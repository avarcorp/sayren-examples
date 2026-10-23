import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { z } from "zod";
import { CollectionTemplate } from "../components/templates/collection-template";
import { getCollectionFn } from "../lib/collections";

const rootRoute = getRouteApi("__root__");

const searchSchema = z.object({
  sort: z
    .enum(["manual", "recommend", "latest", "priceAsc", "priceDesc", "reviewCount", "ratingDesc"])
    .optional()
    .catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
});

export const Route = createFileRoute("/collections/$slug")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) => getCollectionFn({ data: { slug: params.slug, ...deps } }),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.collection.metaTitle ?? loaderData?.collection.title ?? "기획전"} | 설기로운`,
      },
      ...(loaderData?.collection.metaDescription
        ? [{ name: "description", content: loaderData.collection.metaDescription }]
        : []),
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { collection, products } = Route.useLoaderData();
  const search = Route.useSearch();
  const tree = rootRoute.useLoaderData({ select: (d) => d.categories });
  return (
    <CollectionTemplate
      collection={collection}
      products={products}
      sort={search.sort ?? null}
      tree={tree}
    />
  );
}
