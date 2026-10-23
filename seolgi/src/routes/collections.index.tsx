import { createFileRoute } from "@tanstack/react-router";
import { CollectionListTemplate } from "../components/templates/collection-list-template";
import { getCollectionsFn } from "../lib/collections";

export const Route = createFileRoute("/collections/")({
  loader: () => getCollectionsFn(),
  head: () => ({ meta: [{ title: "기획전 | 설기로운" }] }),
  component: CollectionsPage,
});

function CollectionsPage() {
  return <CollectionListTemplate collections={Route.useLoaderData()} />;
}
