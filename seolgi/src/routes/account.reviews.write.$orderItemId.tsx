import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { ReviewForm } from "../components/organisms/review-form";
import { AccountTitle } from "../components/templates/account-template";
import { createReviewFn, getReviewsFn } from "../lib/account";
import { uploadReviewImage } from "../lib/review-upload";

export const Route = createFileRoute("/account/reviews/write/$orderItemId")({
  loader: async ({ params }) => {
    const { writable } = await getReviewsFn();
    const target = writable.find((w) => w.orderItemId === params.orderItemId);
    if (!target) throw notFound();
    return target;
  },
  head: () => ({ meta: [{ title: "리뷰 쓰기 | 설기로운" }] }),
  component: WriteReview,
});

function WriteReview() {
  const target = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <>
      <AccountTitle title="리뷰 쓰기" />
      <ReviewForm
        product={{
          name: target.productName,
          optionName: target.optionName,
          thumbnailUrl: target.thumbnailUrl,
        }}
        submitLabel="리뷰 남기기"
        rewardNote="리뷰를 남기면 적립금을 드립니다. 사진 리뷰는 더 드립니다."
        onUpload={uploadReviewImage}
        onSubmit={async (draft) => {
          const r = await createReviewFn({ data: { orderItemId: target.orderItemId, ...draft } });
          if (r.error) return r.error;
          await navigate({ to: "/account/reviews" });
          return null;
        }}
      />
    </>
  );
}
