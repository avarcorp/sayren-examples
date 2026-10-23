import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { buttonClass } from "../components/atoms/button";
import { ProductThumb } from "../components/atoms/product-thumb";
import { RatingStars } from "../components/atoms/rating-stars";
import { SectionTitle } from "../components/molecules/section-title";
import { AccountTitle } from "../components/templates/account-template";
import { deleteReviewFn, getReviewsFn } from "../lib/account";
import { formatDate } from "../lib/dates";

export const Route = createFileRoute("/account/reviews/")({
  loader: () => getReviewsFn(),
  head: () => ({ meta: [{ title: "리뷰 | 설기로운" }] }),
  component: Reviews,
});

/** 리뷰 — 쓸 수 있는 상품(기한)과 내가 쓴 리뷰(고치기·지우기, 상점 답글) */
function Reviews() {
  const { writable, mine } = Route.useLoaderData();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <AccountTitle title="리뷰" />
      <section aria-labelledby="writable-title" className="flex flex-col">
        <SectionTitle id="writable-title" title={`쓸 수 있는 리뷰 ${writable.length}`} />
        {writable.length === 0 ? (
          <p className="py-12 text-center text-muted">
            지금 쓸 수 있는 리뷰가 없습니다. 구매확정한 상품에 씁니다.
          </p>
        ) : (
          writable.map((w) => (
            <div
              key={w.orderItemId}
              className="flex flex-wrap items-center gap-5 border-line border-b py-5"
            >
              <span className="w-16 shrink-0">
                <ProductThumb src={w.thumbnailUrl} name={w.productName} size="sm" />
              </span>
              <span className="flex min-w-0 flex-[1_1_200px] flex-col gap-1 text-body">
                {w.productName}
                <span className="text-caption text-muted">
                  {w.optionName ? `${w.optionName} · ` : ""}
                  {formatDate(w.writableUntil)}까지
                </span>
              </span>
              <Link
                to="/account/reviews/write/$orderItemId"
                params={{ orderItemId: w.orderItemId }}
                className={buttonClass({ size: "sm" })}
              >
                리뷰 쓰기
              </Link>
            </div>
          ))
        )}
      </section>
      <section aria-labelledby="mine-title" className="flex flex-col">
        <SectionTitle id="mine-title" title={`내가 쓴 리뷰 ${mine.totalElements}`} />
        {error ? (
          <p role="alert" className="pt-3 text-primary text-small">
            {error}
          </p>
        ) : null}
        {mine.contents.length === 0 ? (
          <p className="py-12 text-center text-muted">쓴 리뷰가 없습니다.</p>
        ) : (
          mine.contents.map((r) => (
            <article key={r.reviewId} className="flex flex-wrap gap-5 border-line border-b py-6">
              <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
                <p className="flex items-center gap-2.5 text-caption text-muted">
                  <RatingStars rating={r.rating} />
                  {formatDate(r.createdAt)}
                  {r.blinded ? <span className="text-primary">가려진 리뷰</span> : null}
                </p>
                <p className="text-body">{r.productName}</p>
                {r.optionName ? <p className="text-caption text-muted">{r.optionName}</p> : null}
                <p className="whitespace-pre-line text-body leading-[1.8]">{r.content}</p>
                {r.sellerReply ? (
                  <div className="mt-1 border-ink border-l pl-3.5 text-prose text-small">
                    <p className="font-medium text-caption text-ink">상점 답글</p>
                    {r.sellerReply.content}
                  </div>
                ) : null}
                {r.editable ? (
                  <div className="flex gap-4 pt-1 text-small">
                    <Link
                      to="/account/reviews/edit/$reviewId"
                      params={{ reviewId: r.reviewId }}
                      className="underline underline-offset-4"
                    >
                      고치기
                    </Link>
                    <button
                      type="button"
                      className="text-muted underline underline-offset-4"
                      onClick={async () => {
                        const res = await deleteReviewFn({ data: { reviewId: r.reviewId } });
                        setError(res.error);
                        await router.invalidate();
                      }}
                    >
                      지우기
                    </button>
                    <span className="text-caption text-muted">
                      {formatDate(r.editableUntil)}까지 고칠 수 있습니다
                    </span>
                  </div>
                ) : null}
              </div>
              {r.images[0] ? (
                <img src={r.images[0]} alt="" className="size-24 shrink-0 object-cover" />
              ) : null}
            </article>
          ))
        )}
      </section>
    </>
  );
}
