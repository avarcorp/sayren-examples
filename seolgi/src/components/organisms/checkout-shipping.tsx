import { useState } from "react";
import type { CheckoutState } from "../../hooks/use-checkout";
import { MEMO_CUSTOM, MEMO_PRESETS } from "../../lib/checkout-form";
import { formatPhone } from "../../lib/format";
import { Checkbox } from "../atoms/checkbox";
import { inputClass } from "../atoms/text-input";
import { AddressSearchButton } from "../molecules/address-search-button";
import { FormField, fieldAria } from "../molecules/form-field";
import { SectionTitle } from "../molecules/section-title";

/**
 * 배송지 (시안 DCheckout) — 저장한 배송지면 이름·연락처·주소 세 줄과 「변경」, 아니면 입력 칸.
 * 「변경」은 저장한 배송지 목록과 「새 배송지」를 펼친다. 아래에 배송 요청사항.
 */
export function CheckoutShipping({ state }: { state: CheckoutState }) {
  const { register, formState, watch, setValue, clearErrors } = state.form;
  const e = formState.errors;
  const { address } = state;
  const [choosing, setChoosing] = useState(false);
  const [manual, setManual] = useState(false);
  const memoChoice = watch("memoChoice");
  const zip = register("zipCode", { onBlur: (ev) => address.quoteZip(ev.target.value.trim()) });
  const saved = address.mode === "saved" && address.selected;

  return (
    <section aria-labelledby="shipping-title" className="flex flex-col gap-5">
      <SectionTitle
        id="shipping-title"
        title="배송지"
        action={
          address.list.length > 0 ? (
            <button
              type="button"
              aria-expanded={choosing}
              onClick={() => setChoosing((v) => !v)}
              className="h-9 text-small underline underline-offset-[3px]"
            >
              변경
            </button>
          ) : null
        }
      />
      {choosing ? (
        <ul className="flex flex-col border-line border-b">
          {address.list.map((a) => (
            <li key={a.addressId}>
              <button
                type="button"
                onClick={() => {
                  address.pick(a);
                  setChoosing(false);
                }}
                aria-pressed={address.selected?.addressId === a.addressId}
                className="flex w-full flex-col gap-0.5 border-line border-t py-3 text-left text-body hover:bg-tone-plain/50"
              >
                <span className="font-medium">
                  {a.alias} · {a.receiverName}
                  {a.isDefault ? (
                    <span className="ml-1.5 font-normal text-caption text-muted">기본 배송지</span>
                  ) : null}
                </span>
                <span className="text-muted text-small">
                  ({a.zipCode}) {a.address1} {a.address2 ?? ""}
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                address.startNew();
                setChoosing(false);
              }}
              className="h-12 w-full border-line border-t text-left text-body underline underline-offset-[3px]"
            >
              새 배송지 입력
            </button>
          </li>
        </ul>
      ) : null}

      {saved ? (
        <div className="flex flex-col gap-1 text-body leading-[1.7]">
          <span className="font-medium">
            {address.selected?.receiverName}
            {address.selected?.isDefault ? (
              <span className="ml-1.5 font-normal text-caption text-muted">기본 배송지</span>
            ) : null}
          </span>
          <span>{formatPhone(address.selected?.phone ?? "")}</span>
          <span>
            ({address.selected?.zipCode}) {address.selected?.address1}{" "}
            {address.selected?.address2 ?? ""}
          </span>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <FormField id="receiver" label="받는 분" required error={e.receiverName?.message}>
            <input
              {...register("receiverName")}
              {...fieldAria("receiver", e.receiverName?.message)}
              autoComplete="name"
              className={inputClass}
            />
          </FormField>
          <FormField id="phone" label="연락처" required error={e.phone?.message}>
            <input
              {...register("phone")}
              {...fieldAria("phone", e.phone?.message)}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01012345678"
              className={inputClass}
            />
          </FormField>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="font-medium text-small">주소</span>
            <div className="flex items-end gap-3">
              <input
                {...zip}
                {...fieldAria("zip", e.zipCode?.message)}
                aria-label="우편번호"
                placeholder="우편번호"
                inputMode="numeric"
                readOnly={!manual}
                className={`${inputClass} max-w-[140px]`}
              />
              <AddressSearchButton
                onSelect={({ zipCode, address1 }) => {
                  setValue("zipCode", zipCode);
                  setValue("address1", address1);
                  clearErrors(["zipCode", "address1"]);
                  address.quoteZip(zipCode);
                  document.getElementById("address2")?.focus();
                }}
                onUnavailable={() => setManual(true)}
              />
            </div>
            <input
              {...register("address1")}
              {...fieldAria("address1", e.address1?.message)}
              aria-label="기본 주소"
              readOnly={!manual}
              placeholder={manual ? "기본 주소" : "주소 검색으로 입력합니다"}
              className={inputClass}
            />
            <input
              {...register("address2")}
              id="address2"
              aria-label="상세 주소"
              placeholder="상세 주소"
              className={inputClass}
            />
            {e.zipCode?.message || e.address1?.message ? (
              <p id="zip-msg" className="text-primary text-small">
                {e.zipCode?.message ?? e.address1?.message}
              </p>
            ) : null}
            {address.list.length > 0 || state.data.member ? (
              <Checkbox
                checked={address.saveAsDefault}
                onChange={(ev) => address.setSaveAsDefault(ev.target.checked)}
                className="text-small"
              >
                기본 배송지로 저장
              </Checkbox>
            ) : null}
          </div>
        </div>
      )}

      <FormField id="memo" label="배송 요청사항" required>
        <select
          {...register("memoChoice")}
          id="memo"
          className="h-12 border-0 border-line-strong border-b bg-transparent text-body"
        >
          {MEMO_PRESETS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value={MEMO_CUSTOM}>{MEMO_CUSTOM}</option>
        </select>
      </FormField>
      {memoChoice === MEMO_CUSTOM ? (
        <input
          {...register("memoText")}
          aria-label="배송 요청사항 직접 입력"
          maxLength={100}
          placeholder="100자까지 입력합니다"
          className={inputClass}
        />
      ) : null}
    </section>
  );
}
