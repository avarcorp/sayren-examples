import { createFileRoute } from "@tanstack/react-router";
import { CheckoutTemplate } from "../components/templates/checkout-template";
import { useCheckout } from "../hooks/use-checkout";
import { createCheckoutFn } from "../lib/checkout";
import { checkoutSearch } from "../lib/checkout-intent";

export const Route = createFileRoute("/checkout/")({
  validateSearch: checkoutSearch,
  loaderDeps: ({ search }) => search,
  // loader가 주문서 세션을 만든다 — 링크에 마우스를 올린 것만으로 만들지 않는다
  preload: false,
  // 주문서는 들어올 때마다 새로 만든다(가격·재고를 다시 계산한다)
  staleTime: 0,
  gcTime: 0,
  loader: ({ deps, location }) => createCheckoutFn({ data: { search: deps, back: location.href } }),
  head: () => ({ meta: [{ title: "주문서 | 설기로운" }] }),
  staticData: { checkoutStep: 2 },
  component: CheckoutPage,
});

/** 주문서를 새로 만들면(다시 들어오기) 입력·쿠폰·결제 상태를 새로 시작한다 */
function CheckoutPage() {
  const data = Route.useLoaderData();
  return <CheckoutView key={data.checkout.checkoutId} data={data} />;
}

function CheckoutView({ data }: { data: ReturnType<typeof Route.useLoaderData> }) {
  const state = useCheckout(data);
  return <CheckoutTemplate state={state} />;
}
