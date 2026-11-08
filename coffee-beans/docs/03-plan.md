# 03 기획 — 월수금 로스터리

## 1. 주문 흐름

**커스텀 흐름을 쓰지 않는다. 기본 흐름을 쓴다.**

| 기본 흐름 단계 | 이 상점에서의 뜻 |
|---|---|
| 결제 완료 | 주문 접수 |
| 상품 준비 | 월·수·금 로스팅과 포장 |
| 발송 | 송장 등록 |
| 배송완료 → 구매확정 | 택배 도착, 7일 뒤 자동 구매확정 |

이유(규칙 2): 결제 뒤 과정이 「결제 → 준비 → 발송 → 배송완료 → 구매확정」과 1:1로 맞는다. 주문 후 로스팅은 「상품 준비」 단계 안의 셀러 작업이고,
구매자 승인·방문 수령·예약 날짜·회차가 없다. 월·수·금 출고는 흐름의 대기 단계가 아니라 안내 문구다. 정기배송은 하지 않는다(셀러 답변).

## 2. 상품 구조

| 상품군 | 카테고리 | 수 | 옵션 | 분쇄도 |
|---|---|---|---|---|
| 싱글 오리진 원두 | 싱글 오리진 | 6 | `optionGroups` 「용량」 200g·500g·1kg(용량마다 `additionalPrice`, 재고) | `customInputs` select 필수 4종 |
| 블렌드 원두 | 블렌드 | 3 | 같음 | 같음 |
| 드립백 세트 | 드립백 | 2 | 없음 | 없음 |
| 드립 도구 | 드립 도구 | 3 | 없음 | 없음 |

분쇄도는 재고·값에 영향이 없어 옵션 조합(재고 단위)이 아니라 직접 입력(select)으로 받는다. 용량×분쇄도 12조합으로 재고를 나누지 않는다.

## 3. 화면 목록

| 영역 | 경로 | 내용 | 수단(storefront-sdk) |
|---|---|---|---|
| 탐색 | `/` | 띠 공지 한 줄 → 상품 그리드(갓 볶은 원두) → 카테고리 링크 | `store.get`, `catalog.searchProducts`, `catalog.listCategories` |
| | `/products` | 제목·카테고리 칩·정렬·그리드·페이지 | `catalog.searchProducts({ categoryId, sort, page })`, `catalog.listCategories` |
| | `/search` | 검색어 입력·최근 검색어·결과 그리드 | `catalog.searchProducts({ keyword })` |
| | `/collections`, `/collections/$slug` | 기획전 목록·상품 | `catalog.listCollections`·`getCollection`·`listCollectionProducts` |
| | `/products/$productId` | 갤러리 → 구매 상자(이름·가격·용량·분쇄도·수량·담기·바로 구매·찜) → 탭(상세·리뷰·문의·판매자 정보) → 안내 섹션(로스팅·발송, 교환·반품) → 고시 → 같은 카테고리 추천 → 모바일 하단 구매 바 | `catalog.getProduct`, `priceViewOf`·`optionChoicesOf`·`deliveryNoticeOf`, `catalog.listProductReviews`·`listProductInquiries`·`createInquiry`, `catalog.getPointPolicy`·`listCoupons`, `cart.addItem`, `member.addWishlist` |
| 구매 | `/cart` | 줄(용량·분쇄도 표시)·수량·삭제·합계(서버 값) | `cart.get`·`updateItem`·`removeItem` |
| | `/checkout` | 비회원 정보·배송지(우편번호 검색)·배송 메모·쿠폰·적립금·결제 수단·합계 | `checkout.create`·`quoteDelivery`·`pricing`·`applicableCoupons`·`startPayment`, `member.listAddresses`, `/payments` `open` |
| | `/checkout/return`, `/checkout/complete` | 결제 결과 확인·주문 완료 | `/payments` `result`, `payments.getStatus`·`retry`, `myOrders.get` |
| 회원 | `/login`, `/signup`, `/auth/callback` | 이메일·소셜 로그인, 가입·동의 | `/auth` 모듈(`createStorefrontAuth` session·signUp·idp·idpCallback), `store.loginMethods` |
| 마이페이지 | `/account` | 회원 정보·배송지·동의·로그아웃·탈퇴 | `member.me`·`updateMe`·`listAddresses`·`createAddress`·`updateAddress`·`deleteAddress`·`consents`·`updateConsents`, `/auth` signOut·withdraw |
| | `/orders`, `/orders/$orderId` | 주문 내역·상세(배송조회·구매확정·취소·반품·교환) | `myOrders.list`·`get`·`getDelivery`·`decidePurchase`·`act`·`actOnOrder`, `myClaims.preview`·`create`·`list`·`withdraw` |
| | `/account/wishlist` | 찜 | `member.listWishlist`·`removeWishlist` |
| | `/coupons`, `/points` | 쿠폰, 적립금 | `me.coupons`·`downloadCoupon`, `member.getPoints`·`listPointHistory` |
| | `/account/reviews` | 리뷰 작성·수정 | `reviews.listWritable`·`listMine`·`create`·`update`·`remove` |
| | `/account/inquiries`, `/account/support` | 상품 문의, 1:1 문의 | `inquiries.listMine`, `me.customerInquiries.list`·`create`·`get` |
| 비회원 | `/guest-order` | 주문 번호·연락처·비밀번호로 조회 | `myOrders.getGuestOrder`·`guestAct`·`guestActOnOrder` |
| 정책 | `/terms`, `/privacy` | 약관, 개인정보 | `store.get`(상점 이름·이메일·개인정보 보호책임자)로 채운 정적 본문 |
| | `/help` | 도움말(로스팅·발송, 분쇄도 고르는 법, 교환·반품, 사진 출처) | `store.get`, 상품 `infoSections`와 같은 문구 원천(안내 섹션) |

### 상점 쪽 설정

| 기능 | 관리 API | 범위 |
|---|---|---|
| 결제 수단 | PG 연결(포트원 테스트) | 이미 연결됨(`get_starter_status` `PAYMENT_CONNECTED` true). 에이전트가 바꾸지 않는다 |
| 적립금 | CurrentStoreController_getPointPolicy·updatePointPolicy | 기본 꺼짐 유지. 화면은 정책이 꺼져 있으면 적립금 칸을 숨긴다. 결제 점검 때만 잠시 켰다 되돌린다 |
| 쿠폰 | 쿠폰 생성 | 쓰지 않음(셀러 요청 없음). `/coupons`는 빈 상태로 둔다 |
| 기획전 | CollectionsController_create | 「입문 원두」 기획전 1개(산미 낮은 원두·드립백) |
| 소셜 로그인 | 구매자 인증 제공자 설정 | 쓰지 않음(설정 없음). 화면은 `store.loginMethods`에 있는 방법만 보인다 |
| 안내 섹션 | InfoSectionsController_create | 「로스팅·발송」「교환·반품」 2개 |
| 주문·발송 메일 | 플랫폼 기본 구매자 메일(주문 접수·발송 알림) | 설정 없이 켜져 있다. 주문서에서 이메일을 받는다 |

## 4. 요구사항 대응표

| # | 요구사항 | 수단 | 화면 |
|---|---|---|---|
| R1 | 용량별 가격 | ProductsController_create `optionGroups`·`variants.additionalPrice` + SDK `optionChoicesOf`·`priceViewOf` | 상세 구매 상자, 장바구니 |
| R2 | 분쇄도 필수 선택 | ProductsController_create `customInputs`(key `grind`, select, required) + `cart.addItem` inputs | 상세 구매 상자, 장바구니·주문 상세 줄 |
| R3 | 로스팅·발송 안내 | InfoSectionsController_create 「로스팅·발송」 + 상품 `infoSectionIds` + 띠 공지 + `/help` | 상세, 공통 셸, `/help` |
| R4 | 결제 후 로스팅·발송 | 기본 흐름(1절) | 주문 상세 상태 |
| R5 | 배송비 3,000원·3만원 이상 무료 | CurrentStoreController_patch `shippingPolicy`(저장함), `deliveryNoticeOf`, 주문서 `amounts` | 상세 배송 안내, 장바구니, 주문서 |
| R6 | 개봉 후 반품 불가, 미개봉 왕복 6,000원 | CurrentStoreController_patch `refundPolicy`(저장함) + 안내 섹션 「교환·반품」 + `myClaims.preview/create` | 상세, 주문 상세, `/help` |
| R7 | 카테고리 4개·상품 14개 | CategoriesController_create, ProductsController_create | 헤더 메뉴, 목록 |
| R8 | 상품 사진(예시) | Openverse·Wikimedia Commons CC0/CC BY → `upload_image` → `images` | 카드, 상세 갤러리, `/help` 출처 |
| R9 | 주문·발송 메일 | 플랫폼 기본 구매자 메일(주문 접수·발송 알림, 설정 불필요) + `checkout.create` 비회원 `guest.email` | 주문서 이메일 칸 |
| R10 | 기본 화면 전체 | 3절 표의 화면별 SDK 메서드 | 3절 전체 |
| R11 | 상품정보제공 고시 | 상품 `notice`(가공식품·주방용품 품목군) + `product.notice` | 상세 고시 표 |

이슈로 넘기는 요구사항은 없다. 앱은 쓰지 않는다(알림은 기본 메일, 외부 연동 없음).

gate: approved
