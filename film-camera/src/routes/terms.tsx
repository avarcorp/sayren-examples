import { createFileRoute } from "@tanstack/react-router";
import { PolicyDocument } from "../components/policy";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  const store = useStore();
  const contact = [store.customerCenterPhone, store.customerCenterEmail]
    .filter(Boolean)
    .join(" · ");
  return (
    <PolicyDocument
      title={m.terms_title()}
      sections={[
        { title: m.terms_1_title(), body: m.terms_1_body({ store: store.name }) },
        { title: m.terms_2_title(), body: m.terms_2_body() },
        { title: m.terms_3_title(), body: m.terms_3_body() },
        { title: m.terms_4_title(), body: m.terms_4_body() },
        { title: m.terms_5_title(), body: m.terms_5_body() },
        { title: m.terms_6_title(), body: m.terms_6_body() },
        { title: m.terms_7_title(), body: m.terms_7_body({ contact }) },
      ]}
    />
  );
}
