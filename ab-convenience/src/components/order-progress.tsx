import type { MyOrderItem } from "@sayren/storefront-sdk";
import { useRouterState } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { m } from "../i18n";
import type { RootData } from "../routes/__root";

type Stage = { key: string; label: string; types: readonly string[] };

const DONE = ["DELIVERED", "COMPLETED"];

/** 받는 방법별 진행 칸 — 서버가 주는 단계 유형(`step.type`)만으로 나눈다. 흐름의 전체 단계 목록은 공개 API에 없다 */
function stagesOf(method: string | null | undefined): Stage[] {
  if (method === "PICKUP") {
    return [
      {
        key: "prep",
        label: m.order_progress_preparing(),
        types: ["SELLER_PROCESSING", "BUYER_ACTION", "IN_DELIVERY"],
      },
      { key: "done", label: m.order_progress_picked_up(), types: DONE },
    ];
  }
  return [
    {
      key: "prep",
      label: m.order_progress_preparing(),
      types: ["SELLER_PROCESSING", "BUYER_ACTION"],
    },
    { key: "ship", label: m.order_progress_delivering(), types: ["IN_DELIVERY"] },
    { key: "done", label: m.order_progress_delivered(), types: DONE },
  ];
}

/**
 * 주문 상태 머리 — 지금 단계 이름(`step.label`, 흐름의 구매자용 이름)과 판매자 안내문, 받는 방법별 진행 칸.
 * 취소·반품 중이거나 취소된 주문은 진행 칸 없이 이름만 보인다. 지금 취소할 수 없는 단계면 가게 전화를 안내한다.
 * 주문상품이 여럿이면 끝나지 않은 첫 상품을 기준으로 한다(묶음 진행은 같은 단계다).
 */
export function OrderProgress({ items }: { items: MyOrderItem[] }) {
  const phone = useRouterState({
    select: (state) =>
      (state.matches[0]?.loaderData as RootData | undefined)?.contact?.phone ?? null,
  });
  const item =
    items.find((candidate) => candidate.step && candidate.step.type !== "CANCELED") ??
    items.find((candidate) => candidate.step);
  const step = item?.step;
  if (!item || !step) return null;
  const method = (item.fulfillmentSnapshot as { method?: string | null } | null | undefined)
    ?.method;
  const stages = stagesOf(method);
  // 구매확정 뒤에도 옛 api는 단계 유형을 SELLER_PROCESSING으로 줬다 — 공개 상태가 끝났으면 끝난 것으로 본다
  const stepType =
    item.status === "PURCHASE_DECIDED"
      ? "COMPLETED"
      : item.status === "DELIVERED"
        ? "DELIVERED"
        : step.type;
  const current = stages.findIndex((stage) => stage.types.includes(stepType));
  const showBar = current >= 0;
  const cancellable = (step.claimable ?? []).some(
    (claim) => claim.action === "CANCEL" || claim.action === "CANCEL_REQUEST",
  );
  const beforeDone = showBar && !DONE.includes(stepType);

  return (
    <section
      aria-labelledby="order-progress"
      className="-mx-4 flex flex-col gap-4 bg-page px-5 py-5 md:mx-0 md:rounded-card md:border md:border-line"
    >
      <div className="flex flex-col gap-1.5">
        <span className="font-bold text-brand text-meta">
          {method === "PICKUP"
            ? m.receive_method_pickup()
            : method === "DIRECT"
              ? m.receive_method_direct()
              : null}
        </span>
        <h2 id="order-progress" className="font-extrabold text-2xl">
          {step.label}
        </h2>
        {step.message ? (
          <p className="whitespace-pre-line text-body text-sub">{step.message}</p>
        ) : null}
      </div>
      {showBar ? (
        <ol
          aria-label={m.order_progress_label()}
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
        >
          {stages.map((stage, index) => (
            <li
              key={stage.key}
              aria-current={index === current ? "step" : undefined}
              className="flex flex-col gap-2"
            >
              <span className={`h-1.5 rounded-full ${index <= current ? "bg-brand" : "bg-line"}`} />
              <span
                className={`text-caption ${index === current ? "font-extrabold text-brand-strong" : index < current ? "font-bold text-brand-strong" : "text-sub"}`}
              >
                {stage.label}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
      {beforeDone && !cancellable ? (
        <div className="flex flex-col gap-2">
          <p className="text-caption text-sub">{m.order_progress_no_cancel()}</p>
          {phone ? (
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
              className="flex h-12 items-center justify-center gap-1.5 rounded-control border-[1.5px] border-line font-bold text-body"
            >
              <Phone size={18} aria-hidden />
              {m.order_progress_call()}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
