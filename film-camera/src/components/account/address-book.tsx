import type { MemberAddress } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useAction } from "../../hooks/use-action";
import { m } from "../../i18n";
import { createAddress, deleteAddress, updateAddress } from "../../lib/account-actions";
import { addressesQuery } from "../../lib/account-queries";
import { AddressForm, type AddressValue } from "../address-form";
import { Button, Checkbox, EmptyState, ErrorState, SectionTitle, TextField } from "../ui";

const EMPTY: AddressValue = {
  receiverName: "",
  phone: "",
  zipCode: "",
  address1: "",
  address2: "",
  deliveryMemo: "",
};

type Editing = { kind: "new" } | { kind: "edit"; address: MemberAddress } | null;

/** 배송지 관리 — 추가·수정·삭제. 목록은 서버 값을 그대로 보인다 */
export function AddressBook({ addresses }: { addresses: MemberAddress[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const refresh = () => queryClient.invalidateQueries({ queryKey: addressesQuery().queryKey });

  const remove = async (addressId: string) => {
    const result = await run(() => deleteAddress({ data: { addressId } }));
    if (result.ok) await refresh();
  };

  return (
    <section aria-labelledby="addresses" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <SectionTitle id="addresses">{m.account_addresses()}</SectionTitle>
        <Button variant="secondary" onClick={() => setEditing(editing ? null : { kind: "new" })}>
          {editing ? m.common_cancel() : m.account_address_add()}
        </Button>
      </div>
      {editing ? (
        <AddressEditor
          key={editing.kind === "edit" ? editing.address.addressId : "new"}
          initial={editing.kind === "edit" ? editing.address : null}
          onDone={async () => {
            setEditing(null);
            await refresh();
          }}
        />
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      {addresses.length === 0 ? (
        <EmptyState message={m.account_address_empty()} />
      ) : (
        <ul className="divide-y divide-line border-line border-y">
          {addresses.map((a) => (
            <li key={a.addressId} className="flex flex-col gap-1 py-4 text-body">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {a.alias}
                {a.isDefault ? (
                  <span className="border border-point px-1.5 text-caption text-point-strong">
                    {m.account_address_default()}
                  </span>
                ) : null}
              </p>
              <p className="break-words text-sub">
                {a.receiverName} · {a.phone}
              </p>
              <p className="break-words text-sub">
                ({a.zipCode}) {a.address1} {a.address2}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="min-h-11 px-1 text-meta underline"
                  onClick={() => setEditing({ kind: "edit", address: a })}
                >
                  {m.account_address_edit()}
                </button>
                <button
                  type="button"
                  className="min-h-11 px-1 text-meta text-sub underline"
                  disabled={pending}
                  onClick={() => remove(a.addressId)}
                >
                  {m.account_address_delete()}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AddressEditor({
  initial,
  onDone,
}: {
  initial: MemberAddress | null;
  onDone: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<AddressValue>(
    initial
      ? {
          receiverName: initial.receiverName,
          phone: initial.phone,
          zipCode: initial.zipCode,
          address1: initial.address1,
          address2: initial.address2 ?? "",
          deliveryMemo: "",
        }
      : EMPTY,
  );
  const [alias, setAlias] = useState(initial?.alias ?? "");
  const [isDefault, setIsDefault] = useState(initial?.isDefault ?? false);
  const { pending, error, run } = useAction();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const body = {
      alias,
      receiverName: draft.receiverName,
      phone: draft.phone.replace(/\D/g, ""),
      zipCode: draft.zipCode,
      address1: draft.address1,
      address2: draft.address2 || undefined,
      isDefault,
    };
    const result = await run(() =>
      initial
        ? updateAddress({ data: { addressId: initial.addressId, body } })
        : createAddress({ data: body }),
    );
    if (result.ok) await onDone();
  };

  return (
    <form className="flex flex-col gap-4 border border-line p-4" onSubmit={submit}>
      <TextField
        id="addr-alias"
        label={m.account_address_alias()}
        required
        maxLength={20}
        value={alias}
        onChange={(e) => setAlias(e.target.value)}
      />
      <AddressForm idPrefix="addr" value={draft} onChange={setDraft} withMemo={false} />
      <Checkbox
        label={m.account_address_set_default()}
        checked={isDefault}
        onChange={(e) => setIsDefault(e.target.checked)}
      />
      {error ? <ErrorState message={error} /> : null}
      <Button type="submit" className="self-start" disabled={pending}>
        {m.account_save()}
      </Button>
    </form>
  );
}
