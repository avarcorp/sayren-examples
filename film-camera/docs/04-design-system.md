# 04 디자인 시스템

근거: `02-brand.md`(이름·말투·색·로고), `03-plan.md`(화면 P1–P27).

## 원칙

- 기억에 남는 요소 하나: **점검 기록표**. 정비 기록지처럼 가는 선으로 나눈 표에 항목·결과를 적고, 통과 항목 앞에 로고와 같은 「테두리 정사각형 + 점」 표시를 둔다. 상세의 점검표와 구매 상자의 「점검 완료」 줄이 이 모양이다.
- 나머지는 조용하게 둔다. 바탕은 흰색 하나, 장식 그림자·그라데이션·둥근 카드·입장 애니메이션 없음. 구분은 1px 선으로만 한다.
- 정렬축은 왼쪽. 간격 단위 4px(4·8·12·16·24·32·48·64).
- 모든 상품에 사진(대표 1장 + 추가 1장 이상)을 둔다(rule 17). 판매자 사진이 생기기 전에는 기종이 같은 공개 사진을 쓰고 출처는 `docs/image-credits.md`에 둔다.
- 사진 칸은 카드·상세 모두 4:3이다. 카메라 사진이 가로로 길어 세로 칸이면 본체 양옆이 잘린다.
- 사진을 불러오지 못하면 얇은 테두리 칸 가운데 작은 카메라 기호(muted)만 둔다. 이름을 사진 자리에 크게 쓰지 않는다(카드 아래에 이미 있다).

## 배치 (rule 11, 상품 먼저)

- 홈은 상품 그리드로 시작한다. 390px 첫 화면에 상품 카드가 보인다. 히어로·소개 문단·버튼 묶음을 두지 않는다. 상품 아래에는 등급별 모음 링크만 둔다. 점검·보증·질문은 상품 상세와 `/help`에 있다.
- 목록·모음·검색 화면은 작은 제목(설명 줄 없음), 필터·정렬, 그리드 순이다.
- `PageHeader`는 제목만 둔다. 모든 화면에 설명 줄이 없다.
- 상품 상세는 구매 상자(이름·가격·구매)가 먼저고, 긴 설명은 상세정보 탭과 안내 섹션에 있다.

## 테마 토큰 (`src/theme.css` `@theme`)

배경은 흰색 하나다(rule 7). `chip`·`surface`·`point-soft`는 기존 화면 코드가 쓰는 이름이라 남기되 값은 흰색으로 둔다. 선택·강조는 테두리로 표시한다.

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--color-page` | `#ffffff` | 페이지 바탕 |
| `--color-ink` | `#161616` | 본문, 가격, 제목 |
| `--color-sub` | `#555555` | 보조 본문 |
| `--color-muted` | `#767676` | 캡션, 판매 완료 |
| `--color-line` | `#e5e5e5` | 구분선, 카드 테두리 |
| `--color-line-strong` | `#cfcfcf` | 입력·보조 버튼 테두리 |
| `--color-chip` | `#ffffff` | (흰색 고정) |
| `--color-surface` | `#ffffff` | (흰색 고정) |
| `--color-point` | `#d9531e` | A급 배지 테두리, 점검 통과 점, 선택 테두리, 포커스 링 |
| `--color-point-strong` | `#b8441a` | 주 버튼 바탕(흰 글자), 링크·강조 글자, A급 배지 글자 |
| `--color-point-soft` | `#ffffff` | (흰색 고정) |
| `--color-info` | `#2563eb` | 배송중 상태 글자 |
| `--color-danger` | `#c62828` | 오류 글자 |
| `--font-sans` | Pretendard Variable | 모든 글자(rule 8) |
| `--font-display` | `var(--font-sans)` | 같은 값 유지 |
| `--radius-card` | `0` | 카드·표 |
| `--radius-control` | `2px` | 버튼·입력 |
| `--container-page` | `72rem` | 본문 최대 폭 |

글자 단차(본문 14px 기준 1.25배): caption 12, meta 13, body 14, body-lg 15, `text-lg` 18, `text-xl` 20, `text-2xl` 24, `text-3xl` 30.
제목 굵기 700, 자간 -0.02em. 본문 400, 줄 길이 최대 40자(`max-w-[40em]`). 숫자는 `.tabular`.

## 핵심 컴포넌트 (`src/components/`)

| 컴포넌트 | 모양·규칙 |
|---|---|
| `SiteHeader` | 띠 공지 1줄(「구매 후 6개월 무상 수리」), 글자 로고, 카테고리 메뉴(데스크톱), 검색·마이·장바구니 아이콘(44px 터치). 모바일은 메뉴 버튼 → `NavDrawer` |
| `NavDrawer` | 왼쪽 서랍. 카테고리, 등급 모음, 내 메뉴, 고객센터 |
| `SiteFooter` | 고객센터(운영 시간·이메일), 링크(이용약관·개인정보처리방침·고객센터·1:1 문의·비회원 주문 조회), 사업자 정보 `sellerInfoOf`(정한 항목만) |
| `Logo` | 「테두리 정사각형 + 점」 + 「셔터점검소」 Pretendard Bold 18px |
| `CheckMark` | 테두리 1.5px `point` 정사각형 + 가운데 점. 점검 통과 표시. 크기 12·16px |
| `GradeBadge` | A급: `point` 테두리 + `point-strong` 글자. B급: `ink` 테두리 + `ink` 글자. 높이 22px, 글자 12px 700 |
| `SoldOutLabel` | `muted` 글자 「판매 완료」. 카드 위에 겹치지 않고 가격 줄을 대신한다 |
| `ProductCard` | 4:3 사진, 불러오지 못하면 `TypeCover`. 아래로 등급 배지, 상품명(2줄 줄바꿈), 가격(`priceViewOf`), 판매 완료면 `SoldOutLabel`. 그림자·둥근 모서리 없음 |
| `TypeCover` | 사진을 불러오지 못했거나 없을 때의 자리. 카드·상세 사진 칸 4:3, 상세는 모바일 높이 64px 띠(이름·가격·구매 버튼이 첫 화면 위쪽에 오게)와 데스크톱 4:3. 흰 칸 + `line` 테두리, 가운데 카메라 기호 22px `muted`. 글자 없음 |
| `InspectionTable` | 점검 기록표. 상세설명 HTML의 표를 이 모양으로 그린다(`.description table` 스타일): 위아래 `ink` 1px, 행 사이 `line`, 1열 항목 굵게 |
| `Price` | `priceViewOf` 결과. 낼 가격 `ink` 700, 취소선 가격 `muted`(있을 때만) |
| `DeliveryNotice` | `deliveryNoticeOf` 결과 한 줄 |
| `Button` | primary: `point-strong` 바탕 흰 글자. secondary: 흰 바탕 `line-strong` 테두리 `ink` 글자. text: 밑줄 링크. 높이 48px(모바일)·44px, 비활성은 `muted` 테두리·글자 |
| `StickyBuyBar` | 상세·장바구니·주문서 하단 고정(모바일). 흰 바탕 + 위 `line` 테두리, 가격 + 주 버튼. 안전 영역 여백 |
| `TextField` · `Select` · `Textarea` · `Checkbox` | 높이 48px, `line-strong` 테두리, 포커스 `point` 2px 링, 오류 `danger` 글자 |
| `FilterChips` | 카테고리·정렬 칩. 선택은 `ink` 테두리 + 700, 미선택 `line` 테두리 |
| `Tabs` | 상세 고정 탭 바. 선택 탭 아래 `ink` 2px 선 |
| `Accordion` | 판매자 정보·반품/교환 안내. 행 사이 `line` |
| `InfoSectionBlock` | 안내 섹션(`infoSections[].title·body`) 제목 + 정화 HTML |
| `NoticeTable` | 상품정보제공 고시 `notice.fields` 2열 표, null이면 숨김 |
| `ReviewList` · `InquiryList` | 요약(평점·개수), 목록, 빈 상태. 문의는 작성 폼 포함 |
| `PageHeader` | 페이지 제목 20px 700만. 설명 줄 없음 |
| `EmptyState` | 문장 한 줄 + 보조 버튼. 그림 없음 |
| `ErrorState` | 오류 문장 + 다시 시도 |
| `AmountSummary` | 상품 금액·배송비·할인·합계 행. 값은 응답 그대로 |
| `OrderCard` · `StatusLabel` | 주문 번호(`formatOrderNo`)·날짜·상품 줄·단계. 배송중은 `info` 글자 |
| `AddressForm` | 우편번호 검색(`react-daum-postcode`) + 주소·상세 주소·받는 사람·연락처·배송 메모 |
| `AccountMenu` | 마이페이지 메뉴 묶음: 쇼핑(주문 내역·찜) / 혜택(쿠폰·적립금) / 활동(리뷰·상품 문의·1:1 문의) |
| `Pagination` | 이전·다음 + 쪽 번호, 44px 터치 |
| `Sheet` | 모바일 하단 시트(구매 확인·클레임 신청) |

## 화면 × 컴포넌트

공통 셸(`SiteHeader`·`NavDrawer`·`SiteFooter`·`Logo`)은 P2–P27 모든 화면에 있다. 아래는 화면마다 더 쓰는 컴포넌트다.

| # | 화면 | 컴포넌트 |
|---|---|---|
| P1 | 공통 셸 | `SiteHeader`, `NavDrawer`, `SiteFooter`, `Logo` |
| P2 | `/` 홈 | `ProductCard`·`TypeCover`·`GradeBadge`·`Price`(첫 화면 그리드), `GradeBadge`(등급별 모음 링크), `EmptyState` |
| P3 | `/products` | `PageHeader`, `FilterChips`, `ProductCard`, `Pagination`, `EmptyState` |
| P4 | `/search` | `TextField`, `FilterChips`(최근 검색어), `ProductCard`, `EmptyState` |
| P5 | `/collections` | `PageHeader`, `GradeBadge`, `Button`(text), `EmptyState` |
| P6 | `/collections/$slug` | `PageHeader`, `ProductCard`, `EmptyState` |
| P7 | `/products/$productId` | `Gallery`(4:3 사진 + 썸네일), `TypeCover`(사진을 불러오지 못할 때), `GradeBadge`, `Price`, `DeliveryNotice`, `CheckMark`, `Tabs`, `InspectionTable`, `InfoSectionBlock`, `NoticeTable`, `ReviewList`, `InquiryList`, `Accordion`, `ProductCard`(추천), `StickyBuyBar`, `Button`, `SoldOutLabel` |
| P8 | `/cart` | `PageHeader`, `ProductCard`(줄 형태), `AmountSummary`, `StickyBuyBar`, `EmptyState` |
| P9 | `/checkout` | `PageHeader`, `TextField`, `Checkbox`, `AddressForm`, `AmountSummary`, `StickyBuyBar`, `ErrorState` |
| P10 | `/checkout/return` | `PageHeader`, `Button`, `ErrorState` |
| P11 | `/checkout/complete` | `PageHeader`, `CheckMark`, `OrderCard`, `Button` |
| P12 | `/login` | `PageHeader`, `TextField`, `Button`, `ErrorState` |
| P13 | `/signup` | `PageHeader`, `TextField`, `Checkbox`, `Button`, `ErrorState` |
| P14 | `/auth/callback` | `PageHeader`, `ErrorState` |
| P15 | `/account` | `PageHeader`, `AccountMenu`, `TextField`, `Checkbox`, `AddressForm`, `Button` |
| P16 | `/orders` | `PageHeader`, `AccountMenu`, `OrderCard`, `StatusLabel`, `Pagination`, `EmptyState` |
| P17 | `/orders/$orderId` | `PageHeader`, `OrderCard`, `StatusLabel`, `AmountSummary`, `Button`, `Sheet`, `Select`, `Textarea` |
| P18 | `/account/wishlist` | `PageHeader`, `AccountMenu`, `ProductCard`, `EmptyState` |
| P19 | `/coupons` | `PageHeader`, `AccountMenu`, `EmptyState`, `Button` |
| P20 | `/points` | `PageHeader`, `AccountMenu`, `AmountSummary`, `EmptyState` |
| P21 | `/account/reviews` | `PageHeader`, `AccountMenu`, `ReviewList`, `Textarea`, `Button`, `EmptyState` |
| P22 | `/account/inquiries` | `PageHeader`, `AccountMenu`, `InquiryList`, `EmptyState` |
| P23 | `/account/support` | `PageHeader`, `AccountMenu`, `TextField`, `Select`, `Textarea`, `Button`, `EmptyState` |
| P24 | `/guest-order` | `PageHeader`, `TextField`, `Button`, `OrderCard`, `StatusLabel`, `AmountSummary`, `ErrorState` |
| P25 | `/terms` | `PageHeader`, `InfoSectionBlock` |
| P26 | `/privacy` | `PageHeader`, `InfoSectionBlock` |
| P27 | `/help` | `PageHeader`, `Accordion`, `InfoSectionBlock`, `Button` |

## 반응형

390px 기준으로 먼저 그린다. 카드 그리드 2열(390), 3열(768), 4열(1440). 상세는 390·768 한 열, 1440에서 갤러리·구매 상자 두 열(구매 상자 sticky).
하단 구매 바는 1024px 미만에서만 보인다. 터치 대상 44px 이상, 가로 넘침 없음, 긴 기종명은 줄바꿈(`break-words`, `min-w-0`).
`prefers-reduced-motion`에서는 서랍·시트 전환을 끈다.

gate: approved
