import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ConfirmDialog } from "../components/confirm-dialog";
import { MyPageShell } from "../components/mypage/my-page-shell";
import { Pagination, TAB_ROW, tabClass } from "../components/mypage/pagination";
import { ProductThumb } from "../components/product-thumb";
import { buttonClass } from "../components/ui/button";
import { EmptyState } from "../components/ui/section";
import { m } from "../i18n";
import { formatDateTime } from "../lib/format";
import { deleteMyReview, getMyReviews } from "../lib/my-reviews";
import { pageTitle } from "../lib/page-title";
import { productPathParam } from "../lib/product-path";

const search = z.object({
  /** 내가 쓴 리뷰 탭. 없으면 작성 가능한 리뷰 */
  tab: z.enum(["written"]).optional().catch(undefined),
  page: z.coerce.number().int().min(2).optional().catch(undefined),
});

/** 마이페이지 리뷰 — 리뷰 쓰기(작성 가능한 주문 상품)와 내가 쓴 리뷰(수정 30일·삭제) */
export const Route = createFileRoute("/account_/reviews/")({
  validateSearch: search,
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => getMyReviews({ data: { page: deps.page ?? 1 } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.rw_title()) }] }),
  component: MyReviews,
});

function Stars({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={m.rv_stars({ rating })} className="text-meta">
      <span className="text-point">{"★".repeat(rating)}</span>
      <span className="text-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function MyReviews() {
  const { writable, mine } = Route.useLoaderData();
  const { tab } = Route.useSearch();
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const confirmDelete = () => {
    if (!deleting) return;
    setPending(true);
    void deleteMyReview({ data: { reviewId: deleting } })
      .then(async (result) => {
        setMessage(
          result.ok
            ? { ok: true, text: m.rw_deleted() }
            : { ok: false, text: m.rw_delete_failed() },
        );
        if (result.ok) await router.invalidate();
      })
      .catch(() => setMessage({ ok: false, text: m.rw_delete_failed() }))
      .finally(() => {
        setPending(false);
        setDeleting(null);
      });
  };

  return (
    <MyPageShell current="reviews" title={m.rw_title()}>
      <div className="flex min-w-0 flex-col gap-4">
        <nav aria-label={m.rw_title()} className={TAB_ROW}>
          <Link
            to="/account/reviews"
            aria-current={tab ? undefined : "true"}
            className={tabClass(!tab)}
          >
            {m.mypage_reviews_tab_writable()}
            <span className="ml-1 tabular">{writable.length}</span>
          </Link>
          <Link
            to="/account/reviews"
            search={{ tab: "written" }}
            aria-current={tab === "written" ? "true" : undefined}
            className={tabClass(tab === "written")}
          >
            {m.mypage_reviews_tab_written()}
            <span className="ml-1 tabular">{mine.totalElements}</span>
          </Link>
        </nav>

        {message ? (
          <p role="status" className={message.ok ? "text-body" : "text-body text-point"}>
            {message.text}
          </p>
        ) : null}

        {tab !== "written" ? (
          writable.length === 0 ? (
            <EmptyState title={m.rw_writable_empty()} />
          ) : (
            <ul className="divide-y divide-line border-line border-b">
              {writable.map((item) => (
                <li
                  key={item.orderItemId}
                  className="flex min-w-0 items-center gap-3 py-4 md:gap-4"
                >
                  <ProductThumb
                    src={item.thumbnailUrl}
                    alt=""
                    className="h-20 w-16 shrink-0 bg-chip object-cover"
                    loading="lazy"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 break-words text-body">{item.productName}</p>
                    {item.optionName ? (
                      <p className="break-words text-meta text-muted">{item.optionName}</p>
                    ) : null}
                    <p className="text-caption text-muted">
                      {m.rw_writable_until({ date: formatDateTime(item.writableUntil) })}
                    </p>
                  </div>
                  <Link
                    to="/account/reviews/write/$orderItemId"
                    params={{ orderItemId: item.orderItemId }}
                    className={buttonClass({ variant: "outline", size: "sm" })}
                  >
                    {m.rw_write()}
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : mine.contents.length === 0 ? (
          <EmptyState title={m.rw_mine_empty()} />
        ) : (
          <ul className="divide-y divide-line border-line border-b">
            {mine.contents.map((review) => (
              <li key={review.reviewId} className="flex min-w-0 flex-col gap-3 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <ProductThumb
                    src={review.thumbnailUrl}
                    alt=""
                    className="h-15 w-12 shrink-0 bg-chip object-cover"
                    loading="lazy"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link
                      to="/products/$productId"
                      params={{ productId: productPathParam(review) }}
                      className="line-clamp-1 break-all text-body hover:underline"
                    >
                      {review.productName ?? m.inquiry_product_deleted()}
                    </Link>
                    {review.optionName ? (
                      <p className="break-words text-caption text-muted">{review.optionName}</p>
                    ) : null}
                    <p className="flex flex-wrap items-center gap-x-2 text-caption">
                      <Stars rating={review.rating} />
                      <span className="tabular text-muted">{formatDateTime(review.createdAt)}</span>
                    </p>
                  </div>
                </div>
                {review.blinded ? (
                  <p className="bg-chip p-3 text-meta text-muted">{m.rw_blinded()}</p>
                ) : null}
                <p className="whitespace-pre-line break-words text-body leading-relaxed">
                  {review.content}
                </p>
                {review.images.length ? (
                  <ul className="flex flex-wrap gap-2">
                    {review.images.map((src, index) => (
                      <li key={src} className="shrink-0">
                        <img
                          src={src}
                          alt={m.rw_photo_alt({ index: index + 1 })}
                          loading="lazy"
                          className="size-16 bg-chip object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {review.sellerReply ? (
                  <div className="flex flex-col gap-1 bg-chip p-4">
                    <p className="font-bold text-meta">
                      {m.rv_seller_reply()}{" "}
                      <span className="font-normal text-muted">
                        {formatDateTime(review.sellerReply.repliedAt)}
                      </span>
                    </p>
                    <p className="whitespace-pre-line break-words text-body">
                      {review.sellerReply.content}
                    </p>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  {review.editable ? (
                    <>
                      <Link
                        to="/account/reviews/edit/$reviewId"
                        params={{ reviewId: review.reviewId }}
                        className={buttonClass({ variant: "subtle", size: "xs" })}
                      >
                        {m.rw_edit()}
                      </Link>
                      <span className="text-caption text-muted">
                        {m.rw_editable_until({ date: formatDateTime(review.editableUntil) })}
                      </span>
                    </>
                  ) : (
                    <span className="text-caption text-muted">{m.rw_not_editable()}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMessage(null);
                      setDeleting(review.reviewId);
                    }}
                    className={buttonClass({ variant: "subtle", size: "xs", className: "ml-auto" })}
                  >
                    {m.rw_delete()}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {tab === "written" ? (
          <Pagination page={mine.page} totalPages={mine.totalPages} to="/account/reviews" />
        ) : null}
      </div>

      <ConfirmDialog
        open={deleting !== null}
        title={m.rw_delete_title()}
        body={m.rw_delete_body()}
        confirmLabel={m.rw_delete_confirm()}
        cancelLabel={m.rw_delete_cancel()}
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </MyPageShell>
  );
}
