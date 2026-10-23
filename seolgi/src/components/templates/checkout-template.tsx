import type { CheckoutState } from "../../hooks/use-checkout";
import { CheckoutDiscounts } from "../organisms/checkout-discounts";
import { CheckoutLines } from "../organisms/checkout-lines";
import { CheckoutOrderer } from "../organisms/checkout-orderer";
import { CheckoutShipping } from "../organisms/checkout-shipping";
import { CheckoutSummary } from "../organisms/checkout-summary";
import { PaymentMethods } from "../organisms/payment-methods";

/** 주문서 (시안 DCheckout) — 왼쪽 주문자·배송지·주문 상품·할인·결제수단, 오른쪽 금액과 결제 버튼 */
export function CheckoutTemplate({ state }: { state: CheckoutState }) {
  const guest = !state.data.member;
  const discounts = state.data.member || state.data.checkout.points;
  return (
    <form
      id="checkout-form"
      noValidate
      onSubmit={(e) => void state.submit(e)}
      className="flex flex-wrap items-start gap-14 pt-12 pb-16"
    >
      <div className="flex min-w-0 flex-[999_1_640px] flex-col gap-14">
        <h1 className="font-display text-page-title">주문서</h1>
        {guest ? <CheckoutOrderer state={state} /> : null}
        <CheckoutShipping state={state} />
        <CheckoutLines items={state.data.checkout.items} />
        {discounts || guest ? <CheckoutDiscounts state={state} /> : null}
        <PaymentMethods state={state} />
      </div>
      <CheckoutSummary state={state} />
    </form>
  );
}
