import { useSuspenseQuery } from "@tanstack/react-query";
import { m } from "../../i18n";
import { addressesQuery } from "../../lib/account-queries";
import type { AddressValue } from "../address-form";
import { Button } from "../ui";

/** 회원의 저장한 배송지 — 고르면 배송지 칸을 채운다 */
export function SavedAddresses({ onPick }: { onPick: (value: AddressValue) => void }) {
  const addresses = useSuspenseQuery(addressesQuery()).data;
  if (addresses.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="font-semibold text-meta">{m.address_saved()}</p>
      <ul className="flex flex-wrap gap-2">
        {addresses.map((a) => (
          <li key={a.addressId}>
            <Button
              variant="secondary"
              onClick={() =>
                onPick({
                  receiverName: a.receiverName,
                  phone: a.phone,
                  zipCode: a.zipCode,
                  address1: a.address1,
                  address2: a.address2 ?? "",
                  deliveryMemo: "",
                })
              }
            >
              {a.alias}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
