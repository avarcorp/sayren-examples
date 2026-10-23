/** 색 스와치 버튼 — 44px 누름 영역 안의 32px 원. 고르면 primary 테두리 고리 */
export function Swatch({
  name,
  color,
  on,
  disabled,
  onClick,
}: {
  name: string;
  color: string;
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={disabled ? `${name} 품절` : name}
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative grid size-11 place-items-center rounded-full border ${on ? "border-primary" : "border-transparent"} disabled:opacity-40`}
    >
      <span
        className="size-8 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.1)]"
        style={{ background: color }}
      />
      {disabled ? <span aria-hidden className="absolute h-px w-9 rotate-45 bg-ink" /> : null}
    </button>
  );
}
