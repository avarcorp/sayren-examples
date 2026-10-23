import type { MemberConsents } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "../atoms/brand-mark";
import { Button } from "../atoms/button";
import { Checkbox } from "../atoms/checkbox";

/**
 * 다시 동의 — 소셜로 처음 가입했거나 약관이 바뀐 회원에게 어느 화면에서든 먼저 띄운다.
 * 필수 두 가지에 동의해야 닫히고, 원하지 않으면 로그아웃한다(닫기 단추 없음, Esc로 닫히지 않음).
 */
export function ReconsentDialog({
  consents,
  onSubmit,
  onLogout,
}: {
  consents: MemberConsents;
  onSubmit: (marketing: boolean) => Promise<string | null>;
  onLogout: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(consents.marketing.agreed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  const doc = (url: string | null, fallback: "/terms" | "/privacy") =>
    url ? (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="ml-auto text-muted underline underline-offset-2"
      >
        보기
      </a>
    ) : (
      <Link
        to={fallback}
        target="_blank"
        className="ml-auto text-muted underline underline-offset-2"
      >
        보기
      </Link>
    );
  return (
    <dialog
      ref={dialog}
      aria-labelledby="reconsent-title"
      onCancel={(e) => e.preventDefault()}
      className="m-auto w-[min(440px,calc(100vw-2rem))] bg-page p-0 backdrop:bg-ink/50"
    >
      <form
        className="flex flex-col gap-5 p-7"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!terms || !privacy) return setError("필수 약관에 동의하십시오.");
          setBusy(true);
          const message = await onSubmit(marketing).catch(() => "동의를 저장하지 못했습니다.");
          setBusy(false);
          setError(message);
        }}
      >
        <BrandMark className="h-10 w-auto self-start text-brand" />
        <h2 id="reconsent-title" className="font-display text-h3">
          약관 동의가 필요합니다
        </h2>
        <p className="text-body text-prose">
          {consents.terms.agreed && consents.privacy.agreed
            ? "약관이 바뀌었습니다. 바뀐 내용을 확인하고 다시 동의하십시오."
            : "쇼핑을 계속하려면 아래 약관에 동의하십시오."}
        </p>
        <fieldset className="flex flex-col border-ink border-t pt-2">
          <legend className="sr-only">약관 동의</legend>
          <Checkbox
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="text-small"
          >
            [필수] 이용약관 동의
            {doc(consents.terms.currentDocumentUrl, "/terms")}
          </Checkbox>
          <Checkbox
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
            className="text-small"
          >
            [필수] 개인정보 수집·이용 동의
            {doc(consents.privacy.currentDocumentUrl, "/privacy")}
          </Checkbox>
          <Checkbox
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="text-small"
          >
            [선택] 마케팅 정보 수신 동의
          </Checkbox>
        </fieldset>
        {error ? (
          <p role="alert" className="text-primary text-small">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" block disabled={busy}>
          동의하고 계속하기
        </Button>
        <button
          type="button"
          onClick={onLogout}
          className="self-center py-2 text-muted text-small underline underline-offset-4"
        >
          동의하지 않고 로그아웃
        </button>
      </form>
    </dialog>
  );
}
