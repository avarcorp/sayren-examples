import { type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import { m } from "../../i18n";
import { SectionTitle } from "../ui";

/** 결제 수단 — 주문서의 `paymentOptions` 그대로. 값은 `paymentOptionKey` */
export function PaymentOptions({
  options,
  value,
  onChange,
  title = m.checkout_payment(),
}: {
  options: AvailablePaymentOption[];
  value: string;
  onChange: (key: string) => void;
  title?: string;
}) {
  return (
    <section aria-labelledby="co-payment" className="flex flex-col gap-3">
      <SectionTitle id="co-payment">{title}</SectionTitle>
      <div role="radiogroup" aria-labelledby="co-payment" className="grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const key = paymentOptionKey(opt);
          const active = key === value;
          return (
            <label
              key={key}
              className={`flex min-h-12 cursor-pointer items-center gap-3 border px-4 text-body-lg ${active ? "border-point font-semibold" : "border-line-strong"}`}
            >
              <input
                type="radio"
                name="payment-option"
                value={key}
                checked={active}
                onChange={() => onChange(key)}
                className="size-4 accent-point-strong"
              />
              {opt.logoUrl ? (
                <img src={`${opt.logoUrl}?w=48&f=webp`} alt="" className="size-6 shrink-0" />
              ) : null}
              {opt.label}
            </label>
          );
        })}
      </div>
    </section>
  );
}
