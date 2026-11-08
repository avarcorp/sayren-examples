# 04 디자인 시스템 — 월수금 로스터리

02 브랜드의 색·말투와 03 기획의 화면 목록으로 정했다. 기준 폭은 390px(모바일 먼저), 그다음 768px·1440px.

## 1. 테마 토큰 (`src/theme.css` `@theme`)

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--color-page` | #FFFFFF | 페이지·섹션·카드·헤더 바탕(전부 흰색, 규칙 7) |
| `--color-ink` | #1F1A17 | 본문 글자, 상품명, 판매가 |
| `--color-sub` | #4A423C | 보조 본문(설명 문장) |
| `--color-muted` | #6E645D | 캡션, 정가 취소선, 용량 설명 |
| `--color-line` | #E7E1DB | 구분선, 카드 이미지 테두리 |
| `--color-line-strong` | #CFC6BE | 입력칸·보조 버튼 테두리, 선택 안 된 옵션 칩 테두리 |
| `--color-point` | #5A3A22 | 주요 버튼 바탕, 링크, 선택된 옵션 칩 테두리·글자, 띠 공지 글자 |
| `--color-point-hover` | #452C19 | 주요 버튼 눌림·hover |
| `--color-sale` | #B4442B | 할인율, 품절 배지 글자, 오류 문구 |
| `--color-info` | #2F6B4F | 배송중 상태 글자 |
| `--color-chip` | #FFFFFF | 쓰지 않는 면 토큰도 흰색으로 둔다(바탕색 금지) |
| `--color-point-soft` | #FFFFFF | 같음 |
| `--color-surface` | #FFFFFF | 같음 |
| `--font-sans` | Pretendard Variable, Pretendard, Noto Sans KR, sans-serif | 모든 글자(규칙 8) |
| `--font-display` | `var(--font-sans)` | 제목·로고도 같은 서체 |
| `--radius-card` | 8px | 카드 이미지, 다이얼로그 |
| `--radius-control` | 8px | 버튼, 입력칸, 옵션 칩 |
| `--container-page` | 72rem | 본문 최대 폭 |
| 글자 단차 | caption 12 · meta 13 · body 14 · body-lg 15 · 제목 18/20 | 시작 코드 단차 유지 |

모서리 8px은 「따뜻한 로스터리」 분위기(02 §5)를 각진 0보다 부드럽게 내기 위한 것이다. 그림자·그라데이션·바탕 면은 쓰지 않는다.

## 2. 레이아웃 원칙 (규칙 11)

- 페이지 머리(PageTitle)는 제목 한 줄뿐이다. 설명 줄 자리가 없다.
- 홈은 띠 공지 한 줄 다음 바로 상품 그리드다. 390px 첫 화면(헤더 56px + 띠 공지 36px 아래)에 상품 카드 두 줄째 윗부분까지 보인다. 히어로·소개 섹션 없음.
- 목록·컬렉션·검색: 작은 제목 → 카테고리 칩·정렬 → 그리드. 히어로 없음.
- 그리드: 390px 2열, 768px 3열, 1440px 4열. 카드 간격 12px/16px.
- 상세: 갤러리 → 구매 상자(이름·가격·옵션·담기) 먼저, 긴 설명은 탭 아래.
- 모바일 하단 구매 바(상세·장바구니·주문서): 화면 아래 고정, 높이 64px, 버튼 높이 48px.
- 터치 영역 44px 이상. 긴 상품명은 줄바꿈(`break-words`, `min-w-0`). 가로 넘침 없음.

## 3. 핵심 컴포넌트

| 컴포넌트 | 파일 | 모양 |
|---|---|---|
| SiteHeader | `components/site-header.tsx` | 흰 바탕 56px, 왼쪽 메뉴 버튼(모바일)·로고, 오른쪽 검색·마이·장바구니(수량 배지 point 글자). 1440px은 카테고리 메뉴 가로 노출 |
| AnnouncementBar | `components/announcement-bar.tsx` | 흰 바탕, 아래 1px line, point 글자 13px 한 줄 가운데 |
| Logo | `components/logo.tsx` | Pretendard Bold 「월수금 로스터리」 + point 점 세 개 |
| NavDrawer | `components/nav-drawer.tsx` | 왼쪽 서랍, 흰 바탕, 카테고리·내 메뉴·도움말 링크(44px 행) |
| SiteFooter | `components/site-footer.tsx` | 위 1px line, 링크 묶음, 사업자 정보(`sellerInfoOf`, 있는 항목만), 고객센터 이메일·운영 시간 |
| PageTitle | `components/ui.tsx` | h1 20px bold, 설명 슬롯 없음 |
| Button | `components/ui.tsx` | primary: point 바탕·흰 글자, secondary: 흰 바탕·line-strong 테두리·ink 글자, 높이 48px(작은 것 40px) |
| Chip | `components/ui.tsx` | 흰 바탕, line-strong 테두리, 선택 시 point 테두리 2px·point 글자. 높이 40px |
| ProductCard | `components/product-card.tsx` | 정사각 이미지(line 테두리, 8px), 이름 2줄, 가격(판매가 ink bold·할인율 sale), 배지 하나(품절 또는 무료배송) |
| ProductGrid | `components/product-grid.tsx` | 2/3/4열 그리드 + 빈 상태 문구 |
| FilterBar | `components/filter-bar.tsx` | 카테고리 Chip 가로 스크롤 + 정렬 select |
| Pagination | `components/pagination.tsx` | 이전·번호·다음, 44px 버튼 |
| Gallery | `components/product/gallery.tsx` | 정사각 큰 이미지 + 아래 썸네일 줄, 누르면 확대 |
| PurchaseBox | `components/product/purchase-box.tsx` | 이름·가격·배송 안내 → 「용량」 Chip 묶음(품절 비활성) → 「분쇄도」 Chip 묶음(필수, 미선택 시 sale 오류 한 줄) → 수량 → 합계(서버 값) → 장바구니 담기·바로 구매·찜 |
| StickyBuyBar | `components/product/sticky-buy-bar.tsx` | 390px 하단 고정, 흰 바탕·위 1px line. 상세: 가격 + 「구매하기」 → 구매 시트 열기. 장바구니: 합계 + 「주문하기」 |
| Badge | `components/ui.tsx` | 흰 바탕, 글자·1px 테두리만(품절 sale, 무료배송 point). 현재 페이지 표시도 같은 방식 |
| ProductTabs | `components/product/product-tabs.tsx` | 상세정보·리뷰·문의·판매자 정보 고정 탭(흰 바탕, 선택 탭 point 밑줄) |
| InfoSections | `components/product/info-sections.tsx` | 안내 섹션 아코디언(로스팅·발송, 교환·반품) |
| NoticeTable | `components/product/notice-table.tsx` | 고시 표(라벨·값 2열) |
| ReviewList | `components/product/review-list.tsx` | 평점 요약·정렬·리뷰 카드 |
| InquiryList | `components/product/inquiry-list.tsx` | 문의 목록·비밀글·작성 폼 |
| LineItem | `components/line-item.tsx` | 썸네일·이름·옵션(용량)·입력(분쇄도)·수량·금액 |
| AmountSummary | `components/amount-summary.tsx` | 상품 금액·배송비·할인·적립금·합계(서버 응답 그대로) |
| AddressForm | `components/address-form.tsx` | 우편번호 검색(react-daum-postcode)·주소·받는 분·연락처 |
| FormField | `components/ui.tsx` | 라벨(명사구)·입력칸(48px)·오류 문구(sale) |
| OrderCard | `components/account/order-card.tsx` | 주문 번호·날짜·상태·상품 줄·행동 버튼 |
| AccountLayout | `components/account/account-layout.tsx` | 마이페이지 메뉴(쇼핑·혜택·활동)와 본문 |
| StatusLabel | `components/account/status-label.tsx` | 상태값 명사구(결제 완료·상품 준비·발송·배송완료) |
| EmptyState | `components/ui.tsx` | 해요체 한 문장 + 버튼 하나 |
| PolicyText | `components/policy.tsx` | 약관·개인정보 본문(합니다체, 법률 문서 예외) |

## 4. 화면 × 컴포넌트

| 화면 | 컴포넌트 |
|---|---|
| `/` | SiteHeader, AnnouncementBar, ProductGrid(ProductCard), Chip(카테고리 링크), SiteFooter |
| `/products` | SiteHeader, PageTitle, FilterBar, ProductGrid, Pagination, SiteFooter |
| `/search` | SiteHeader, FormField(검색어), Chip(최근 검색어), ProductGrid, Pagination, EmptyState |
| `/collections` | SiteHeader, PageTitle, ProductCard(기획전 대표 이미지 카드), EmptyState |
| `/collections/$slug` | SiteHeader, PageTitle, ProductGrid, Pagination |
| `/products/$productId` | SiteHeader, Gallery, PurchaseBox, StickyBuyBar, ProductTabs, InfoSections, NoticeTable, ReviewList, InquiryList, ProductGrid(추천) |
| `/cart` | SiteHeader, PageTitle, LineItem, AmountSummary, Button, EmptyState, StickyBuyBar |
| `/checkout` | SiteHeader, PageTitle, FormField, AddressForm, LineItem, AmountSummary, Button |
| `/checkout/return` | SiteHeader, EmptyState(결제 확인 중·실패), Button |
| `/checkout/complete` | SiteHeader, PageTitle, OrderCard, Button |
| `/login` | SiteHeader, PageTitle, FormField, Button |
| `/signup` | SiteHeader, PageTitle, FormField, Button |
| `/auth/callback` | EmptyState(로그인 처리 중) |
| `/account` | AccountLayout, FormField, AddressForm, Button |
| `/orders` | AccountLayout, OrderCard, Pagination, EmptyState |
| `/orders/$orderId` | AccountLayout, OrderCard, LineItem, StatusLabel, AmountSummary, Button(구매확정·반품·교환) |
| `/account/wishlist` | AccountLayout, ProductGrid, EmptyState |
| `/coupons` | AccountLayout, Chip(상태), EmptyState |
| `/points` | AccountLayout, AmountSummary(잔액), EmptyState |
| `/account/reviews` | AccountLayout, LineItem, FormField, Button, EmptyState |
| `/account/inquiries` | AccountLayout, InquiryList, EmptyState |
| `/account/support` | AccountLayout, FormField, Button, EmptyState |
| `/guest-order` | SiteHeader, PageTitle, FormField, OrderCard |
| `/terms` | SiteHeader, PageTitle, PolicyText |
| `/privacy` | SiteHeader, PageTitle, PolicyText |
| `/help` | SiteHeader, PageTitle, InfoSections, PolicyText |

모든 화면은 흰 바탕이고(규칙 7) 글자는 Pretendard다(규칙 8). 공통 셸(SiteHeader·AnnouncementBar·SiteFooter)은 마이페이지 화면에도 있다.

gate: approved
