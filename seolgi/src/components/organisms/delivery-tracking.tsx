import type { DeliveryTracking as Tracking } from "@sayren/storefront-sdk";
import { formatDateTime } from "../../lib/dates";
import { SectionTitle } from "../molecules/section-title";

/** 배송 조회 (시안 DOrder) — 택배사·송장, 최근 일이 위인 이력. 맨 위 줄만 굵게 */
export function DeliveryTracking({
  tracking,
  productName,
}: {
  tracking: Tracking | null;
  productName: string;
}) {
  return (
    <section aria-labelledby="tracking-title" className="flex flex-col gap-4">
      <SectionTitle
        id="tracking-title"
        title={`배송 조회 · ${productName}`}
        action={
          tracking ? (
            <a
              href={tracking.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-muted text-small underline underline-offset-2"
            >
              {tracking.carrierName} {tracking.trackingNumber}
            </a>
          ) : null
        }
      />
      {!tracking ? (
        <p className="text-body text-muted">배송 정보를 아직 받지 못했습니다.</p>
      ) : tracking.trackingEvents.length === 0 ? (
        <p className="text-body text-muted">택배사 이력이 아직 없습니다.</p>
      ) : (
        <ol className="flex flex-col gap-3.5 text-body">
          {tracking.trackingEvents.map((e, i) => (
            <li
              key={`${e.occurredAt}-${e.status}`}
              className={`flex gap-6 ${i === 0 ? "" : "text-muted"}`}
            >
              <span className="w-30 shrink-0 text-muted">
                {formatDateTime(e.occurredAt).slice(5)}
              </span>
              <span className={i === 0 ? "font-medium" : ""}>
                {e.status} · {e.location}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
