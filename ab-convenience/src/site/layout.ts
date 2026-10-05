import type { z } from "zod";
import layoutJson from "./layout.json";
import {
  commerceSchema,
  detailSchema,
  footerSchema,
  formatIssues,
  headerSchema,
  LAYOUT_FORMAT_VERSION,
  listSchema,
  type Section,
  type SiteLayout,
  sectionSchema,
  siteLayoutSchema,
} from "./layout-schema";

/**
 * 레이아웃 설정 읽기 — 확장 지점: 화면 구성은 `src/site/layout.json`을 고친다(섹션과 변형 목록은 `layout.schema.json`).
 *
 * 설정은 빌드·dev에서 vite 플러그인(`vite-plugin.ts`)이 먼저 검사한다. 여기서는 빌드를 거치지 않은 경우를 막는다 —
 * 잘못된 섹션은 빼고, 헤더·푸터·목록·상세·주문 방식 설정이 잘못되면 기본값을 쓴다. 사이트가 흰 화면이 되지 않게 한다.
 */
export interface ResolvedLayout {
  layout: SiteLayout;
  /** 빼거나 기본값으로 바꾼 곳 — 비면 설정이 그대로 쓰였다 */
  problems: string[];
}

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

function part<S extends z.ZodType>(
  schema: S,
  value: unknown,
  path: string,
  problems: string[],
): z.infer<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  problems.push(...formatIssues(result.error.issues, path).map((line) => `${line} (기본값 사용)`));
  return schema.parse(undefined);
}

export function resolveLayout(input: unknown): ResolvedLayout {
  const strict = siteLayoutSchema.safeParse(input);
  if (strict.success) return { layout: strict.data, problems: [] };

  const problems: string[] = [];
  const raw = record(input);
  if (raw.version !== LAYOUT_FORMAT_VERSION) {
    problems.push(`version: ${LAYOUT_FORMAT_VERSION}이어야 합니다(그대로 읽음)`);
  }
  const commerce = part(commerceSchema.prefault({}), raw.commerce, "commerce", problems);
  const header = part(headerSchema.prefault({}), raw.header, "header", problems);
  const footer = part(footerSchema.nullable().default(null), raw.footer, "footer", problems);
  const list = part(listSchema.prefault({}), raw.list, "list", problems);
  const detail = part(detailSchema.prefault({}), raw.detail, "detail", problems);

  const home: Section[] = [];
  const seen = new Set<string>();
  const sections = Array.isArray(raw.home) ? raw.home : [];
  if (raw.home !== undefined && !Array.isArray(raw.home)) problems.push("home: 배열이 아닙니다");
  sections.slice(0, 30).forEach((value, index) => {
    const result = sectionSchema.safeParse(value);
    if (!result.success) {
      problems.push(...formatIssues(result.error.issues, `home.${index}`).map((l) => `${l} (뺌)`));
      return;
    }
    if (seen.has(result.data.id)) {
      problems.push(`home.${index}.id: 섹션 id가 겹칩니다: ${result.data.id} (뺌)`);
      return;
    }
    seen.add(result.data.id);
    home.push(result.data);
  });

  // 가격 숨기기는 카탈로그형에서만 — 주문을 받는 상점에서 가격이 사라지지 않게 한다
  if (!list.card.showPrice && commerce.mode !== "catalog") {
    list.card.showPrice = true;
    problems.push("list.card.showPrice: 카탈로그형에서만 끌 수 있습니다 (가격 표시)");
  }

  return {
    layout: { version: LAYOUT_FORMAT_VERSION, commerce, header, footer, home, list, detail },
    problems,
  };
}

const resolved = resolveLayout(layoutJson);
if (resolved.problems.length > 0) {
  console.warn(`[layout] src/site/layout.json 설정 오류\n- ${resolved.problems.join("\n- ")}`);
}

/** 이 사이트의 레이아웃 — 빌드에 들어간 `layout.json`을 검사하고 기본값을 채운 값 */
export const siteLayout: SiteLayout = resolved.layout;
