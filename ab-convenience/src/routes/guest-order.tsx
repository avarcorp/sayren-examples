import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, type FlowAction, formatOrderNo, type MyOrder } from "@sayren/storefront-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OrderItemRow } from "../components/mypage/order-card";
import { FlowActionForm, OrderStepInfo } from "../components/order-step";
import { SubmitButton } from "../components/submit-button";
import { TextField } from "../components/text-field";
import { buttonClass } from "../components/ui/button";
import { InfoList, SectionHeader } from "../components/ui/section";
import { m } from "../i18n";
import { apiFor } from "../lib/api.server";
import type { FlowInputValue } from "../lib/flow-input";
import {
  type GuestOrderLookup,
  type GuestOrderLookupInput,
  guestOrderLookupSchema,
} from "../lib/form-schemas";
import { formatDateTime, formatPrice } from "../lib/format";
import { guestLookupLockedMessage, normalizePhone } from "../lib/guest-order";
import { pageTitle } from "../lib/page-title";

const guestOrderSearch = z.object({
  /** 주문 완료 화면이 주문번호를 채워 보낸다 */
  orderId: z.string().optional().catch(undefined),
});

/**
 * 비회원 주문 조회 — 주문번호와 주문할 때 적은 연락처·주문 조회 비밀번호로 찾는다.
 * 비밀번호가 주소에 남지 않도록 서버 함수(POST)로 보낸다.
 */
const lookupGuestOrder = createServerFn({ method: "POST" })
  .validator(z.object({ orderId: z.string(), phone: z.string(), orderPassword: z.string() }))
  .handler(async ({ data }) => {
    const orderId = data.orderId.trim();
    const phone = normalizePhone(data.phone);
    if (!orderId || !phone || !data.orderPassword) {
      return { order: null, error: m.guest_order_required() };
    }
    try {
      const order: MyOrder = await apiFor().myOrders.getGuestOrder(orderId, {
        phone,
        orderPassword: data.orderPassword,
      });
      return { order, error: null };
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
        return { order: null, error: m.guest_order_not_found() };
      }
      // 주문번호마다 시도 한도가 있다. 여러 번 틀리면 한동안 맞는 비밀번호로도 조회되지 않는다
      if (error instanceof ApiError && error.status === 429) {
        return { order: null, error: guestLookupLockedMessage(error.details?.retryAfterSeconds) };
      }
      return { order: null, error: m.guest_order_failed() };
    }
  });

/**
 * 비회원 흐름 행동(시안 승인 등, #115) — 서버가 켠 행동만 보낸다. 조회와 같은 확인(연락처·비밀번호)과 시도 한도를 지난다.
 * 비밀번호는 화면 메모리에만 두고 이 요청 본문으로만 보낸다. 성공하면 바뀐 주문을 다시 읽어 돌려준다
 */
const actAsGuest = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderId: z.string(),
      orderItemId: z.string(),
      key: z.string().min(1).max(64),
      phone: z.string(),
      orderPassword: z.string(),
      input: z
        .record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean(), z.array(z.string()).max(20)]),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const credentials = { phone: normalizePhone(data.phone), orderPassword: data.orderPassword };
    const api = apiFor();
    try {
      await api.myOrders.guestAct(data.orderId, data.orderItemId, data.key, {
        ...credentials,
        ...(data.input ? { input: data.input } : {}),
      });
      const order: MyOrder = await api.myOrders.getGuestOrder(data.orderId, credentials);
      return { order, error: null };
    } catch (error) {
      return {
        order: null,
        error:
          error instanceof ApiError && error.message ? error.message : m.order_flow_action_failed(),
      };
    }
  });

export const Route = createFileRoute("/guest-order")({
  validateSearch: guestOrderSearch,
  head: ({ matches }) => ({
    // 주소에 주문번호(`?orderId=`)가 실린다. 외부 링크로 나갈 때 리퍼러로 흘리지 않는다
    meta: [
      { title: pageTitle(matches, m.guest_order_title()) },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: GuestOrder,
});

function GuestOrder() {
  const { orderId } = Route.useSearch();
  const [order, setOrder] = useState<MyOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 조회에 쓴 확인 값 — 흐름 행동이 같은 값으로 다시 확인한다(화면 메모리에만 둔다)
  const [credentials, setCredentials] = useState<{ phone: string; orderPassword: string } | null>(
    null,
  );
  const [acting, setActing] = useState<{ orderItemId: string; action: FlowAction } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const runAction = (
    orderItemId: string,
    action: FlowAction,
    input?: Record<string, FlowInputValue>,
  ) => {
    if (!order || !credentials) return;
    setPending(true);
    setActionError(null);
    actAsGuest({
      data: {
        orderId: order.orderId,
        orderItemId,
        key: action.key,
        ...credentials,
        ...(input ? { input } : {}),
      },
    })
      .then((result) => {
        if (result.error || !result.order) {
          setActionError(result.error ?? m.order_flow_action_failed());
          return;
        }
        setOrder(result.order);
        setActing(null);
      })
      .catch(() => setActionError(m.order_flow_action_failed()))
      .finally(() => setPending(false));
  };
  const form = useForm<GuestOrderLookupInput, unknown, GuestOrderLookup>({
    resolver: zodResolver(guestOrderLookupSchema),
  });
  const { errors, isSubmitting } = form.formState;

  const submit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      const result = await lookupGuestOrder({ data: values });
      setOrder(result.order);
      setError(result.error);
      setCredentials(
        result.order ? { phone: values.phone, orderPassword: values.orderPassword } : null,
      );
    } catch {
      setOrder(null);
      setError(m.guest_order_failed());
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-10 py-6 md:py-12">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-bold text-2xl tracking-tight">{m.guest_order_title()}</h1>
          <p className="text-meta text-sub">{m.guest_order_description()}</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          {/* 주문 완료 화면이 주문번호를 채워 보낸다 — 서버 HTML에 값이 실리도록 defaultValue로 준다 */}
          <TextField
            label={m.guest_order_order_id()}
            registration={form.register("orderId")}
            error={errors.orderId?.message}
            defaultValue={orderId}
            placeholder="ord_"
            required
          />
          <TextField
            label={m.guest_order_phone()}
            registration={form.register("phone")}
            error={errors.phone?.message}
            type="tel"
            placeholder="01012345678"
            required
          />
          <TextField
            label={m.guest_order_password()}
            registration={form.register("orderPassword")}
            error={errors.orderPassword?.message}
            type="password"
            required
          />
          <SubmitButton
            disabled={isSubmitting}
            className={buttonClass({
              variant: "primary",
              size: "lg",
              block: true,
              className: "mt-2",
            })}
          >
            {m.guest_order_submit()}
          </SubmitButton>
        </form>
        {error ? (
          <p role="alert" className="text-body text-point">
            {error}
          </p>
        ) : null}
      </div>

      {order ? (
        <section aria-label={m.guest_order_order_info()} className="flex min-w-0 flex-col gap-5">
          <SectionHeader title={m.guest_order_heading({ orderId: order.orderId })} rule />
          <InfoList
            rows={[
              {
                key: "at",
                label: m.mypage_ordered_at(),
                value: formatDateTime(order.orderedAt),
              },
              ...(order.orderNo
                ? [
                    {
                      key: "no",
                      label: m.mypage_order_no(),
                      value: (
                        <span className="tabular break-all">{formatOrderNo(order.orderNo)}</span>
                      ),
                    },
                  ]
                : []),
            ]}
          />
          <ul className="divide-y divide-line border border-line">
            {order.items.map((item) => (
              <li key={item.orderItemId}>
                <OrderItemRow item={item}>
                  <OrderStepInfo item={item} />
                  {item.step?.actions.length ? (
                    <div className="flex flex-wrap gap-2">
                      {item.step.actions.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          disabled={!action.enabled || pending}
                          onClick={() =>
                            action.input?.length
                              ? setActing({ orderItemId: item.orderItemId, action })
                              : runAction(item.orderItemId, action)
                          }
                          className={buttonClass({ variant: "outline", size: "sm" })}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {acting?.orderItemId === item.orderItemId ? (
                    <FlowActionForm
                      action={acting.action}
                      pending={pending}
                      error={actionError}
                      onSubmit={(input) => runAction(item.orderItemId, acting.action, input)}
                      onCancel={() => setActing(null)}
                    />
                  ) : actionError ? (
                    <p role="alert" className="text-meta text-point">
                      {actionError}
                    </p>
                  ) : null}
                  {item.fulfillment?.status === "FULFILLED" && item.fulfillment.note ? (
                    <dl className="flex flex-col gap-1 bg-chip p-3 text-meta">
                      <dt className="font-bold">{m.guest_order_fulfillment_note()}</dt>
                      <dd className="whitespace-pre-line break-words">{item.fulfillment.note}</dd>
                    </dl>
                  ) : null}
                </OrderItemRow>
              </li>
            ))}
          </ul>
          <dl className="flex items-baseline justify-between gap-3 border-ink border-t-2 pt-4">
            <dt className="font-bold text-body-lg">{m.guest_order_total_amount()}</dt>
            <dd className="tabular font-bold text-xl">{formatPrice(order.payment.totalAmount)}</dd>
          </dl>
          <p className="bg-chip p-4 text-meta text-sub">{m.guest_order_claim_notice()}</p>
        </section>
      ) : null}
    </div>
  );
}
