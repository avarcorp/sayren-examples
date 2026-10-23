/** 설기로운 심볼(고리에 건 뼈다귀 이름표) — 로고 파일과 같은 도형이다 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="24 56 208 144" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M94.00 104.00L162.00 104.00A32 32 0 1 1 212.65 130.00A32 32 0 1 1 162.00 156.00L94.00 156.00A32 32 0 1 1 43.35 130.00A32 32 0 1 1 94.00 104.00Z"
      />
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M102.00 90.00a26 26 0 1 0 52 0a26 26 0 1 0 -52 0Z M111.00 90.00a17 17 0 1 0 34 0a17 17 0 1 0 -34 0Z"
      />
    </svg>
  );
}
