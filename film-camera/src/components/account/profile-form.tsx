import type { Member } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useAction } from "../../hooks/use-action";
import { m } from "../../i18n";
import { updateProfile } from "../../lib/account-actions";
import { sessionQuery } from "../../lib/account-queries";
import { Button, Checkbox, ErrorState, SectionTitle, TextField } from "../ui";

/** 회원 정보 — 이름·연락처·마케팅 수신. 이메일은 바꾸지 않는다 */
export function ProfileForm({ member }: { member: Member }) {
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaved(false);
    const result = await run(() =>
      updateProfile({
        data: {
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? "").replace(/\D/g, ""),
          marketingAgreed: form.get("marketing") === "on",
        },
      }),
    );
    if (result.ok) {
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey });
    }
  };

  return (
    <section aria-labelledby="profile" className="flex flex-col gap-4">
      <SectionTitle id="profile">{m.account_profile()}</SectionTitle>
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="me-name"
            name="name"
            label={m.field_name()}
            required
            defaultValue={member.name}
            autoComplete="name"
          />
          <TextField
            id="me-phone"
            name="phone"
            label={m.field_phone()}
            type="tel"
            inputMode="numeric"
            defaultValue={member.phone ?? ""}
            autoComplete="tel"
          />
        </div>
        <TextField id="me-email" label={m.field_email()} value={member.email ?? ""} readOnly />
        <Checkbox
          name="marketing"
          label={m.account_marketing()}
          defaultChecked={member.marketingAgreed}
        />
        {error ? <ErrorState message={error} /> : null}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="secondary" disabled={pending}>
            {m.account_save()}
          </Button>
          <span aria-live="polite" className="text-meta text-sub">
            {saved ? m.common_saved() : null}
          </span>
        </div>
      </form>
    </section>
  );
}
