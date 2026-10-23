import { useQuery } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckoutHeader } from "../components/organisms/checkout-header";
import { ErrorView, RouteError } from "../components/organisms/error-view";
import { ReconsentDialog } from "../components/organisms/reconsent-dialog";
import { SiteFooter } from "../components/organisms/site-footer";
import { SiteHeader } from "../components/organisms/site-header";
import { updateConsentsFn } from "../lib/account";
import { startAnalytics } from "../lib/analytics";
import { logoutFn } from "../lib/auth";
import { cartQuery } from "../lib/cart";
import { getRootData, type RootData } from "../lib/store";
import type { RouterContext } from "../router";
import { siteContent } from "../site/content";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<RouterContext>()({
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: loaderData?.store?.name ?? "설기로운" },
      { name: "theme-color", content: "#ffffff" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@300;400;500;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  // context 타입을 적어 둔다 — 추론에 맡기면 라우트 트리 타입이 루트 loader를 거쳐 순환한다
  loader: async ({ context }: { context: RouterContext }): Promise<RootData> => {
    // 헤더의 장바구니 수 — 캐시에 받아 두고 헤더가 읽는다(못 받으면 수를 숨긴다)
    const [root] = await Promise.all([
      getRootData(),
      context.queryClient.ensureQueryData(cartQuery()).catch(() => null),
    ]);
    return root;
  },
  // 상점 정보·카테고리는 화면을 옮길 때마다 다시 받지 않는다
  staleTime: Number.POSITIVE_INFINITY,
  shellComponent: RootDocument,
  component: Root,
  errorComponent: RouteError,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  // 셸은 오류 화면도 감싼다 — loader가 실패했을 때를 함께 다룬다
  const root = useRouterState({
    select: (s) => s.matches[0]?.loaderData as RootData | undefined,
  });
  // 주문 단계 화면이면 단계 헤더만 둔다(띠·메뉴·푸터 없음)
  const checkoutStep = useRouterState({
    select: (s) => s.matches.findLast((m) => m.staticData.checkoutStep)?.staticData.checkoutStep,
  });
  const bare = useRouterState({ select: (s) => s.matches.some((m) => m.staticData.bare) });
  const store = root?.store ?? null;
  const ordering = store?.checkoutAvailable ?? true;
  // 루트 loader가 캐시에 받아 둔 장바구니 — 담기·삭제 뒤 무효화되면 다시 받는다
  const { data: cart } = useQuery({ ...cartQuery(), enabled: ordering });
  return (
    <html lang="ko">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-page text-ink">
        {bare ? null : checkoutStep ? (
          <CheckoutHeader storeName={store?.name ?? "설기로운"} step={checkoutStep} />
        ) : (
          <>
            {store && !store.checkoutAvailable ? (
              <p className="bg-ink px-4 py-2 text-center text-caption text-white">
                지금은 주문을 받지 않습니다.
                {store.customerCenterPhone
                  ? ` 문의는 고객센터 ${store.customerCenterPhone}로 연락하십시오.`
                  : ""}
              </p>
            ) : (
              <p className="bg-primary px-4 py-2 text-center text-caption text-white">
                {siteContent.promoBand}
              </p>
            )}
            <SiteHeader
              storeName={store?.name ?? "설기로운"}
              categories={root?.categories ?? []}
              showCollections={root?.hasCollections ?? false}
              cartCount={ordering ? (cart?.cart?.items.length ?? 0) : null}
            />
          </>
        )}
        <main className="mx-auto w-full max-w-page px-4 md:px-10">{children}</main>
        {checkoutStep || bare ? null : <SiteFooter store={store} />}
        <Scripts />
      </body>
    </html>
  );
}

function Root() {
  const { analytics, reconsent } = Route.useLoaderData();
  const router = useRouter();
  useEffect(() => {
    void startAnalytics(analytics);
  }, [analytics]);
  return (
    <>
      <Outlet />
      {reconsent ? (
        <ReconsentDialog
          consents={reconsent}
          onSubmit={async (marketing) => {
            const { error } = await updateConsentsFn({ data: { marketing } });
            if (!error) await router.invalidate();
            return error;
          }}
          onLogout={() => {
            void logoutFn().then(() => window.location.assign("/"));
          }}
        />
      ) : null}
    </>
  );
}

function NotFound() {
  return <ErrorView title="찾는 화면이 없습니다" message="주소를 다시 확인하십시오." />;
}
