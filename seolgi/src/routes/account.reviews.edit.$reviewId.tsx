import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ReviewForm } from "../components/organisms/review-form";
import { AccountTitle } from "../components/templates/account-template";
import { getReviewsFn, updateReviewFn } from "../lib/account";
import { uploadReviewImage } from "../lib/review-upload";

export const Route = createFileRoute("/account/reviews/edit/$reviewId")({
  loader: async ({ params }) => {
    const { mine } = await getReviewsFn();
    const review = mine.contents.find((r) => r.reviewId === params.reviewId);
    if (!review?.editable) throw notFound();
    return review;
  },
  head: () => ({ meta: [{ title: "리뷰 고치기 | 설기로운" }] }),
  component: EditReview,
});

function EditReview() {
  const review = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <>
      <AccountTitle title="리뷰 고치기" />
      <ReviewForm
        product={{
          name: review.productName ?? "",
          optionName: review.optionName,
          thumbnailUrl: review.thumbnailUrl,
        }}
        initial={{ rating: review.rating, content: review.content, images: review.images }}
        submitLabel="고친 내용 저장"
        onUpload={uploadReviewImage}
        onSubmit={async (draft) => {
          const r = await updateReviewFn({ data: { reviewId: review.reviewId, body: draft } });
          if (r.error) return r.error;
          await navigate({ to: "/account/reviews" });
          return null;
        }}
      />
    </>
  );
}
