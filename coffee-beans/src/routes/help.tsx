import { createFileRoute, Link } from "@tanstack/react-router";
import { Accordion } from "../components/product/info-sections";
import { Container, PageTitle, SectionTitle } from "../components/ui";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";
import { PHOTO_CREDITS } from "../lib/photo-credits";

/** 도움말 — 로스팅·발송, 분쇄도 고르는 법, 교환·반품, 고객센터, 사진 출처 */
export const Route = createFileRoute("/help")({ component: Help });

function Help() {
  const store = useStore();
  return (
    <Container className="flex max-w-3xl flex-col gap-8 pt-5">
      <PageTitle>{m.help_title()}</PageTitle>
      <section className="flex flex-col">
        <SectionTitle>{m.help_faq()}</SectionTitle>
        <div className="mt-3 border-line border-t">
          <Accordion title={m.help_q_roast()} open>
            <p>{m.help_a_roast()}</p>
          </Accordion>
          <Accordion title={m.help_q_grind()}>
            <ul className="flex flex-col gap-1">
              <li>{m.help_a_grind_whole()}</li>
              <li>{m.help_a_grind_drip()}</li>
              <li>{m.help_a_grind_espresso()}</li>
              <li>{m.help_a_grind_cold()}</li>
            </ul>
          </Accordion>
          <Accordion title={m.help_q_size()}>
            <p>{m.help_a_size()}</p>
          </Accordion>
          <Accordion title={m.help_q_return()}>
            <p>{m.help_a_return()}</p>
          </Accordion>
          <Accordion title={m.help_q_store()}>
            <p>{m.help_a_store()}</p>
          </Accordion>
          <Accordion title={m.help_q_guest()}>
            <p>
              {m.help_a_guest()}{" "}
              <Link to="/guest-order" className="text-point underline">
                {m.nav_guest_order()}
              </Link>
            </p>
          </Accordion>
        </div>
      </section>
      <section className="flex flex-col gap-2">
        <SectionTitle>{m.help_contact()}</SectionTitle>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-body">
          {store.customerCenterPhone ? (
            <>
              <dt className="text-muted">{m.seller_customerCenterPhone()}</dt>
              <dd className="tabular">{store.customerCenterPhone}</dd>
            </>
          ) : null}
          {store.customerCenterEmail ? (
            <>
              <dt className="text-muted">{m.seller_customerCenterEmail()}</dt>
              <dd className="break-all">{store.customerCenterEmail}</dd>
            </>
          ) : null}
          {store.businessHours ? (
            <>
              <dt className="text-muted">{m.help_hours()}</dt>
              <dd>{store.businessHours}</dd>
            </>
          ) : null}
        </dl>
        <Link
          to="/account/support"
          className="min-h-11 content-center text-meta text-point underline"
        >
          {m.footer_support()}
        </Link>
      </section>
      <section className="flex flex-col gap-2">
        <SectionTitle>{m.help_photos()}</SectionTitle>
        <p className="text-meta text-sub">{m.help_photos_note()}</p>
        <ul className="flex flex-col gap-1 text-caption text-muted">
          {PHOTO_CREDITS.map((credit) => (
            <li key={credit.source} className="break-words">
              <a href={credit.source} target="_blank" rel="noreferrer" className="underline">
                {credit.title}
              </a>
              {credit.creator ? ` · ${credit.creator}` : ""} ·{" "}
              <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className="underline">
                {credit.license}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}
