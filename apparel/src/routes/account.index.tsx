import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { AccountLayout } from "../components/account/account-layout";
import { Button } from "../components/ui/button";
import { Checkbox, TextField } from "../components/ui/fields";
import { Sheet } from "../components/ui/sheet";
import { m } from "../i18n";
import {
  agreeToCurrentTerms,
  deleteAddress,
  logout,
  updateProfile,
  withdrawMember,
} from "../lib/account-actions";
import { accountQuery, sessionQuery } from "../lib/account-queries";
import { formatMoney } from "../lib/format";
import { requireMember } from "../lib/require-member";

export const Route = createFileRoute("/account/")({
  loader: async ({ context }) => {
    await requireMember(context.queryClient, "/account");
    return context.queryClient.ensureQueryData(accountQuery());
  },
  head: () => ({ meta: [{ title: m.nav_account() }] }),
  component: AccountPage,
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-line border-t py-6">
      <h2 className="font-semibold text-body-lg">{title}</h2>
      {children}
    </section>
  );
}

function AccountPage() {
  const { member, addresses, points, consents } = useSuspenseQuery(accountQuery()).data;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: member.name,
    phone: member.phone ?? "",
    marketingAgreed: member.marketingAgreed,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: accountQuery().queryKey });

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const result = await updateProfile({ data: profile }).catch(() => null);
    setMessage(result?.ok ? m.account_saved() : (result?.message ?? m.common_error_retry()));
    if (result?.ok) await refresh();
  };

  const signOut = async () => {
    await logout();
    queryClient.removeQueries();
    await navigate({ to: "/" });
  };

  return (
    <AccountLayout title={m.nav_account()}>
      {consents.reconsentRequired ? (
        <div className="mb-6 flex flex-col gap-3 border border-point p-4">
          <p className="text-body">{m.account_reconsent()}</p>
          <div className="flex flex-wrap gap-3 text-meta">
            {consents.terms.currentDocumentUrl ? (
              <a
                href={consents.terms.currentDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-point underline"
              >
                {m.footer_terms()}
              </a>
            ) : null}
            {consents.privacy.currentDocumentUrl ? (
              <a
                href={consents.privacy.currentDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-point underline"
              >
                {m.footer_privacy()}
              </a>
            ) : null}
          </div>
          <Button
            className="self-start"
            onClick={async () => {
              const result = await agreeToCurrentTerms().catch(() => null);
              if (result?.ok) await refresh();
            }}
          >
            {m.account_reconsent_agree()}
          </Button>
        </div>
      ) : null}
      <p className="pb-6 text-body">
        {m.account_greeting({ name: member.name })}
        <span className="ml-2 text-meta text-sub">
          {m.account_points_summary({ amount: formatMoney(points.balance) })}
        </span>
      </p>
      <Block title={m.account_profile()}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <TextField label={m.field_email()} name="email" value={member.email ?? ""} readOnly />
          <TextField
            label={m.field_name()}
            name="name"
            required
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
          <TextField
            label={m.field_phone()}
            name="phone"
            type="tel"
            inputMode="numeric"
            required
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
          <Checkbox
            label={m.account_marketing()}
            checked={profile.marketingAgreed}
            onChange={(e) => setProfile({ ...profile, marketingAgreed: e.target.checked })}
          />
          {message ? (
            <p role="status" className="text-meta text-sub">
              {message}
            </p>
          ) : null}
          <Button type="submit" variant="secondary" className="self-start">
            {m.common_save()}
          </Button>
        </form>
      </Block>
      <Block title={m.account_addresses()}>
        {addresses.length === 0 ? (
          <p className="text-body text-sub">{m.account_addresses_empty()}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {addresses.map((address) => (
              <li
                key={address.addressId}
                className="flex items-start justify-between gap-3 border border-line p-4 text-meta"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-body">
                    {address.alias}
                    {address.isDefault ? (
                      <span className="ml-2 text-caption text-point">
                        {m.account_address_default()}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sub">
                    {address.receiverName} · {address.phone}
                  </p>
                  <p className="break-words text-sub">
                    ({address.zipCode}) {address.address1} {address.address2 ?? ""}
                  </p>
                </div>
                <Button
                  variant="text"
                  onClick={async () => {
                    const result = await deleteAddress({
                      data: { addressId: address.addressId },
                    }).catch(() => null);
                    if (result?.ok) await refresh();
                  }}
                >
                  {m.common_delete()}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Block>
      <Block title={m.account_session()}>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={signOut}>
            {m.account_logout()}
          </Button>
          <Button variant="text" onClick={() => setWithdrawOpen(true)}>
            {m.account_withdraw()}
          </Button>
        </div>
      </Block>
      <Sheet
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title={m.account_withdraw()}
      >
        <p className="text-body text-sub">{m.account_withdraw_detail()}</p>
        <TextField
          label={m.account_withdraw_password()}
          name="withdrawPassword"
          type="password"
          autoComplete="current-password"
          value={withdrawPassword}
          onChange={(e) => setWithdrawPassword(e.target.value)}
          error={withdrawError ?? undefined}
        />
        <Button
          onClick={async () => {
            const result = await withdrawMember({ data: { password: withdrawPassword } }).catch(
              () => null,
            );
            if (result?.ok) {
              queryClient.removeQueries({ queryKey: sessionQuery().queryKey });
              await navigate({ to: "/" });
            } else setWithdrawError(result?.message ?? m.common_error_retry());
          }}
        >
          {m.account_withdraw_confirm()}
        </Button>
      </Sheet>
    </AccountLayout>
  );
}
