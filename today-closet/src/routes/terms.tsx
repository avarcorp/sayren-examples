import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/policy-page";
import { pageTitle } from "../lib/page-title";
import { POLICY_TITLES, termsOf } from "../site/policies";
import { useSellerInfo } from "../site/seller";

export const Route = createFileRoute("/terms")({
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, POLICY_TITLES.terms) }] }),
  component: () => <PolicyPage document={termsOf(useSellerInfo())} />,
});
