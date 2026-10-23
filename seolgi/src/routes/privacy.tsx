import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { PolicyTemplate } from "../components/templates/policy-template";
import { privacyOf } from "../site/policies";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "개인정보처리방침 | 설기로운" }] }),
  component: () => (
    <PolicyTemplate doc={privacyOf(rootRoute.useLoaderData({ select: (d) => d.store }))} />
  ),
});
