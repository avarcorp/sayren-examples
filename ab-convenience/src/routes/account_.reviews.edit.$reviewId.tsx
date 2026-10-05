import { createFileRoute, useRouter } from "@tanstack/react-router";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { ProductThumb } from "../components/product-thumb";
import { ReviewForm } from "../components/review-form";
import { m } from "../i18n";
import { formatDateTime } from "../lib/format";
import { getMyReview, updateMyReview } from "../lib/my-reviews";
import { pageTitle } from "../lib/page-title";

/** 리뷰 수정 — 작성 후 30일(`editable`)까지. 별점·본문·사진을 바꾼다 */
export const Route = createFileRoute("/account_/reviews/edit/$reviewId")({
  loader: ({ params }) => getMyReview({ data: { reviewId: params.reviewId } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.rw_edit_title()) }] }),
  component: EditReview,
});

function EditReview() {
  const review = Route.useLoaderData();
  const router = useRouter();
  return (
    <MyPageShell
      current="reviews"
      title={m.rw_edit_title()}
      back={{ to: "/account/reviews", label: m.rw_back() }}
    >
      <div className="flex min-w-0 max-w-2xl flex-col gap-6">
        {!review ? (
          <p role="status" className="border border-line p-6 text-body text-sub">
            {m.rw_edit_not_found()}
          </p>
        ) : !review.editable ? (
          <p role="status" className="border border-line p-6 text-body text-sub">
            {m.rw_not_editable()}
          </p>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-3 border border-line p-4">
              <ProductThumb
                src={review.thumbnailUrl}
                alt=""
                className="h-20 w-16 shrink-0 bg-chip object-cover"
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="break-words text-body">{review.productName}</p>
                {review.optionName ? (
                  <p className="break-words text-meta text-muted">{review.optionName}</p>
                ) : null}
                <p className="break-words text-meta text-muted">
                  {m.rw_editable_until({ date: formatDateTime(review.editableUntil) })}
                </p>
              </div>
            </div>
            <ReviewForm
              initial={{ rating: review.rating, content: review.content, images: review.images }}
              submitLabel={m.rw_edit_submit()}
              onSubmit={async (draft) => {
                const result = await updateMyReview({
                  data: {
                    reviewId: review.reviewId,
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
