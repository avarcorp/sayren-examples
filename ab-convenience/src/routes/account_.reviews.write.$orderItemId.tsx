import { createFileRoute, useRouter } from "@tanstack/react-router";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { ProductThumb } from "../components/product-thumb";
import { ReviewForm } from "../components/review-form";
import { m } from "../i18n";
import { createMyReview, getWritableItem } from "../lib/my-reviews";
import { pageTitle } from "../lib/page-title";

/** 리뷰 쓰기 — 별점·본문·사진(최대 5장) */
export const Route = createFileRoute("/account_/reviews/write/$orderItemId")({
  loader: ({ params }) => getWritableItem({ data: { orderItemId: params.orderItemId } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.rw_form_title()) }] }),
  component: WriteReview,
});

function WriteReview() {
  const item = Route.useLoaderData();
  const { orderItemId } = Route.useParams();
  const router = useRouter();
  return (
    <MyPageShell
      current="reviews"
      title={m.rw_form_title()}
      back={{ to: "/account/reviews", label: m.rw_back() }}
    >
      <div className="flex min-w-0 max-w-2xl flex-col gap-6">
        {!item ? (
          <p role="status" className="border border-line p-6 text-body text-sub">
            {m.rw_form_not_writable()}
          </p>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-3 border border-line p-4">
              <ProductThumb
                src={item.thumbnailUrl}
                alt=""
                className="h-20 w-16 shrink-0 bg-chip object-cover"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="break-words text-body">{item.productName}</p>
                {item.optionName ? (
                  <p className="break-words text-meta text-muted">{item.optionName}</p>
                ) : null}
              </div>
            </div>
            <ReviewForm
              submitLabel={m.rw_form_submit()}
              onSubmit={async (draft) => {
                const result = await createMyReview({
                  data: {
                    orderItemId,
                    body: { rating: draft.rating, content: draft.content, images: draft.images },
                  },
                });
                if (result.failure) return result.failure;
                await router.navigate({ to: "/account/reviews", search: { tab: "written" } });
                return null;
              }}
            />
          </>
        )}
      </div>
    </MyPageShell>
  );
}
