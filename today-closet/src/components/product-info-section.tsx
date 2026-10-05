import type { ProductDetail } from "@sayren/storefront-sdk";
import { ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { m } from "../i18n";
import { NOTICE_FALLBACK, type NoticeRow } from "../lib/product-notice";
import { ProductNoticeTable } from "./product-notice-table";
import { buttonClass } from "./ui/button";
import { InfoList, SectionHeader } from "./ui/section";

/**
 * 상세정보 탭 위쪽 — 안전거래 안내 박스, 「상품정보」 표(상품번호 복사), 「상품정보제공고시 보기」로 펼치는 고시 표.
 * 제조사·원산지·제조일자는 스토어프론트 상품 응답에 없어 「상품 상세 참조」다.
 */
export function ProductInfoSection({
  product,
  brand,
  noticeRows,
}: {
  product: ProductDetail;
  brand: string;
  noticeRows: NoticeRow[];
}) {
  const [copied, setCopied] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const noticeId = useId();
  const material = noticeRows.find((row) => row.label === "제품 소재")?.value ?? NOTICE_FALLBACK;
  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: m.pd_info_product_id(),
      value: (
        <span className="flex flex-wrap items-center gap-2">
          <span className="tabular break-all">{product.productNo ?? product.productId}</span>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard
                .writeText(String(product.productNo ?? product.productId))
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
            className={buttonClass({ variant: "subtle", size: "xs" })}
          >
            {m.pd_info_copy()}
          </button>
          {copied ? (
            <span role="status" className="text-caption text-muted">
              {m.pd_info_copied()}
            </span>
          ) : null}
        </span>
      ),
    },
    { label: m.pd_info_brand(), value: brand },
    {
      label: m.pd_info_category(),
      value: product.categoryPath.map((c) => c.name).join(" > ") || NOTICE_FALLBACK,
    },
    { label: m.pd_info_material(), value: material },
    { label: m.pd_info_manufacturer(), value: NOTICE_FALLBACK },
    { label: m.pd_info_origin(), value: NOTICE_FALLBACK },
    { label: m.pd_info_made_at(), value: NOTICE_FALLBACK },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <p role="note" className="flex gap-2.5 bg-chip p-4 text-meta text-sub leading-relaxed">
        <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-ink" strokeWidth={1.6} />
        <span className="min-w-0">{m.pd_safe_notice()}</span>
      </p>
      <section className="flex min-w-0 flex-col gap-4">
        <SectionHeader
          title={m.pd_info_title()}
          rule
          action={
            <button
              type="button"
              aria-expanded={noticeOpen}
              aria-controls={noticeId}
              onClick={() => setNoticeOpen((value) => !value)}
              className={buttonClass({ variant: "subtle", size: "xs" })}
            >
              {noticeOpen ? m.pd_notice_close() : m.pd_notice_open()}
            </button>
          }
        />
        <InfoList
          labelWidth="5.5rem"
          rows={rows.map((row) => ({ key: row.label, label: row.label, value: row.value }))}
        />
        <div id={noticeId} hidden={!noticeOpen} className="pt-2">
          <ProductNoticeTable rows={noticeRows} />
        </div>
      </section>
    </div>
  );
}
