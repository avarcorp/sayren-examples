import type {
  ProductDetail,
  PublicInquiry,
  ReviewPage,
  StorefrontStore,
} from "@sayren/storefront-sdk";
import { useState } from "react";
import { m } from "../../i18n";
import { formatMoney } from "../../lib/format";
import { createProductInquiry } from "../../lib/shop-actions";
import { SellerInfoRows } from "../layout/seller-info";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/fields";

const SECTIONS = [
  { id: "detail", label: () => m.tab_detail() },
  { id: "reviews", label: () => m.tab_reviews() },
  { id: "inquiries", label: () => m.tab_inquiries() },
  { id: "guide", label: () => m.tab_guide() },
] as const;

/** 고정 탭 바 — 각 구획으로 스크롤한다 */
export function SectionTabs({ reviewCount }: { reviewCount: number }) {
  return (
    <nav
      aria-label={m.tab_label()}
      className="sticky top-[93px] z-20 -mx-4 border-line border-b bg-page md:top-[97px] md:mx-0"
    >
      <ul className="grid grid-cols-4">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="flex min-h-12 items-center justify-center text-meta hover:text-point"
            >
              {section.label()}
              {section.id === "reviews" && reviewCount > 0 ? ` ${reviewCount}` : ""}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={`${id}-title`} className="pb-4 font-semibold text-body-lg">
      {children}
    </h2>
  );
}

/** 상세 설명(서버가 정화한 HTML) + 상품정보 제공고시 + 인증 */
export function DetailSection({ product }: { product: ProductDetail }) {
  return (
    <section id="detail" aria-labelledby="detail-title" className="scroll-mt-40 pt-8">
      <SectionHeading id="detail">{m.tab_detail()}</SectionHeading>
      <div
        className="product-description max-w-2xl text-body text-sub [&_h3]:pt-4 [&_h3]:pb-1 [&_h3]:font-semibold [&_h3]:text-ink [&_img]:h-auto [&_img]:max-w-full"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: 서버가 정화한 상세 설명 HTML이다
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
      {product.notice ? (
        <div className="pt-8">
          <h3 className="pb-3 font-semibold text-body">{m.notice_title()}</h3>
          <table className="w-full border-line border-t text-meta">
            <tbody>
              {product.notice.fields.map((field) => (
                <tr key={field.key} className="border-line border-b">
                  <th
                    scope="row"
                    className="w-2/5 py-2.5 pr-3 text-left align-top font-normal text-sub"
                  >
                    {field.label}
                  </th>
                  <td className="break-words py-2.5">{field.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {product.certifications ? (
        <ul className="pt-6 text-meta text-sub">
          {product.certifications.items.map((item) => (
            <li key={`${item.kind}-${item.number}`}>
              {[item.kindLabel, item.agency, item.number].filter(Boolean).join(" · ")}
            </li>
          ))}
          {product.certifications.exemptions.map((ex) => (
            <li key={ex.subject}>
              {ex.subjectLabel} — {ex.exemptionLabel}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function ReviewSection({ reviews }: { reviews: ReviewPage | null }) {
  if (!reviews) return null;
  const summary = reviews.summary;
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-40 pt-12">
      <SectionHeading id="reviews">{m.tab_reviews()}</SectionHeading>
      {reviews.contents.length === 0 || !summary ? (
        <p className="border-line border-t py-8 text-body text-sub">{m.reviews_empty()}</p>
      ) : (
        <>
          <p className="pb-4 text-body">
            <span className="font-semibold text-lg">{summary.averageRating.toFixed(1)}</span>
            <span className="ml-2 text-meta text-sub">
              {m.reviews_count({ count: summary.totalCount })}
            </span>
          </p>
          <ul className="border-line border-t">
            {reviews.contents.map((review) => (
              <li key={review.reviewId} className="flex flex-col gap-2 border-line border-b py-5">
                <p className="text-meta">
                  <span className="sr-only">{m.reviews_rating({ rating: review.rating })}</span>
                  <span aria-hidden>
                    {"★".repeat(review.rating)}
                    <span className="text-line-strong">{"★".repeat(5 - review.rating)}</span>
                  </span>
                  <span className="ml-2 text-sub">{review.writerMaskedName}</span>
                </p>
                {review.optionName ? (
                  <p className="text-caption text-muted">{review.optionName}</p>
                ) : null}
                <p className="whitespace-pre-line break-words text-body">{review.content}</p>
                {review.images.length > 0 ? (
                  <ul className="flex gap-2">
                    {review.images.map((src) => (
                      <li key={src} className="size-20 overflow-hidden border border-line">
                        <img
                          src={src}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {review.sellerReply ? (
                  <p className="border-line border-l-2 pl-3 text-meta text-sub">
                    {review.sellerReply.content}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function InquirySection({
  productId,
  inquiries,
}: {
  productId: string;
  inquiries: { contents: PublicInquiry[] } | null;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [secret, setSecret] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  if (!inquiries) return null;

  const submit = async () => {
    if (!content.trim()) return;
    const result = await createProductInquiry({
      data: { productId, content: content.trim(), secret },
    });
    setMessage(result.ok ? m.inquiry_sent() : result.message);
    if (result.ok) {
      setContent("");
      setOpen(false);
    }
  };

  return (
    <section id="inquiries" aria-labelledby="inquiries-title" className="scroll-mt-40 pt-12">
      <div className="flex items-center justify-between">
        <SectionHeading id="inquiries">{m.tab_inquiries()}</SectionHeading>
        <Button variant="text" onClick={() => setOpen((v) => !v)}>
          {m.inquiry_write()}
        </Button>
      </div>
      {open ? (
        <div className="flex flex-col gap-3 pb-6">
          <label htmlFor="inquiry-content" className="sr-only">
            {m.inquiry_content()}
          </label>
          <textarea
            id="inquiry-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={m.inquiry_placeholder()}
            className="w-full border border-line-strong p-3 text-body focus:border-point focus:outline-none"
          />
          <Checkbox
            label={m.inquiry_secret()}
            checked={secret}
            onChange={(event) => setSecret(event.target.checked)}
          />
          <Button onClick={submit} disabled={!content.trim()}>
            {m.inquiry_submit()}
          </Button>
        </div>
      ) : null}
      {message ? (
        <p role="status" className="pb-4 text-meta text-sub">
          {message}
        </p>
      ) : null}
      {inquiries.contents.length === 0 ? (
        <p className="border-line border-t py-8 text-body text-sub">{m.inquiries_empty()}</p>
      ) : (
        <ul className="border-line border-t">
          {inquiries.contents.map((inquiry) => (
            <li key={inquiry.inquiryId} className="flex flex-col gap-1.5 border-line border-b py-4">
              <p className="text-caption text-muted">
                {inquiry.writerMaskedName} ·{" "}
                {inquiry.answer ? m.inquiry_answered() : m.inquiry_waiting()}
              </p>
              <p className="break-words text-body">
                {inquiry.secret && !inquiry.mine ? m.inquiry_secret_hidden() : inquiry.content}
              </p>
              {inquiry.answer?.content ? (
                <p className="border-line border-l-2 pl-3 text-meta text-sub">
                  {inquiry.answer.content}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 배송·교환·반품 안내 — 상품의 fulfillment·returnPeriodDays 값으로만 만든다 */
export function GuideSection({
  store,
  product,
  deliveryText,
}: {
  store: StorefrontStore;
  product: ProductDetail;
  deliveryText: string | null;
}) {
  const shipping = product.fulfillment.type === "SHIPPING" ? product.fulfillment.shipping : null;
  return (
    <section id="guide" aria-labelledby="guide-title" className="scroll-mt-40 pt-12">
      <SectionHeading id="guide">{m.tab_guide()}</SectionHeading>
      <dl className="border-line border-t text-meta">
        {deliveryText ? <GuideRow label={m.guide_delivery()} value={deliveryText} /> : null}
        {shipping?.estimatedDays ? (
          <GuideRow label={m.guide_estimated()} value={shipping.estimatedDays} />
        ) : null}
        {shipping ? (
          <>
            <GuideRow
              label={m.guide_return_fee()}
              value={formatMoney(shipping.returnDeliveryFee, product.currency)}
            />
            <GuideRow
              label={m.guide_exchange_fee()}
              value={formatMoney(shipping.exchangeDeliveryFee, product.currency)}
            />
          </>
        ) : null}
        <GuideRow
          label={m.guide_return_period()}
          value={m.guide_return_period_value({ days: product.returnPeriodDays })}
        />
      </dl>
      <SellerInfoRows
        store={store}
        className="mt-6 flex flex-col gap-1 border-line border-t pt-4 text-meta text-sub"
      />
      {product.infoSections.map((section) => (
        <div key={section.infoSectionId} className="pt-6">
          <h3 className="pb-2 font-semibold text-body">{section.title}</h3>
          <div
            className="text-meta text-sub"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: 서버가 정화한 안내 섹션 HTML이다
            dangerouslySetInnerHTML={{ __html: section.body }}
          />
        </div>
      ))}
    </section>
  );
}

function GuideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-line border-b py-2.5">
      <dt className="w-2/5 shrink-0 text-sub">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}
