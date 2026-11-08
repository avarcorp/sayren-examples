import { useState } from "react";
import { DaumPostcodeEmbed } from "react-daum-postcode";
import { m } from "../i18n";
import { Button, Field, Input } from "./ui";

export interface AddressValue {
  receiverName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
  deliveryMemo: string;
}

export const EMPTY_ADDRESS: AddressValue = {
  receiverName: "",
  phone: "",
  zipCode: "",
  address1: "",
  address2: "",
  deliveryMemo: "",
};

/**
 * 배송지 입력 — 우편번호 검색(react-daum-postcode)으로 주소를 고른다.
 * 우편번호가 정해지면 `onZipCode`로 알린다(주문서가 배송비를 다시 계산한다)
 */
export function AddressForm({
  value,
  onChange,
  onZipCode,
  errors = {},
  memo = true,
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  onZipCode?: (zipCode: string) => void;
  errors?: Partial<Record<keyof AddressValue, string>>;
  memo?: boolean;
}) {
  const [search, setSearch] = useState(false);
  const set = (key: keyof AddressValue) => (event: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [key]: event.target.value });
  return (
    <div className="flex flex-col gap-4">
      <Field label={m.address_receiver()} error={errors.receiverName}>
        <Input value={value.receiverName} autoComplete="name" onChange={set("receiverName")} />
      </Field>
      <Field label={m.address_phone()} error={errors.phone}>
        <Input
          value={value.phone}
          inputMode="tel"
          autoComplete="tel"
          placeholder={m.address_phone_placeholder()}
          onChange={(event) => onChange({ ...value, phone: event.target.value.replace(/\D/g, "") })}
        />
      </Field>
      <Field label={m.address_label()} error={errors.zipCode ?? errors.address1}>
        <div className="flex gap-2">
          <Input
            value={value.zipCode}
            readOnly
            placeholder={m.address_zip()}
            className="w-28 shrink-0"
          />
          <Button variant="secondary" className="flex-1" onClick={() => setSearch((open) => !open)}>
            {m.address_search()}
          </Button>
        </div>
      </Field>
      {search ? (
        <div className="overflow-hidden rounded-control border border-line-strong">
          <DaumPostcodeEmbed
            style={{ height: 420 }}
            onComplete={(data) => {
              onChange({
                ...value,
                zipCode: data.zonecode,
                address1: data.roadAddress || data.address,
              });
              setSearch(false);
              onZipCode?.(data.zonecode);
            }}
          />
        </div>
      ) : null}
      {value.address1 ? <p className="break-words text-body">{value.address1}</p> : null}
      <Field label={m.address_detail()}>
        <Input value={value.address2} autoComplete="address-line2" onChange={set("address2")} />
      </Field>
      {memo ? (
        <Field label={m.address_memo()}>
          <Input
            value={value.deliveryMemo}
            maxLength={100}
            placeholder={m.address_memo_placeholder()}
            onChange={set("deliveryMemo")}
          />
        </Field>
      ) : null}
    </div>
  );
}
