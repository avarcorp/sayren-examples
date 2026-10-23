import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { PolicyTemplate } from "../components/templates/policy-template";
import { termsOf } from "../site/policies";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "이용약관 | 설기로운" }] }),
  component: () => (
    <PolicyTemplate doc={termsOf(rootRoute.useLoaderData({ select: (d) => d.store }))} />
  ),
});
