import type { Cart } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { removeCartItemsFn, updateCartItemFn } from "../lib/cart";

/** 장바구니 화면 상태 — 고른 줄, 수량 변경·삭제, 오류 문구. 바꾼 뒤 장바구니 캐시를 다시 받는다 */
export function useCartActions(cart: Cart) {
  const queryClient = useQueryClient();
  const buyable = cart.items.filter((i) => i.purchasable);
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(buyable.map((i) => i.cartItemId)),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 고른 id는 지금 장바구니에 있는 줄과만 맞춘다 — 다른 경로로 지운 줄 id가 남으면 선택 삭제가 404로 멈춘다
  const chosen = buyable.filter((i) => picked.has(i.cartItemId));
  const chosenIds = chosen.map((i) => i.cartItemId);

  async function run(job: () => Promise<{ error: string | null }>) {
    setBusy(true);
    setError(null);
    try {
      const { error: failed } = await job();
      if (failed) setError(failed);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch {
      setError("장바구니를 바꾸지 못했습니다. 다시 시도하십시오.");
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    chosen,
    allPicked: chosen.length === buyable.length && buyable.length > 0,
    isPicked: (id: string) => picked.has(id),
    toggle: (id: string) =>
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: () =>
      setPicked((prev) =>
        chosen.length === buyable.length && prev.size > 0
          ? new Set()
          : new Set(buyable.map((i) => i.cartItemId)),
      ),
    setQuantity: (cartItemId: string, quantity: number) =>
      run(() => updateCartItemFn({ data: { cartItemId, quantity } })),
    remove: (cartItemIds: string[]) => run(() => removeCartItemsFn({ data: { cartItemIds } })),
    removeChosen: () => run(() => removeCartItemsFn({ data: { cartItemIds: chosenIds } })),
  };
}

export type CartActions = ReturnType<typeof useCartActions>;
