import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { useEffect } from "react";
import { SiteFooter, type StoreContact } from "../components/site-footer";
import { type NavLink, SiteHeader, type StoreBrand } from "../components/site-header";
import { getLocale, m } from "../i18n";
import { type AnalyticsConfig, startAnalytics } from "../lib/analytics";
import { apiFor } from "../lib/api.server";
import { ANALYTICS_DEBUG, API_BASE_URL, resolveStoreCode } from "../lib/config.server";
import type { Ordering } from "../lib/ordering";
import type { RouterContext } from "../router";
import { siteOrderingOf } from "../site/commerce";
import { siteLayout } from "../site/layout";
import { resolveNav } from "../site/nav";
import { type SellerInfo, sellerInfoOf } from "../site/seller";
import appCss from "../styles.css?url";

/** 방문 분석 설정 — 서버 값(`process.env`)이라 서버 함수로 내려준다 */
const getAnalyticsConfig = createServerFn({ method: "GET" }).handler(
  (): AnalyticsConfig => ({
    apiBaseUrl: API_BASE_URL,
    storeCode: resolveStoreCode(),
    debug: ANALYTICS_DEBUG,
  }),
);

/**
 * 상점 이름·로고 — 셀러가 상점 플랫폼 설정 › 상점 정보에서 정한 값이다. 헤더와 문서 제목에 쓴다.
 * 읽지 못해도 화면은 그린다(각 화면이 자기 데이터로 오류를 보인다).
 * 헤더 메뉴의 카테고리 이름도 여기서 목록 경로로 바꾼다(`src/site/layout.json`의 `header.nav`).
 */
const getStoreBrand = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    brand: StoreBrand | null;
    contact: StoreContact | null;
    ordering: Ordering;
    nav: NavLink[];
    seller: SellerInfo;
  }> => {
    const api = apiFor();
    const [store, nav] = await Promise.all([
      api.store.get().catch(() => null),
      resolveNav(siteLayout.header.nav, () => api.catalog.listCategories()),
    ]);
    return {
      brand: store ? { name: store.name, logoUrl: store.logoUrl } : null,
      contact: store
        ? { phone: store.customerCenterPhone, businessHours: store.businessHours }
        : null,
      // 주문을 받지 않으면(결제 수단 없음 등, 카탈로그형) 장바구니·주문 버튼을 숨긴다 — `site/commerce.ts`
      ordering: siteOrderingOf(store, siteLayout.commerce.mode),
      nav,
      // 사업자 정보 — 상점 정보 API 값이 먼저, 없으면 예시 값(`site/seller.ts` 한 곳)
      seller: sellerInfoOf(store),
    };
  },
);

export interface RootData {
  analytics: AnalyticsConfig;
  store: StoreBrand | null;
  contact: StoreContact | null;
  ordering: Ordering;
  nav: NavLink[];
  seller: SellerInfo;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // 화면마다 `{화면} | {상점 이름}`으로 덮어쓴다(`lib/page-title.ts`). 여기 값은 홈처럼
      // 화면 이름이 없는 곳의 제목이다
      { title: loaderData?.store?.name ?? m.site_store_fallback() },
    ],
    links: [
      // 본문 서체 Pretendard(theme.css의 --font-sans)
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
      },
      { rel: "stylesheet", href: appCss },
      // 확장 지점 — 파비콘은 public/favicon.svg를 바꾼다
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  loader: async (): Promise<RootData> => {
    const [analytics, { brand, contact, ordering, nav, seller }] = await Promise.all([
      getAnalyticsConfig(),
      getStoreBrand(),
    ]);
    return { analytics, store: brand, contact, ordering, nav, seller };
  },
  // 설정은 바뀌지 않는다 — 화면을 옮길 때마다 다시 받지 않는다
  staleTime: Number.POSITIVE_INFINITY,
  shellComponent: RootDocument,
  component: Root,
  errorComponent: RootError,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  // 셸은 오류 화면도 감싼다 — loader가 실패했을 수 있어 값이 없을 때를 함께 다룬다
  const root = useRouterState({
    select: (state) => state.matches[0]?.loaderData as RootData | undefined,
  });
  const store = root?.store ?? null;
  const showCart = root?.ordering.open ?? siteLayout.commerce.mode === "shop";
  return (
    <html lang={getLocale()}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-page text-ink">
        {/* URL 검색 파라미터(목록 검색어·카테고리·정렬·페이지)는 nuqs로 읽고 바꾼다 */}
        <NuqsAdapter>
          {/* 헤더·푸터 모양은 src/site/layout.json의 header·footer다 */}
          <SiteHeader store={store} showCart={showCart} nav={root?.nav} />
          <main className="mx-auto w-full max-w-page px-4 pt-8 pb-16 md:px-10 md:pb-24">
            {children}
          </main>
          {siteLayout.footer ? (
            <SiteFooter
              layout={siteLayout.footer}
              store={store}
              contact={root?.contact ?? null}
              seller={root?.seller ?? null}
              showCart={showCart}
            />
          ) : null}
        </NuqsAdapter>
        <Scripts />
      </body>
    </html>
  );
}

function Root() {
  const { analytics } = Route.useLoaderData();
  // 방문 분석은 브라우저에서 한 번 시작한다. 이후 페이지뷰는 SDK가 History API 이동으로 센다
  useEffect(() => {
    startAnalytics(analytics);
  }, [analytics]);
  return <Outlet />;
}

function RootError({ error }: ErrorComponentProps) {
  return (
    <ErrorView
      title={m.root_error_title()}
      detail={error instanceof Error ? error.message : undefined}
    />
  );
}

function NotFound() {
  return <ErrorView title={m.root_not_found_title()} />;
}

function ErrorView({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="space-y-3 py-16 text-center">
      <h1 className="font-bold text-2xl">{title}</h1>
      {detail ? <p className="text-muted">{detail}</p> : null}
      <Link className="inline-block text-point underline" to="/">
        {m.root_go_home()}
      </Link>
    </div>
  );
}
