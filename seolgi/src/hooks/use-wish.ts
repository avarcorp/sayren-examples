import { useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toggleWishFn } from "../lib/wishlist";

/** 찜 상태 — 누르면 바로 바꾸고 실패하면 되돌린다. 로그인하지 않았으면 로그인 화면으로 보낸다 */
export function useWish(productId: string, initial: boolean) {
  const [wished, setWished] = useState(initial);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  async function toggle() {
    const next = !wished;
    setWished(next);
    setBusy(true);
    try {
      const result = await toggleWishFn({ data: { productId, wished: next } });
      if ("needLogin" in result) {
        setWished(!next);
        await navigate({ to: "/login", search: { redirectTo: location.href } });
      }
    } catch {
      setWished(!next);
    } finally {
      setBusy(false);
    }
  }
  return { wished, busy, toggle };
}
