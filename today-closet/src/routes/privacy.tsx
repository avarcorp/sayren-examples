import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/policy-page";
import { pageTitle } from "../lib/page-title";
import { POLICY_TITLES, privacyOf } from "../site/policies";
import { useSellerInfo } from "../site/seller";

export const Route = createFileRoute("/privacy")({
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, POLICY_TITLES.privacy) }] }),
  component: () => <PolicyPage document={privacyOf(useSellerInfo())} />,
});
