import { m } from "../../i18n";
import { TextField } from "../ui";

export interface GuestValue {
  name: string;
  phone: string;
  email: string;
  orderPassword: string;
}

/** 비회원 주문자 정보 — 검증은 SDK `guestInfoSchema`가 한다(`errors`의 `guest.{칸}`) */
export function GuestFields({
  value,
  onChange,
  errors,
}: {
  value: GuestValue;
  onChange: (next: GuestValue) => void;
  errors: Record<string, string>;
}) {
  const set = (patch: Partial<GuestValue>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="co-name"
          label={m.field_name()}
          required
          autoComplete="name"
          value={value.name}
          onChange={(e) => set({ name: e.target.value })}
          error={errors["guest.name"]}
        />
        <TextField
          id="co-phone"
          label={m.field_phone()}
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder={m.field_phone_placeholder()}
          value={value.phone}
          onChange={(e) => set({ phone: e.target.value.replace(/[^\d+]/g, "") })}
          error={errors["guest.phone"]}
        />
      </div>
      <TextField
        id="co-email"
        label={m.field_email()}
        required
        type="email"
        autoComplete="email"
        help={m.checkout_email_notice()}
        value={value.email}
        onChange={(e) => set({ email: e.target.value })}
        error={errors["guest.email"]}
      />
      <TextField
        id="co-password"
        label={m.field_order_password()}
        required
        type="password"
        minLength={6}
        autoComplete="new-password"
        help={m.field_order_password_help()}
        value={value.orderPassword}
        onChange={(e) => set({ orderPassword: e.target.value })}
        error={errors["guest.orderPassword"]}
      />
    </div>
  );
}
