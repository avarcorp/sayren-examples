import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument } from "../components/ui/legal-document";
import { Container, PageTitle } from "../components/ui/page-title";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: m.footer_privacy() }] }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const store = useStore();
  const officer = [store.privacyOfficerName, store.privacyOfficerEmail].filter(Boolean).join(" · ");
  return (
    <Container>
      <PageTitle>{m.footer_privacy()}</PageTitle>
      <LegalDocument
        body={m.privacy_body({
          store: store.name,
          officer: officer || m.legal_contact_fallback(),
          email: store.customerCenterEmail ?? m.legal_contact_fallback(),
        })}
      />
    </Container>
  );
}
