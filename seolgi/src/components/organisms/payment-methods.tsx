import {
  type AvailablePaymentOption,
  cashReceiptAvailable,
  paymentOptionKey,
} from "@sayren/storefront-sdk";
import type { CheckoutState } from "../../hooks/use-checkout";
import { inputClass } from "../atoms/text-input";
import { RadioDot } from "../molecules/radio-dot";
import { SectionTitle } from "../molecules/section-title";

const LOGOS: Record<string, string> = {
  NAVERPAY: "/pay/naverpay.svg",
  KAKAOPAY: "/pay/kakaopay.svg",
  TOSSPAY: "/pay/tosspay.svg",
  PAYCO: "/pay/payco.svg",
};
const OTHERS = ["BANK_TRANSFER", "VIRTUAL_ACCOUNT", "MOBILE"] as const;

/**
 * 결제수단 (시안 DCheckout) — 신용·체크카드 행(설명 두 줄), 간편결제 행(결제사 로고 타일), 나머지 행.
 * 서버가 준 결제 옵션을 모두 고를 수 있다. 행·타일은 그 결제수단(결제사)의 첫 번째 쓸 수 있는 옵션을 고르는 바로가기이고,
 * 같은 결제수단에 PG가 여럿이면 고른 행 아래에 PG 선택이 열린다. 결제창에서 다시 고를 수 없는 실패로 끝난 옵션은 막는다.
 */
export function PaymentMethods({ state }: { state: CheckoutState }) {
  const { options, selected, selectedKey, unavailableKeys, select } = state.payment;
  const usable = (o: AvailablePaymentOption) => !unavailableKeys.has(paymentOptionKey(o));
  const ofMethod = (method: string) => options.filter((o) => o.method === method);
  const pickFirst = (list: AvailablePaymentOption[]) => {
    const first = list.find(usable);
    if (first) select(paymentOptionKey(first));
  };
  const cards = ofMethod("CARD");
  const easy = easyPayProviders(options);
  const easySelected = selected?.method === "EASY_PAY" ? selected : null;
  const easyGroup = easySelected
    ? easy.find((g) => g.provider === easySelected.provider)
    : undefined;
  const pgPicker = (list: AvailablePaymentOption[]) =>
    list.length > 1 ? (
      <PgPicker
        options={list}
        selectedKey={selectedKey}
        unavailableKeys={unavailableKeys}
        onSelect={select}
      />
    ) : null;
  const row =
    "flex h-13 w-full items-center gap-3 text-left font-medium text-lead disabled:text-muted";
  return (
    <section aria-labelledby="pay-title" className="flex flex-col gap-5">
      <SectionTitle id="pay-title" title="결제 수단" />
      {!state.paymentRequired ? (
        <p className="text-body text-muted">
          적립금으로 전액 결제합니다. 결제수단을 고르지 않습니다.
        </p>
      ) : options.length === 0 ? (
        <p className="text-body text-muted">지금 사용할 수 있는 결제수단이 없습니다.</p>
      ) : (
        <fieldset className="flex flex-col">
          <legend className="sr-only">결제 수단</legend>
          {cards.some(usable) ? (
            <div className="border-line border-b pt-1 pb-5">
              <label className={row}>
                <input
                  type="radio"
                  name="payment-method"
                  className="sr-only"
                  checked={selected?.method === "CARD"}
                  onChange={() => pickFirst(cards)}
                />
                <RadioDot on={selected?.method === "CARD"} />
                신용·체크카드
              </label>
              <div className="flex flex-col gap-1.5 pl-8 text-muted text-small leading-relaxed">
                <span>카드사와 할부 개월은 결제창에서 선택합니다.</span>
                <span>법인카드와 해외 발급 카드도 사용할 수 있습니다.</span>
              </div>
              {selected?.method === "CARD" ? pgPicker(cards) : null}
            </div>
          ) : null}
          {easy.length > 0 ? (
            <div className="border-line border-b pt-1 pb-5">
              <div className="flex h-13 items-center gap-3 font-medium text-lead">
                <RadioDot on={Boolean(easySelected)} />
                간편결제
              </div>
              <div className="grid grid-cols-2 gap-2 pl-8 sm:grid-cols-[repeat(auto-fill,minmax(140px,1fr))]">
                {easy.map((g) => {
                  const on = easySelected?.provider === g.provider;
                  const blocked = !g.options.some(usable);
                  return (
                    <label
                      key={g.provider}
                      className={`flex h-14 cursor-pointer items-center justify-center gap-2 bg-page px-3 font-medium text-body has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-40 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-primary ${on ? "border-2 border-primary" : "border border-line-strong hover:border-ink"}`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        className="sr-only"
                        checked={on}
                        disabled={blocked}
                        onChange={() => pickFirst(g.options)}
                      />
                      {LOGOS[g.provider] ? (
                        <img
                          src={LOGOS[g.provider]}
                          alt=""
                          width={24}
                          height={24}
                          className="size-6 shrink-0"
                        />
                      ) : null}
                      {g.options[0]?.label}
                    </label>
                  );
                })}
              </div>
              {easyGroup ? pgPicker(easyGroup.options) : null}
              <p className="pt-3 pl-8 text-muted text-small">
                {easySelected
                  ? `${easySelected.label} 결제창으로 이동합니다.`
                  : "사용할 간편결제를 선택합니다."}
              </p>
            </div>
          ) : null}
          {OTHERS.map((method) => {
            const list = ofMethod(method);
            if (!list.some(usable)) return null;
            const on = selected?.method === method;
            return (
              <div key={method} className="border-line border-b">
                <label className={`${row} h-14`}>
                  <input
                    type="radio"
                    name="payment-method"
                    className="sr-only"
                    checked={on}
                    onChange={() => pickFirst(list)}
                  />
                  <RadioDot on={on} />
                  {list[0]?.label}
                </label>
                {on && list.length > 1 ? <div className="pb-4">{pgPicker(list)}</div> : null}
              </div>
            );
          })}
        </fieldset>
      )}
      {selected && cashReceiptAvailable(selected.method) ? <CashReceipt state={state} /> : null}
    </section>
  );
}

/** 간편결제 옵션을 결제사로 묶는다 — 결제사 하나가 PG 여럿으로 올 수 있다. 처음 나온 순서를 지킨다 */
function easyPayProviders(options: AvailablePaymentOption[]) {
  const groups: { provider: string; options: AvailablePaymentOption[] }[] = [];
  for (const o of options) {
    if (o.method !== "EASY_PAY") continue;
    const group = groups.find((g) => g.provider === o.provider);
    if (group) group.options.push(o);
    else groups.push({ provider: o.provider, options: [o] });
  }
  return groups;
}

/** 같은 결제수단의 PG 고르기 — 고른 행 아래에 PG 이름 라디오. 쓸 수 없는 PG는 막는다 */
function PgPicker({
  options,
  selectedKey,
  unavailableKeys,
  onSelect,
}: {
  options: AvailablePaymentOption[];
  selectedKey: string;
  unavailableKeys: ReadonlySet<string>;
  onSelect: (key: string) => void;
}) {
  return (
    <fieldset className="flex flex-wrap gap-x-5 gap-y-1 pt-3 pl-8">
      <legend className="sr-only">결제 대행사</legend>
      {options.map((o) => {
        const key = paymentOptionKey(o);
        const blocked = unavailableKeys.has(key);
        return (
          <label
            key={key}
            className={`flex min-h-11 items-center gap-2 text-small ${blocked ? "cursor-not-allowed text-muted" : "cursor-pointer"}`}
          >
            <input
              type="radio"
              name="payment-pg"
              className="size-4 accent-primary"
              checked={key === selectedKey}
              disabled={blocked}
              onChange={() => onSelect(key)}
            />
            {o.pgName}
          </label>
        );
      })}
    </fieldset>
  );
}

/** 현금영수증 — 계좌이체·가상계좌에서만 받는다. 주민등록번호는 받지 않는다 */
function CashReceipt({ state }: { state: CheckoutState }) {
  const { cashReceipt: v, setCashReceipt, cashReceiptError } = state.payment;
  return (
    <fieldset className="flex flex-col gap-3 pl-8">
      <legend className="sr-only">현금영수증</legend>
      <label className="flex min-h-11 items-center gap-2.5 text-body">
        <input
          type="checkbox"
          className="size-[18px] accent-primary"
          checked={v.on}
          onChange={(e) => setCashReceipt({ ...v, on: e.target.checked })}
        />
        현금영수증 신청
      </label>
      {v.on ? (
        <div className="flex flex-wrap items-end gap-3">
          <select
            aria-label="용도"
            value={v.type}
            onChange={(e) => setCashReceipt({ ...v, type: e.target.value as typeof v.type })}
            className="h-12 border-0 border-ink border-b bg-transparent text-body"
          >
            <option value="INCOME_DEDUCTION">소득공제</option>
            <option value="EXPENSE_PROOF">지출증빙</option>
          </select>
          <input
            aria-label={v.type === "INCOME_DEDUCTION" ? "휴대폰 번호" : "사업자등록번호"}
            inputMode="numeric"
            value={v.number}
            onChange={(e) => setCashReceipt({ ...v, number: e.target.value })}
            placeholder={v.type === "INCOME_DEDUCTION" ? "휴대폰 번호" : "사업자등록번호"}
            className={`${inputClass} max-w-[240px]`}
          />
          {cashReceiptError ? (
            <p className="w-full text-primary text-small">{cashReceiptError}</p>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
