# 04 디자인 시스템 — 데일리 베이직

## 테마 토큰 (`src/theme.css`)

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-page` | #ffffff | 모든 바탕(규칙 7). 다른 바탕색 토큰을 쓰지 않는다 |
| `--color-ink` | #111111 | 본문, 판매가, 로고 |
| `--color-sub` | #555555 | 보조 본문 |
| `--color-muted` | #767676 | 캡션, 정가 취소선, 비활성 |
| `--color-line` | #e5e5e5 | 구분선, 사진 자리 테두리 |
| `--color-line-strong` | #c9c9c9 | 입력·보조 버튼 테두리 |
| `--color-point` | #1F2A44 | 주요 버튼 면, 링크, 선택 테두리 |
| `--color-point-ink` | #ffffff | 주요 버튼 위 글자 |
| `--color-sale` | #B42318 | 할인율, 오류 글자, 필수 표시 |
| `--color-chip` | #ffffff | 시작 코드 토큰 호환용. 흰색으로 고정해 옅은 면이 생기지 않게 한다 |
| `--color-surface` | #ffffff | 위와 같다 |
| `--font-sans` | Pretendard Variable, Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif | 모든 글자(규칙 8) |
| `--font-display` | `var(--font-sans)` | 제목·로고도 같은 서체 |
| `--radius-card` · `--radius-control` | 0 | 각진 모서리(미니멀) |
| `--container-page` | 80rem | 본문 최대 폭 |
| 글자 단차 | caption 12 · meta 13 · body 14 · body-lg 15 · 제목 18/20/24 | |

간격은 Tailwind 기본(4px 단위)이다. 화면 좌우 여백 16px(390px), 24px(768px 이상).

## 레이아웃 원칙 (규칙 11)

- 페이지 머리말은 제목만 둔다. 설명 줄 자리를 만들지 않는다.
- 홈: 한 줄 이미지 띠(높이 120px 이하, 문구 한 줄) → 상품 그리드 → 카테고리 링크 → 컬렉션 카드. 390px 첫 화면에 상품 카드가 보인다.
- 목록·컬렉션·검색: 작은 제목 → 칩·정렬 → 그리드. 히어로 없음.
- 그리드: 390px 2열, 768px 3열, 1440px 4열. 사진 비율 3:4.

## 핵심 구성 요소

| ID | 구성 요소 | 설명 |
|---|---|---|
| C1 | SiteHeader | 로고(글자), 데스크톱 메뉴(카테고리), 검색·마이·장바구니 아이콘(44px 터치), 모바일 메뉴 버튼 |
| C2 | AnnouncementBar | 띠 공지 한 줄(배송비 조건). 흰 바탕, 아래 테두리 |
| C3 | MobileDrawer | 카테고리·내 메뉴 서랍 |
| C4 | SiteFooter | 링크(약관·개인정보·도움말·1:1 문의), 사업자 정보(`sellerInfoOf`, 값이 있는 항목만) |
| C5 | PageTitle | 제목만 있는 머리말 |
| C6 | ProductCard | 사진 3:4, 상품명, 가격(`priceViewOf`), 배지 최대 1개(품절·무료배송). 사진이 없으면 얇은 테두리 + 작은 상점 이름 |
| C7 | ProductGrid | 2/3/4열 그리드, 빈 상태 |
| C8 | FilterChips · SortSelect | 카테고리 칩(가로 스크롤), 정렬 선택 |
| C9 | Pagination | 이전·다음·번호 |
| C10 | Gallery | 상세 사진 넘김(embla), 썸네일, 확대 보기 |
| C11 | OptionPicker | 색상·사이즈 버튼(`optionChoicesOf` state로 품절·불가 비활성), 선택 테두리 point |
| C12 | QuantityStepper | 수량 −/+ (44px) |
| C13 | PurchaseBox · StickyBuyBar | 상세 구매 상자, 모바일 하단 고정 구매 바 → 구매 시트 |
| C14 | Tabs | 상세정보·리뷰·문의·안내 고정 탭 |
| C15 | InfoTable | 상품정보 고시·사업자 정보 표 |
| C16 | ReviewList · InquiryList | 리뷰 요약·목록, 문의 목록·작성 |
| C17 | Button | primary(point 면, 흰 글자) · secondary(테두리) · text 링크. 높이 48px |
| C18 | TextField · Select · Checkbox | 입력(테두리 line-strong, 포커스 point) |
| C19 | MoneyRow · SummaryBox | 금액 줄과 합계(응답 값 그대로) |
| C20 | EmptyState · ErrorState | 해요체 한두 문장 + 버튼 |
| C21 | AccountNav | 마이페이지 메뉴 묶음(쇼핑·혜택·활동) |
| C22 | OrderCard · StatusBadge | 주문 요약, 상태 명사구 |
| C23 | CollectionCard | 컬렉션 대표 사진 + 제목 |
| C24 | AddressForm | 주소 검색(react-daum-postcode) + 상세 주소 |
| C25 | Dialog · Sheet | 확인 창, 하단 시트 |

## 화면 × 구성 요소

| 화면 | 구성 요소 |
|---|---|
| V1 홈 | C1 C2 C3 C4 C6 C7 C23 |
| V2 전체 상품 | C1 C4 C5 C6 C7 C8 C9 C20 |
| V3 검색 | C1 C4 C5 C7 C18 C20 |
| V4 컬렉션 목록 | C1 C4 C5 C23 C20 |
| V5 컬렉션 | C1 C4 C5 C7 C8 C20 |
| V6 상품 상세 | C1 C4 C6 C10 C11 C12 C13 C14 C15 C16 C17 C25 |
| V7 장바구니 | C1 C4 C5 C12 C17 C19 C20 |
| V8 주문서 | C1 C5 C17 C18 C19 C24 C25 |
| V9 결제 복귀 | C1 C5 C17 C20 |
| V10 주문 완료 | C1 C4 C5 C17 C19 C22 |
| V11 로그인·가입·콜백 | C1 C4 C5 C17 C18 |
| V12 마이페이지 | C1 C4 C5 C17 C18 C21 C24 C25 |
| V13 주문 내역·상세 | C1 C4 C5 C17 C19 C21 C22 C25 |
| V14 찜 | C1 C4 C5 C6 C7 C20 C21 |
| V15 쿠폰·적립금 | C1 C4 C5 C17 C20 C21 |
| V16 리뷰 | C1 C4 C5 C16 C17 C18 C20 C21 |
| V17 문의·1:1 문의 | C1 C4 C5 C16 C17 C18 C20 C21 |
| V18 비회원 주문 | C1 C4 C5 C17 C18 C19 C22 |
| V19 약관·개인정보·도움말 | C1 C4 C5 C15 |
| V20 공통 셸 | C1 C2 C3 C4 |

gate: approved
