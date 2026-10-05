import { useRouterState } from "@tanstack/react-router";
import { m } from "../i18n";
import { type Ordering, orderingOf } from "../lib/ordering";

/**
 * 지금 주문을 받는가 — 루트 loader가 한 번 읽은 `GET /store`의 값이다(`__root.tsx`). 화면마다 상점 설정을 다시 부르지 않는다.
 */
export function useOrdering(): Ordering {
  return useRouterState({
    select: (state) =>
      (state.matches[0]?.loaderData as { ordering?: Ordering } | undefined)?.ordering ??
      orderingOf(null),
  });
}

/** 주문을 받지 않을 때 주문 버튼 자리에 보이는 안내 — 고객센터 전화가 있으면 문의 전화를 함께 보인다 */
export function OrderingNotice({ ordering }: { ordering: Ordering }) {
  if (ordering.open) return null;
  return (
    <div role="status" className="space-y-1 bg-chip p-4 text-center text-sm">
      <p className="font-semibold">{ordering.notice}</p>
      {ordering.phone ? (
        <p className="text-muted">
          {m.ordering_notice_contact()}{" "}
          <a href={`tel:${ordering.phone.replace(/[^0-9+]/g, "")}`} className="underline">
            {ordering.phone}
          </a>
        </p>
      ) : null}
    </div>
  );
}
