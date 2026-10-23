import { createFileRoute, getRouteApi, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/atoms/button";
import { Checkbox } from "../components/atoms/checkbox";
import { inputClass } from "../components/atoms/text-input";
import { FormField } from "../components/molecules/form-field";
import { SectionTitle } from "../components/molecules/section-title";
import { AccountTitle } from "../components/templates/account-template";
import { updateProfileFn, withdrawFn } from "../lib/account";
import { formatDate } from "../lib/dates";

const accountRoute = getRouteApi("/account");

export const Route = createFileRoute("/account/profile")({
  head: () => ({ meta: [{ title: "회원 정보 | 설기로운" }] }),
  component: Profile,
});

/** 회원 정보 — 이메일(바꿀 수 없음)·가입일, 이름·휴대폰·마케팅 수신 동의 */
function Profile() {
  const { member } = accountRoute.useLoaderData();
  const router = useRouter();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <>
      <AccountTitle title="회원 정보" aside={`${formatDate(member.joinedAt)} 가입`} />
      <form
        className="flex max-w-[480px] flex-col gap-6 border-ink border-t pt-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const name = String(fd.get("name") ?? "").trim();
          const phone = String(fd.get("phone") ?? "").replace(/[^0-9]/g, "");
          if (!name) return setMessage({ ok: false, text: "이름을 입력하십시오." });
          if (phone && !/^01[0-9]{8,9}$/.test(phone))
            return setMessage({ ok: false, text: "휴대폰 번호를 다시 확인하십시오." });
          const r = await updateProfileFn({
            data: { name, phone, marketingAgreed: fd.get("marketing") === "on" },
          });
          setMessage(r.error ? { ok: false, text: r.error } : { ok: true, text: "저장했습니다." });
          if (!r.error) await router.invalidate();
        }}
      >
        <FormField id="pf-email" label="이메일" required hint="이메일은 바꿀 수 없습니다">
          <input id="pf-email" value={member.email ?? ""} disabled className={inputClass} />
        </FormField>
        <FormField id="pf-name" label="이름" required>
          <input
            id="pf-name"
            name="name"
            defaultValue={member.name}
            maxLength={50}
            autoComplete="name"
            className={inputClass}
          />
        </FormField>
        <FormField id="pf-phone" label="휴대폰 번호">
          <input
            id="pf-phone"
            name="phone"
            type="tel"
            defaultValue={member.phone ?? ""}
            autoComplete="tel"
            className={inputClass}
          />
        </FormField>
        <Checkbox name="marketing" defaultChecked={member.marketingAgreed} className="text-body">
          마케팅 정보 수신 동의 <span className="text-muted text-small">선택</span>
        </Checkbox>
        {message ? (
          <p role="status" className={message.ok ? "text-body" : "text-primary text-small"}>
            {message.text}
          </p>
        ) : null}
        <Button type="submit" className="self-start">
          저장
        </Button>
      </form>
      <Withdrawal />
    </>
  );
}

/** 회원 탈퇴 — 끝나지 않은 주문이 있으면 서버가 막는다. 이메일 가입 회원은 비밀번호로 다시 확인한다 */
function Withdrawal() {
  const [open, setOpen] = useState(false);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <section aria-labelledby="withdraw-title" className="flex max-w-[480px] flex-col gap-4">
      <SectionTitle
        id="withdraw-title"
        title="회원 탈퇴"
        action={
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="h-9 text-muted text-small underline underline-offset-[3px]"
          >
            {open ? "접기" : "탈퇴하기"}
          </button>
        }
      />
      {open ? (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const password = String(new FormData(e.currentTarget).get("password") ?? "");
            setBusy(true);
            const r = await withdrawFn({ data: { password: password || undefined } });
            setBusy(false);
            if (r.error) setError(r.error);
            // 로그인 상태가 모든 화면에서 풀리도록 문서째 이동한다
            else window.location.assign("/");
          }}
        >
          <p className="text-body text-prose">
            탈퇴하면 적립금·쿠폰이 사라지고 되돌릴 수 없습니다. 주문 기록은 법에 따라 정한 기간 동안
            보관합니다.
          </p>
          <FormField
            id="wd-password"
            label="비밀번호"
            hint="이메일로 가입했다면 입력합니다. 소셜 가입은 비워 둡니다"
          >
            <input
              id="wd-password"
              name="password"
              type="password"
              autoComplete="current-password"
              aria-describedby="wd-password-msg"
              className={inputClass}
            />
          </FormField>
          <Checkbox
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="text-body"
          >
            안내를 확인했고 탈퇴합니다
          </Checkbox>
          {error ? (
            <p role="alert" className="text-primary text-small">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="outline" disabled={!agree || busy} className="self-start">
            회원 탈퇴
          </Button>
        </form>
      ) : null}
    </section>
  );
}
