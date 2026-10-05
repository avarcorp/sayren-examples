import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { m } from "../../i18n";
import { formatPrice } from "../../lib/format";
import { priceView } from "../../lib/price";
import { useOrdering } from "../ordering-notice";
import { PurchaseButtons } from "../product-buy-box";
import { usePurchase } from "../purchase-context";
import { Price } from "../ui/price";

/**
 * 위쪽 구매 영역(`targetId`)이 화면 위로 나갔는가 — 보이는 동안·아직 아래에 있는 동안은 false다.
 * 서버 렌더와 첫 그림은 false(숨김)로 시작한다.
 */
function useScrolledPast(targetId: string): boolean {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);
  return past;
}

/**
 * 따라오는 구매 상자(lg 이상) — 상단 구매 영역이 화면 밖으로 나간 뒤에만 가볍게 나타난다.
 * 상품명·가격·옵션 요약(누르면 위 구매 영역으로 옮겨 간다)·장바구니/바로구매. 같은 구매 상태를 쓴다.
 * 숨은 동안은 `inert`라 탭 이동·스크린 리더에서 빠진다.
 */
export function FollowingBuyBox({
  targetId,
  top,
  onChangeOptions,
}: {
  /** 지켜볼 상단 구매 영역의 id */
  targetId: string;
  /** sticky 위치(고정 헤더 + 탭 바 아래) */
  top: number;
  /** 옵션 요약을 누르면 — 상단 구매 영역으로 옮겨 간다 */
  onChangeOptions: () => void;
}) {
  const shown = useScrolledPast(targetId);
  const purchase = usePurchase();
  const ordering = useOrdering();
  const { product, hasOptions, state, totals } = purchase;
  const firstVariant = product.variants.find((v) => v.variantId === state.lines[0]?.variantId);
  const summary = !state.lines.length
    ? m.pd_option_required()
    : state.lines.length === 1 || !firstVariant
      ? m.pd_aside_summary({
          name: hasOptions && firstVariant ? firstVariant.name : product.name,
          count: totals.count,
        })
      : m.pd_aside_summary_many({
          name: firstVariant.name,
          more: state.lines.length - 1,
          count: totals.count,
        });

  return (
    <aside
      aria-label={m.pd_aside_label()}
      inert={!shown}
      style={{ top }}
      className={`sticky flex flex-col gap-3 border border-ink bg-page p-5 transition-[opacity,translate] duration-200 ${
        shown ? "translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
      }`}
    >
      <p className="line-clamp-2 break-words font-bold text-body leading-snug">{product.name}</p>
      <Price view={priceView(product)} size="sm" className="text-lg" />
      {hasOptions ? (
        <button
          type="button"
          onClick={onChangeOptions}
          className="flex h-11 min-w-0 items-center justify-between gap-2 border border-line-strong bg-page px-3 text-left text-meta hover:border-ink"
        >
          <span className={`min-w-0 truncate ${state.lines.length ? "" : "text-muted"}`}>
            {summary}
          </span>
          <span className="sr-only">{m.pd_aside_change()}</span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.6} />
        </button>
      ) : null}
      {state.lines.length ? (
        <p className="flex items-baseline justify-between gap-2 text-meta">
          <span>
            {m.pd_total_amount()}{" "}
            <span className="text-muted">{m.pd_total_count({ count: totals.count })}</span>
          </span>
          <strong className="tabular font-bold text-body-lg">{formatPrice(totals.amount)}</strong>
        </p>
      ) : null}
      {ordering.open ? <PurchaseButtons size="md" /> : null}
      {purchase.error ? (
        <p role="alert" className="text-meta text-point">
          {purchase.error}
        </p>
      ) : null}
    </aside>
  );
}
