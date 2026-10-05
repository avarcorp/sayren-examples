import type { MemberAddress } from "@sayren/storefront-sdk";
import { m } from "../../i18n";
import { Badge } from "../ui/badge";
import { buttonClass } from "../ui/button";
import { Sheet } from "../ui/sheet";

/** 저장한 배송지 한 줄 요약 — `[우편번호] 주소 상세 주소` */
export function addressLine(address: Pick<MemberAddress, "zipCode" | "address1" | "address2">) {
  return `[${address.zipCode}] ${address.address1}${address.address2 ? ` ${address.address2}` : ""}`;
}

/** 저장한 배송지 카드 — 주문서 배송지 섹션의 요약이자 목록 시트의 한 칸 */
export function AddressCard({ address }: { address: MemberAddress }) {
  return (
    <span className="flex min-w-0 flex-col gap-1">
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        <b className="break-words text-body-lg">{address.receiverName}</b>
        {address.alias && address.alias !== address.receiverName ? (
          <span className="break-words text-meta text-sub">{address.alias}</span>
        ) : null}
        {address.isDefault ? (
          <Badge tone="outline">{m.checkout_address_default_badge()}</Badge>
        ) : null}
      </span>
      <span className="text-meta text-sub">{address.phone}</span>
      <span className="break-words text-meta">{addressLine(address)}</span>
    </span>
  );
}

/** 배송지 목록 시트 — 저장한 배송지 중 하나를 고르거나 「새로 입력」 */
export function AddressBookSheet({
  open,
  onClose,
  addresses,
  selectedId,
  onSelect,
  onNew,
}: {
  open: boolean;
  onClose: () => void;
  addresses: MemberAddress[];
  selectedId: string | null;
  onSelect: (address: MemberAddress) => void;
  onNew: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={m.checkout_address_book()}
      closeLabel={m.checkout_address_book_close()}
      footer={
        <button
          type="button"
          onClick={() => {
            onNew();
            onClose();
          }}
          className={buttonClass({ variant: "outline", size: "md", block: true })}
        >
          {m.checkout_address_new()}
        </button>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {addresses.map((address) => {
          const selected = address.addressId === selectedId;
          return (
            <li key={address.addressId}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelect(address);
                  onClose();
                }}
                className={`flex w-full min-w-0 p-4 text-left ${
                  selected
                    ? "border-[1.5px] border-ink"
                    : "border border-line-strong hover:border-ink"
                }`}
              >
                <AddressCard address={address} />
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
