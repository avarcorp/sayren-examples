import type { StorefrontCollection } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";

/** 컬렉션 카드 — 대표 사진(4:3)과 제목. 사진이 없으면 테두리 상자에 제목만 */
export function CollectionCard({ collection }: { collection: StorefrontCollection }) {
  return (
    <Link
      to="/collections/$slug"
      params={{ slug: collection.slug }}
      className="group flex min-w-0 flex-col gap-2.5"
    >
      <div className="aspect-[4/3] overflow-hidden border border-line">
        {collection.imageUrl ? (
          <img
            src={collection.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        ) : null}
      </div>
      <p className="font-semibold text-body group-hover:underline">{collection.title}</p>
    </Link>
  );
}
