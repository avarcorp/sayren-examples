import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { SiteFooter } from "../components/layout/site-footer";
import { SiteHeader } from "../components/layout/site-header";
import { getLocale, m } from "../i18n";
import { type AnalyticsConfig, startAnalytics } from "../lib/analytics";
import { ANALYTICS_DEBUG, API_BASE_URL, resolveStoreCode } from "../lib/config.server";
import { categoriesQuery, shippingNoticeQuery, storeQuery } from "../lib/queries";
import type { RouterContext } from "../router";
import appCss from "../styles.css?url";

/**
 * 루트 — 문서 머리, 방문 분석 시작, 공통 머리·바닥(상점·카테고리·배송 안내를 루트 loader에서 한 번 받는다), 오류 화면.
 * 화면 데이터는 `src/lib/queries.ts`의 queryOptions와 `src/hooks`의 훅으로 읽는다.
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

/** 루트 데이터 — 머리·바닥이 읽는 상점·카테고리·배송 안내를 한 번에 받아 둔다 */
async function loadRoot({ queryClient }: RouterContext): Promise<RootData> {
  const [analytics, storeName] = await Promise.all([
    getAnalyticsConfig(),
    queryClient.ensureQueryData(storeQuery()).then((store): string => store.name),
    queryClient.ensureQueryData(categoriesQuery()),
    queryClient.ensureQueryData(shippingNoticeQuery()),
  ]);
  return { analytics, storeName };
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
  loader: ({ context }: { context: RouterContext }) => loadRoot(context),
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
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:p-3">
        {m.common_skip_to_content()}
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
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
    <div className="space-y-3 px-4 py-16 text-center">
      <h1 className="font-bold text-2xl">{title}</h1>
      {detail ? <p className="text-muted">{detail}</p> : null}
      <Link className="inline-block underline" to="/">
        {m.root_go_home()}
      </Link>
    </div>
  );
}
