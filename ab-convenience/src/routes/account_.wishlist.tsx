import { createFileRoute, Link, useHydrated, useRouter } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { Pagination } from "../components/mypage/pagination";
import { ProductCard } from "../components/product-card";
import { buttonClass } from "../components/ui/button";
import { EmptyState } from "../components/ui/section";
import { m } from "../i18n";
import { getMyWishlist } from "../lib/my-wishlist";
import { pageTitle } from "../lib/page-title";
import { toggleWish } from "../lib/wishlist";

const search = z.object({
  page: z.coerce.number().int().min(2).optional().catch(undefined),
});

/** 찜한 상품 — 상품 카드 그리드(모바일 2열·데스크톱 4열), 카드마다 찜 해제 */
export const Route = createFileRoute("/account_/wishlist")({
  validateSearch: search,
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getMyWishlist({ data: { page: deps.page ?? 1 } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.mypage_wishlist_title()) }] }),
  component: Wishlist,
});

function Wishlist() {
  const page = Route.useLoaderData();
  const router = useRouter();
  const hydrated = useHydrated();
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = (productId: string) => {
    setRemoving(productId);
    setError(null);
    void toggleWish({ data: { productId, wish: false } })
      .then(async (result) => {
        if (result.loginRequired) {
          await router.navigate({ to: "/login", search: { redirectTo: "/account/wishlist" } });
          return;
        }
        if (result.wished === null) {
          setError(m.mypage_wishlist_remove_failed());
          return;
        }
        await router.invalidate();
      })
      .catch(() => setError(m.mypage_wishlist_remove_failed()))
      .finally(() => setRemoving(null));
  };

  return (
    <MyPageShell
      current="wishlist"
      title={
        <>
          {m.mypage_wishlist_title()}
          <span className="ml-1.5 font-normal text-muted">{page.totalElements}</span>
        </>
      }
    >
      {error ? (
        <p role="alert" className="text-body text-point">
          {error}
        </p>
      ) : null}
      {page.contents.length === 0 ? (
        <EmptyState
          icon={<Heart aria-hidden="true" className="size-10" strokeWidth={1.4} />}
          title={m.mypage_wishlist_empty()}
          description={m.mypage_wishlist_empty_description()}
          action={
            <Link to="/products" className={buttonClass({ variant: "outline", size: "sm" })}>
              {m.mypage_wishlist_browse()}
            </Link>
          }
        />
      ) : (
        <ul className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-4">
          {page.contents.map((product) => (
            <li key={product.productId} className="relative min-w-0">
              <ProductCard product={product} />
              {/* 카드는 상세로 가는 링크라 해제 버튼은 링크 밖에서 이미지 위에 겹쳐 둔다 */}
              <button
                type="button"
                aria-label={m.mypage_wishlist_remove({ name: product.name })}
                disabled={!hydrated || removing === product.productId}
                onClick={() => remove(product.productId)}
                className="absolute top-1.5 right-1.5 flex size-9 items-center justify-center bg-page/80 text-point hover:bg-page disabled:opacity-50"
              >
                <Heart aria-hidden="true" className="size-5 fill-current" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page.page} totalPages={page.totalPages} to="/account/wishlist" />
    </MyPageShell>
  );
}
