# 03 기획

근거: `.sayren/idea.md`(요구 R1–R10), `01-research.md`(차별점 D1–D5), `02-brand.md`.

## 주문 흐름

**커스텀 주문 흐름을 쓰지 않는다. 기본 배송 흐름을 쓴다.**

이유: 점검은 상품 등록 전에 끝나고 결제 뒤에는 바로 포장·발송한다(셀러 인터뷰). 결제 뒤 과정이 기본 흐름
「결제 완료 → 상품 준비 → 발송 → 배송완료 → 구매확정」과 같다. 제작·예약·픽업·회차·승인 단계가 없다.
초기 불량 교환·환불과 단순 변심 반품은 기본 흐름의 클레임(반품·교환)으로 처리한다.

| 단계 | 누가 | sayren 수단 |
|---|---|---|
| 주문·결제 | 구매자 | `checkout.create` → `checkout.startPayment` → `/payments` 결제창 → `/checkout/return` |
| 주문 확인 메일 | 플랫폼 | 기본 구매자 주문 메일(주문서 이메일) |
| 상품 준비(발주 확인) | 셀러 | 상점 플랫폼 주문 화면(`OrdersController_confirm`) |
| 발송·송장 | 셀러 | `OrdersController_dispatch`, 발송 메일은 플랫폼 기본 |
| 배송완료 | 자동 7일 | 상점 설정 `autoDeliverDays: 7` |
| 구매확정 | 구매자 또는 자동 7일 | `myOrders.decidePurchase`, `autoConfirmDays: 7` |
| 반품·교환 신청 | 구매자(수령 7일 안) | `myClaims.preview` → `myClaims.create`, 반품 배송비는 `refundPolicy` 응답 그대로 |
| 보증 수리(6개월) | 구매자 → 셀러 | 1:1 문의 `/account/support`(`me.customerInquiries.create`) 접수 후 셀러 처리. 주문 흐름 밖의 사후 서비스 |

## 상품 구성

| 상품 | 카테고리 | 판매가 | 등급 | 재고 |
|---|---|---|---|---|
| 펜탁스 MX + 50mm f1.7 (A급) | 수동 SLR | 280,000원 | A | 1 |
| 니콘 FM2 + 50mm f1.8 (A급) | 수동 SLR | 420,000원 | A | 1 |
| 캐논 AE-1 Program + 50mm f1.8 (B급) | 수동 SLR | 260,000원 | B | 1 |
| 올림푸스 뮤2 (A급) | 자동 컴팩트 | 390,000원 | A | 1 |
| 야시카 일렉트로35 GSN (B급) | 레인지파인더 | 180,000원 | B | 1 |

- 옵션·추가 선택·직접 입력 없음(`optionGroups: []`, 단일 variant). 배송비는 상점 기본(4,000원, 30만원 이상 무료).
- 상세설명 HTML: 소개 → 점검표(셔터 속도·노출계·광학·필름 실 4행 표, 항목·결과·메모) → 점검 사진 → 구성품 → 관리 방법 → 배송·교환 안내.
  점검 결과 수치는 셀러가 준 값이 없어 「점검 완료」로만 적고, 세부 수치는 셀러 확인 항목으로 둔다.
- 안내 섹션 두 개를 모든 상품에 잇는다: 「등급 기준」, 「보증·교환·반품」.
- 컬렉션: `a-grade`(A급), `b-grade`(B급).

## 화면 목록

`sayren` starter 기준 구조(§6.5) 전체를 만든다. 업종 조정: 홈의 쿠폰·적립 띠와 포토 리뷰 섹션은 넣지 않는다(쿠폰·적립 운영 계획 없음, 리뷰 0건). 컬렉션 섹션은 등급 바로가기로 쓴다.

| # | 경로 | 화면 | 구성 | SDK·sayren 수단 | 요구 |
|---|---|---|---|---|---|
| P1 | 공통 셸 | 헤더·메뉴 서랍·푸터 | 띠 공지(배송 조건), 글자 로고, 카테고리 메뉴, 검색·마이·장바구니, 푸터 사업자 정보 | `store.get`, `catalog.listCategories`, `sellerInfoOf` | R5, R9 |
| P2 | `/` | 홈 | 소개(점검 4항목·6개월 보증), 판매 중 카메라 그리드, 등급 바로가기, 점검 방식 안내, 판매 완료 기록, 자주 묻는 질문 | `catalog.searchProducts`, `catalog.listCollections` | R1, R3, R7 |
| P3 | `/products` | 목록 | 카테고리 칩, 정렬, 2열/4열 카드(등급·판매 완료 표시) | `catalog.searchProducts`, `catalog.listCategories` | R1, R3 |
| P4 | `/search` | 검색 | 검색어 입력, 최근 검색어, 결과 카드 | `catalog.searchProducts({ keyword })` | R9 |
| P5 | `/collections` | 등급별 모음 | 컬렉션 목록 | `catalog.listCollections` | R3 |
| P6 | `/collections/$slug` | 등급 모음 상세 | 컬렉션 설명 + 카드 | `catalog.getCollection`, `listCollectionProducts` | R3 |
| P7 | `/products/$productId` | 상품 상세 | 갤러리(사진 없으면 글자 자리), 요약(이름·등급·가격·적립), 점검 요약, 하단 구매 바(바로 구매·담기·찜), 탭(상세·리뷰·문의·판매자 정보), 상세설명(점검표), 안내 섹션, 고시, 리뷰, 문의, 같은 카테고리 추천 | `catalog.getProduct`, `priceViewOf`, `deliveryNoticeOf`, `listProductReviews`, `listProductInquiries`·`createInquiry`, `member.addWishlist` | R1, R2, R3, R7, R10 |
| P8 | `/cart` | 장바구니 | 줄(구매 불가 사유), 합계(응답 그대로) | `cart.get`·`updateItem`·`removeItem` | R1, R5 |
| P9 | `/checkout` | 주문서 | 주문자·배송지(우편번호 검색)·배송 메모·결제 수단·금액(응답 그대로) | `checkout.create`·`quoteDelivery`·`pricing`·`startPayment`, `member.listAddresses` | R4, R5, R8 |
| P10 | `/checkout/return` | 결제 복귀 | 결과 확인 → 완료 이동 또는 재시도 | `/payments` `result`, `payments.getStatus`·`retry` | R9 |
| P11 | `/checkout/complete` | 주문 완료 | 주문 번호, 메일 안내 | `myOrders.get` | R8 |
| P12 | `/login` | 로그인 | 이메일 로그인, 소셜 버튼(`loginMethods`) | `/auth` | R9 |
| P13 | `/signup` | 가입 | 이메일 가입, 필수 동의 | `/auth` signUp | R9 |
| P14 | `/auth/callback` | 소셜 로그인 복귀 | 처리 후 이동 | `/auth` idpCallback | R9 |
| P15 | `/account` | 마이페이지 | 회원 정보·동의·배송지 관리, 메뉴(쇼핑·혜택·활동) | `member.me`·`updateMe`·`consents`·`*Address` | R9 |
| P16 | `/orders` | 주문 내역 | 주문 카드, 단계 | `myOrders.list` | R6 |
| P17 | `/orders/$orderId` | 주문 상세 | 상품·금액·배송 조회·구매확정·반품/교환 신청·클레임 내역·흐름 버튼 | `myOrders.get`·`getDelivery`·`decidePurchase`·`act`·`actOnOrder`, `myClaims.preview`·`create`·`list`·`withdraw` | R6, R7 |
| P18 | `/account/wishlist` | 찜 | 찜한 카메라 카드 | `member.listWishlist`·`removeWishlist` | R9 |
| P19 | `/coupons` | 쿠폰 | 보유 쿠폰(없으면 빈 상태) | `me.coupons`, `catalog.listCoupons`·`me.downloadCoupon` | R9 |
| P20 | `/points` | 적립금 | 잔액·내역 | `member.getPoints`·`listPointHistory` | R9 |
| P21 | `/account/reviews` | 리뷰 | 작성 가능·내 리뷰(작성·수정·삭제) | `reviews.listWritable`·`listMine`·`create`·`update`·`remove`·`createImageUpload` | R9 |
| P22 | `/account/inquiries` | 상품 문의 | 내 문의 목록 | `inquiries.listMine` | R9 |
| P23 | `/account/support` | 1:1 문의(보증 수리 접수) | 목록·작성·상세 | `me.customerInquiries.list`·`create`·`get` | R7 |
| P24 | `/guest-order` | 비회원 주문 조회 | 주문 번호·연락처·주문 비밀번호 → 주문 상세 | `myOrders.getGuestOrder`·`guestAct`·`guestActOnOrder` | R9 |
| P25 | `/terms` | 이용약관 | 상점 정보로 채운 약관 | `store.get` | R9 |
| P26 | `/privacy` | 개인정보처리방침 | 상점 정보로 채운 방침 | `store.get` | R9 |
| P27 | `/help` | 고객센터 | 운영 시간·이메일, 배송·반품·보증 안내, 자주 묻는 질문 | `store.get`(배송·반품 값은 상점 응답) | R5, R7 |

## 요구 사항 표

| # | 요구 | sayren 수단 | 화면 | 인수 시나리오 |
|---|---|---|---|---|
| R1 | 한 대씩 판매, 팔리면 품절·판매 완료 표시 | `variants[0].stockQuantity: 1`, 카드·상세 `soldOut` | P2, P3, P7, P8 | S3 |
| R2 | 점검표·점검 사진 | 상품 `description` HTML, `images` | P7 | S1 |
| R3 | 등급 표시와 기준 | 상품명 등급 표기, 안내 섹션 「등급 기준」, 컬렉션 `a-grade`·`b-grade` | P2, P3, P5, P6, P7 | S1, S5 |
| R4 | 배송 메모만 받음 | 옵션·직접 입력 없음, 주문서 배송 메모 | P9 | S1 |
| R5 | 배송비 4,000원, 30만원 이상 무료 | `shippingPolicy`(저장함), 금액은 응답 그대로 | P1, P8, P9, P27 | S1, S2 |
| R6 | 결제 뒤 바로 발송 | 기본 흐름 | P16, P17 | S4 |
| R7 | 6개월 보증, 7일 초기 불량 교환·환불, 반품 왕복 8,000원 | 안내 섹션 「보증·교환·반품」, `refundPolicy`(저장함), 클레임, 1:1 문의 | P7, P17, P23, P27 | S4 |
| R8 | 주문·발송 메일 | 플랫폼 기본 구매자 메일 | P9, P11 | S1 |
| R9 | 기본 화면 전체 | 위 화면 목록 | P1–P27 | S1–S5 |
| R10 | 상품정보제공 고시 | 상품 `notice`(카메라 품목군) | P7 | S1 |

## 인수 시나리오

`.sayren/idea.md`의 S1–S5를 그대로 쓴다.

gate: approved
