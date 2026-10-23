import type { CheckoutState } from "../../hooks/use-checkout";
import { formatMoney } from "../../lib/format";
import { Button } from "../atoms/button";
import { Checkbox } from "../atoms/checkbox";
import { SummaryRows } from "../molecules/summary-rows";

/**
 * 주문서 오른쪽 (시안 DCheckout) — 금액 줄(서버 값), 최종 결제 금액, 테스트 결제 안내, 동의, 결제 버튼.
 * 버튼 글은 「네이버페이로 51,700원 결제하기」처럼 고른 간편결제를 앞에 붙인다.
 */
export function CheckoutSummary({ state }: { state: CheckoutState }) {
  const { amounts, payment, paymentRequired } = state;
  const agreeError = state.form.formState.errors.agree?.message;
  const via = payment.selected?.method === "EASY_PAY" ? `${payment.selected.label}로 ` : "";
  const label = paymentRequired
    ? `${via}${formatMoney(amounts.totalAmount)} 결제하기`
    : "적립금으로 주문하기";
  return (
    <aside className="flex w-full min-w-0 flex-[1_1_340px] md:max-w-[400px] flex-col gap-4 md:sticky md:top-6 md:pt-24">
      <SummaryRows
        rows={[
          { label: "상품 금액", value: formatMoney(amounts.productAmount) },
          ...(amounts.couponDiscountAmount
            ? [
                {
                  label: "쿠폰 할인",
                  value: `−${formatMoney(amounts.couponDiscountAmount)}`,
                  accent: true,
                },
              ]
            : []),
          ...(amounts.pointAmount
            ? [
                {
                  label: "적립금 사용",
                  value: `−${formatMoney(amounts.pointAmount)}`,
                  accent: true,
                },
              ]
            : []),
          ...(amounts.deliveryDiscountAmount
            ? [
                {
                  label: "배송비 할인",
                  value: `−${formatMoney(amounts.deliveryDiscountAmount)}`,
                  accent: true,
                },
              ]
            : []),
          {
            label: "배송비",
            value: amounts.deliveryFee ? formatMoney(amounts.deliveryFee) : "무료",
          },
        ]}
        totalLabel="최종 결제 금액"
        total={formatMoney(amounts.totalAmount)}
      />
      {state.data.checkout.testPayment ? (
        <p className="bg-tone-cream px-3 py-2 text-caption">
          테스트 결제입니다. 실제로 돈이 나가지 않습니다.
        </p>
      ) : null}
      <Checkbox
        {...state.form.register("agree")}
        aria-invalid={agreeError ? true : undefined}
        aria-describedby={agreeError ? "agree-msg" : undefined}
        className="items-start pt-2 text-small leading-relaxed"
      >
        주문 내용을 확인했고 결제에 동의합니다. 주문제작 상품은 제작 후 교환·반품이 제한됩니다.
      </Checkbox>
      {agreeError ? (
        <p id="agree-msg" className="-mt-2 text-primary text-small">
          {agreeError}
        </p>
      ) : null}
      <Button
        type="submit"
        form="checkout-form"
        size="lg"
        block
        disabled={state.submitting || state.busy}
      >
        {state.submitting ? "결제 준비 중" : label}
      </Button>
      <div role="status" aria-live="polite" className="empty:hidden">
        {state.notice ? (
          <p className="border border-primary px-4 py-3 text-body text-primary">{state.notice}</p>
        ) : null}
      </div>
    </aside>
  );
}
