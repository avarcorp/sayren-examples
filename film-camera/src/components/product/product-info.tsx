import type { ProductDetail } from "@sayren/storefront-sdk";
import { sellerInfoOf } from "@sayren/storefront-sdk";
import { useStore } from "../../hooks/use-catalog";
import { m } from "../../i18n";
import { formatMoney } from "../../lib/format";
import { Accordion } from "../accordion";
import { InfoRows } from "../ui";

const SELLER_LABEL = {
  businessName: () => m.seller_businessName(),
  representativeName: () => m.seller_representativeName(),
  businessNumber: () => m.seller_businessNumber(),
  mailOrderSalesNumber: () => m.seller_mailOrderSalesNumber(),
  businessAddress: () => m.seller_businessAddress(),
  customerCenterPhone: () => m.seller_customerCenterPhone(),
  customerCenterEmail: () => m.seller_customerCenterEmail(),
  privacyOfficerName: () => m.seller_privacyOfficerName(),
  privacyOfficerEmail: () => m.seller_privacyOfficerEmail(),
} as const;

/** 상품정보제공 고시·인증 정보 — 서버가 채운 그대로 표로. 없으면 숨긴다 */
export function NoticeTable({ product }: { product: ProductDetail }) {
  if (!product.notice && !product.certifications) return null;
  return (
    <div className="flex flex-col gap-6">
      {product.notice ? (
        <section aria-labelledby="notice-title" className="flex flex-col gap-3">
          <h3 id="notice-title" className="font-bold text-body-lg">
            {m.product_notice_title()}
          </h3>
          <InfoRows rows={product.notice.fields.map((f) => ({ label: f.label, value: f.value }))} />
        </section>
      ) : null}
      {product.certifications ? (
        <section aria-labelledby="cert-title" className="flex flex-col gap-3">
          <h3 id="cert-title" className="font-bold text-body-lg">
            {m.product_certifications_title()}
          </h3>
          <InfoRows
            rows={[
              ...product.certifications.items.map((c) => ({ label: c.kindLabel, value: c.number })),
              ...product.certifications.exemptions.map((e) => ({
                label: e.subjectLabel,
                value: e.exemptionLabel,
              })),
            ]}
          />
        </section>
      ) : null}
    </div>
  );
}

/** 판매자 정보·반품/교환 안내(접는 행) */
export function SellerAndReturn({ product }: { product: ProductDetail }) {
  const store = useStore();
  const seller = sellerInfoOf(store);
  const shipping = product.fulfillment.type === "SHIPPING" ? product.fulfillment.shipping : null;
  const money = (n: number) => formatMoney(n, product.currency);
  return (
    <Accordion
      items={[
        {
          id: "seller",
          title: m.product_seller_title(),
          body: (
            <InfoRows
              rows={[
                { label: m.seller_businessName(), value: store.name },
                ...seller
                  .filter((row) => row.field !== "businessName")
                  .map((row) => ({ label: SELLER_LABEL[row.field](), value: row.value })),
              ]}
            />
          ),
        },
        {
          id: "return",
          title: m.product_return_title(),
          body: (
            <div className="flex flex-col gap-2">
              <p>{m.product_return_period({ days: product.returnPeriodDays })}</p>
              {shipping ? (
                <p>
                  {m.product_return_fee({
                    fee: money(shipping.returnDeliveryFee),
                    exchange: money(shipping.exchangeDeliveryFee),
                  })}
                </p>
              ) : null}
              <p>{m.product_return_seller_fault()}</p>
            </div>
          ),
        },
      ]}
    />
  );
}
