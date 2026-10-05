import type { ReactNode } from "react";

/**
 * 페이지 제목 — 데스크톱 24, 모바일 20. 설명은 13 보조 글자.
 */
export function PageTitle({
  children,
  description,
  action,
}: {
  children: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-end justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="break-words font-bold text-xl tracking-tight md:text-2xl">{children}</h1>
        {description ? <p className="text-meta text-sub">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * 섹션 머리 — 제목 18(모바일 16) + 오른쪽 행동. `rule`이면 아래 2px 잉크 선(목록 머리)
 */
export function SectionHeader({
  id,
  title,
  count,
  action,
  rule = false,
}: {
  id?: string;
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  rule?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center justify-between gap-3 ${rule ? "border-ink border-b-2 pb-3" : ""}`}
    >
      <h2 id={id} className="min-w-0 break-words font-bold text-base md:text-lg">
        {title}
        {count != null ? <span className="ml-1.5 font-normal text-muted">{count}</span> : null}
      </h2>
      {action}
    </div>
  );
}

/**
 * 폼·주문서 섹션 카드 — 모바일은 화면 끝까지 닿는 흰 면 + 아래 8px chip 띠, 데스크톱은 흰 카드.
 * 바깥(페이지)이 `bg-chip`일 때 쓴다(주문서).
 */
export function SectionCard({
  title,
  titleId,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  titleId?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={`flex min-w-0 flex-col gap-4 bg-page px-4 py-6 md:gap-5 md:px-8 md:py-8 ${className}`}
    >
      {title ? <SectionHeader id={titleId} title={title} action={action} /> : null}
      {children}
    </section>
  );
}

/** 빈 상태 — 목록이 비었을 때 가운데 정렬 안내 + 선택 행동 */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      {icon ? <span className="text-line-strong">{icon}</span> : null}
      <p className="font-bold text-body-lg">{title}</p>
      {description ? <p className="text-body text-sub">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** 정보 행 목록(dl) — 라벨 열 고정 폭, 값 열은 줄바꿈 허용. 모바일 가로 넘침을 막으려 min-w-0·break-words */
export function InfoList({
  rows,
  labelWidth = "5.5rem",
  className = "",
}: {
  rows: { label: ReactNode; value: ReactNode; key?: string }[];
  labelWidth?: string;
  className?: string;
}) {
  return (
    <dl className={`flex flex-col gap-3 text-body ${className}`}>
      {rows.map((row, index) => (
        <div
          key={row.key ?? index}
          className="grid gap-3"
          style={{ gridTemplateColumns: `${labelWidth} minmax(0,1fr)` }}
        >
          <dt className="text-muted">{row.label}</dt>
          <dd className="min-w-0 break-words">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
