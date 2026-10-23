import type { CheckoutState } from "../../hooks/use-checkout";
import { inputClass } from "../atoms/text-input";
import { FormField, fieldAria } from "../molecules/form-field";
import { SectionTitle } from "../molecules/section-title";

/** 비회원 주문자 — 이름·이메일·주문 조회 비밀번호. 연락처는 배송지 연락처를 함께 쓴다 */
export function CheckoutOrderer({ state }: { state: CheckoutState }) {
  const { register, formState } = state.form;
  const e = formState.errors;
  return (
    <section aria-labelledby="orderer-title" className="flex flex-col gap-5">
      <SectionTitle
        id="orderer-title"
        title="주문자"
        action={<span className="text-muted text-small">비회원 주문</span>}
      />
      <div className="grid gap-5 md:grid-cols-2">
        <FormField id="guest-name" label="이름" required error={e.guestName?.message}>
          <input
            {...register("guestName")}
            {...fieldAria("guest-name", e.guestName?.message)}
            autoComplete="name"
            className={inputClass}
          />
        </FormField>
        <FormField
          id="guest-email"
          label="이메일"
          required
          error={e.guestEmail?.message}
          hint="주문 안내를 보냅니다"
        >
          <input
            {...register("guestEmail")}
            {...fieldAria("guest-email", e.guestEmail?.message, true)}
            type="email"
            autoComplete="email"
            className={inputClass}
          />
        </FormField>
        <FormField
          id="order-password"
          label="주문 조회 비밀번호"
          required
          error={e.orderPassword?.message}
          hint="6자 이상. 비회원 주문 조회에 씁니다"
        >
          <input
            {...register("orderPassword")}
            {...fieldAria("order-password", e.orderPassword?.message, true)}
            type="password"
            autoComplete="new-password"
            className={inputClass}
          />
        </FormField>
      </div>
    </section>
  );
}
