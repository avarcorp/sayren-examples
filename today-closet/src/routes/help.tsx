import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "../components/policy-page";
import { buttonClass } from "../components/ui/button";
import { m } from "../i18n";
import { pageTitle } from "../lib/page-title";
import { HELP } from "../site/policies";

export const Route = createFileRoute("/help")({
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, HELP.title) }] }),
  component: Help,
});

function Help() {
  return (
    <PolicyPage document={HELP}>
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
