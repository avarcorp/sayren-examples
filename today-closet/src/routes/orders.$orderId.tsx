import {
  ApiError,
  type ClaimPreview,
  type ClaimReason,
  type ClaimType,
  type CreateClaimResult,
  claimReasonSchema,
  claimTypeSchema,
  type DeliveryTracking,
  type FlowAction,
  formatOrderNo,
  type MyOrderItem,
} from "@sayren/storefront-sdk";
import { createFileRoute, Link, notFound, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { ACTION, ACTION_STRONG, OrderItemRow, orderNoText } from "../components/mypage/order-card";
import { FlowActionForm, OrderStepInfo } from "../components/order-step";
import { SubmitButton } from "../components/submit-button";
import { buttonClass, inputClass } from "../components/ui/button";
import { InfoList, SectionHeader } from "../components/ui/section";
import { lazyMessages, m } from "../i18n";
import { apiFor } from "../lib/api.server";
import type { FlowInputValue } from "../lib/flow-input";
import { formatDateTime, formatPrice } from "../lib/format";
import {
  canClaim,
  canReview,
  canTrack,
  claimableTypes,
  flowButtons,
  paymentMethodLabel,
} from "../lib/order-status";
import { pageTitle } from "../lib/page-title";
import { readToken } from "../lib/session.server";

const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ orderId: z.string() }))
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) {
      throw redirect({ to: "/login", search: { redirectTo: `/orders/${data.orderId}` } });
    }
    try {
      return await apiFor({ accessToken }).myOrders.get(data.orderId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  });

/** 배송조회 — 발송된 주문 상품의 택배사·송장·이동 기록. 구매자 토큰은 서버에만 두므로 서버 함수로 받는다 */
const getDelivery = createServerFn({ method: "GET" })
  .validator(z.object({ orderItemId: z.string() }))
  .handler(async ({ data }): Promise<DeliveryTracking | null> => {
    const accessToken = readToken();
    if (!accessToken) throw redirect({ to: "/login", search: { redirectTo: "/orders" } });
    try {
      return await apiFor({ accessToken }).myOrders.getDelivery(data.orderItemId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  });

/**
 * 취소·반품 접수 — 수량을 실으면 그 수량만 접수된다(생략하면 남은 수량 전체).
 * 상한은 주문 상품의 `activeQuantity`이고 넘기면 서버가 400 `INVALID_QUANTITY`로 거절한다.
 * 구매자 토큰은 서버에만 두므로 접수도 서버 함수에서 한다.
 */
/** 신청 전 미리보기 — 예상 환불·취소 수수료. 접수할 수 없으면 접수와 같은 문구를 돌려준다 */
const previewClaim = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderItemId: z.string(),
      type: claimTypeSchema,
      reason: claimReasonSchema,
      quantity: z.number().int().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) throw redirect({ to: "/login", search: { redirectTo: "/orders" } });
    const { orderItemId, ...body } = data;
    try {
      return {
        preview: await apiFor({ accessToken }).myClaims.preview(orderItemId, body),
        error: null,
      };
    } catch (error) {
      return { preview: null, error: claimErrorMessage(error) };
    }
  });

const createClaim = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderItemId: z.string(),
      type: claimTypeSchema,
      reason: claimReasonSchema,
      quantity: z.number().int().min(1),
      reasonDetail: z.string().max(1000).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) throw redirect({ to: "/login", search: { redirectTo: "/orders" } });
    const { orderItemId, ...body } = data;
    try {
      return {
        claim: await apiFor({ accessToken }).myClaims.create(orderItemId, body),
        error: null,
      };
    } catch (error) {
      return { claim: null, error: claimErrorMessage(error) };
    }
  });

/**
 * 주문 흐름 행동(#115, 시안 승인·구매확정 등) — 서버가 켠 행동(`items[].actions`)만 보낸다. 할 수 없으면 서버가 409로 거절하고 그 문구를
 * 보인다. 취소·반품(하위 흐름)은 아래 접수 폼이 맡는다. 구매자 토큰은 서버에만 둔다
 */
const actOnItem = createServerFn({ method: "POST" })
  .validator(
    z.object({
      orderItemId: z.string(),
      key: z.string().min(1).max(64),
      input: z
        .record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean(), z.array(z.string()).max(20)]),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) throw redirect({ to: "/login", search: { redirectTo: "/orders" } });
    try {
      await apiFor({ accessToken }).myOrders.act(data.orderItemId, data.key, data.input ?? {});
      return { error: null };
    } catch (error) {
      return {
        error:
          error instanceof ApiError && error.message ? error.message : m.order_flow_action_failed(),
      };
    }
  });

function claimErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return m.order_claim_failed();
  switch (error.code) {
    case "INVALID_QUANTITY":
      return m.order_claim_invalid_quantity();
    case "CLAIM_IN_PROGRESS":
      return m.order_claim_in_progress();
    case "INVALID_STATUS":
      return m.order_claim_invalid_status();
    case "PERIOD_EXPIRED":
      return m.order_claim_period_expired();
    default:
      return error.message || m.order_claim_failed();
  }
}

const orderSearch = z.object({
  /** 목록의 「배송 조회」 — 이 주문 상품의 배송 조회를 열어 둔다 */
  track: z.string().optional().catch(undefined),
  /** 목록의 「취소·반품 신청」 — 이 주문 상품의 신청 폼을 열어 둔다 */
  claim: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/orders/$orderId")({
  validateSearch: orderSearch,
  loader: ({ params }) => getOrder({ data: { orderId: params.orderId } }),
  head: ({ matches, params }) => ({
    meta: [{ title: pageTitle(matches, m.order_title({ orderId: params.orderId })) }],
  }),
  component: OrderDetail,
});

const CLAIM_TYPE_LABELS = lazyMessages<ClaimType>({
  CANCEL: () => m.order_claim_type_cancel(),
  RETURN: () => m.order_claim_type_return(),
  EXCHANGE: () => m.order_claim_type_exchange(),
});

const CLAIM_REASON_LABELS = lazyMessages<ClaimReason>({
  CHANGE_OF_MIND: () => m.order_claim_reason_change_of_mind(),
  WRONG_ORDER: () => m.order_claim_reason_wrong_order(),
  DEFECTIVE: () => m.order_claim_reason_defective(),
  WRONG_DELIVERY: () => m.order_claim_reason_wrong_delivery(),
  DIFFERENT_FROM_PAGE: () => m.order_claim_reason_different_from_page(),
  DELAY: () => m.order_claim_reason_delay(),
});

/** 할인·사용 금액 — 0이면 줄을 두지 않는다 */
function minusRow(key: string, label: string, amount: number) {
  return amount > 0
    ? [{ key, label, value: m.mypage_minus_price({ amount: formatPrice(amount) }) }]
    : [];
}

function OrderDetail() {
  const order = Route.useLoaderData();
  const { track, claim } = Route.useSearch();
  const router = useRouter();
  const [openItemId, setOpenItemId] = useState<string | null>(claim ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateClaimResult | null>(null);
  const [acting, setActing] = useState<{ orderItemId: string; action: FlowAction } | null>(null);
  const [actionError, setActionError] = useState<{ orderItemId: string; message: string } | null>(
    null,
  );

  const runAction = (
    orderItemId: string,
    action: FlowAction,
    input?: Record<string, FlowInputValue>,
  ) => {
    setPending(true);
    setActionError(null);
    actOnItem({ data: { orderItemId, key: action.key, ...(input ? { input } : {}) } })
      .then((response) => {
        if (response.error) {
          setActionError({ orderItemId, message: response.error });
          return;
        }
        setActing(null);
        return router.invalidate();
      })
      .finally(() => setPending(false));
  };

  const submit = (data: Parameters<typeof createClaim>[0]["data"]) => {
    setPending(true);
    setError(null);
    createClaim({ data })
      .then((response) => {
        if (response.error) {
          setError(response.error);
          return;
        }
        setResult(response.claim);
        setOpenItemId(null);
        return router.invalidate();
      })
      .finally(() => setPending(false));
  };

  const address = order.shippingAddress;
  const payment = order.payment;

  return (
    <MyPageShell
      current="orders"
      title={m.mypage_order_detail()}
      back={{ to: "/orders", label: m.order_back_to_orders() }}
    >
      {result ? (
        <div role="status" className="flex flex-col gap-1 bg-chip p-4 text-body md:p-5">
          <p className="font-bold">
            {result.approved
              ? m.order_claim_canceled({ quantity: result.quantity })
              : m.order_claim_received({ quantity: result.quantity })}
          </p>
          {/* 상품 금액 환불은 수량 비율이고, 반품 배송비는 이미 빠져 있다. 배송비 환불은 따로 온다 */}
          {result.expectedRefundAmount === null ? null : (
            <p className="text-sub">
              {result.claimDeliveryFee > 0
                ? m.order_claim_expected_refund_with_fee({
                    amount: formatPrice(result.expectedRefundAmount),
                    fee: formatPrice(result.claimDeliveryFee),
                  })
                : (result.approved ? m.order_claim_refund : m.order_claim_expected_refund)({
                    amount: formatPrice(result.expectedRefundAmount),
                  })}
            </p>
          )}
          {result.pointRefundAmount > 0 ? (
            <p className="text-muted">
              {(result.approved ? m.order_claim_point_refund : m.order_claim_expected_point_refund)(
                {
                  amount: formatPrice(result.pointRefundAmount),
                },
              )}
            </p>
          ) : null}
          {result.deliveryFeeRefundAmount > 0 ? (
            <p className="text-sub">
              {m.order_claim_expected_delivery_fee_refund({
                amount: formatPrice(result.deliveryFeeRefundAmount),
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      <section aria-labelledby="order-info" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="order-info" title={m.mypage_order_info()} rule />
        <InfoList
          rows={[
            { key: "at", label: m.mypage_ordered_at(), value: formatDateTime(order.orderedAt) },
            {
              key: "no",
              label: m.mypage_order_no(),
              // 주문번호 — 문의할 때 불러 주는 숫자 번호다. 4자리마다 하이픈으로 나눠 보인다
              value: <span className="tabular break-all">{orderNoText(order)}</span>,
            },
          ]}
        />
      </section>

      <section aria-labelledby="order-items" className="flex min-w-0 flex-col gap-4">
        <SectionHeader
          id="order-items"
          title={m.mypage_order_items()}
          count={order.items.length}
          rule
        />
        <ul className="divide-y divide-line border border-line">
          {order.items.map((item) => (
            <li key={item.orderItemId}>
              <OrderItemRow
                item={item}
                meta={
                  item.orderItemNo ? (
                    <p className="tabular break-all text-caption text-muted">
                      {m.order_item_number({ orderItemNo: formatOrderNo(item.orderItemNo) })}
                    </p>
                  ) : null
                }
                actions={
                  <>
                    {flowButtons(item).map((action) => (
                      <button
                        key={action.key}
                        type="button"
                        disabled={!action.enabled || pending}
                        title={action.disabled?.message}
                        onClick={() => {
                          setActionError(null);
                          if (action.input?.length)
                            setActing({ orderItemId: item.orderItemId, action });
                          else runAction(item.orderItemId, action);
                        }}
                        className={ACTION_STRONG}
                      >
                        {action.label}
                      </button>
                    ))}
                    {canReview(item) ? (
                      <Link
                        to="/account/reviews/write/$orderItemId"
                        params={{ orderItemId: item.orderItemId }}
                        className={ACTION_STRONG}
                      >
                        {m.order_review_write()}
                      </Link>
                    ) : null}
                    {canClaim(item) && openItemId !== item.orderItemId ? (
                      <button
                        type="button"
                        onClick={() => {
                          setResult(null);
                          setError(null);
                          setOpenItemId(item.orderItemId);
                        }}
                        className={ACTION}
                      >
                        {m.order_claim_open()}
                      </button>
                    ) : null}
                    <Link
                      to="/account/support/new"
                      search={{ orderItemId: item.orderItemId }}
                      className={ACTION}
                    >
                      {m.mypage_action_inquiry()}
                    </Link>
                  </>
                }
              >
                <FulfillmentInfo item={item} />
                <OrderStepInfo item={item} />
                {acting?.orderItemId === item.orderItemId ? (
                  <FlowActionForm
                    action={acting.action}
                    pending={pending}
                    error={
                      actionError?.orderItemId === item.orderItemId ? actionError.message : null
                    }
                    onSubmit={(input) => runAction(item.orderItemId, acting.action, input)}
                    onCancel={() => setActing(null)}
                  />
                ) : actionError?.orderItemId === item.orderItemId ? (
                  <p role="alert" className="text-meta text-point">
                    {actionError.message}
                  </p>
                ) : null}
                <DeliveryTrackingPanel item={item} autoOpen={track === item.orderItemId} />
                {canClaim(item) && openItemId === item.orderItemId ? (
                  <ClaimForm
                    item={item}
                    pending={pending}
                    error={error}
                    onSubmit={submit}
                    onCancel={() => setOpenItemId(null)}
                  />
                ) : null}
              </OrderItemRow>
            </li>
          ))}
        </ul>
      </section>

      {order.requiresShipping ? (
        <section aria-labelledby="order-address" className="flex min-w-0 flex-col gap-4">
          <SectionHeader id="order-address" title={m.mypage_shipping_address()} rule />
          <InfoList
            rows={[
              { key: "name", label: m.mypage_receiver(), value: address.receiverName },
              { key: "phone", label: m.mypage_phone(), value: address.phone },
              {
                key: "address",
                label: m.mypage_address(),
                value: `(${address.zipCode}) ${address.address1}${address.address2 ? ` ${address.address2}` : ""}`,
              },
              ...(address.deliveryMemo
                ? [{ key: "memo", label: m.mypage_delivery_memo(), value: address.deliveryMemo }]
                : []),
              ...(address.entranceCode
                ? [
                    {
                      key: "entrance",
                      label: m.mypage_entrance_code(),
                      value: address.entranceCode,
                    },
                  ]
                : []),
            ]}
          />
        </section>
      ) : null}

      <section aria-labelledby="order-payment" className="flex min-w-0 flex-col gap-4">
        <SectionHeader id="order-payment" title={m.mypage_payment_info()} rule />
        <InfoList
          rows={[
            {
              key: "method",
              label: m.mypage_payment_method(),
              value: paymentMethodLabel(payment.method, payment.easyPayProvider),
            },
            ...(payment.paidAt
              ? [{ key: "paid", label: m.mypage_paid_at(), value: formatDateTime(payment.paidAt) }]
              : []),
            ...minusRow("coupon", m.mypage_coupon_discount(), payment.couponDiscountAmount),
            ...minusRow("delivery", m.mypage_delivery_discount(), payment.deliveryDiscountAmount),
            ...minusRow("point", m.mypage_point_used(), payment.pointAmount),
            ...(payment.receiptUrl
              ? [
                  {
                    key: "receipt",
                    label: m.order_receipt(),
                    value: (
                      <a
                        href={payment.receiptUrl}
                        className="underline underline-offset-4"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {m.order_receipt_open()}
                      </a>
                    ),
                  },
                ]
              : []),
          ]}
        />
        <dl className="flex items-baseline justify-between gap-3 border-line border-t pt-4">
          <dt className="font-bold text-body-lg">{m.order_total_amount()}</dt>
          <dd className="tabular font-bold text-xl">{formatPrice(payment.totalAmount)}</dd>
        </dl>
        {/* 환불(#115) — 끝난 환불과, 판매자가 승인하고 아직 처리하지 않은 환불 */}
        {payment.refundedAmount > 0 ? (
          <dl className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">{m.order_refunded_amount()}</dt>
            <dd className="tabular">{formatPrice(payment.refundedAmount)}</dd>
          </dl>
        ) : null}
        {payment.refundPendingAmount > 0 ? (
          <dl className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">{m.order_refund_pending_amount()}</dt>
            <dd className="tabular">{formatPrice(payment.refundPendingAmount)}</dd>
          </dl>
        ) : null}
        {(payment.pointRefundedAmount ?? 0) > 0 ? (
          <dl className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">{m.order_point_refunded_amount()}</dt>
            <dd className="tabular">{formatPrice(payment.pointRefundedAmount ?? 0)}</dd>
          </dl>
        ) : null}
      </section>
    </MyPageShell>
  );
}

/**
 * 배송이 없는 상품의 이용 안내 — 판매자가 제공 처리하며 남긴 안내(이슈 #48). 배송 상품이거나 안내가 없으면 그리지 않는다.
 * 배송 상품이 아니므로 배송 조회 링크가 없다.
 */
function FulfillmentInfo({ item }: { item: MyOrderItem }) {
  const note = item.fulfillment?.status === "FULFILLED" ? item.fulfillment.note : null;
  if (!note) return null;
  return (
    <dl className="flex flex-col gap-1 bg-chip p-3 text-meta">
      <dt className="font-bold">{m.order_fulfillment_note()}</dt>
      <dd className="whitespace-pre-line break-words">{note}</dd>
    </dl>
  );
}

type TrackingState =
  | { kind: "closed" }
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "loaded"; tracking: DeliveryTracking | null };

/**
 * 배송조회 — 발송 뒤에만 버튼을 보이고, 누르면 그때 받는다(주문 상세 첫 화면을 느리게 하지 않는다).
 * 목록의 「배송 조회」로 들어오면(`autoOpen`) 화면이 붙은 뒤 바로 받는다.
 */
function DeliveryTrackingPanel({ item, autoOpen }: { item: MyOrderItem; autoOpen: boolean }) {
  const [state, setState] = useState<TrackingState>({ kind: "closed" });
  const trackable = canTrack(item);
  const open = useCallback(() => {
    setState({ kind: "loading" });
    getDelivery({ data: { orderItemId: item.orderItemId } })
      .then((tracking) => setState({ kind: "loaded", tracking }))
      .catch(() => setState({ kind: "error" }));
  }, [item.orderItemId]);
  useEffect(() => {
    if (autoOpen && trackable) open();
  }, [autoOpen, trackable, open]);
  if (!trackable) return null;
  if (state.kind === "closed") {
    return (
      <button
        type="button"
        className={buttonClass({ variant: "subtle", size: "sm", className: "self-start" })}
        onClick={open}
      >
        {m.order_tracking_open()}
      </button>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-3 bg-chip p-4 text-meta">
      {state.kind === "loading" ? <p role="status">{m.order_tracking_loading()}</p> : null}
      {state.kind === "error" ? <p role="alert">{m.order_tracking_failed()}</p> : null}
      {state.kind === "loaded" && !state.tracking ? <p>{m.order_tracking_empty()}</p> : null}
      {state.kind === "loaded" && state.tracking ? (
        <>
          <InfoList
            labelWidth="4.5rem"
            className="text-meta"
            rows={[
              {
                key: "carrier",
                label: m.order_tracking_carrier(),
                value: state.tracking.carrierName,
              },
              {
                key: "number",
                label: m.order_tracking_number(),
                value: (
                  <span className="flex flex-wrap items-center gap-x-2">
                    <span className="tabular break-all">{state.tracking.trackingNumber}</span>
                    <a
                      href={state.tracking.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      {m.order_tracking_link()}
                    </a>
                  </span>
                ),
              },
            ]}
          />
          {state.tracking.trackingEvents.length ? (
            <ol className="flex flex-col gap-2 border-line border-t pt-3">
              {state.tracking.trackingEvents.map((event) => (
                <li
                  key={`${event.occurredAt}-${event.status}`}
                  className="flex min-w-0 flex-col gap-0.5 md:flex-row md:gap-3"
                >
                  <span className="tabular shrink-0 text-muted">
                    {formatDateTime(event.occurredAt)}
                  </span>
                  <span className="min-w-0 break-words">
                    {event.status} · {event.location}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted">{m.order_tracking_empty()}</p>
          )}
        </>
      ) : null}
      <button
        type="button"
        className={buttonClass({ variant: "ghost", className: "self-start" })}
        onClick={() => setState({ kind: "closed" })}
      >
        {m.order_tracking_close()}
      </button>
    </div>
  );
}

const SELECT = inputClass({ className: "appearance-auto pr-2" });

/**
 * 취소·반품 접수 폼. 수량 기본값은 남은 수량 전체이고 입력값은 `activeQuantity`까지다.
 * 서버 렌더한 마크업에 값이 그대로 남아야 하므로 프리필은 `defaultValue`로 준다.
 */
function ClaimForm({
  item,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  item: MyOrderItem;
  pending: boolean;
  error: string | null;
  onSubmit: (data: {
    orderItemId: string;
    type: ClaimType;
    reason: ClaimReason;
    quantity: number;
    reasonDetail?: string;
  }) => void;
  onCancel: () => void;
}) {
  const types = claimableTypes(item);
  const [type, setType] = useState<ClaimType | undefined>(types[0]);
  const [reason, setReason] = useState<ClaimReason>(claimReasonSchema.options[0]);
  // 수량은 빈 칸·범위 밖을 폼에서 먼저 잡는다 — `Number("")`는 0이라 그대로 보내면 서버 400을 본다
  const [quantityText, setQuantityText] = useState(String(item.activeQuantity));
  const quantity = Number(quantityText);
  const quantityError =
    quantityText.trim() === "" || !Number.isInteger(quantity)
      ? m.order_claim_quantity_required()
      : quantity < 1 || quantity > item.activeQuantity
        ? m.order_claim_quantity_range({ max: item.activeQuantity })
        : null;
  // 신청 전에 예상 환불·취소 수수료를 서버에서 받아 보인다(계산은 접수와 같은 함수다)
  const [preview, setPreview] = useState<{ data: ClaimPreview | null; error: string | null }>({
    data: null,
    error: null,
  });
  useEffect(() => {
    if (!type || quantityError) return;
    let current = true;
    previewClaim({ data: { orderItemId: item.orderItemId, type, reason, quantity } }).then(
      (response) => {
        if (current) setPreview({ data: response.preview, error: response.error });
      },
    );
    return () => {
      current = false;
    };
  }, [item.orderItemId, type, reason, quantity, quantityError]);
  return (
    <form
      aria-label={m.order_claim_open()}
      className="flex min-w-0 flex-col gap-4 bg-chip p-4 md:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (quantityError) return;
        const form = new FormData(event.currentTarget);
        const reasonDetail = String(form.get("reasonDetail") ?? "").trim();
        onSubmit({
          orderItemId: item.orderItemId,
          type: form.get("type") as ClaimType,
          reason: form.get("reason") as ClaimReason,
          quantity,
          reasonDetail: reasonDetail || undefined,
        });
      }}
    >
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="font-bold text-meta">{m.order_claim_type()}</span>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as ClaimType)}
            className={SELECT}
          >
            {types.map((type) => (
              <option key={type} value={type}>
                {CLAIM_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="font-bold text-meta">{m.order_claim_reason()}</span>
          <select
            name="reason"
            value={reason}
            onChange={(event) => setReason(event.target.value as ClaimReason)}
            className={SELECT}
          >
            {claimReasonSchema.options.map((reason) => (
              <option key={reason} value={reason}>
                {CLAIM_REASON_LABELS[reason]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="font-bold text-meta">
            {m.order_claim_quantity({ active: item.activeQuantity })}
          </span>
          <input
            type="number"
            name="quantity"
            min={1}
            max={item.activeQuantity}
            step={1}
            value={quantityText}
            onChange={(event) => setQuantityText(event.target.value)}
            aria-invalid={quantityError !== null}
            className={inputClass({ invalid: quantityError !== null })}
          />
        </label>
      </div>

      {quantityError ? <p className="text-meta text-point">{quantityError}</p> : null}
      {!quantityError && preview.error ? (
        <p className="text-meta text-point">{preview.error}</p>
      ) : !quantityError && preview.data && preview.data.expectedRefundAmount !== null ? (
        <div className="flex flex-col gap-0.5 text-meta">
          <p className="font-bold">
            {preview.data.claimDeliveryFee > 0
              ? m.order_claim_expected_refund_with_fee({
                  amount: formatPrice(preview.data.expectedRefundAmount),
                  fee: formatPrice(preview.data.claimDeliveryFee),
                })
              : m.order_claim_expected_refund({
                  amount: formatPrice(preview.data.expectedRefundAmount),
                })}
          </p>
          {preview.data.pointRefundAmount > 0 ? (
            <p>
              {m.order_claim_expected_point_refund({
                amount: formatPrice(preview.data.pointRefundAmount),
              })}
            </p>
          ) : null}
          {preview.data.deductAmount > 0 ? (
            <p className="text-muted">
              {m.order_claim_preview_deduct({ amount: formatPrice(preview.data.deductAmount) })}
            </p>
          ) : null}
        </div>
      ) : null}

      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="font-bold text-meta">{m.order_claim_reason_detail()}</span>
        <textarea
          name="reasonDetail"
          rows={3}
          maxLength={1000}
          className="w-full min-w-0 border border-line-strong bg-page px-3.5 py-3 text-body focus:border-ink focus:outline-none"
        />
      </label>

      {error ? (
        <p role="alert" className="text-meta text-point">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton
          disabled={pending || quantityError !== null}
          className={buttonClass({ variant: "primary", size: "md" })}
        >
          {m.order_claim_submit()}
        </SubmitButton>
        <button type="button" onClick={onCancel} className={buttonClass({ variant: "ghost" })}>
          {m.order_claim_close()}
        </button>
      </div>
    </form>
  );
}
