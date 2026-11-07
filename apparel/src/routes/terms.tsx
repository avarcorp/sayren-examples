import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument } from "../components/ui/legal-document";
import { Container, PageTitle } from "../components/ui/page-title";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: m.footer_terms() }] }),
  component: TermsPage,
});

function TermsPage() {
  const store = useStore();
  return (
    <Container>
      <PageTitle>{m.footer_terms()}</PageTitle>
      <LegalDocument
        body={m.terms_body({
          store: store.name,
          email: store.customerCenterEmail ?? m.legal_contact_fallback(),
        })}
      />
    </Container>
  );
}
