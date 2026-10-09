# sayren examples

이 저장소는 [sayren.app](https://sayren.app)에서 만든 예제 저장소 모음입니다.

예제는 모두 sayren 운영 환경에서 만들었습니다. 게시된 `@sayren/storefront-sdk`와 운영 API(`api.sayren.app`)만 쓰고,
상점 데이터는 sayren MCP로, 사이트 소스는 `sayren` CLI로 다뤘습니다. 템플릿을 받아 실제 쇼핑몰 수준까지 확장하는 과정을 그대로 남겼습니다.

| 폴더 | 예제 | 기반 |
|---|---|---|
| [`today-closet/`](today-closet/) | 오늘의옷장. 여성 의류 쇼핑몰 | 스토어프론트 템플릿 `basic` 0.2.15 |
| [`sayren-apps/order-mail`](https://github.com/avarcorp/sayren-apps/tree/main/order-mail) | 주문 메일 알림. 결제된 주문을 Resend로 알리는 서드파티 앱(별도 저장소 `avarcorp/sayren-apps`) | `@sayren/app` 0.8 · `sayren app` CLI |

## 오늘의옷장 (`today-closet/`)

sayren이 호스팅하는 스토어프론트(`{slug}.sayren.co`)입니다. MCP가 내려 주는 `basic` 템플릿(TanStack Start SSR + Tailwind v4)에서
시작해 상품 상세·리뷰·문의·마이페이지를 국내 의류 쇼핑몰 수준으로 확장했습니다. 결제는 포트원 테스트 키로 연결돼 있어 테스트 결제만 됩니다.

### 상점 구성

| 항목 | 내용 |
|---|---|
| 카테고리 | 아우터·상의·니트·원피스·팬츠·스커트·액세서리 |
| 상품 | 29개. 색상·사이즈 옵션, 옵션별 재고, HTML 상세설명(소재·실측표·세탁·배송/교환) |
| 배송비 | 3,000원, 5만 원 이상 무료(상품별 조건부 무료) |
| 반품·교환 배송비 | 반품 3,000원 · 교환 6,000원 |

상품 등록 요청 본문은 [`data/gen_products.py`](today-closet/data/gen_products.py)가 만들고 MCP `ProductsController_create`로 등록했습니다.
`data/p00~p28.json`이 그 결과입니다. 사업자 정보는 예시 값입니다([`src/site/business.ts`](today-closet/src/site/business.ts)).

### 템플릿에 더한 기능

| 영역 | 내용 | 주요 파일 |
|---|---|---|
| 홈 | `layout.json` 기반 섹션 구성(히어로·혜택·공지·FAQ 등), 상단 띠 공지 | `src/site/layout.json`, `src/site/sections/` |
| 상품 목록·검색 | 기획전(`/collections`), 통합 검색(`/search`), 정렬·필터 칩, 최근 검색어 | `src/routes/collections.*`, `src/components/browse/` |
| 상품 상세 | 갤러리·확대 보기, 단계형 옵션 드롭다운(품절 비활성·키보드 조작), 선택 행·합계, 고정 탭 바, sticky 구매 상자, 모바일 바텀시트, 상품정보 제공고시, 같은 카테고리 추천 | `src/components/product-*.tsx`, `src/components/pdp/`, `src/lib/option-steps.ts` |
| 리뷰 | 평점 분포·포토 리뷰 모음·정렬·필터, 작성·수정(사진 첨부) | `src/components/product-reviews.tsx`, `src/routes/account_.reviews.*` |
| 문의 | 상품 Q&A(비밀글), 1:1 문의(유형·관련 주문 선택) | `src/components/product-inquiries.tsx`, `src/routes/account_.support.*` |
| 혜택 | 쿠폰 받기·주문서 쿠폰 적용, 적립금 조회 | `src/routes/coupons.tsx`, `src/routes/points.tsx`, `src/components/checkout/coupon-sheet.tsx` |
| 주문서 | 단계 표시, 우편번호 검색(Daum), 배송지 목록, 배송 메모, 결제수단 선택 | `src/components/checkout/` |
| 마이페이지 | 탭 메뉴, 주문 내역, 찜, 내 리뷰, 내 문의 | `src/components/mypage/`, `src/routes/account*.tsx` |
| 판매자 정보·정책 | 판매자 정보·반품/교환 안내 아코디언, 이용약관·개인정보처리방침·고객센터 | `src/components/seller-section.tsx`, `src/routes/{terms,privacy,help}.tsx` |

결제 흐름·구매자 세션·쿠키·API 클라이언트는 템플릿 그대로입니다. 구조와 건드리지 않는 편이 좋은 부분은
[`today-closet/README.md`](today-closet/README.md)(템플릿 안내)를 참고합니다.

### 로컬에서 실행

```bash
cd today-closet
pnpm install
pnpm dev
```

개발 서버는 `http://localhost:4010`에서 뜹니다. 실행에는 `.env`가 필요합니다.

```bash
SAYREN_API_URL=https://api.sayren.app/storefront/v1
SAYREN_STORE_CODE=내_상점_코드
```

자기 상점에 붙이려면 `SAYREN_STORE_CODE`를 자기 상점 코드로 바꿉니다. 상품 id·카테고리는 상점마다 다르므로 홈 섹션과 내비가
비어 보이면 `src/site/layout.json`을 자기 상점에 맞게 고칩니다.

### 검사

```bash
pnpm typecheck && pnpm test && pnpm build
```

`npx sayren verify`는 호스팅 규칙을 검사합니다. 서버 전용 코드가 브라우저 번들에 섞이는 경우는 `verify`가 잡지 못하므로 배포 전에 `pnpm build`를 함께 돌립니다.

### 호스팅 사이트에 배포

```bash
npx sayren login
npx sayren pull --project <storeId>
npx sayren deploy
```

`deploy`는 `src/`·`public/`·루트 설정 파일·`package.json`·`pnpm-lock.yaml`만 올리고 서버가 잠금 파일대로 빌드합니다.
자세한 절차는 [`today-closet/README.md`](today-closet/README.md#호스팅-사이트를-cli로-고치기)에 있습니다.

## 저장소 규칙

- 예제마다 독립 프로젝트입니다. 잠금 파일·`node_modules`를 자기 폴더에 두고, 그 폴더에서 `pnpm install`을 실행합니다.
- 루트 `pnpm-workspace.yaml`은 상위 저장소의 pnpm이 이 폴더를 자기 워크스페이스로 잡지 않게 끊는 경계입니다.
- `.env`·`.mcp.json`·`.sayren/`은 커밋하지 않습니다. 토큰은 저장소에 두지 않습니다.

## 커밋 규칙

저장소 루트에서 `pnpm install`을 한 번 실행하면 husky 훅이 설치됩니다. 루트 설치는 biome·commitlint·husky만 받습니다.

| 훅 | 동작 |
|---|---|
| `pre-commit` | 스테이징한 파일에 `biome check --write`를 실행하고 고친 내용을 다시 스테이징합니다. 자동으로 못 고치는 오류가 있으면 커밋을 멈춥니다 |
| `commit-msg` | commitlint(Conventional Commits). `type(scope): 제목`, 헤더 100자. scope는 예제 폴더 이름입니다(`feat(today-closet): 리뷰 정렬 추가`) |

전체를 한 번에 고칠 때는 루트에서 `pnpm check`를 실행합니다.

예제의 `biome.json`은 `root: false`인 독립 설정입니다. 루트 설정을 `extends`하지 않으므로 예제 폴더만 꺼내거나 `sayren deploy`로 올려도
자기 설정으로 동작합니다. 새 예제를 추가하면 그 `biome.json`의 `root`를 `false`로 바꿉니다.
