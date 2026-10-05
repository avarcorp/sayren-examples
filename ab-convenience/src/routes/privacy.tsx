import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "../components/policy-page";
import { pageTitle } from "../lib/page-title";
import { PRIVACY } from "../site/policies";

export const Route = createFileRoute("/privacy")({
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, PRIVACY.title) }] }),
  component: () => <PolicyPage document={PRIVACY} />,
});
