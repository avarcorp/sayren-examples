import { createFileRoute } from "@tanstack/react-router";
import { PolicySection } from "../components/policy";
import { Container, PageTitle } from "../components/ui";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";

/** 개인정보처리방침 — 보호책임자·연락처는 상점 설정 값(없으면 그 줄을 숨긴다). 본문은 합니다체 */
export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  const store = useStore();
  const name = store.businessName ?? store.name;
  const contact = store.privacyOfficerEmail ?? store.customerCenterEmail;
  return (
    <Container className="flex max-w-3xl flex-col gap-6 pt-5">
      <PageTitle>{m.footer_privacy()}</PageTitle>
      <PolicySection title={m.privacy_1_title()}>
        <p>{m.privacy_1_body({ name })}</p>
      </PolicySection>
      <PolicySection title={m.privacy_2_title()}>
        <p>{m.privacy_2_body()}</p>
      </PolicySection>
      <PolicySection title={m.privacy_3_title()}>
        <p>{m.privacy_3_body()}</p>
      </PolicySection>
      <PolicySection title={m.privacy_4_title()}>
        <p>{m.privacy_4_body()}</p>
      </PolicySection>
      <PolicySection title={m.privacy_5_title()}>
        <p>{m.privacy_5_body()}</p>
      </PolicySection>
      <PolicySection title={m.privacy_6_title()}>
        {store.privacyOfficerName ? (
          <p>{m.privacy_officer({ officer: store.privacyOfficerName })}</p>
        ) : null}
        {contact ? <p>{m.privacy_contact({ contact })}</p> : null}
        <p>{m.privacy_6_body()}</p>
      </PolicySection>
    </Container>
  );
}
