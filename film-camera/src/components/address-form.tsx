import { lazy, Suspense, useState } from "react";
import type { Address } from "react-daum-postcode";
import { m } from "../i18n";
import { Button, TextField } from "./ui";

/** 우편번호 검색은 브라우저에서만 쓰므로 열 때 불러온다(서버 렌더에 넣지 않는다) */
const PostcodeEmbed = lazy(() =>
  import("react-daum-postcode").then((mod) => ({ default: mod.KakaoPostcodeEmbed })),
);

export interface AddressValue {
  receiverName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
  deliveryMemo: string;
}

/**
 * 배송지 입력 — 받는 사람·연락처·우편번호 검색·주소·상세 주소·배송 메모.
 * 우편번호가 정해지면 `onZipCode`로 알린다(주문서가 배송비를 다시 계산한다).
 */
export function AddressForm({
  idPrefix,
  value,
  onChange,
  onZipCode,
  withMemo = true,
  errors = {},
}: {
  errors?: Record<string, string>;
  idPrefix: string;
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  onZipCode?: (zipCode: string) => void;
  withMemo?: boolean;
}) {
  const [searching, setSearching] = useState(false);
  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });

  const complete = (address: Address) => {
    set({ zipCode: address.zonecode, address1: address.roadAddress || address.address });
    setSearching(false);
    onZipCode?.(address.zonecode);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={`${idPrefix}-receiver`}
          error={errors[`ship.receiverName`]}
          label={m.field_receiver()}
          required
          autoComplete="shipping name"
          value={value.receiverName}
          onChange={(e) => set({ receiverName: e.target.value })}
        />
        <TextField
          id={`${idPrefix}-phone`}
          error={errors[`ship.phone`]}
          label={m.field_phone()}
          required
          type="tel"
          inputMode="numeric"
          autoComplete="shipping tel"
          placeholder={m.field_phone_placeholder()}
          value={value.phone}
          onChange={(e) => set({ phone: e.target.value })}
        />
      </div>
      <div className="flex items-end gap-2">
        <div className="w-36 shrink-0">
          <TextField
            id={`${idPrefix}-zip`}
            error={errors[`ship.zipCode`]}
            label={m.field_zip()}
            required
            readOnly
            value={value.zipCode}
            onClick={() => setSearching(true)}
          />
        </div>
        <Button variant="secondary" onClick={() => setSearching((open) => !open)}>
          {searching ? m.address_search_close() : m.address_search()}
        </Button>
      </div>
      {searching ? (
        <div className="h-[28rem] border border-line">
          <Suspense fallback={null}>
            <PostcodeEmbed onComplete={complete} style={{ height: "100%" }} />
          </Suspense>
        </div>
      ) : null}
      <TextField
        id={`${idPrefix}-address1`}
        error={errors[`ship.address1`]}
        label={m.field_address1()}
        required
        readOnly
        value={value.address1}
        onClick={() => setSearching(true)}
      />
      <TextField
        id={`${idPrefix}-address2`}
        label={m.field_address2()}
        autoComplete="shipping address-line2"
        value={value.address2}
        onChange={(e) => set({ address2: e.target.value })}
      />
      {withMemo ? (
        <TextField
          id={`${idPrefix}-memo`}
          error={errors[`ship.deliveryMemo`]}
          label={m.field_memo()}
          placeholder={m.field_memo_placeholder()}
          maxLength={100}
          value={value.deliveryMemo}
          onChange={(e) => set({ deliveryMemo: e.target.value })}
        />
      ) : null}
    </div>
  );
}
