import type { CategoryNode, PickupLocationView, ProductCard } from "@sayren/storefront-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { DeliveryHome, type HomeProduct } from "../components/delivery-home";
import { m } from "../i18n";
import { apiFor } from "../lib/api.server";
import { readCartToken } from "../lib/cart-session.server";
import { readToken } from "../lib/session.server";

/**
 * 홈 — 배달앱 모양(받는 방법·가게 카드·카테고리·상품 목록·장바구니 바). 카테고리는 상점의 최상위 카테고리이고
 * 상품은 카테고리마다 받아 이름을 붙인다. 배달팁은 첫 배송 상품 상세의 기본 배송비다(묶음·지역 추가는 주문서가 정한다).
 * 장바구니 수량은 서버 장바구니 그대로다 — 담기·빼기는 `lib/home-cart.ts`.
 */
const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const api = apiFor();
  const [categories, pickupLocations] = await Promise.all([
    api.catalog.listCategories().catch((): CategoryNode[] => []),
    api.pickupLocations.list().catch((): PickupLocationView[] => []),
  ]);
  const top = categories.slice(0, 8);
  const pages = await Promise.all(
    top.map((category) =>
      api.catalog
        .searchProducts({ categoryId: category.categoryId, size: 50 })
        .then((page) => page.contents)
        .catch((): ProductCard[] => []),
    ),
  );
  const seen = new Set<string>();
  const products: HomeProduct[] = [];
  top.forEach((category, index) => {
    for (const product of pages[index] ?? []) {
      if (seen.has(product.productId)) continue;
      seen.add(product.productId);
      products.push({ ...product, categoryId: category.categoryId, categoryName: category.name });
    }
  });
  const firstShipping = products.find((product) => product.fulfillment.type === "SHIPPING");
  const detail = firstShipping
    ? await api.catalog.getProduct(firstShipping.productId).catch(() => null)
    : null;
  const shipping =
    detail?.fulfillment.type === "SHIPPING" && "shipping" in detail.fulfillment
      ? detail.fulfillment.shipping
      : null;
  return {
    categories: top.map((category) => ({ categoryId: category.categoryId, name: category.name })),
    products,
    pickupLocations,
    deliveryFee: shipping
      ? { fee: shipping.deliveryFee, freeOver: shipping.conditionalFreeAmount }
      : null,
  };
});

/** 장바구니 — 홈 목록의 수량·장바구니 바. 화면을 열 때마다 서버 값을 다시 읽는다 */
const getHomeCart = createServerFn({ method: "GET" }).handler(async () => {
  const accessToken = readToken();
  const cartToken = readCartToken();
  if (!accessToken && !cartToken) return null;
  return apiFor({ accessToken, cartToken })
    .cart.get()
    .catch(() => null);
});

export const Route = createFileRoute("/")({
  // 제목은 루트가 상점 이름으로 정한다
  head: () => ({ meta: [{ name: "description", content: m.home_description() }] }),
  loader: async () => {
    const [home, cart] = await Promise.all([getHome(), getHomeCart()]);
    return { ...home, cart };
  },
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  return <DeliveryHome {...data} />;
}
