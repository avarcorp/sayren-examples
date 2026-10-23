import { Link } from "@tanstack/react-router";

/** 오류·없는 화면 — 구매자에게 내부 오류 문구를 보이지 않는다 */
export function ErrorView({
  title,
  message = "잠시 뒤 다시 시도하십시오.",
}: {
  title: string;
  message?: string;
}) {
  return (
    <div className="space-y-3 py-24 text-center">
      <h1 className="font-display text-h2">{title}</h1>
      <p className="text-muted">{message}</p>
      <Link className="inline-block py-2 underline underline-offset-4" to="/">
        홈으로
      </Link>
    </div>
  );
}

export function RouteError() {
  return <ErrorView title="화면을 불러오지 못했습니다" />;
}
