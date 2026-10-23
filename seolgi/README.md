# 설기로운

강아지 산책 용품과 이름표 주문제작을 파는 sayren 스토어프론트 예제입니다. `@sayren/storefront-sdk`로 공개 API만 부릅니다.

## 실행

```bash
pnpm install
cp .env.example .env      # SAYREN_STORE_CODE를 상점 코드로 바꿉니다
pnpm dev                  # http://localhost:4020 — 운영 API
pnpm dev:mock             # http://localhost:4021 — mock 데이터(사진·리뷰·주문이 있는 화면)
```

`pnpm dev:mock`은 `SAYREN_MOCK=1`로 띄웁니다. SDK의 fetch 자리에 `src/mock/`이 끼어 운영 API 대신 고정 데이터로 답합니다.
- 상품 16개(그림은 `public/mock/`, `scripts/mock-images.py`로 다시 만듭니다), 리뷰·문의, 기획전 2개, 쿠폰.
- 데모 회원 `seolgi@example.com` — 비밀번호는 아무 값이나 받습니다(「wrong」만 틀린 비밀번호로 봅니다). 지난 주문 3건·배송지 2곳이 들어 있습니다.
- 코드 쿠폰 `SEOLGI3000`.
- 결제는 PG 결제창 없이 바로 완료됩니다(`status: "completed"`). 상태는 dev 서버 메모리에만 있고 서버를 다시 띄우면 처음으로 돌아갑니다.
- 방문 분석은 보내지 않습니다.

mock 코드는 서버에서만 읽습니다(`src/lib/api.server.ts`). 브라우저 번들에는 들어가지 않습니다.

## 구조 (아토믹 디자인)

| 폴더                   | 내용                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `components/atoms`     | 버튼·가격·상품 그림·칩·체크박스·스와치·별점·수량·입력칸·심볼                             |
| `components/molecules` | 상품 카드·카테고리 원·옵션 그룹·쿠폰 줄·리뷰·문의·폼 칸·주문 줄·쪽 번호                  |
| `components/organisms` | 헤더·푸터·히어로·진열·목록 필터·사진 슬라이드·구매 영역·리뷰·주문서 구역·마이페이지 메뉴 |
| `components/templates` | 화면 하나의 배치. 데이터는 props로만 받는다                                              |
| `routes`               | 페이지. loader가 데이터를 받아 템플릿에 넘긴다                                           |
| `hooks`                | 구매·장바구니·주문서·찜·리뷰 목록 상태                                                   |
| `lib`                  | 서버 함수(`createServerFn`)와 규칙. `*.server.ts`는 서버 전용                            |
| `site`                 | 셀러가 고치는 문구·색 표·약관                                                            |
| `mock`                 | mock API(`SAYREN_MOCK=1`일 때만)                                                         |

디자인 원천은 캔버스 시안(DHome·DList·PdpDesktop·PdpDetail·PdpMobile·PdpSheet·DCart·DCheckout·DComplete·DLogin·DOrder)입니다.
토큰은 `src/theme.css` 한 곳에 있습니다.

## 화면

홈, 상품 목록(하위 칩·가격·무료배송·정렬), 검색, 기획전, 상품 상세(사진 슬라이드·스와치·이름표 미리보기·쿠폰 받기·찜·리뷰 정렬·문의 작성),
장바구니, 주문서(배송지·쿠폰·적립금·간편결제), 결제 복귀, 주문 완료, 로그인·가입·소셜 로그인, 마이페이지(주문 내역·주문 상세·배송 조회·구매확정·취소/반품/교환,
찜, 쿠폰, 적립금, 리뷰 쓰기·고치기, 상품 문의, 1:1 문의, 회원 정보, 배송지 관리), 비회원 주문 조회, 이용약관·개인정보처리방침.

## 검사

```bash
pnpm typecheck
pnpm exec biome check .
pnpm test
pnpm build
```
