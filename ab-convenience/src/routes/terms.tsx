import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/policy-page";
import { pageTitle } from "../lib/page-title";
import { TERMS } from "../site/policies";

export const Route = createFileRoute("/terms")({
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, TERMS.title) }] }),
  component: () => <PolicyPage document={TERMS} />,
});
