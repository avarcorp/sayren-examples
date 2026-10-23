import type { ReviewPage } from "@sayren/storefront-sdk";
import { useState } from "react";
import { getReviewsFn, type ReviewSort } from "../lib/product";

/** 상세 리뷰 목록 상태 — 정렬·사진 리뷰만을 바꾸면 첫 쪽부터, 「더 보기」는 다음 쪽을 이어 붙인다 */
export function useReviewList(productId: string, first: ReviewPage | null) {
  const [sort, setSort] = useState<ReviewSort>("helpful");
  const [photoOnly, setPhotoOnly] = useState(false);
  const [reviews, setReviews] = useState(first?.contents ?? []);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(first?.totalPages ?? 1);
  const [loading, setLoading] = useState(false);

  async function load(next: { sort: ReviewSort; photoOnly: boolean; page: number }) {
    setLoading(true);
    try {
      const result = await getReviewsFn({
        data: { productId, sort: next.sort, hasImage: next.photoOnly, page: next.page },
      });
      setReviews((prev) => (next.page === 1 ? result.contents : [...prev, ...result.contents]));
      setPage(next.page);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }

  return {
    sort,
    photoOnly,
    reviews,
    loading,
    hasMore: page < totalPages,
    setSort: (s: ReviewSort) => {
      setSort(s);
      void load({ sort: s, photoOnly, page: 1 });
    },
    setPhotoOnly: (on: boolean) => {
      setPhotoOnly(on);
      void load({ sort, photoOnly: on, page: 1 });
    },
    more: () => void load({ sort, photoOnly, page: page + 1 }),
  };
}
