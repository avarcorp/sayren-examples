import type { ProductDetail } from "@sayren/storefront-sdk";
import { formatMoney } from "../../lib/format";
import { HTML_CLASS } from "./product-description";

/** 상품정보제공 고시·인증 정보·안내 섹션 — 서버가 채운 칸을 순서대로 그린다 */
export function ProductInfo({ product }: { product: ProductDetail }) {
  const rows = [
    ...(product.notice?.fields.map((f) => ({ key: f.key, label: f.label, value: f.value })) ?? []),
    ...(product.certifications?.items.map((c, i) => ({
      key: `cert-${i}`,
      label: c.kindLabel,
      value: [c.agency, c.number].filter(Boolean).join(" · "),
    })) ?? []),
    ...(product.certifications?.exemptions.map((e, i) => ({
      key: `exempt-${i}`,
      label: e.subjectLabel,
      value: e.exemptionLabel,
    })) ?? []),
  ];
  return (
    <div className="flex flex-col gap-10">
      {product.infoSections.map((s) => (
        <section key={s.infoSectionId} className="flex flex-col gap-3">
          <h3 className="font-medium text-lead">{s.title}</h3>
          {/* biome-ignore lint/security/noDangerouslySetInnerHtml: 안내 섹션 본문은 서버가 정화한 HTML이다 */}
          <div className={HTML_CLASS} dangerouslySetInnerHTML={{ __html: s.body }} />
        </section>
      ))}
      {rows.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h3 className="font-medium text-lead">
            상품정보제공 고시{product.notice ? ` · ${product.notice.name}` : ""}
          </h3>
          <dl className="grid grid-cols-[minmax(110px,180px)_minmax(0,1fr)] border-ink border-t text-body">
            {rows.map((r) => (
              <div key={r.key} className="contents">
                <dt className="border-line border-b py-3.5 pr-3 text-muted">{r.label}</dt>
                <dd className="border-line border-b py-3.5">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

/** 배송·교환·반품 안내 — 상품의 이행·환불 정책 값만 쓴다 */
export function DeliveryReturnInfo({ product }: { product: ProductDetail }) {
  const s = product.fulfillment.type === "SHIPPING" ? product.fulfillment.shipping : null;
  return (
    <dl className="grid grid-cols-[minmax(110px,180px)_minmax(0,1fr)] border-ink border-t text-body">
      {s ? (
        <>
          <Row label="배송비">
            {s.deliveryType === "FREE"
              ? "무료"
              : `${formatMoney(s.deliveryFee)}${s.conditionalFreeAmount ? ` (${formatMoney(s.conditionalFreeAmount)} 이상 무료)` : ""}`}
          </Row>
          {s.estimatedDays ? <Row label="배송 기간">{s.estimatedDays}</Row> : null}
          <Row label="반품 배송비">{formatMoney(s.returnDeliveryFee)}</Row>
          <Row label="교환 배송비">{formatMoney(s.exchangeDeliveryFee)}</Row>
        </>
      ) : null}
      <Row label="반품·교환 기간">받은 날부터 {product.returnPeriodDays}일 이내</Row>
    </dl>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="border-line border-b py-3.5 pr-3 text-muted">{label}</dt>
      <dd className="border-line border-b py-3.5">{children}</dd>
    </div>
  );
}
