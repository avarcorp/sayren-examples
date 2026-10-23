import {
  createFileRoute,
  getRouteApi,
  redirect,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { hasNameTagPreview } from "../components/molecules/name-tag-preview";
import { BuyPanel } from "../components/organisms/buy-panel";
import { MobileBuy } from "../components/organisms/mobile-buy";
import { Reviews } from "../components/organisms/reviews";
import { ProductDetailTemplate } from "../components/templates/product-detail-template";
import { usePurchase } from "../hooks/use-purchase";
import { useReviewList } from "../hooks/use-review-list";
import { useWish } from "../hooks/use-wish";
import { useTrack } from "../lib/analytics";
import { downloadCouponFn } from "../lib/coupons";
import { createInquiryFn, getProductBlocksFn, getProductFn, REVIEW_SORTS } from "../lib/product";
import { isProductNoParam } from "../lib/product-path";
import { deliveryRows } from "../lib/shipping";
import { toneOf } from "../lib/tones";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/products/$productNo")({
  loader: async ({ params }) => {
    const product = await getProductFn({ data: { ref: params.productNo } });
    // 상품 id 주소(옛 링크)는 상품번호 주소로 영구 이동한다
    if (!isProductNoParam(params.productNo) && product.productNo != null) {
      throw redirect({
        to: "/products/$productNo",
        params: { productNo: String(product.productNo) },
        statusCode: 301,
      });
    }
    const blocks = await getProductBlocksFn({ data: { productId: product.productId } });
    return { product, blocks };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.product.name} | 설기로운` }] : [],
  }),
  component: ProductPage,
});

/** 상품을 옮기면(A → B, 뒤로 가기) 옵션·찜·리뷰 상태를 새로 시작한다 */
function ProductPage() {
  const data = Route.useLoaderData();
  return <ProductView key={data.product.productId} {...data} />;
}

function ProductView({ product, blocks }: ReturnType<typeof Route.useLoaderData>) {
  const root = rootRoute.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const location = useLocation();
  const storeName = root.store?.name ?? "설기로운";
  const ordering = root.store?.checkoutAvailable ?? true;
  const purchase = usePurchase(product);
  const wish = useWish(product.productId, blocks.wished);
  const list = useReviewList(product.productId, blocks.reviews);
  useTrack({ name: "product_view", productId: product.productId });
  const delivery = deliveryRows(product);
  const loginRedirect = location.href;

  return (
    <ProductDetailTemplate
      product={product}
      storeName={storeName}
      tone={toneOf(product.categoryPath[0]?.categoryId, root.categories)}
      coupons={blocks.coupons}
      onDownloadCoupon={async (couponId) => {
        const result = await downloadCouponFn({ data: { couponId } });
        if ("needLogin" in result) {
          await navigate({ to: "/login", search: { redirectTo: loginRedirect } });
          return null;
        }
        if ("error" in result) return result.error;
        await router.invalidate();
        return "쿠폰을 받았습니다. 주문서에서 적용합니다.";
      }}
      buyPanel={
        <BuyPanel purchase={purchase} ordering={ordering} wish={wish} delivery={delivery} />
      }
      mobileBuy={
        <MobileBuy
          purchase={purchase}
          ordering={ordering}
          wish={wish}
          cta={hasNameTagPreview(product) ? "이름표 만들기" : "구매하기"}
        >
          <BuyPanel purchase={purchase} ordering={ordering} delivery={delivery} />
        </MobileBuy>
      }
      reviewCount={blocks.reviews?.summary?.totalCount ?? product.reviewCount}
      reviews={
        <Reviews
          summary={blocks.reviews?.summary ?? null}
          photos={blocks.photoReviews}
          reviews={list.reviews}
          hasMore={list.hasMore}
          loading={list.loading}
          sort={list.sort}
          sorts={REVIEW_SORTS}
          photoOnly={list.photoOnly}
          storeName={storeName}
          onSort={list.setSort}
          onPhotoOnly={list.setPhotoOnly}
          onMore={list.more}
        />
      }
      inquiries={{
        data: blocks.inquiries,
        loggedIn: blocks.loggedIn,
        loginRedirect,
        onSubmit: async (input) => {
          const result = await createInquiryFn({
            data: { productId: product.productId, ...input },
          });
          if ("needLogin" in result) {
            await navigate({ to: "/login", search: { redirectTo: loginRedirect } });
            return null;
          }
          if ("error" in result) return result.error;
          await router.invalidate();
          return null;
        },
      }}
    />
  );
}
