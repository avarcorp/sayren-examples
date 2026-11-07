import { lazy, Suspense, useState } from "react";
import { m } from "../../i18n";
import { Button } from "../ui/button";
import { TextField } from "../ui/fields";
import { Sheet } from "../ui/sheet";

const DaumPostcodeEmbed = lazy(() => import("react-daum-postcode"));

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
 * 배송지 입력 — 우편번호·기본 주소는 주소 검색(react-daum-postcode)으로만 채운다.
 * 우편번호가 바뀌면 `onZipChange`로 알린다(주문서가 배송비를 다시 받는다)
 */
export function AddressFields({
  value,
  onChange,
  onZipChange,
  errors = {},
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  onZipChange?: (zipCode: string) => void;
  errors?: Partial<Record<keyof AddressValue, string>>;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const set = (key: keyof AddressValue) => (event: { target: { value: string } }) =>
    onChange({ ...value, [key]: event.target.value });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={m.address_receiver()}
          name="receiverName"
          autoComplete="shipping name"
          required
          value={value.receiverName}
          onChange={set("receiverName")}
          error={errors.receiverName}
        />
        <TextField
          label={m.address_phone()}
          name="receiverPhone"
          type="tel"
          inputMode="numeric"
          autoComplete="shipping tel"
          placeholder="01012345678"
          required
          value={value.phone}
          onChange={set("phone")}
          error={errors.phone}
        />
      </div>
      <div className="flex items-end gap-2">
        <TextField
          label={m.address_zip()}
          name="zipCode"
          readOnly
          required
          value={value.zipCode}
          className="w-32"
          error={errors.zipCode}
        />
        <Button variant="secondary" onClick={() => setSearchOpen(true)}>
          {m.address_search()}
        </Button>
      </div>
      <TextField
        label={m.address_line1()}
        name="address1"
        readOnly
        required
        value={value.address1}
        error={errors.address1}
      />
      <TextField
        label={m.address_line2()}
        name="address2"
        autoComplete="shipping address-line2"
        value={value.address2}
        onChange={set("address2")}
      />
      <TextField
        label={m.address_memo()}
        name="deliveryMemo"
        maxLength={100}
        placeholder={m.address_memo_placeholder()}
        value={value.deliveryMemo}
        onChange={set("deliveryMemo")}
      />
      <Sheet open={searchOpen} onClose={() => setSearchOpen(false)} title={m.address_search()}>
        <Suspense fallback={<p className="text-meta text-sub">{m.common_loading()}</p>}>
          <DaumPostcodeEmbed
            style={{ height: 460 }}
            onComplete={(data) => {
              onChange({
                ...value,
                zipCode: data.zonecode,
                address1: data.roadAddress || data.address,
              });
              onZipChange?.(data.zonecode);
              setSearchOpen(false);
            }}
          />
        </Suspense>
      </Sheet>
    </div>
  );
}
