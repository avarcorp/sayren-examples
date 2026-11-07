import { createFileRoute } from "@tanstack/react-router";
import { PolicyDocument } from "../components/policy";
import { InfoRows } from "../components/ui";
import { useStore } from "../hooks/use-catalog";
import { m } from "../i18n";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  const store = useStore();
  const officer = [
    ...(store.privacyOfficerName
      ? [{ label: m.seller_privacyOfficerName(), value: store.privacyOfficerName }]
      : []),
    ...(store.privacyOfficerEmail
      ? [{ label: m.seller_privacyOfficerEmail(), value: store.privacyOfficerEmail }]
      : []),
    ...(store.customerCenterEmail
      ? [{ label: m.privacy_contact(), value: store.customerCenterEmail }]
      : []),
  ];
  return (
    <PolicyDocument
      title={m.privacy_title()}
      sections={[
        { title: m.privacy_1_title(), body: m.privacy_1_body() },
        { title: m.privacy_2_title(), body: m.privacy_2_body() },
        { title: m.privacy_3_title(), body: m.privacy_3_body() },
        { title: m.privacy_4_title(), body: m.privacy_4_body() },
        { title: m.privacy_5_title(), body: m.privacy_5_body() },
      ]}
      footer={
        officer.length > 0 ? (
          <section className="flex flex-col gap-2">
            <h2 className="font-bold text-body-lg">{m.privacy_6_title()}</h2>
            <InfoRows rows={officer} />
          </section>
        ) : null
      }
    />
  );
}
