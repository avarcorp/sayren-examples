import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { ButtonLink } from "../components/ui";
import { getLocale, m } from "../i18n";
import { cartQuery, sessionQuery } from "../lib/account-queries";
import { type AnalyticsConfig, startAnalytics } from "../lib/analytics";
import { ANALYTICS_DEBUG, API_BASE_URL, resolveStoreCode } from "../lib/config.server";
import { categoriesQuery, storeQuery } from "../lib/queries";
import type { RouterContext } from "../router";
import appCss from "../styles.css?url";

/**
 * 루트 — 문서 머리, 방문 분석 시작, 공통 셸(헤더·푸터), 오류 화면.
 * 화면 데이터는 `src/lib/queries.ts`·`src/lib/account-queries.ts`의 queryOptions와 `src/hooks`의 훅으로 읽는다.
 */

/** 방문 분석 설정 — 서버 값(`process.env`)이라 서버 함수로 내려준다 */
const getAnalyticsConfig = createServerFn({ method: "GET" }).handler(
  (): AnalyticsConfig => ({
    apiBaseUrl: API_BASE_URL,
    storeCode: resolveStoreCode(),
    debug: ANALYTICS_DEBUG,
  }),
);

export interface RootData {
  analytics: AnalyticsConfig;
  storeName: string | null;
}

/** 공통 셸 데이터(상점·카테고리·세션·장바구니)를 먼저 받아 둔다 — 헤더·푸터가 훅으로 읽는다 */
async function loadRoot(queryClient: QueryClient): Promise<RootData> {
  const [analytics, store] = await Promise.all([
    getAnalyticsConfig(),
    queryClient.ensureQueryData(storeQuery()),
    queryClient.ensureQueryData(categoriesQuery()),
    queryClient.ensureQueryData(sessionQuery()),
    queryClient.ensureQueryData(cartQuery()),
  ]);
  return { analytics, storeName: store.name };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: loaderData?.storeName ?? m.site_store_fallback() },
    ],
    links: [
      // 본문 서체 Pretendard(theme.css의 --font-sans). 다른 서체는 여기에 https 스타일시트로 더한다
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  loader: ({ context }: { context: RouterContext }) => loadRoot(context.queryClient),
  staleTime: Number.POSITIVE_INFINITY,
  shellComponent: RootDocument,
  component: Root,
  errorComponent: RootError,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang={getLocale()}>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-page text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-page focus:p-3 focus:outline-2 focus:outline-point"
        >
          {m.site_skip()}
        </a>
        {children}
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
  return (
    <>
      <SiteHeader />
      <div id="main" className="mx-auto min-h-[60vh] w-full max-w-page px-4 pt-6 lg:pt-10">
        <Outlet />
      </div>
      <SiteFooter />
    </>
  );
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
    <main className="mx-auto flex max-w-page flex-col items-start gap-4 px-4 py-16">
      <h1 className="font-bold text-2xl">{title}</h1>
      {detail ? <p className="text-sub">{detail}</p> : null}
      <ButtonLink to="/" variant="secondary">
        {m.root_go_home()}
      </ButtonLink>
    </main>
  );
}
