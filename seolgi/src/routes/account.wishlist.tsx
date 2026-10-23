import { createFileRoute, useRouter } from "@tanstack/react-router";
import { X } from "lucide-react";
import { z } from "zod";
import { Pagination } from "../components/molecules/pagination";
import { ProductCard } from "../components/molecules/product-card";
import { AccountTitle } from "../components/templates/account-template";
import { getWishlistFn } from "../lib/account";
import { toggleWishFn } from "../lib/wishlist";

export const Route = createFileRoute("/account/wishlist")({
  validateSearch: z.object({ page: z.number().int().min(1).optional().catch(undefined) }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getWishlistFn({ data: deps }),
  head: () => ({ meta: [{ title: "찜한 상품 | 설기로운" }] }),
  component: Wishlist,
});

/** 찜한 상품 — 카드 격자, 카드마다 찜 해제 */
function Wishlist() {
  const page = Route.useLoaderData();
  const router = useRouter();
  return (
    <>
      <AccountTitle title="찜한 상품" aside={`${page.totalElements}개`} />
      {page.contents.length === 0 ? (
        <p className="border-ink border-t py-24 text-center text-muted">
          찜한 상품이 없습니다. 상품 화면의 하트로 담습니다.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-5">
          {page.contents.map((p) => (
            <div key={p.productId} className="relative">
              <ProductCard product={p} tone="bg-tone-plain" />
              <button
                type="button"
                aria-label={`${p.name} 찜 해제`}
                onClick={async () => {
                  await toggleWishFn({ data: { productId: p.productId, wished: false } });
                  await router.invalidate();
                }}
                className="absolute top-2 right-2 grid size-9 place-items-center bg-page/90"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page.page} totalPages={page.totalPages} />
    </>
  );
}
