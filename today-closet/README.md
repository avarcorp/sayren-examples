# 스토어프론트 템플릿 (TanStack Router · TanStack Start SSR)

sayren MCP가 내려 주는 스토어프론트 시작점입니다. 구매 흐름 전체가 이미 붙어 있습니다.

| 화면 | 경로 |
| --- | --- |
| 홈 · 상품 목록·검색 · 상품 상세 | `/`, `/products`, `/products/$productId` |
| 장바구니 · 주문서 | `/cart`, `/checkout` |
| 결제 복귀(다른 결제수단 재시도) · 주문 완료 | `/checkout/return`, `/checkout/complete` |
| 로그인 · 회원가입 · 소셜 로그인 복귀 | `/login`, `/signup`, `/auth/callback` |
| 내 정보(재동의·로그아웃·탈퇴) · 주문 내역 · 주문 상세(취소·반품 신청) | `/account`, `/orders`, `/orders/$orderId` |
| 비회원 주문 조회 | `/guest-order` |

## 시작하기

```bash
npm install
npm run dev
```

pnpm·yarn을 써도 됩니다(`pnpm install`·`pnpm dev`). 개발 서버는 `http://localhost:4010`에서 뜹니다.

설정은 프로젝트 루트의 `.env`에 둡니다. 계정 액세스 토큰(`SAYREN_TOKEN`)과 상점(`SAYREN_STORE_ID`)을 주고 `npx @sayren/mcp create`로 받았다면 이미 채워져 있습니다.
셸에서 준 값이 `.env`보다 우선합니다.

```bash
SAYREN_API_URL=https://api.sayren.app/storefront/v1
SAYREN_STORE_CODE=내_상점_코드
```

| 환경변수 | 뜻 |
| --- | --- |
| `SAYREN_API_URL` | 스토어프론트 API 베이스 |
| `SAYREN_STORE_CODE` | 상점 코드. 상점 플랫폼 설정 › 상점 정보에서 확인합니다. 서브도메인으로 서비스하면 비워 둡니다 |
| `SAYREN_ANALYTICS_DEBUG` | `1`이면 localhost에서도 방문 분석을 보냅니다. 기본은 보내지 않습니다 |

`.env`는 커밋하지 않습니다(`.gitignore`에 있습니다). 액세스 토큰은 `.env`에 두지 않습니다.

토큰을 주고 받았다면 프로젝트 루트에 `.mcp.json`이 있습니다. sayren 원격 MCP(`https://mcp.sayren.app/mcp`) 주소와 상점 id만 든
연결 설정이고 토큰은 들어 있지 않습니다. 이 폴더에서 연 AI 에이전트(Claude Code 등)가 처음 연결할 때 Sayren 계정으로 로그인하고
sayren 도구를 씁니다.

### 호스팅 사이트를 CLI로 고치기

sayren이 호스팅하는 사이트(`{slug}.sayren.co`)는 `sayren` CLI로 소스를 받아 고치고 다시 배포할 수 있습니다. 상점 플랫폼·AI 편집과
같은 작업 트리입니다. `npx sayren login`으로 Sayren 계정에 로그인합니다. 로그인 정보는 프로젝트 폴더가 아니라 사용자 설정 폴더에
저장됩니다. 로그인 대신 Sayren 계정 › 액세스 토큰에서 스코프 `storefront:rw`로 만든 토큰을 `SAYREN_TOKEN`으로 줘도 됩니다.

```bash
npx sayren login                                        # Sayren 계정으로 로그인합니다(사용자 설정 폴더에 저장)
npx sayren pull --project <storeId>                     # 폴더에 받고 .mcp.json·.env·.sayren/state.json을 씁니다
npm install --ignore-scripts && npm run dev             # 로컬에서 확인합니다(설치 스크립트는 돌리지 않습니다)
npx sayren deploy                                       # 검사 → 올리기 → 빌드 → 발행
```

`pull`이 쓰는 파일은 다음과 같습니다. 셋 다 `.gitignore`에 있고 배포에 올리지 않습니다.

| 파일 | 내용 |
| --- | --- |
| `.mcp.json` | sayren 원격 MCP 주소와 상점 id(`X-Store-Id`). 토큰은 없습니다 |
| `.env` | `SAYREN_API_URL`·`SAYREN_STORE_CODE`(개발 서버용) |
| `.sayren/state.json` | 상점·사이트·받은 작업 트리(배포 조건) |

배포는 `src/`·`public/`·루트 설정 파일·`package.json`·`pnpm-lock.yaml`만 올리고 `.env`·`.mcp.json`·`node_modules`·빌드 결과는
올리지 않습니다. 빌드는 서버가 `pnpm-lock.yaml`대로 합니다 — 의존성을
바꾸면 `pnpm install`로 잠금 파일을 함께 갱신합니다.

`npm run build`는 `dist/`에 클라이언트와 서버 번들을 만들고, `npm run start`는 그 결과를 띄워 확인합니다.
운영 배포는 호스팅에 맞는 TanStack Start 배포 설정(Node 서버, Cloudflare Workers, Vercel 등)을 더합니다.

## 구조

| 자리 | 하는 일 |
| --- | --- |
| `src/routes/` | 파일 기반 라우트. 파일 이름이 곧 경로입니다(`products.$productId.tsx` → `/products/:productId`) |
| `src/routeTree.gen.ts` | 라우트 트리. `npm run dev`·`npm run build`가 다시 만듭니다. 손으로 고치지 않습니다 |
| `src/start.ts` | 전역 요청 미들웨어. 서버 함수 CSRF 검사와 구매자 세션 갱신 |
| `src/lib/*.server.ts` | 서버 전용 코드. `process.env`·쿠키·API 클라이언트는 여기에만 둡니다 |
| `public/` | 그대로 서빙하는 파일(파비콘 `favicon.svg`) |

화면 데이터는 라우트 `loader`가 서버 함수(`createServerFn`)를 불러 받습니다. 첫 요청은 서버에서 그리고, 이후 이동은
브라우저가 같은 서버 함수를 호출합니다. 담기·결제 요청·로그인 같은 쓰기도 서버 함수라서 토큰이 브라우저 JS에 나가지 않습니다.

## 기본 라이브러리

| 라이브러리 | 역할 | 쓰는 곳 |
| --- | --- | --- |
| `@tanstack/react-query` · `@tanstack/react-router-ssr-query` | 서버 함수 데이터 캐시. 서버가 채운 캐시를 HTML에 실어 브라우저가 이어 씁니다 | `src/router.tsx`, 상품 목록(`src/lib/catalog-queries.ts`) |
| `nuqs` | URL 상태(검색어·카테고리·정렬·페이지) | 상품 목록(`src/lib/products-search.ts`) |
| `react-hook-form` · `@hookform/resolvers` · `zod` | 폼 입력과 검증 | 회원가입 · 주문서 · 비회원 주문 조회(`src/lib/form-schemas.ts`) |
| `query-string` | 화면 밖(서버 라우트)에서 주소 만들기 | 소셜 로그인 복귀(`src/routes/auth.callback.ts`) |

**데이터(TanStack Query)**: 쿼리는 `queryOptions` 팩토리로 만들고 loader와 화면이 같은 팩토리를 씁니다. loader는
`context.queryClient.ensureQueryData(productsQuery(search))`로 서버에서 미리 받고, 화면은 `useSuspenseQuery(productsQuery(search))`로
캐시에서 읽습니다. `queryFn`은 서버 함수를 부릅니다. `useQuery`만 쓰면 서버 렌더에 데이터가 없어 첫 화면이 빕니다.
주문서(`/checkout`)는 들어올 때마다 주문서를 새로 만들어야 하므로 캐시하지 않고 loader가 서버 함수를 바로 부릅니다.

**URL 상태(nuqs)**: 파서(`productsSearchParams`)가 원천입니다. 라우트 `validateSearch`가 같은 파서로 주소를 읽어 loader에
넘기고, 화면은 `useQueryStates`로 검색어·정렬을 바꿉니다. 기본값(1페이지·추천순)은 주소에서 빠집니다. 페이지 이동처럼
자바스크립트 없이도 동작해야 하는 곳은 링크(`<Link search>`)로 둡니다.

**폼(react-hook-form + zod)**: 입력 규칙은 스토어프론트 SDK 스키마(`signupRequestSchema`·`shippingAddressInputSchema`·
`guestInfoSchema`·`cashReceiptRequestSchema`)를 재사용하고 안내 문구만 붙입니다. 입력 칸은 `src/components/text-field.tsx`를 씁니다.
브라우저 필수 검사(`required`)는 그대로 두어 빈 칸은 브라우저가 먼저 막습니다. 주문서는 결제창을 클릭 시점에 열어야 하므로
제출 핸들러에서 같은 스키마로 먼저 동기 검사한 뒤 `payments.prepareWindow()`를 부릅니다(`form.handleSubmit`은 검증을 기다립니다).

**주소 문자열(query-string)**: 화면 안의 URL 상태는 nuqs와 라우터가 맡습니다. 서버 라우트의 `Location` 헤더처럼 라우터 밖에서
쿼리 문자열을 만들 때만 `queryString.stringifyUrl`을 씁니다.

헤더와 브라우저 탭 제목은 상점 플랫폼 설정 › 상점 정보의 상점 이름·로고(`GET /store`)를 씁니다. 탭 제목은
`{화면} | {상점 이름}`(예: `회원가입 | 나의첫번째몰`)이고 홈은 상점 이름만 씁니다. 형식은 `src/lib/page-title.ts` 한 곳에서 바꿉니다.

## 방문 분석

`src/lib/analytics.ts`가 브라우저에서 방문 분석을 시작합니다. 페이지뷰·체류는 자동으로 세고, 상품 조회·목록 노출·검색은
화면에서 `useTrack`으로 남깁니다. 장바구니·결제·구매는 `src/lib/api.server.ts`가 방문자 쿠키를 API 요청 헤더에 실어
서버가 기록합니다.

**localhost에서는 보내지 않습니다.** 개발 중인 방문이 통계에 섞이지 않게 하려는 기본값입니다. 개발 중에 확인하려면
`SAYREN_ANALYTICS_DEBUG=1`을 줍니다. 배포한 주소에서는 설정 없이 보냅니다.

동의 기본값은 `granted`(바로 수집)입니다. 개인정보를 저장하지 않는 1st-party 쿠키라 국내 쇼핑몰 기준으로 정했습니다.
EU 등 분석 쿠키에 사전 동의가 필요한 지역의 구매자를 받는다면 `src/lib/analytics.ts`의 `consent`를 `"pending"`으로 바꾸고,
쿠키 동의 배너에서 `setConsent("granted" | "denied")`를 부릅니다. 동의 전에는 쿠키를 만들지 않고 이벤트를 모아 두었다가
동의하면 보냅니다.

## 화면 문구

버튼·안내·제목 같은 화면 문구는 `messages/ko.json` 한 곳에 있습니다. 코드에서는 `import { m } from "../i18n"` 뒤 `m.키()`로 부르고,
값의 `{name}` 자리는 인자로 채웁니다(`m.cart_count({ count: 3 })`). 문구를 바꿀 때는 이 파일의 값만 고칩니다.

언어는 요청마다 `?lang=` → 브라우저 언어(`Accept-Language`) → 한국어 순서로 정합니다. 다른 언어를 더하려면 `messages/en.json`을 만들고
`src/i18n/index.ts`의 `LOCALES`·`CATALOGS`에 더합니다. 빠진 키는 한국어 문구로 보입니다.

## 확장 지점

| 자리 | 파일 |
| --- | --- |
| 브랜드 색·서체·본문 폭 | `src/theme.css`의 `@theme` |
| 헤더·전역 내비 | `src/components/site-header.tsx` |
| 파비콘 | `public/favicon.svg` |
| 상품 카드 | `src/components/product-card.tsx` |
| 화면 추가 | `src/routes/`에 파일 추가 |
| 약관 동의 | `src/routes/signup.tsx`(가입 동의)·`src/routes/account.tsx`(동의 상태·재동의)·`src/routes/login.tsx`(소셜 가입 동의) |

이메일·비밀번호 가입은 가입 화면(`/signup`)에서 이용약관·개인정보 수집이용(필수)과 마케팅 수신(선택) 동의를 함께 받습니다.
서버가 가입과 같은 트랜잭션에서 동의 이력을 남깁니다. 가입 화면은 셀러가 이메일·비밀번호 로그인을 켰을 때만 열립니다.

소셜 로그인은 공급자 화면을 거치므로 구매자가 무엇에 동의했는지는 이 앱만 압니다. 이 템플릿은 로그인 화면에서 동의를
받지 않고(기존 회원의 로그인까지 막히지 않게) **가입된 뒤 계정 화면에서 받습니다**. 필수 동의 이력이 없는 구매자는
`GET /me`의 `reconsentRequired`가 `true`이고, 계정 화면의 약관 항목에서 동의하면 이력에 남습니다.
소셜 가입 전에 미리 받으려면 `login.tsx`의 `auth.idp(provider, { redirectUri, agreements })`에 그 값을 넘깁니다
(필수 동의는 `terms`·`privacy`를 함께 보냅니다). 서버가 로그인 흐름에 보관해 두고 계정을 만드는 것과 같은 트랜잭션에서
이력을 남깁니다. 어느 쪽이든 동의하지 않은 구매자가 동의한 것으로 남지는 않습니다.

## 건드리지 않는 편이 좋은 것

- `src/lib/payments.ts`·`src/lib/payment-options.ts`·`src/routes/checkout.return.tsx` — 결제 흐름입니다. 결제 시작은 서버 함수로
  하고(구매자 토큰이 브라우저 JS에 나가지 않습니다), 결제창은 결제 서비스가 그립니다. 주문서는 버튼 클릭 시점에
  `payments.prepareWindow()`로 빈 팝업을 먼저 열고(팝업 차단 회피) `payments.open(start, { window })`으로 결제창을
  띄웁니다. 모바일·팝업 차단은 같은 탭이 결제 서비스로 이동하고 복귀 화면으로 돌아옵니다. 복귀 화면은
  `payments.result()`로 결과를 읽습니다. 결과를 모르면(`PROCESSING`) 실패로 단정하지 않고 결제 상태를 계속 조회합니다.
  다시 결제하게 하면 이중 결제가 납니다. 실패·취소면 주문서가 남겨 둔 결제 옵션으로 `payments.retry()`를 보여 줍니다.
- `src/lib/api.server.ts` — 테넌트 헤더와 토큰 전달 방식입니다. 토큰을 모듈 전역에 담으면 서버 렌더에서
  다른 사용자의 요청에 섞입니다.
- `src/lib/session.server.ts`·`src/start.ts` — 구매자 세션 쿠키와 갱신입니다. 갱신은 요청마다 한 번이고, 같은
  리프레시 토큰의 동시 갱신은 한 번으로 모읍니다. 리프레시 토큰은 한 번 쓰면 폐기되므로 각자 갱신하면 로그아웃됩니다.
  로그아웃은 서버에서 `auth.signOut()`으로 리프레시 토큰을 폐기한 뒤 쿠키를 지웁니다.
- `src/lib/cookies.server.ts` — 서버 쿠키의 이름과 속성입니다. 프로덕션 빌드는 이름에 `__Host-` 접두사를 붙여
  같은 상위 도메인의 다른 사이트가 심은 쿠키로 세션이 바뀌지 않게 합니다. 접두사를 빼거나 `Domain`을 주지 않습니다.
  그래서 빌드 결과는 https(또는 localhost)에서만 로그인·장바구니가 유지됩니다. Safari는 http://localhost의 Secure 쿠키도
  받지 않으므로 `pnpm start`로 확인할 때는 Chrome·Firefox를 쓰거나 https로 띄웁니다.
- loader가 서버 함수로 데이터를 받아 그리는 구조 — 컴포넌트에서 다시 받으면 검색 노출과 첫 화면이 죽습니다.
  TanStack Query를 쓰는 화면도 loader의 `ensureQueryData`를 지우지 않습니다.
- 결제 도메인 — 상점 플랫폼 설정 › 결제의 **결제 도메인**은 선택형 허용 목록입니다. 비워 두면 https 복귀 주소를 모두 받고,
  등록하면 그 도메인에서만 결제가 됩니다. 등록했다면 이 쇼핑몰을 배포한 주소도 넣습니다. 배포 주소는 PG(토스페이먼츠·포트원)
  가맹 정보에도 등록합니다. 테스트 결제는 localhost에서도 됩니다.

## 주의

- 주문서(`/checkout`)는 들어올 때마다 주문서 세션을 새로 만듭니다. 조회 API가 없고, 가격과 재고를
  매번 다시 계산해야 하기 때문입니다.
- 비회원 장바구니는 서버가 발급한 토큰으로만 찾습니다. 쿠키를 지우면 담은 상품이 사라집니다.
- 비회원 주문은 주문번호와 주문서에 적은 연락처·주문 조회 비밀번호로 찾습니다(`/guest-order`). 주문 완료 화면이 주문번호를
  채워 보냅니다. 주문번호마다 10분에 5번까지 확인하고 5번째가 틀리면 30분 동안(하루 15번을 넘으면 그날 끝까지) `429 TOO_MANY_REQUESTS`라서,
  화면은 남은 시간(`details.retryAfterSeconds`)을 분 단위로 안내합니다(`src/lib/guest-order.ts`). 주문이 없는 것과
  연락처·비밀번호가 틀린 것은 같은 `404`입니다.
- 배송비는 배송 묶음마다 한 번 붙습니다. 같은 출고지 + 같은 배송 정책인 상품이 한 묶음이고, 제주·도서산간 추가
  배송비는 묶음마다 더하며 무료배송이어도 부과합니다. 주문서를 만들 때는 배송지를 몰라 주문서의 `delivery.zipCode`가
  null이고 추가 배송비가 0입니다. 주문서(`/checkout`)는 우편번호 입력을 마칠 때(blur) `quoteDelivery` 서버 함수로
  `checkout.quoteDelivery(checkoutId, { zipCode })`를 불러 금액 요약을 갱신합니다(주문서를 바꾸지 않는 읽기 계산입니다).
  **최종 금액은 결제 시작 응답의 `amounts`·`delivery`입니다.** 서버가 결제 시작이 보낸 배송지로 배송비를 다시 계산하므로
  미리보기와 다를 수 있고, 화면은 그 값으로 덮어씁니다.
- 취소·반품은 수량 단위입니다. 주문 상세(`/orders/$orderId`)의 신청 수량 상한은 주문 상품의 `activeQuantity`
  (남은 수량)이고, 접수 결과의 `expectedRefundAmount`는 수량 비율 상품 금액에서 반품 배송비를 뺀 값입니다.
  배송비 환불은 `deliveryFeeRefundAmount`로 따로 옵니다. 교환은 희망 옵션(`exchangeOptionId`)이 필요해 이 화면에
  넣지 않았습니다.
