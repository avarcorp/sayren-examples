import type { MemberAddress } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountLayout } from "../../components/account/account-layout";
import { AddressForm, type AddressValue, EMPTY_ADDRESS } from "../../components/address-form";
import { Badge, Button, ErrorText, Field, Input, SectionTitle } from "../../components/ui";
import { useAddresses, useSession } from "../../hooks/use-account";
import { m } from "../../i18n";
import {
  createAddress,
  deleteAddress,
  updateAddress,
  updateProfile,
} from "../../lib/account-actions";
import { addressesQuery, sessionQuery } from "../../lib/account-queries";
import { logout, reconsent, withdraw } from "../../lib/auth-actions";
import { requireMember } from "../../lib/guards";

/** 회원 정보 — 이름·연락처·마케팅 동의, 배송지 관리, 재동의, 로그아웃·탈퇴 */
export const Route = createFileRoute("/account/")({
  beforeLoad: requireMember,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(sessionQuery()),
      context.queryClient.ensureQueryData(addressesQuery()),
    ]),
  component: AccountPage,
});

function AccountPage() {
  const member = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  if (!member) return null;

  const onLogout = async () => {
    await logout();
    await queryClient.invalidateQueries();
    await navigate({ to: "/" });
  };

  return (
    <AccountLayout title={m.account_menu_profile()}>
      {member.reconsentRequired ? <Reconsent /> : null}
      <Profile
        name={member.name}
        phone={member.phone ?? ""}
        email={member.email}
        marketing={member.marketingAgreed}
      />
      <Addresses />
      <section className="flex flex-col gap-3 border-line border-t pt-5">
        <Button variant="secondary" onClick={onLogout}>
          {m.account_logout()}
        </Button>
        <Withdraw />
      </section>
    </AccountLayout>
  );
}

function Reconsent() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  return (
    <section className="flex flex-col gap-2 rounded-card border border-point p-4">
      <p className="text-body">{m.account_reconsent()}</p>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button
        size="sm"
        onClick={async () => {
          const result = await reconsent();
          if (!result.ok) return setError(result.message);
          await queryClient.invalidateQueries({ queryKey: ["session"] });
        }}
      >
        {m.account_reconsent_agree()}
      </Button>
    </section>
  );
}

function Profile({
  name,
  phone,
  email,
  marketing,
}: {
  name: string;
  phone: string;
  email: string | null;
  marketing: boolean;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name, phone, marketingAgreed: marketing });
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setForm({ name, phone, marketingAgreed: marketing }), [name, phone, marketing]);
  const save = async () => {
    const result = await updateProfile({ data: form });
    if (!result.ok) return setStatus({ ok: false, text: result.message });
    setStatus({ ok: true, text: m.account_saved() });
    await queryClient.invalidateQueries({ queryKey: ["session"] });
  };
  return (
    <section className="flex flex-col gap-4">
      <SectionTitle>{m.account_profile()}</SectionTitle>
      {email ? (
        <Field label={m.login_email()}>
          <Input value={email} readOnly className="text-muted" />
        </Field>
      ) : null}
      <Field label={m.signup_name()}>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label={m.address_phone()}>
        <Input
          value={form.phone}
          inputMode="tel"
          onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
        />
      </Field>
      <label className="flex min-h-11 items-center gap-2 text-meta">
        <input
          type="checkbox"
          className="size-4 accent-point"
          checked={form.marketingAgreed}
          onChange={(e) => setForm({ ...form, marketingAgreed: e.target.checked })}
        />
        {m.signup_marketing()}
      </label>
      {status ? (
        status.ok ? (
          <p role="status" className="text-meta text-point">
            {status.text}
          </p>
        ) : (
          <ErrorText>{status.text}</ErrorText>
        )
      ) : null}
      <Button variant="secondary" onClick={save}>
        {m.account_save()}
      </Button>
    </section>
  );
}

function toValue(address: MemberAddress): AddressValue {
  return {
    receiverName: address.receiverName,
    phone: address.phone,
    zipCode: address.zipCode ?? "",
    address1: address.address1,
    address2: address.address2 ?? "",
    deliveryMemo: "",
  };
}

function Addresses() {
  const addresses = useAddresses();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<{
    id: string | null;
    alias: string;
    value: AddressValue;
    isDefault: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["me", "addresses"] });

  const save = async () => {
    if (!editing) return;
    const body = {
      alias: editing.alias || m.address_alias_default(),
      receiverName: editing.value.receiverName,
      phone: editing.value.phone,
      zipCode: editing.value.zipCode,
      address1: editing.value.address1,
      address2: editing.value.address2 || undefined,
      isDefault: editing.isDefault,
    };
    const result = editing.id
      ? await updateAddress({ data: { addressId: editing.id, body } })
      : await createAddress({ data: body });
    if (!result.ok) return setError(result.message);
    setEditing(null);
    setError(null);
    await refresh();
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SectionTitle>{m.account_addresses()}</SectionTitle>
        {!editing ? (
          <Button
            size="sm"
            variant="text"
            onClick={() =>
              setEditing({
                id: null,
                alias: "",
                value: EMPTY_ADDRESS,
                isDefault: addresses.length === 0,
              })
            }
          >
            {m.account_address_add()}
          </Button>
        ) : null}
      </div>
      {addresses.length === 0 && !editing ? (
        <p className="text-meta text-muted">{m.account_addresses_empty()}</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {addresses.map((address) => (
          <li
            key={address.addressId}
            className="flex flex-col gap-1 rounded-card border border-line p-3 text-meta"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-body">{address.alias}</span>
              {address.isDefault ? <Badge>{m.address_default()}</Badge> : null}
            </div>
            <p>
              {address.receiverName} · <span className="tabular">{address.phone}</span>
            </p>
            <p className="break-words text-sub">
              ({address.zipCode}) {address.address1} {address.address2 ?? ""}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="text"
                onClick={() =>
                  setEditing({
                    id: address.addressId,
                    alias: address.alias,
                    value: toValue(address),
                    isDefault: address.isDefault,
                  })
                }
              >
                {m.account_edit()}
              </Button>
              <Button
                size="sm"
                variant="text"
                onClick={async () => {
                  const result = await deleteAddress({ data: { addressId: address.addressId } });
                  if (!result.ok) return setError(result.message);
                  await refresh();
                }}
              >
                {m.account_delete()}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {editing ? (
        <div className="flex flex-col gap-4 rounded-card border border-line p-4">
          <Field label={m.address_alias()}>
            <Input
              value={editing.alias}
              maxLength={20}
              onChange={(e) => setEditing({ ...editing, alias: e.target.value })}
            />
          </Field>
          <AddressForm
            value={editing.value}
            memo={false}
            onChange={(value) => setEditing({ ...editing, value })}
          />
          <label className="flex min-h-11 items-center gap-2 text-meta">
            <input
              type="checkbox"
              className="size-4 accent-point"
              checked={editing.isDefault}
              onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })}
            />
            {m.address_set_default()}
          </label>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>
              {m.account_cancel()}
            </Button>
            <Button className="flex-1" onClick={save}>
              {m.account_save()}
            </Button>
          </div>
        </div>
      ) : null}
      {error ? <ErrorText>{error}</ErrorText> : null}
    </section>
  );
}

function Withdraw() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  if (!open) {
    return (
      <Button variant="text" size="sm" className="w-fit text-muted" onClick={() => setOpen(true)}>
        {m.account_withdraw()}
      </Button>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-card border border-line p-4">
      <p className="text-meta text-sub">{m.account_withdraw_notice()}</p>
      <Field label={m.login_password()} hint={m.account_withdraw_password_hint()}>
        <Input
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          {m.account_cancel()}
        </Button>
        <Button
          className="flex-1"
          onClick={async () => {
            const result = await withdraw({ data: { password: password || undefined } });
            if (!result.ok) return setError(result.message);
            await queryClient.invalidateQueries();
            await navigate({ to: "/" });
          }}
        >
          {m.account_withdraw_confirm()}
        </Button>
      </div>
    </div>
  );
}
