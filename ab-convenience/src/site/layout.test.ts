import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveLayout } from "./layout";
import {
  isInternalPath,
  layoutJsonSchema,
  SECTION_TYPES,
  siteLayoutSchema,
  strictLayoutProblems,
} from "./layout-schema";
import { layoutFileProblems } from "./vite-plugin";

const here = import.meta.dirname;
const read = (name: string) => readFileSync(join(here, name), "utf8");

describe("레이아웃 설정", () => {
  it("기본 템플릿 설정이 엄격 검사를 통과한다", () => {
    expect(layoutFileProblems(read("layout.json"))).toEqual([]);
  });

  it("layout.schema.json이 스키마에서 생성한 것과 같다(pnpm layout:schema)", () => {
    const generated = `${JSON.stringify(layoutJsonSchema(), null, 2)}\n`;
    if (import.meta.env.VITE_WRITE_LAYOUT_SCHEMA === "1")
      writeFileSync(join(here, "layout.schema.json"), generated);
    // 포맷(biome)과 무관하게 값으로 비교한다
    expect(JSON.parse(read("layout.schema.json"))).toEqual(JSON.parse(generated));
  });

  it("테마가 덮는 layout.json도 엄격 검사를 통과한다(templates/themes/*)", () => {
    // 저장소 밖(셀러가 받은 폴더)에서는 테마 디렉터리가 없다 — 있을 때만 본다
    const themes = join(here, "..", "..", "..", "themes");
    if (!existsSync(themes)) return;
    for (const id of readdirSync(themes)) {
      const file = join(themes, id, "src", "site", "layout.json");
      if (!existsSync(file)) continue;
      expect(layoutFileProblems(readFileSync(file, "utf8")), id).toEqual([]);
    }
  });

  it("섹션 타입은 13개다", () => {
    expect(SECTION_TYPES).toHaveLength(13);
  });

  it("사이트 안 경로만 링크로 받는다", () => {
    for (const ok of [
      "/",
      "/products",
      "/products?categoryId=c1",
      "/products/p1",
      "/guest-order",
    ]) {
      expect(isInternalPath(ok), ok).toBe(true);
    }
    for (const bad of [
      "//evil.com",
      "https://evil.com",
      "/admin",
      "javascript:alert(1)",
      "/cart x",
      "products",
    ]) {
      expect(isInternalPath(bad), bad).toBe(false);
    }
  });

  it("엄격 검사는 경로별 메시지를 낸다", () => {
    const problems = strictLayoutProblems({
      version: 1,
      home: [
        { id: "a", type: "notice", text: "안내" },
        { id: "a", type: "notice", text: "겹침" },
        {
          id: "h",
          type: "hero",
          slides: [{ title: "x", image: "http://insecure.example.com/a.webp" }],
        },
      ],
      list: { card: { showPrice: false } },
    });
    expect(problems.some((line) => line.startsWith("home.1.id"))).toBe(true);
    expect(problems.some((line) => line.startsWith("home.2.slides.0.image"))).toBe(true);
    expect(problems.some((line) => line.startsWith("list.card.showPrice"))).toBe(true);
  });

  it("JSON 문법 오류도 잡는다", () => {
    expect(layoutFileProblems("{ nope")[0]).toMatch(/JSON 문법 오류/);
  });

  it("빈 설정은 기본값으로 채운다(지금 모양)", () => {
    const layout = siteLayoutSchema.parse({ version: 1 });
    expect(layout.header.variant).toBe("classic");
    expect(layout.footer).toBeNull();
    expect(layout.list).toEqual({
      columns: { mobile: 2, desktop: 4 },
      card: { aspect: "square", style: "plain", showRating: true, showPrice: true },
      filters: "top",
    });
    expect(layout.detail.blocks).toEqual(["description"]);
    expect(layout.commerce.mode).toBe("shop");
  });

  it("상세 블록은 겹치지 않고 상품 설명을 뺄 수 없다", () => {
    expect(strictLayoutProblems({ version: 1, detail: { blocks: ["reviews"] } })).not.toEqual([]);
    expect(
      strictLayoutProblems({ version: 1, detail: { blocks: ["description", "description"] } }),
    ).not.toEqual([]);
  });

  it("문구에 HTML·외부 링크를 넣는 필드가 없다(스키마가 모르는 키를 거절한다)", () => {
    expect(
      strictLayoutProblems({
        version: 1,
        home: [{ id: "r", type: "richText", paragraphs: ["a"], html: "<b>" }],
      }),
    ).not.toEqual([]);
    expect(
      strictLayoutProblems({
        version: 1,
        header: { nav: [{ label: "밖", to: "https://evil.com" }] },
      }),
    ).not.toEqual([]);
  });
});

describe("런타임 방어(resolveLayout)", () => {
  it("맞는 설정은 그대로 쓴다", () => {
    const resolved = resolveLayout(JSON.parse(read("layout.json")));
    expect(resolved.problems).toEqual([]);
    expect(resolved.layout.home.map((s) => s.id)).toEqual([
      "main-banner",
      "benefits",
      "categories",
      "new-arrivals",
      "best",
      "meals",
      "drinks",
      "faq",
    ]);
  });

  it("잘못된 섹션만 빼고 나머지는 그린다", () => {
    const { layout, problems } = resolveLayout({
      version: 1,
      home: [
        { id: "ok", type: "notice", text: "안내" },
        { id: "bad", type: "unknownType" },
        { id: "ok", type: "notice", text: "겹침" },
        { id: "grid", type: "productGrid", limit: 999 },
      ],
    });
    expect(layout.home.map((s) => s.id)).toEqual(["ok"]);
    expect(problems.length).toBeGreaterThanOrEqual(3);
  });

  it("헤더·목록·상세가 잘못되면 그 부분만 기본값이다", () => {
    const { layout, problems } = resolveLayout({
      version: 1,
      header: { variant: "floating" },
      list: { filters: "sidebar" },
      detail: { gallery: "3d" },
      commerce: { mode: "catalog" },
    });
    expect(layout.header.variant).toBe("classic");
    expect(layout.list.filters).toBe("sidebar");
    expect(layout.detail.gallery).toBe("stack");
    expect(layout.commerce.mode).toBe("catalog");
    expect(problems.some((line) => line.startsWith("header.variant"))).toBe(true);
  });

  it("설정 파일이 통째로 깨져도 기본 레이아웃이다", () => {
    const { layout } = resolveLayout("not an object");
    expect(layout.header.variant).toBe("classic");
    expect(layout.home).toEqual([]);
  });

  it("주문을 받는 상점에서 가격 숨기기는 되돌린다", () => {
    const { layout } = resolveLayout({
      version: 1,
      home: [],
      list: { card: { showPrice: false } },
    });
    expect(layout.list.card.showPrice).toBe(true);
  });
});
