import { Link } from "@tanstack/react-router";
import { buttonClass } from "../../components/ui/button";
import { m } from "../../i18n";
import type { SectionOf } from "../layout-schema";
import { fill } from "../site-link";
import type { SectionData } from "./data";

/** 문의 안내 — 고객센터 전화·영업시간(`GET /store`)과 문의 경로. 전화가 없으면 내 정보의 문의로 보낸다 */
export function ContactCtaSection({
  section,
  data,
  storeName,
}: {
  section: SectionOf<"contactCta">;
  data: SectionData<"contactCta">;
  storeName: string;
}) {
  const phone = data.phone?.trim() || null;
  return (
    <section className="flex flex-col items-start justify-between gap-4 bg-chip p-5 md:flex-row md:items-center md:p-8">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="font-bold font-display text-xl tracking-tight md:text-2xl">
          {fill(section.title ?? m.contact_cta_title(), storeName)}
        </h2>
        {section.description ? (
          <p className="text-body text-sub">{fill(section.description, storeName)}</p>
        ) : null}
        {data.businessHours ? (
          <p className="text-meta text-muted">
            {m.contact_cta_business_hours({ hours: data.businessHours })}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {phone ? (
          <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className={buttonClass({ size: "sm" })}>
            {m.contact_cta_phone({ phone })}
          </a>
        ) : null}
        <Link to="/account" className={buttonClass({ variant: "outline", size: "sm" })}>
          {m.contact_cta_inquiry()}
        </Link>
      </div>
    </section>
  );
}
