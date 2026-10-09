import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "../components/policy-page";
import { buttonClass } from "../components/ui/button";
import { m } from "../i18n";
import { pageTitle } from "../lib/page-title";
import { helpOf, POLICY_TITLES } from "../site/policies";
import { useSellerInfo } from "../site/seller";

export const Route = createFileRoute("/help")({
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, POLICY_TITLES.help) }] }),
  component: Help,
});

function Help() {
  const seller = useSellerInfo();
  return (
    <PolicyPage document={helpOf(seller)}>
      <section className="flex flex-col gap-3 bg-chip p-5 md:p-6">
        <p className="text-body">{m.help_support_cta_note()}</p>
        <div className="flex flex-wrap gap-2">
          <Link to="/account/support/new" className={buttonClass({ size: "sm" })}>
            {m.help_support_cta()}
          </Link>
          <Link to="/account/support" className={buttonClass({ variant: "outline", size: "sm" })}>
            {m.account_menu_support()}
          </Link>
        </div>
      </section>
    </PolicyPage>
  );
}
