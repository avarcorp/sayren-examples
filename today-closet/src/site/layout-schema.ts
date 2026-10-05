import { z } from "zod";

/**
 * 사이트 레이아웃 설정(`src/site/layout.json`)의 형식 — 이 파일이 유일한 원천이다. 에디터·에이전트용 JSON Schema
 * (`layout.schema.json`)는 여기서 생성한다(`pnpm layout:schema`, 일치는 테스트가 고정).
 *
 * 레이아웃은 배치만 바꾸고 기능을 끄지 않는다. 장바구니·주문 내역·내 정보 링크를 빼는 값은 받지 않는다. 예외는
 * `commerce.mode: "catalog"`로, 주문을 받지 않는 상점(`checkoutAvailable` false)과 같은 화면을 강제한다.
 *
 * 필드는 추가만 한다 — 옛 설정을 새 코드에 붙여도(CLI로 받은 폴더에 새 템플릿 코드를 덮는 경우) 그대로 읽혀야 한다.
 * 문구는 텍스트 노드로만 그린다(HTML 없음). 링크는 사이트 안 경로, 이미지는 https만 받는다.
 */

export const LAYOUT_FORMAT_VERSION = 1;

/** 링크로 가리킬 수 있는 화면 — `/`로 시작하고 이 목록의 경로이거나 그 아래여야 한다 */
export const INTERNAL_ROUTES = [
  "/",
  "/products",
  "/collections",
  "/cart",
  "/orders",
  "/account",
  "/points",
  "/coupons",
  "/guest-order",
  "/login",
  "/signup",
  "/terms",
  "/privacy",
  "/help",
] as const;

export function isInternalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || /[\s\\]/.test(value)) return false;
  const pathname = value.split(/[?#]/)[0] ?? "";
  if (pathname === "/") return true;
  return INTERNAL_ROUTES.some(
    (route) => route !== "/" && (pathname === route || pathname.startsWith(`${route}/`)),
  );
}

/** 글자 수 상한이 있는 한 줄 문구 — 앞뒤 공백은 지운다. `{storeName}`은 상점 이름으로 바뀐다 */
const text = (max: number) => z.string().trim().min(1).max(max);

const internalPath = z
  .string()
  .max(300)
  .refine(isInternalPath, "사이트 안 경로(/products 등)만 쓸 수 있습니다")
  .describe("사이트 안 경로. `/`로 시작하고 /products·/cart·/orders·/account 같은 화면이어야 한다");

const httpsUrl = z
  .url({ protocol: /^https$/, hostname: z.regexes.domain })
  .max(2000)
  .describe("https 이미지 주소");

const idSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,31}$/, "소문자·숫자·하이픈 32자 이하")
  .describe("섹션 id. 설정 안에서 유일하다. 분석 목록 id(`home:{id}`)로 쓴다");

export const linkSchema = z.strictObject({ label: text(20), to: internalPath });

/** 컬렉션 주소(slug) 형식 — 상점 플랫폼 컬렉션 주소와 같다(영문 소문자·숫자·하이픈 64자까지) */
const collectionSlug = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{0,63}$/, "컬렉션 주소(영문 소문자·숫자·하이픈 64자 이하)")
  .describe(
    "컬렉션 주소(slug). 상점 플랫폼 상품 › 컬렉션의 주소다. 상품·순서·정렬은 컬렉션 설정을 따르고, 컬렉션이 없거나 숨김·기간 밖이면 섹션을 숨긴다",
  );

export const productSortValues = [
  "recommend",
  "latest",
  "priceAsc",
  "priceDesc",
  "reviewCount",
  "ratingDesc",
] as const;

/**
 * 섹션이 보일 상품 — 상점과 무관한 형태로 쓴다(템플릿 설정이 어느 상점에서나 돌아야 한다).
 * 카테고리는 이름으로 찾고 없으면 섹션을 숨긴다. `productIds`는 셀러가 고쳐 넣는 용도다.
 * `collection`은 컬렉션 주소로 찾는다(#83) — 셀러가 상점 플랫폼에서 상품을 바꾸면 코드 수정 없이 섹션이 따라간다.
 */
export const productSourceSchema = z.union([
  z.strictObject({
    sort: z.enum(productSortValues).default("recommend"),
    category: text(40).optional().describe("카테고리 이름. 없으면 전체 상품"),
  }),
  z.strictObject({ productIds: z.array(z.string().min(1).max(64)).min(1).max(24) }),
  z.strictObject({ collection: collectionSlug }),
]);

const columnsSchema = z.strictObject({
  mobile: z.union([z.literal(1), z.literal(2)]).default(2),
  desktop: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4),
});

// ─── 홈 섹션 ─────────────────────────────────────────────

const heroSlide = z.strictObject({
  image: httpsUrl.optional(),
  imageAlt: text(80).optional(),
  title: text(60),
  subtitle: text(120).optional(),
  cta: linkSchema.optional(),
});

export const heroSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("hero"),
  variant: z.enum(["fullBleed", "split", "carousel", "textOnly"]).default("fullBleed"),
  slides: z.array(heroSlide).min(1).max(5),
  /** 자동 넘김 — 기본 꺼짐. 구매자가 움직임 줄이기를 켰으면 항상 꺼진다 */
  autoplay: z.boolean().default(false),
});

export const categoryGridSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("categoryGrid"),
  variant: z.enum(["tiles", "circles", "chips"]).default("chips"),
  title: text(40).optional(),
  limit: z.number().int().min(1).max(24).optional().describe("보일 카테고리 수. 없으면 전부"),
  /** 카테고리 이름 → 이미지. 없으면 그 카테고리의 대표 상품 이미지를 쓴다 */
  images: z.record(text(40), httpsUrl).optional(),
});

export const productRailSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("productRail"),
  variant: z.enum(["scroll", "carousel"]).default("scroll"),
  title: text(40).optional(),
  source: productSourceSchema.prefault({}),
  limit: z.number().int().min(1).max(24).default(8),
  moreLink: z.boolean().default(false).describe("목록 화면의 같은 조건으로 가는 「더 보기」 링크"),
});

export const productGridSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("productGrid"),
  title: text(40).optional(),
  source: productSourceSchema.prefault({}),
  limit: z.number().int().min(1).max(24).default(8),
  columns: columnsSchema.prefault({}),
  moreLink: z.boolean().default(false).describe("목록 화면의 같은 조건으로 가는 「더 보기」 링크"),
});

export const productSpotlightSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("productSpotlight"),
  variant: z.enum(["imageLeft", "imageRight", "stacked"]).default("imageLeft"),
  title: text(40).optional(),
  /** 조건에 맞는 첫 상품 하나를 보인다 */
  source: productSourceSchema.prefault({}),
});

const bannerItem = z.strictObject({
  image: httpsUrl,
  imageAlt: text(80).optional(),
  title: text(60),
  subtitle: text(120).optional(),
  to: internalPath.optional(),
});

export const editorialBannerSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("editorialBanner"),
  variant: z.enum(["wide", "twoUp", "threeUp"]).default("wide"),
  items: z.array(bannerItem).min(1).max(3),
});

export const brandStorySectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("brandStory"),
  variant: z.enum(["imageLeft", "imageRight", "textOnly"]).default("imageLeft"),
  image: httpsUrl.optional(),
  imageAlt: text(80).optional(),
  title: text(60),
  paragraphs: z.array(text(600)).min(1).max(3),
  cta: linkSchema.optional(),
});

export const reviewHighlightsSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("reviewHighlights"),
  variant: z.enum(["cards", "quotes"]).default("cards"),
  title: text(40).optional(),
  /** 이 상품들의 공개 후기를 모은다. 실제 후기가 3개 미만이면 섹션을 숨긴다(설정에 후기 문구를 쓰는 필드는 없다) */
  source: productSourceSchema.prefault({ sort: "reviewCount" }),
  limit: z.number().int().min(3).max(12).default(6),
});

export const benefitsSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("benefits"),
  variant: z.enum(["band", "grid"]).default("band"),
  items: z
    .array(z.strictObject({ title: text(30), description: text(80).optional() }))
    .min(1)
    .max(4),
});

export const faqSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("faq"),
  variant: z.enum(["accordion"]).default("accordion"),
  title: text(40).optional(),
  items: z
    .array(z.strictObject({ question: text(120), answer: text(1000) }))
    .min(1)
    .max(20),
});

export const noticeSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("notice"),
  variant: z.enum(["band", "box"]).default("band"),
  text: text(120),
  to: internalPath.optional(),
});

export const contactCtaSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("contactCta"),
  variant: z.enum(["band"]).default("band"),
  title: text(60).optional(),
  description: text(160).optional(),
});

export const richTextSectionSchema = z.strictObject({
  id: idSchema,
  type: z.literal("richText"),
  title: text(60).optional(),
  paragraphs: z.array(text(2000)).min(1).max(10),
});

export const sectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  categoryGridSectionSchema,
  productRailSectionSchema,
  productGridSectionSchema,
  productSpotlightSectionSchema,
  editorialBannerSectionSchema,
  brandStorySectionSchema,
  reviewHighlightsSectionSchema,
  benefitsSectionSchema,
  faqSectionSchema,
  noticeSectionSchema,
  contactCtaSectionSchema,
  richTextSectionSchema,
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;
export type ProductSource = z.infer<typeof productSourceSchema>;

export const SECTION_TYPES = sectionSchema.options.map(
  (option) => option.shape.type.value,
) as SectionType[];

// ─── 헤더·푸터·목록·상세 ─────────────────────────────────

const navItem = z.union([
  linkSchema,
  z.strictObject({ label: text(20), category: text(40).describe("카테고리 이름") }),
]);

export const headerSchema = z.strictObject({
  /** classic: 지금 모양 · centered: 로고 가운데, 메뉴 아래 줄 · minimal: 로고와 아이콘, 메뉴는 서랍 */
  variant: z.enum(["classic", "centered", "minimal"]).default("classic"),
  announcement: z.strictObject({ text: text(80), to: internalPath.optional() }).optional(),
  /** 주요 메뉴. 장바구니·주문 내역·내 정보는 여기에 두지 않아도 늘 보인다 */
  nav: z
    .array(navItem)
    .max(10)
    .default([{ label: "전체 상품", to: "/products" }]),
});

export const footerSchema = z.strictObject({
  variant: z.enum(["simple", "columns", "minimal"]).default("simple"),
  text: text(200).optional(),
  links: z.array(linkSchema).max(12).default([]),
  social: z
    .array(
      z.strictObject({
        kind: z.enum(["instagram", "youtube", "facebook", "x", "blog", "kakao"]),
        url: z.url({ protocol: /^https$/, hostname: z.regexes.domain }).max(500),
      }),
    )
    .max(6)
    .default([]),
});

export const cardSchema = z.strictObject({
  aspect: z.enum(["square", "portrait", "landscape"]).default("square"),
  style: z.enum(["plain", "bordered", "overlay"]).default("plain"),
  showRating: z.boolean().default(true),
  /** false는 카탈로그형(`commerce.mode: "catalog"`)에서만 받는다 */
  showPrice: z.boolean().default(true),
});

export const listSchema = z.strictObject({
  columns: columnsSchema.prefault({}),
  card: cardSchema.prefault({}),
  filters: z.enum(["top", "sidebar", "drawer"]).default("top"),
});

export const DETAIL_BLOCKS = ["description", "reviews", "fulfillment", "inquiry"] as const;

export const detailSchema = z.strictObject({
  gallery: z.enum(["stack", "thumbsLeft", "thumbsBottom", "carousel"]).default("stack"),
  buyBox: z.enum(["sticky", "inline"]).default("inline"),
  /** 모바일 하단 구매 막대 */
  mobileBuyBar: z.boolean().default(false),
  /** 기본 옵션(조합) 고르는 모양. 추가 선택·직접 입력은 늘 같은 모양이다 */
  optionStyle: z.enum(["select", "chips"]).default("select"),
  /**
   * 상품 아래 블록과 순서. 상품 설명은 빠질 수 없고 후기·배송·문의는 템플릿이 고른다
   * (#72 T0 설계는 네 블록 모두 필수였다 — 2026-09-30 결정으로 기존 화면을 바꾸지 않게 바꿨다. 사용자 템플릿 작업 때 재검토)
   */
  blocks: z
    .array(z.enum(DETAIL_BLOCKS))
    .min(1)
    .max(DETAIL_BLOCKS.length)
    .default(["description"])
    .refine((blocks) => new Set(blocks).size === blocks.length, "블록이 겹칩니다")
    .refine(
      (blocks) => blocks.includes("description"),
      "상품 설명(description)은 빠질 수 없습니다",
    ),
});

export const commerceSchema = z.strictObject({
  /** shop: 주문을 받는 쇼핑몰 · catalog: 주문 없이 상품을 소개하고 문의를 받는다 */
  mode: z.enum(["shop", "catalog"]).default("shop"),
});

export const siteLayoutSchema = z
  .strictObject({
    $schema: z.string().optional(),
    version: z.literal(LAYOUT_FORMAT_VERSION),
    commerce: commerceSchema.prefault({}),
    header: headerSchema.prefault({}),
    /** null이면 푸터를 그리지 않는다 */
    footer: footerSchema.nullable().default(null),
    home: z.array(sectionSchema).max(30).default([]),
    list: listSchema.prefault({}),
    detail: detailSchema.prefault({}),
  })
  .superRefine((layout, ctx) => {
    const seen = new Set<string>();
    layout.home.forEach((section, index) => {
      if (seen.has(section.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["home", index, "id"],
          message: `섹션 id가 겹칩니다: ${section.id}`,
        });
      }
      seen.add(section.id);
    });
    if (!layout.list.card.showPrice && layout.commerce.mode !== "catalog") {
      ctx.addIssue({
        code: "custom",
        path: ["list", "card", "showPrice"],
        message: "가격 숨기기는 카탈로그형(commerce.mode: catalog)에서만 쓸 수 있습니다",
      });
    }
  });

export type SiteLayout = z.infer<typeof siteLayoutSchema>;
export type HeaderLayout = z.infer<typeof headerSchema>;
export type FooterLayout = z.infer<typeof footerSchema>;
export type ListLayout = z.infer<typeof listSchema>;
export type CardLayout = z.infer<typeof cardSchema>;
export type DetailLayout = z.infer<typeof detailSchema>;
export type DetailBlock = (typeof DETAIL_BLOCKS)[number];

/** 검사 결과를 `경로: 메시지` 줄로 — 빌드 로그·오류 오버레이·런타임 경고가 같은 모양을 쓴다 */
export function formatIssues(issues: readonly z.core.$ZodIssue[], prefix = ""): string[] {
  return issues.map((issue) => {
    const path = [prefix, ...issue.path.map(String)].filter(Boolean).join(".");
    return `${path || "(최상위)"}: ${issue.message}`;
  });
}

/** 엄격 검사 — 빌드·dev 플러그인이 쓴다. 문제가 없으면 빈 배열 */
export function strictLayoutProblems(input: unknown): string[] {
  const result = siteLayoutSchema.safeParse(input);
  return result.success ? [] : formatIssues(result.error.issues);
}

/** 에디터 자동 완성·에이전트 참고용 JSON Schema — `layout.schema.json`과 같아야 한다 */
export function layoutJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(siteLayoutSchema, { io: "input", unrepresentable: "any" }) as Record<
    string,
    unknown
  >;
}
