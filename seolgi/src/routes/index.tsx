import type { CategoryNode } from "@sayren/storefront-sdk";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { HomeTemplate } from "../components/templates/home-template";
import { getHomeFn } from "../lib/catalog";
import { homeContent } from "../site/content";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  loader: () =>
    getHomeFn({
      data: {
        rails: homeContent.rails.map((r) => ({ title: r.title, sort: r.sort })),
        nameTagCategory: homeContent.nameTag.category,
      },
    }),
  component: Home,
});

/** 이름으로 카테고리 찾기(대분류·하위 모두) */
function findByName(tree: CategoryNode[], name: string): CategoryNode | null {
  for (const node of tree) {
    if (node.name === name) return node;
    const inner = findByName(node.children, name);
    if (inner) return inner;
  }
  return null;
}

function Home() {
  const { rails, topCategoryOf, nameTag } = Route.useLoaderData();
  const { categories: tree, hasCollections } = rootRoute.useLoaderData();
  const { ctaCategory, ...hero } = homeContent.hero;
  return (
    <HomeTemplate
      hero={{ ...hero, categoryId: findByName(tree, ctaCategory)?.categoryId ?? null }}
      tree={tree}
      showCollections={hasCollections}
      rails={rails}
      topCategoryOf={topCategoryOf}
      nameTag={nameTag ? { content: homeContent.nameTag, target: nameTag } : null}
    />
  );
}
