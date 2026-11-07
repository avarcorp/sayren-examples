import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Container, PageTitle } from "../components/ui/page-title";
import { useShippingNotice, useStore } from "../hooks/use-catalog";
import { m } from "../i18n";
import { deliveryNoticeText } from "../lib/delivery";
import { formatMoney } from "../lib/format";
import { IMAGE_CREDITS } from "../lib/image-credits";

/** 도움말 — 배송·교환·반품(상품 배송 정책 값), 사이즈 안내, 고객센터, 이미지 출처 */
export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: m.nav_help() }] }),
  component: HelpPage,
});

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-line border-t py-6">
      <h2 id={id} className="pb-3 font-semibold text-body-lg">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3 border-line border-b py-2.5 text-meta last:border-b-0">
      <dt className="w-2/5 shrink-0 text-sub">{label}</dt>
      <dd className="min-w-0 break-words">{value}</dd>
    </div>
  );
}

function HelpPage() {
  const store = useStore();
  const shipping = useShippingNotice();
  const deliveryText = shipping ? deliveryNoticeText(shipping.notice, shipping.currency) : null;
  const estimated =
    shipping && "estimatedDays" in shipping.notice ? shipping.notice.estimatedDays : null;

  return (
    <Container className="max-w-3xl">
      <PageTitle>{m.nav_help()}</PageTitle>
      {shipping ? (
        <Block id="help-shipping" title={m.help_shipping_title()}>
          <dl>
            {deliveryText ? <Row label={m.guide_delivery()} value={deliveryText} /> : null}
            {estimated ? <Row label={m.guide_estimated()} value={estimated} /> : null}
            {shipping.returnDeliveryFee !== null ? (
              <Row
                label={m.guide_return_fee()}
                value={formatMoney(shipping.returnDeliveryFee, shipping.currency)}
              />
            ) : null}
            {shipping.exchangeDeliveryFee !== null ? (
              <Row
                label={m.guide_exchange_fee()}
                value={formatMoney(shipping.exchangeDeliveryFee, shipping.currency)}
              />
            ) : null}
            <Row
              label={m.guide_return_period()}
              value={m.guide_return_period_value({ days: shipping.returnPeriodDays })}
            />
          </dl>
          <p className="pt-3 text-meta text-sub">
            {m.help_claim_how()}{" "}
            <Link to="/orders" className="text-point underline underline-offset-4">
              {m.account_orders()}
            </Link>
          </p>
        </Block>
      ) : null}
      <Block id="help-size" title={m.help_size_title()}>
        <dl>
          <Row label={m.help_size_top()} value="S · M · L" />
          <Row label={m.help_size_bottom()} value="28 · 30 · 32 · 34" />
        </dl>
        <p className="pt-3 text-meta text-sub">{m.help_size_note()}</p>
      </Block>
      <Block id="help-contact" title={m.help_contact_title()}>
        <dl>
          {store.customerCenterEmail ? (
            <Row label={m.seller_email()} value={store.customerCenterEmail} />
          ) : null}
          {store.customerCenterPhone ? (
            <Row label={m.seller_phone()} value={store.customerCenterPhone} />
          ) : null}
          {store.businessHours ? <Row label={m.help_hours()} value={store.businessHours} /> : null}
        </dl>
        <p className="pt-3 text-meta">
          <Link to="/account/support" className="text-point underline underline-offset-4">
            {m.footer_support()}
          </Link>
        </p>
      </Block>
      <Block id="help-credits" title={m.help_credits_title()}>
        <p className="pb-3 text-meta text-sub">{m.help_credits_note()}</p>
        <ul className="flex flex-col gap-2 text-caption text-sub">
          {IMAGE_CREDITS.map((credit) => (
            <li key={credit.sourceUrl} className="break-words">
              <a href={credit.sourceUrl} target="_blank" rel="noreferrer" className="underline">
                {credit.title}
              </a>{" "}
              · {credit.creator} ·{" "}
              <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                {credit.license}
              </a>
            </li>
          ))}
        </ul>
      </Block>
    </Container>
  );
}
