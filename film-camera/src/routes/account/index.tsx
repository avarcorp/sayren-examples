import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AccountExit } from "../../components/account/account-exit";
import { AccountLayout } from "../../components/account/account-layout";
import { AddressBook } from "../../components/account/address-book";
import { ProfileForm } from "../../components/account/profile-form";
import { Button } from "../../components/ui";
import { useSession } from "../../hooks/use-account";
import { useAction } from "../../hooks/use-action";
import { m } from "../../i18n";
import { addressesQuery, sessionQuery } from "../../lib/account-queries";
import { reconsent } from "../../lib/auth-actions";
import { requireMember } from "../../lib/guards";

export const Route = createFileRoute("/account/")({
  beforeLoad: requireMember,
  loader: ({ context }) => context.queryClient.ensureQueryData(addressesQuery()),
  component: Account,
});

function Account() {
  const member = useSession();
  const addresses = useSuspenseQuery(addressesQuery()).data;
  const queryClient = useQueryClient();
  const { pending, run } = useAction();
  if (!member) return null;

  const agree = async () => {
    const result = await run(() => reconsent());
    if (result.ok) await queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey });
  };

  return (
    <AccountLayout title={m.account_title()}>
      {member.reconsentRequired ? (
        <section
          aria-labelledby="reconsent"
          className="flex flex-col gap-3 border-point border-l-2 pl-4"
        >
          <h2 id="reconsent" className="font-bold text-body-lg">
            {m.account_reconsent_title()}
          </h2>
          <p className="text-body text-sub">{m.account_reconsent_body()}</p>
          <Button className="self-start" disabled={pending} onClick={agree}>
            {m.account_reconsent_submit()}
          </Button>
        </section>
      ) : null}
      <ProfileForm member={member} />
      <AddressBook addresses={addresses} />
      <AccountExit />
    </AccountLayout>
  );
}
