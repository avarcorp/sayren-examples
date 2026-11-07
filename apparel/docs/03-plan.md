# 03 기획 — 데일리 베이직

## 주문 흐름 결정 (규칙 2)

표준 택배 흐름을 쓴다: 결제 → 상품 준비 → 발송 → 배송 완료 → 구매 확정. 맞춤 흐름을 만들지 않는다.
이유: 기성 의류를 재고에서 바로 출고한다. 주문 제작·예약·픽업·회차·승인 단계가 없다. 셀러가 인터뷰에서 표준 흐름과 기본 메일 알림을 골랐다.
교환·반품은 표준 클레임(구매자 신청 → 셀러 승인 → 수거 → 환불·재배송)으로 처리한다.

## 화면 목록

모든 화면은 스토어프론트 SDK로 데이터를 읽는다. 홈은 규칙 11을 따른다(상품 먼저, 아래에 카테고리·컬렉션 링크만).

| # | 경로 | 화면 | 메커니즘 |
|---|---|---|---|
| V1 | `/` | 홈: 한 줄 이미지 띠(컬렉션 대표 이미지) → 신상품 그리드 → 카테고리 링크 → 컬렉션 카드 | `catalog.searchProducts`, `catalog.listCategories`, `catalog.listCollections` |
| V2 | `/products` | 전체 상품: 제목, 카테고리 칩, 정렬, 그리드, 페이지 | `catalog.searchProducts({ categoryId, sort, page })`, URL 상태는 TanStack Router search |
| V3 | `/search` | 검색: 입력, 최근 검색어, 결과 그리드 | `catalog.searchProducts({ keyword })`. 최근 검색어는 브라우저 `localStorage`(구매자 편의 기록, 서버 데이터 아님) |
| V4 | `/collections` | 컬렉션 목록 | `catalog.listCollections` |
| V5 | `/collections/$slug` | 컬렉션: 제목, 그리드 | `catalog.getCollection`·`listCollectionProducts` |
| V6 | `/products/$productId` | 상세: 갤러리, 요약, 색상·사이즈 선택, 수량, 장바구니·바로구매·찜, 탭(상세정보·리뷰·문의·안내), 고시, 같은 카테고리 추천, 모바일 하단 구매 바 | `catalog.getProduct`, `priceViewOf`, `optionChoicesOf`, `deliveryNoticeOf`, `listProductReviews`, `listProductInquiries`·`createInquiry`, `getPointPolicy`, `listCoupons`·`me.downloadCoupon`, `member.addWishlist`, `cart.addItem`, `checkout.create({ directItem })` |
| V7 | `/cart` | 장바구니 | `cart.get`·`updateItem`·`removeItem` |
| V8 | `/checkout` | 주문서: 배송지(회원 목록·주소 검색), 비회원 정보, 쿠폰·적립금, 결제 수단 | `checkout.create`·`quoteDelivery`·`pricing`·`applicableCoupons`·`startPayment`, `member.listAddresses`, `react-daum-postcode` |
| V9 | `/checkout/return` | 결제 복귀 | `createPayments().result(url)`·`getStatus(paymentId)`·`retry(paymentId)` (`@sayren/storefront-sdk/payments`) |
| V10 | `/checkout/complete` | 주문 완료 | `myOrders.get` |
| V11 | `/login` · `/signup` · `/auth/callback` | 로그인·가입·소셜 복귀 | `createStorefrontAuth().session`·`signUp`·`idp`·`idpCallback`·`requestPasswordReset`·`signOut`·`refresh` (`@sayren/storefront-sdk/auth`), `store.get().loginMethods` |
| V12 | `/account` | 마이페이지 메뉴, 회원정보 수정, 동의, 배송지 관리, 소셜 연결 | `member.me`·`updateMe`·`consents`·`updateConsents`·`member.listAddresses`·`createAddress`·`updateAddress`·`deleteAddress`, `createStorefrontAuth().identities`·`linkIdp`·`linkIdpCallback`·`unlinkIdp`·`withdraw` |
| V13 | `/orders` · `/orders/$orderId` | 주문 내역·상세: 배송조회, 구매확정, 흐름 버튼, 취소·반품·교환 신청·철회 | `myOrders.list`·`get`·`getDelivery`·`decidePurchase`·`act`·`actOnOrder`, `myClaims.preview`·`create`·`list`·`withdraw` |
| V14 | `/account/wishlist` | 찜 | `member.listWishlist`·`removeWishlist` |
| V15 | `/coupons` · `/points` | 쿠폰·적립금 | `me.coupons`, `catalog.listCoupons`·`me.downloadCoupon`, `member.getPoints`·`listPointHistory` |
| V16 | `/account/reviews` | 리뷰 작성·수정·목록 | `reviews.listWritable`·`listMine`·`create`·`update`·`remove`·`createImageUpload` |
| V17 | `/account/inquiries` · `/account/support` | 상품 문의 내역, 1:1 문의 목록·작성·상세 | `inquiries.listMine`, `me.customerInquiries.list`·`create`·`get` |
| V18 | `/guest-order` | 비회원 주문 조회·행동 | `myOrders.getGuestOrder`·`guestAct`·`guestActOnOrder` |
| V19 | `/terms` · `/privacy` · `/help` | 약관·개인정보처리방침·도움말(배송·교환·반품, 사이즈, 이미지 출처) | 약관·개인정보처리방침 본문은 스토어프론트 정적 콘텐츠(`messages/ko.json`)에 상점 값(`store.get().name`·`customerCenterEmail`·`privacyOfficerName`, `sellerInfoOf`)을 끼운다. 도움말의 배송비·무료 기준·반품·교환 배송비는 첫 판매 상품의 `catalog.getProduct().fulfillment.shipping`(상점 기본 정책이 반영된 값)을 `deliveryNoticeOf`로 읽는다(`store.get()`에는 배송 정책이 없다), 사이즈 안내(상의 S·M·L, 하의 28~34)와 이미지 출처 표는 정적 콘텐츠 |
| V20 | 공통 셸 | 헤더(로고·메뉴·검색·마이·장바구니), 띠 공지 한 줄, 모바일 메뉴 서랍, 푸터(링크·사업자 정보) | `store.get`, `catalog.listCategories`, `sellerInfoOf`. 띠 공지 문구 틀은 정적 콘텐츠(`messages/ko.json`), 금액은 V19와 같은 `deliveryNoticeOf(product.fulfillment)` 값. 값을 읽지 못하면 띠 공지를 숨긴다 |

## 요구 사항

| # | 요구 사항 | 메커니즘 | 화면 |
|---|---|---|---|
| R1 | 상점 이름·고객센터 이메일·운영 시간 | `CurrentStoreController_patch` 필드 `name`·`customerCenterEmail`·`businessHours` | V19, V20 |
| R2 | 배송비 3,000원, 5만원 이상 무료, 반품·교환 왕복 6,000원 | `CurrentStoreController_patch` 필드 `shippingPolicy.baseDeliveryFee`=3000·`shippingPolicy.freeThreshold`=50000·`refundPolicy.returnDeliveryFee`=6000·`refundPolicy.exchangeDeliveryFee`=6000. 화면은 `deliveryNoticeOf(product.fulfillment)`, 주문서는 `checkout.create().amounts` | V6, V8, V19 |
| R3 | 카테고리 5개 | `CategoriesController_create` | V1, V2, V20 |
| R4 | 상품 10개(사진을 확보한 품목만, 셀러 범위 10~12개 안), 색상·사이즈 옵션, 조합별 재고 | `ProductsController_create` optionGroups·variants | V1–V6 |
| R5 | 상품 사진(대표 + 추가), 상업 이용 가능, 출처 기록 | Openverse 수집 → `upload_image` → `ProductsController_create images`, `docs/image-credits.md` | V1–V6 |
| R6 | 홈·컬렉션 이미지 | `CollectionsController_create imageUrl` 컬렉션 3개 | V1, V4, V5 |
| R7 | 색상·사이즈 선택 후 장바구니·주문·결제 | `optionChoicesOf` → `cart.addItem`·`cart.get` → `checkout.create`·`checkout.quoteDelivery`·`checkout.pricing` → `checkout.startPayment`(서버) → `createPayments().open`(브라우저) → `result`·`getStatus` | V6–V10 |
| R8 | 로그인·가입·비회원 주문 조회·마이페이지 | `createStorefrontAuth().session`·`signUp`·`signOut`, `member.me`·`updateMe`, `myOrders.list`·`get`·`getGuestOrder` | V11–V18 |
| R9 | 교환·반품 신청 | 표준 클레임 `myClaims.preview`·`create`·`list`·`withdraw` | V13, V18 |
| R10 | CC-BY 이미지 출처 표기 | 스토어프론트 정적 콘텐츠: `src/routes/help.tsx`의 출처 표(원천 `docs/image-credits.json`에서 옮긴 고정 목록). 서버 데이터가 아니다 | V19 |
| R11 | 상품정보제공 고시(의류) | `PlatformCodesController_infoSchemas`로 의류 품목군 확인 → `ProductsController_create` 필드 `notice`. 화면은 `catalog.getProduct().notice` | V6 |

모든 요구 사항이 sayren 기본 기능으로 해결된다. 앱과 이슈는 필요 없다.

gate: approved
