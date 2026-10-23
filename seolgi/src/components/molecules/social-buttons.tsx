import type { SocialProvider } from "../../lib/auth";

const STYLE: Record<SocialProvider, { label: string; className: string; mark?: React.ReactNode }> =
  {
    kakao: { label: "카카오로 시작하기", className: "bg-kakao text-kakao-ink" },
    naver: {
      label: "네이버로 시작하기",
      className: "border border-line-strong bg-page",
      mark: (
        <span
          aria-hidden
          className="grid size-4 place-items-center bg-naver font-bold text-micro text-white"
        >
          N
        </span>
      ),
    },
    google: { label: "Google로 시작하기", className: "border border-line-strong bg-page" },
  };

/** 소셜 로그인 버튼 줄 (시안 DLogin) — 상점이 켠 공급자만, 켠 순서대로 */
export function SocialButtons({
  providers,
  pending,
  onStart,
}: {
  providers: SocialProvider[];
  pending: boolean;
  onStart: (provider: SocialProvider) => void;
}) {
  if (providers.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          disabled={pending}
          onClick={() => onStart(p)}
          className={`flex h-13 items-center justify-center gap-2.5 font-medium text-lead disabled:opacity-50 ${STYLE[p].className}`}
        >
          {STYLE[p].mark}
          {STYLE[p].label}
        </button>
      ))}
    </div>
  );
}
