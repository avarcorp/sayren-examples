import type { ProductDetail } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { addToCartFn, prepareDirectCheckoutFn } from "../lib/cart";
import { messageOf } from "../lib/errors";
import { type LineRequest, MAX_LINE_QUANTITY } from "../lib/line-request";
import {
  addonKey,
  initialAddons,
  inputKey,
  type OptionSelection,
  selectionPayload,
  selectionProblems,
  unitPriceOf,
} from "../lib/product-options";
import { pickValue, resolveVariant, type ValuePicks } from "../lib/variant-pick";

export type PurchaseNotice = { kind: "added" } | { kind: "error"; message: string } | null;

/**
 * 상세의 구매 상태 — 조합 선택, 추가 선택, 직접 입력, 수량, 담기·바로구매.
 * 데스크톱 구매 영역과 모바일 옵션 시트가 같은 상태를 쓴다. 합계는 미리보기이고 최종 금액은 서버가 정한다.
 */
export function usePurchase(product: ProductDetail) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [picks, setPicks] = useState<ValuePicks>({});
  const [selection, setSelection] = useState<OptionSelection>({
    addons: initialAddons(product.addonGroups),
    inputs: {},
  });
  const [quantity, setQuantity] = useState(1);
  // 칸 아래 오류는 그 칸을 건드린 뒤에만 보인다. 담기 버튼 아래 안내는 처음부터 첫 문제를 보인다
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<PurchaseNotice>(null);
  const [busy, setBusy] = useState(false);

  const hasOptions = product.optionGroups.length > 0;
  const variant = resolveVariant(product.optionGroups, product.variants, picks);
  const basePrice = product.discountedPrice ?? product.salePrice;
  const unitPrice = unitPriceOf(
    basePrice,
    variant?.additionalPrice ?? 0,
    product.addonGroups,
    selection,
  );
  const found: Record<string, string> = {};
  if (hasOptions && !variant) found.variant = "옵션을 모두 선택하십시오";
  else if (variant?.soldOut) found.variant = "품절된 옵션입니다";
  for (const p of selectionProblems(product.addonGroups, product.customInputs, selection))
    found[p.key] = p.message;
  const blocker = Object.values(found)[0] ?? null;
  // 필수 선택·입력을 채우기 전에는 담기·구매 버튼을 막는다
  const ready = !product.soldOut && blocker === null;
  const problems = Object.fromEntries(Object.entries(found).filter(([k]) => touched.has(k)));
  const touch = (key: string) =>
    setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));

  /** 담기 요청 본문 — 막힌 상태면 null(버튼이 막혀 있어 평소엔 오지 않는다) */
  function lineOrProblems(): LineRequest | null {
    if (!ready) return null;
    const { addons, customInputs } = selectionPayload(
      product.addonGroups,
      product.customInputs,
      selection,
    );
    return {
      productId: product.productId,
      optionId: variant?.variantId,
      quantity,
      ...(addons.length ? { addons } : {}),
      ...(customInputs.length ? { customInputs } : {}),
    };
  }

  async function addToCart() {
    const line = lineOrProblems();
    if (!line) return;
    setBusy(true);
    setNotice(null);
    try {
      const { error } = await addToCartFn({ data: line });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      setNotice(error ? { kind: "error", message: error } : { kind: "added" });
    } catch (error) {
      setNotice({ kind: "error", message: messageOf(error, "장바구니에 담지 못했습니다.") });
    } finally {
      setBusy(false);
    }
  }

  async function buyNow() {
    const line = lineOrProblems();
    if (!line) return;
    setBusy(true);
    setNotice(null);
    try {
      const { search, error } = await prepareDirectCheckoutFn({ data: line });
      if (!search) {
        setNotice({ kind: "error", message: error ?? "주문서를 열지 못했습니다." });
        return;
      }
      await navigate({ to: "/checkout", search });
    } catch (error) {
      setNotice({ kind: "error", message: messageOf(error, "주문서를 열지 못했습니다.") });
    } finally {
      setBusy(false);
    }
  }

  return {
    product,
    picks,
    pick: (groupId: string, valueId: string) => {
      setPicks((prev) => pickValue(product.optionGroups, product.variants, prev, groupId, valueId));
    },
    selection,
    setAddon: (groupId: string, valueId: string) => {
      touch(addonKey(groupId));
      setSelection((prev) => ({ ...prev, addons: { ...prev.addons, [groupId]: valueId } }));
    },
    setInput: (inputId: string, value: string) => {
      touch(inputKey(inputId));
      setSelection((prev) => ({ ...prev, inputs: { ...prev.inputs, [inputId]: value } }));
    },
    quantity,
    setQuantity: (n: number) => setQuantity(Math.min(MAX_LINE_QUANTITY, Math.max(1, n))),
    variant,
    unitPrice,
    total: unitPrice * quantity,
    ready,
    blocker,
    problems,
    notice,
    busy,
    addToCart,
    buyNow,
  };
}

export type Purchase = ReturnType<typeof usePurchase>;
