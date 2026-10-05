import type { CalendarDayView, ProductDetail } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { m } from "../i18n";
import { addToCart, prepareDirectCheckout, prepareMultiCheckout } from "../lib/cart-actions";
import {
  chooseValue,
  hasOptionSteps,
  initialPurchaseState,
  type PurchaseState,
  purchaseTotals,
  removeLine,
  setLineQuantity,
} from "../lib/option-steps";
import {
  initialAddons,
  type OptionSelection,
  type SelectionProblem,
  selectionPayload,
  selectionProblems,
  unitPriceOf,
} from "../lib/product-options";
import { getStayCalendar, stayQuote } from "../lib/stay";
import { CART_COUNT_KEY } from "./browse/cart-count";
import { optionFieldDomId } from "./product-option-fields";

/**
 * 상품 상세의 구매 상태 — 단계형 옵션·선택 행·추가 선택·담기·바로구매를 한 곳에 둔다.
 * 상단 구매 영역, 아래의 따라오는 구매 상자, 모바일 옵션 시트가 같은 상태를 보여 준다(어디서 골라도 같다).
 */
interface PurchaseContextValue {
  product: ProductDetail;
  hasOptions: boolean;
  state: PurchaseState;
  choose: (step: number, valueId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  selection: OptionSelection;
  setSelection: (next: OptionSelection) => void;
  problems: SelectionProblem[];
  /** 한 개 기준가(할인 적용) */
  basePrice: number;
  totals: { count: number; amount: number };
  submitting: boolean;
  error: string | null;
  addToCart: () => void;
  buyNow: () => void;
  /** 날짜별 재고 상품(숙박, #118)이면 고른 기간 — 아니면 쓰지 않는다 */
  dated: boolean;
  stay: { checkIn: string; checkOut: string };
  /** 행(조합)의 날짜별 달력 — 날짜별 재고 상품만, 받기 전이면 null */
  calendarOf: (variantId: string) => CalendarDayView[] | null;
  /** 행 한 개 가격 — 날짜별 재고 상품은 고른 기간의 박별 가격 합(달력), 그 밖에는 기준가 + 조합 추가금 */
  unitOf: (variantId: string) => number;
  setStay: (stay: { checkIn: string; checkOut: string }) => void;
  /** 찜 여부 — 상단 구매 영역과 따라오는 상자가 같이 바뀐다 */
  wished: boolean;
  setWished: (wished: boolean) => void;
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null);

export function usePurchase(): PurchaseContextValue {
  const value = useContext(PurchaseContext);
  if (!value) throw new Error("usePurchase는 PurchaseProvider 안에서만 쓴다");
  return value;
}

export function PurchaseProvider({
  product,
  initialWished = false,
  children,
}: {
  product: ProductDetail;
  initialWished?: boolean;
  children: ReactNode;
}) {
  const [wished, setWished] = useState(initialWished);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasOptions = hasOptionSteps(product);
  const { addonGroups, customInputs } = product;
  const [state, setState] = useState<PurchaseState>(() => initialPurchaseState(product));
  const [selection, setSelection] = useState<OptionSelection>(() => ({
    addons: initialAddons(addonGroups),
    inputs: {},
  }));
  const [checked, setChecked] = useState(false);
  const dated = product.inventoryMode === "DATED";
  const [stay, setStay] = useState({ checkIn: "", checkOut: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const basePrice = product.discountedPrice ?? product.salePrice;
  // 추가 선택의 추가금은 모든 행에 같게 붙는다(조합 추가금은 행마다 다르다)
  const extraPerUnit = unitPriceOf(0, 0, addonGroups, selection);
  const [calendars, setCalendars] = useState<Record<string, CalendarDayView[]>>({});
  const lineVariants = state.lines.map((line) => line.variantId).join(",");
  useEffect(() => {
    if (!dated) return;
    for (const variantId of lineVariants.split(",").filter(Boolean)) {
      if (calendars[variantId]) continue;
      getStayCalendar({ data: { productId: product.productId, variantId } })
        .catch(() => [])
        .then((days) => setCalendars((current) => ({ ...current, [variantId]: days })));
    }
  }, [dated, lineVariants, product.productId, calendars]);
  const calendarOf = (variantId: string) => calendars[variantId] ?? null;
  const unitOf = (variantId: string) => {
    const days = dated ? calendarOf(variantId) : null;
    const quote = days ? stayQuote(days, stay.checkIn, stay.checkOut) : null;
    if (quote) return quote.amount;
    const variant = product.variants.find((v) => v.variantId === variantId);
    return basePrice + (variant?.additionalPrice ?? 0);
  };
  const totals = dated
    ? state.lines.reduce(
        (sum, line) => ({
          count: sum.count + line.quantity,
          amount: sum.amount + (unitOf(line.variantId) + extraPerUnit) * line.quantity,
        }),
        { count: 0, amount: 0 },
      )
    : purchaseTotals(product, state.lines, basePrice, extraPerUnit);
  const problems = checked ? selectionProblems(addonGroups, customInputs, selection) : [];

  /** 담기·바로구매 전 검사 — 행이 없거나 추가 선택이 빠졌으면 요청을 만들지 않는다 */
  const requestsOrNull = () => {
    setChecked(true);
    if (!state.lines.length) {
      setError(m.pd_option_required());
      return null;
    }
    const found = selectionProblems(addonGroups, customInputs, selection);
    if (found[0]) {
      document.getElementById(optionFieldDomId(found[0].key))?.focus();
      return null;
    }
    if (dated && (!stay.checkIn || !stay.checkOut || stay.checkOut <= stay.checkIn)) {
      setError(m.pd_stay_required());
      return null;
    }
    setError(null);
    const payload = selectionPayload(addonGroups, customInputs, selection);
    return state.lines.map((line) => ({
      productId: product.productId,
      optionId: hasOptions ? line.variantId : undefined,
      quantity: line.quantity,
      ...payload,
      ...(dated ? { stay } : {}),
    }));
  };

  // 담기 함수가 렌더마다 최신 상태를 닫도록 매번 만든다(값이 작아 비용이 없다)
  const value: PurchaseContextValue = {
    product,
    hasOptions,
    state,
    choose: (step, valueId) => {
      setError(null);
      setState((current) => chooseValue(product, current, step, valueId));
    },
    setQuantity: (variantId, quantity) =>
      setState((current) => setLineQuantity(current, variantId, quantity)),
    remove: (variantId) => setState((current) => removeLine(current, variantId)),
    selection,
    setSelection,
    problems,
    basePrice,
    totals,
    submitting,
    error,
    wished,
    setWished,
    dated,
    stay,
    calendarOf,
    unitOf,
    setStay: (next) => {
      setError(null);
      setStay(next);
    },
    addToCart: () => {
      const requests = requestsOrNull();
      if (!requests) return;
      setSubmitting(true);
      // 한 줄씩 담는다 — 비회원 장바구니 토큰이 첫 담기에서 발급된다
      requests
        .reduce<Promise<unknown>>(
          (chain, data) => chain.then(() => addToCart({ data })),
          Promise.resolve(),
        )
        .then(() => {
          // 헤더 장바구니 배지를 바로 맞춘다(실패해도 담기는 끝났다)
          void queryClient.invalidateQueries({ queryKey: CART_COUNT_KEY });
          return navigate({ to: "/cart" });
        })
        .catch(() => setError(m.product_purchase_add_failed()))
        .finally(() => setSubmitting(false));
    },
    buyNow: () => {
      const requests = requestsOrNull();
      if (!requests) return;
      setSubmitting(true);
      const single = requests.length === 1 ? requests[0] : null;
      const prepared = single
        ? prepareDirectCheckout({ data: single })
        : prepareMultiCheckout({ data: { lines: requests } });
      prepared
        .then((result) =>
          result.search
            ? navigate({ to: "/checkout", search: result.search })
            : setError(result.error),
        )
        .catch(() => setError(m.product_purchase_checkout_failed()))
        .finally(() => setSubmitting(false));
    },
  };

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}
