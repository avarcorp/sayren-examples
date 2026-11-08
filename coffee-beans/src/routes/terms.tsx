import { createFileRoute } from "@tanstack/react-router";
import { PolicySection } from "../components/policy";
import { Container, PageTitle } from "../components/ui";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";

/** 이용약관 — 상점 이름은 상점 설정 값. 본문은 법률 문서의 합니다체 */
export const Route = createFileRoute("/terms")({ component: Terms });

function Terms() {
  const store = useStore();
  const name = store.businessName ?? store.name;
  return (
    <Container className="flex max-w-3xl flex-col gap-6 pt-5">
      <PageTitle>{m.footer_terms()}</PageTitle>
      <PolicySection title={m.terms_1_title()}>
        <p>{m.terms_1_body({ name })}</p>
      </PolicySection>
      <PolicySection title={m.terms_2_title()}>
        <p>{m.terms_2_body()}</p>
      </PolicySection>
      <PolicySection title={m.terms_3_title()}>
        <p>{m.terms_3_body()}</p>
      </PolicySection>
      <PolicySection title={m.terms_4_title()}>
        <p>{m.terms_4_body()}</p>
      </PolicySection>
      <PolicySection title={m.terms_5_title()}>
        <p>{m.terms_5_body()}</p>
      </PolicySection>
      <PolicySection title={m.terms_6_title()}>
        <p>{m.terms_6_body({ name })}</p>
      </PolicySection>
    </Container>
  );
}
