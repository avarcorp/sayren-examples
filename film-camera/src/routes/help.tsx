import { createFileRoute } from "@tanstack/react-router";
import { Faq } from "../components/faq";
import { ButtonLink, InfoRows, PageHeader, SectionTitle } from "../components/ui";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";
import { PHOTO_CREDITS } from "../lib/photo-credits";

export const Route = createFileRoute("/help")({
  component: Help,
});

function Help() {
  const store = useStore();
  const contact = [
    ...(store.businessHours ? [{ label: m.help_hours(), value: store.businessHours }] : []),
    ...(store.customerCenterPhone
      ? [{ label: m.help_phone(), value: store.customerCenterPhone }]
      : []),
    ...(store.customerCenterEmail
      ? [
          {
            label: m.help_email(),
            value: (
              <a href={`mailto:${store.customerCenterEmail}`} className="underline">
                {store.customerCenterEmail}
              </a>
            ),
          },
        ]
      : []),
  ];
  const guides = [
    { title: m.help_shipping_title(), body: m.help_shipping_body() },
    { title: m.help_return_title(), body: m.help_return_body() },
    { title: m.help_warranty_title(), body: m.help_warranty_body() },
  ];
  return (
    <main className="flex flex-col gap-10 lg:max-w-[48rem]">
      <PageHeader title={m.help_title()} />
      {contact.length > 0 ? <InfoRows rows={contact} /> : null}
      <div className="flex flex-wrap gap-3">
        <ButtonLink to="/account/support">{m.help_support_cta()}</ButtonLink>
        <ButtonLink to="/guest-order" variant="secondary">
          {m.help_guest_cta()}
        </ButtonLink>
      </div>
      {guides.map((guide) => (
        <section key={guide.title} className="flex flex-col gap-2">
          <SectionTitle>{guide.title}</SectionTitle>
          <p className="max-w-[40em] text-body text-sub leading-relaxed">{guide.body}</p>
        </section>
      ))}
      <section className="flex flex-col gap-3">
        <SectionTitle>{m.faq_title()}</SectionTitle>
        <Faq />
      </section>
      <section className="flex flex-col gap-3">
        <SectionTitle>{m.help_credits_title()}</SectionTitle>
        <p className="text-meta text-sub">{m.help_credits_note()}</p>
        <ul className="flex flex-col gap-2 text-meta text-sub">
          {PHOTO_CREDITS.map((credit) => (
            <li key={credit.sourceUrl} className="break-words">
              {credit.camera} ·{" "}
              <a href={credit.sourceUrl} className="underline" rel="noopener" target="_blank">
                {credit.title}
              </a>{" "}
              · {credit.author} ·{" "}
              <a href={credit.licenseUrl} className="underline" rel="noopener" target="_blank">
                {credit.license}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
