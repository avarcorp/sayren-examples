import type { StorefrontCollection } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { formatDate } from "../../lib/dates";

/** 기획전 목록 — 대표 그림(없으면 크림 면에 제목), 제목·설명·기간. 카드 상자 없이 2열 */
export function CollectionListTemplate({ collections }: { collections: StorefrontCollection[] }) {
  return (
    <div className="flex flex-col gap-10 pt-12 pb-8">
      <h1 className="font-display text-h1">기획전</h1>
      {collections.length === 0 ? (
        <p className="py-24 text-center text-muted">진행 중인 기획전이 없습니다.</p>
      ) : (
        <div className="grid gap-x-5 gap-y-14 md:grid-cols-2">
          {collections.map((c) => (
            <Link
              key={c.collectionId}
              to="/collections/$slug"
              params={{ slug: c.slug }}
              className="group flex flex-col gap-4"
            >
              {c.imageUrl ? (
                <img
                  src={c.imageUrl}
                  alt=""
                  className="aspect-[16/10] w-full bg-tone-cream object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex aspect-[16/10] w-full items-end bg-tone-cream p-6 font-display text-h2"
                >
                  {c.title}
                </span>
              )}
              <span className="flex flex-col gap-1.5">
                <span className="font-display text-h3 group-hover:underline">{c.title}</span>
                {c.description ? (
                  <span className="text-body text-prose">{c.description}</span>
                ) : null}
                <CollectionPeriod startsAt={c.startsAt} endsAt={c.endsAt} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CollectionPeriod({
  startsAt,
  endsAt,
}: {
  startsAt: string | null;
  endsAt: string | null;
}) {
  if (!startsAt && !endsAt) return null;
  return (
    <span className="text-caption text-muted">
      {startsAt ? formatDate(startsAt) : ""} ~ {endsAt ? formatDate(endsAt) : ""}
    </span>
  );
}
