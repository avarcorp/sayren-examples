export type TagShape = "circle" | "bone" | "heart";

export interface TagMetal {
  face: string;
  edge: string;
  ink: string;
}

const GOLD: TagMetal = {
  face: "var(--color-tag-face)",
  edge: "var(--color-tag-edge)",
  ink: "var(--color-tag-ink)",
};

/**
 * 금속 이름표 그림 — 모양(원형·뼈다귀·하트)과 금속 색, 새길 이름. 홈 소개와 상세 미리보기가 같이 쓴다.
 * 이름이 비면 「이름」 자리 글자를 옅게 보인다.
 */
export function NameTagArt({
  name,
  shape = "circle",
  metal = GOLD,
  className,
}: {
  name: string;
  shape?: TagShape;
  metal?: TagMetal;
  className?: string;
}) {
  const label = name.trim() || "이름";
  const size = [...label].length > 4 ? 28 : 40;
  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      role="img"
      aria-label={`${label} 이름이 새겨진 ${SHAPE_NAME[shape]} 이름표`}
    >
      <circle cx="100" cy="36" r="18" fill="none" stroke="var(--color-tag-ring)" strokeWidth="5" />
      {shape === "circle" ? (
        <>
          <circle cx="100" cy="140" r="84" fill={metal.face} stroke={metal.edge} strokeWidth="3" />
          <circle cx="100" cy="68" r="7" fill="var(--color-tone-cream)" />
        </>
      ) : shape === "bone" ? (
        <>
          <path
            d="M62 104 L138 104 A30 30 0 1 1 168 140 A30 30 0 1 1 138 176 L62 176 A30 30 0 1 1 32 140 A30 30 0 1 1 62 104 Z"
            fill={metal.face}
            stroke={metal.edge}
            strokeWidth="3"
          />
          <path d="M100 54 L100 104" stroke="var(--color-tag-ring)" strokeWidth="5" />
        </>
      ) : (
        <>
          <path
            d="M100 222 C42 180 22 148 22 116 C22 86 46 66 72 66 C88 66 96 76 100 86 C104 76 112 66 128 66 C154 66 178 86 178 116 C178 148 158 180 100 222 Z"
            fill={metal.face}
            stroke={metal.edge}
            strokeWidth="3"
          />
          <circle cx="100" cy="96" r="6" fill="var(--color-tone-cream)" />
        </>
      )}
      <text
        x="100"
        y={shape === "heart" ? 150 : 152}
        textAnchor="middle"
        fontFamily="Jua, sans-serif"
        fontSize={size}
        fill={metal.ink}
        opacity={name.trim() ? 1 : 0.35}
      >
        {label}
      </text>
    </svg>
  );
}

const SHAPE_NAME: Record<TagShape, string> = {
  circle: "원형",
  bone: "뼈다귀 모양",
  heart: "하트 모양",
};
