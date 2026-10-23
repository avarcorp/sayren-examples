import type {
  CategoryNode,
  ProductCard,
  ProductDetail,
  PublicInquiry,
  PublicReview,
  StorefrontCollection,
  StorefrontStore,
} from "@sayren/storefront-sdk";

/**
 * mock 모드의 상점·상품 데이터. 운영 「설기로운」 상점의 응답(상품 1~7, 카테고리, 옵션 id)을 바탕으로
 * 사진·리뷰·문의·추가 상품을 더했다. 그림 주소는 `/mock/…`이고 mock 서버가 응답할 때 사이트 주소를 붙인다.
 */
export const mockStore: StorefrontStore = {
  storeCode: "krt94fj5ak65",
  markets: [
    {
      marketId: "mkt_default",
      name: "기본",
      currency: "KRW",
      countries: ["KR"],
      locales: ["ko"],
      checkoutAvailable: true,
    },
  ],
  market: { marketId: "mkt_default", currency: "KRW", matched: true, couponsEnabled: true },
  locale: "ko",
  defaultLocale: "ko",
  name: "설기로운",
  logoUrl: null,
  customerCenterPhone: "1588-0000",
  businessHours: "평일 10:00–17:00 (점심 12:30–13:30)",
  businessName: "설기로운",
  representativeName: "김설기",
  businessNumber: "1234567890",
  mailOrderSalesNumber: "2026-서울마포-0000",
  businessAddress: "서울특별시 마포구 와우산로 00, 2층",
  customerCenterEmail: "help@seolgi.example",
  privacyOfficerName: "김설기",
  privacyOfficerEmail: "privacy@seolgi.example",
  guestCheckout: true,
  loginMethods: ["password", "kakao", "naver"],
  checkoutAvailable: true,
  checkoutMode: "TEST",
  checkoutUnavailableReason: null,
};

const CAT = {
  walk: "cat_cbfb2b50a6ff",
  harness: "cat_763d23797036",
  leash: "cat_62812caee72c",
  collar: "cat_30ab2540d16c",
  walkGoods: "cat_f216fc930a49",
  tag: "cat_a3a6232b895c",
  toy: "cat_bdef7f10a921",
  living: "cat_e16141ebd230",
} as const;

export const mockCategories: CategoryNode[] = [
  {
    categoryId: CAT.walk,
    name: "산책",
    depth: 1,
    children: [
      { categoryId: CAT.harness, name: "하네스", depth: 2, children: [] },
      { categoryId: CAT.leash, name: "리드줄", depth: 2, children: [] },
      { categoryId: CAT.collar, name: "목줄", depth: 2, children: [] },
      { categoryId: CAT.walkGoods, name: "산책 소품", depth: 2, children: [] },
    ],
  },
  { categoryId: CAT.tag, name: "이름표 제작", depth: 1, children: [] },
  { categoryId: CAT.toy, name: "장난감", depth: 1, children: [] },
  { categoryId: CAT.living, name: "리빙", depth: 1, children: [] },
];

const PATHS: Record<string, { categoryId: string; name: string }[]> = {
  [CAT.harness]: [
    { categoryId: CAT.walk, name: "산책" },
    { categoryId: CAT.harness, name: "하네스" },
  ],
  [CAT.leash]: [
    { categoryId: CAT.walk, name: "산책" },
    { categoryId: CAT.leash, name: "리드줄" },
  ],
  [CAT.collar]: [
    { categoryId: CAT.walk, name: "산책" },
    { categoryId: CAT.collar, name: "목줄" },
  ],
  [CAT.walkGoods]: [
    { categoryId: CAT.walk, name: "산책" },
    { categoryId: CAT.walkGoods, name: "산책 소품" },
  ],
  [CAT.tag]: [{ categoryId: CAT.tag, name: "이름표 제작" }],
  [CAT.toy]: [{ categoryId: CAT.toy, name: "장난감" }],
  [CAT.living]: [{ categoryId: CAT.living, name: "리빙" }],
};

const SHIPPING = {
  type: "SHIPPING" as const,
  requiresShipping: true as const,
  shipping: {
    deliveryType: "CONDITIONAL_FREE",
    deliveryFee: 3000,
    conditionalFreeAmount: 30000,
    estimatedDays: "1~2일",
    returnDeliveryFee: 3000,
    exchangeDeliveryFee: 6000,
  },
  methods: ["CARRIER"],
};

const p = (text: string) =>
  `<p class="editor-paragraph"><span style="white-space: pre-wrap;">${text}</span></p>`;
const img = (src: string) =>
  `<p class="editor-paragraph"><img src="${src}" alt="" style="display:block;width:60%;margin:24px auto" /></p>`;

interface Seed {
  productId: string;
  productNo: number;
  name: string;
  categoryId: string;
  salePrice: number;
  originalPrice?: number;
  discountedPrice?: number;
  images: string[];
  description: string;
  /** 최신순 정렬 값(클수록 최근) */
  addedAt: number;
  soldOut?: boolean;
  freeShipping?: boolean;
  purchasePoint?: number;
  detail?: Partial<ProductDetail>;
}

const NOTICE_GOODS = {
  schemaId: "PET_GOODS",
  name: "애완용품",
  fields: [
    { key: "material", label: "소재", value: "폴리에스터 메쉬, 나일론 웨빙" },
    { key: "size", label: "치수", value: "상세 설명 참고" },
    { key: "maker", label: "제조자(수입자)", value: "설기로운" },
    { key: "origin", label: "제조국", value: "대한민국" },
    { key: "caution", label: "취급 시 주의사항", value: "손세탁 후 그늘에서 말립니다" },
    { key: "warranty", label: "품질보증기준", value: "관련 법 및 소비자분쟁해결 기준에 따름" },
    { key: "as", label: "A/S 책임자와 전화번호", value: "설기로운 고객센터 1588-0000" },
  ],
};

const SEEDS: Seed[] = [
  {
    productId: "prod_fa41d076cb03",
    productNo: 1,
    name: "소프트 메쉬 하네스",
    categoryId: CAT.harness,
    salePrice: 27200,
    originalPrice: 32000,
    images: [
      "/mock/harness-cream.svg",
      "/mock/harness-peach.svg",
      "/mock/harness-mint.svg",
      "/mock/harness-charcoal.svg",
    ],
    description:
      p("목이 편한 산책") +
      p(
        "목줄 대신 가슴으로 힘을 나눠 받는 H형 하네스입니다. 통기성 메쉬와 부드러운 안감으로 오래 걸어도 쓸리지 않습니다.",
      ) +
      img("/mock/harness-peach.svg") +
      p(
        "원터치 버클로 머리를 넣지 않고 채우고, 야간 반사 띠로 어두운 길에서도 잘 보입니다. 사이즈는 가슴둘레 기준입니다(S 32~38cm, M 38~46cm, L 46~54cm, XL 54~62cm).",
      ),
    addedAt: 1,
    purchasePoint: 272,
    detail: {
      optionGroups: [
        {
          groupId: "ogrp_82f2d4111087",
          name: "색상",
          values: [
            { valueId: "ogv_10516dcab14f", name: "크림" },
            { valueId: "ogv_7b8bdea57c6f", name: "피치" },
            { valueId: "ogv_a7e6bbbb2497", name: "민트" },
            { valueId: "ogv_06539c4c7e02", name: "차콜" },
          ],
        },
        {
          groupId: "ogrp_17b9154608c9",
          name: "사이즈",
          values: [
            { valueId: "ogv_cb335dfec980", name: "S" },
            { valueId: "ogv_fc8dfe6017e6", name: "M" },
            { valueId: "ogv_549512396d13", name: "L" },
            { valueId: "ogv_9ece8d3d17a3", name: "XL" },
          ],
        },
      ],
      variants: [
        ["ogv_10516dcab14f", "크림"],
        ["ogv_7b8bdea57c6f", "피치"],
        ["ogv_a7e6bbbb2497", "민트"],
        ["ogv_06539c4c7e02", "차콜"],
      ].flatMap(([colorId, color], ci) =>
        [
          ["ogv_cb335dfec980", "S"],
          ["ogv_fc8dfe6017e6", "M"],
          ["ogv_549512396d13", "L"],
          ["ogv_9ece8d3d17a3", "XL"],
        ].map(([sizeId, size], si) => {
          const n = ci * 4 + si + 1;
          return {
            variantId: `var_mock_1_${n}`,
            variantNo: `1-${String(n).padStart(2, "0")}`,
            valueIds: [colorId as string, sizeId as string],
            name: `${color} / ${size}`,
            additionalPrice: size === "XL" ? 2000 : 0,
            // 민트 XL은 품절(품절 표기 확인용)
            soldOut: color === "민트" && size === "XL",
          };
        }),
      ),
      addonGroups: [
        {
          groupId: "ogrp_7fe7bb1de3f8",
          name: "이름표",
          required: false,
          values: [
            { valueId: "ogv_74b0c6352960", name: "원형 각인 이름표", additionalPrice: 6000 },
          ],
        },
      ],
      customInputs: [
        {
          inputId: "cin_075031ec01ec",
          label: "이름표에 새길 이름",
          placeholder: "이름표를 추가했을 때만 입력합니다",
          maxLength: 8,
          required: false,
          key: null,
          type: "text",
          options: null,
        },
      ],
      notice: NOTICE_GOODS,
      infoSections: [
        {
          infoSectionId: "info_size",
          title: "사이즈 가이드",
          body:
            p("가슴둘레를 줄자로 잰 뒤 손가락 두 개가 들어갈 여유를 더해 고릅니다.") +
            p("S 32~38cm · M 38~46cm · L 46~54cm · XL 54~62cm"),
        },
      ],
    },
  },
  {
    productId: "prod_a000499d23f2",
    productNo: 2,
    name: "각인 이름표 주문제작",
    categoryId: CAT.tag,
    salePrice: 12000,
    images: ["/mock/tag-round.svg", "/mock/tag-bone.svg", "/mock/tag-heart.svg"],
    description:
      p("우리 아이 이름을 새겨 드립니다") +
      p("모양과 색을 고르고 앞면 이름과 뒷면 문구를 입력하면 2일 안에 만들어 보냅니다.") +
      img("/mock/tag-bone.svg"),
    addedAt: 2,
    purchasePoint: 120,
    detail: {
      optionGroups: [
        {
          groupId: "ogrp_4763ca6acf74",
          name: "모양",
          values: [
            { valueId: "ogv_aa7e90263603", name: "원형" },
            { valueId: "ogv_92deff0d5f96", name: "뼈다귀" },
            { valueId: "ogv_88d40cbfd283", name: "하트" },
          ],
        },
        {
          groupId: "ogrp_6ee2b6f5203d",
          name: "색상",
          values: [
            { valueId: "ogv_e1d41a37b160", name: "골드" },
            { valueId: "ogv_bb02d7e5f05f", name: "실버" },
            { valueId: "ogv_77d43793c259", name: "로즈골드" },
          ],
        },
      ],
      variants: [
        ["ogv_aa7e90263603", "원형", 0],
        ["ogv_92deff0d5f96", "뼈다귀", 2000],
        ["ogv_88d40cbfd283", "하트", 2000],
      ].flatMap(([shapeId, shape, extra], si) =>
        [
          ["ogv_e1d41a37b160", "골드"],
          ["ogv_bb02d7e5f05f", "실버"],
          ["ogv_77d43793c259", "로즈골드"],
        ].map(([colorId, color], ci) => {
          const n = si * 3 + ci + 1;
          return {
            variantId: `var_mock_2_${n}`,
            variantNo: `2-${String(n).padStart(2, "0")}`,
            valueIds: [shapeId as string, colorId as string],
            name: `${shape} / ${color}`,
            additionalPrice: extra as number,
            soldOut: false,
          };
        }),
      ),
      customInputs: [
        {
          inputId: "cin_8fc92845a501",
          label: "앞면 이름",
          placeholder: "반려견 이름",
          maxLength: 6,
          required: true,
          key: null,
          type: "text",
          options: null,
        },
        {
          inputId: "cin_0f70ad713830",
          label: "뒷면 문구",
          placeholder: "선택 입력 · 예: 사랑해",
          maxLength: 12,
          required: false,
          key: null,
          type: "text",
          options: null,
        },
      ],
    },
  },
  {
    productId: "prod_b355b1ce8d73",
    productNo: 3,
    name: "양털 터그 장난감",
    categoryId: CAT.toy,
    salePrice: 9900,
    originalPrice: 11000,
    images: ["/mock/tug-1.svg", "/mock/tug-2.svg"],
    description: p("당기고 흔들며 노는 양털 터그입니다. 면 로프가 이를 닦아 줍니다."),
    addedAt: 3,
  },
  {
    productId: "prod_da2807ba7b9a",
    productNo: 4,
    name: "반사 리드줄 1.5m",
    categoryId: CAT.leash,
    salePrice: 18000,
    images: ["/mock/leash-1.svg", "/mock/leash-2.svg"],
    description: p("밤 산책에도 잘 보이는 반사사 리드줄입니다. 손잡이에 쿠션을 넣었습니다."),
    addedAt: 4,
  },
  {
    productId: "prod_fb457df0b164",
    productNo: 5,
    name: "가죽 목줄",
    categoryId: CAT.collar,
    salePrice: 24000,
    images: ["/mock/collar-1.svg", "/mock/collar-2.svg"],
    description: p("소가죽을 손바느질한 목줄입니다. 쓸수록 길이 들어 부드러워집니다."),
    addedAt: 5,
  },
  {
    productId: "prod_b158b1c792bf",
    productNo: 6,
    name: "도넛 쿠션 방석",
    categoryId: CAT.living,
    salePrice: 39000,
    images: ["/mock/donut-1.svg", "/mock/donut-2.svg"],
    description: p("몸을 말고 자는 아이에게 맞춘 도넛 방석입니다. 커버를 벗겨 세탁합니다."),
    addedAt: 6,
    freeShipping: true,
  },
  {
    productId: "prod_ae28281c2355",
    productNo: 7,
    name: "산책 배변봉투 케이스",
    categoryId: CAT.walkGoods,
    salePrice: 8500,
    images: ["/mock/pouch-1.svg"],
    description: p("리드줄 손잡이에 거는 배변봉투 케이스입니다. 봉투 1롤이 들어 있습니다."),
    addedAt: 7,
  },
  {
    productId: "prod_mock_08",
    productNo: 8,
    name: "쿨링 메쉬 하네스",
    categoryId: CAT.harness,
    salePrice: 29000,
    discountedPrice: 26100,
    images: ["/mock/cooling-1.svg", "/mock/cooling-2.svg"],
    description: p("여름 산책용 냉감 원단 하네스입니다."),
    addedAt: 8,
  },
  {
    productId: "prod_mock_09",
    productNo: 9,
    name: "자동 리드줄 5m",
    categoryId: CAT.leash,
    salePrice: 32000,
    images: ["/mock/autoleash-1.svg"],
    description: p("버튼 하나로 길이를 고정하는 자동 리드줄입니다."),
    addedAt: 9,
    soldOut: true,
  },
  {
    productId: "prod_mock_10",
    productNo: 10,
    name: "이름 각인 가죽 목줄",
    categoryId: CAT.collar,
    salePrice: 35000,
    images: ["/mock/namecollar-1.svg"],
    description: p("버클 옆 가죽에 이름을 새겨 드립니다."),
    addedAt: 10,
  },
  {
    productId: "prod_mock_11",
    productNo: 11,
    name: "산책 간식 파우치",
    categoryId: CAT.walkGoods,
    salePrice: 15000,
    images: ["/mock/treatpouch-1.svg"],
    description: p("허리에 차는 간식 파우치입니다. 자석 입구로 한 손에 엽니다."),
    addedAt: 11,
  },
  {
    productId: "prod_mock_12",
    productNo: 12,
    name: "하트 각인 이름표",
    categoryId: CAT.tag,
    salePrice: 14000,
    images: ["/mock/hearttag-1.svg"],
    description: p("하트 모양 금속 이름표입니다."),
    addedAt: 12,
  },
  {
    productId: "prod_mock_13",
    productNo: 13,
    name: "삑삑이 고구마 인형",
    categoryId: CAT.toy,
    salePrice: 7900,
    images: ["/mock/potato-1.svg"],
    description: p("누르면 삑삑 소리가 나는 고구마 인형입니다."),
    addedAt: 13,
  },
  {
    productId: "prod_mock_14",
    productNo: 14,
    name: "노즈워크 담요",
    categoryId: CAT.toy,
    salePrice: 23000,
    originalPrice: 28000,
    images: ["/mock/nosework-1.svg"],
    description: p("천 사이에 간식을 숨겨 찾게 하는 노즈워크 담요입니다."),
    addedAt: 14,
  },
  {
    productId: "prod_mock_15",
    productNo: 15,
    name: "원목 높이 식기 받침",
    categoryId: CAT.living,
    salePrice: 28000,
    images: ["/mock/bowl-1.svg"],
    description: p("목을 숙이지 않고 먹는 높이의 원목 받침입니다."),
    addedAt: 15,
  },
  {
    productId: "prod_mock_16",
    productNo: 16,
    name: "포근 극세사 담요",
    categoryId: CAT.living,
    salePrice: 19000,
    images: ["/mock/blanket-1.svg"],
    description: p("켄넬과 소파에 까는 극세사 담요입니다."),
    addedAt: 16,
  },
];

/** 리뷰 — 상품마다 몇 개씩. 사진 리뷰·판매자 답글을 섞는다 */
const REVIEW_TEXTS: [number, string][] = [
  [5, "가슴줄이 넓어서 당겨도 켁켁거리지 않아요. 색도 사진이랑 똑같습니다."],
  [5, "산책 나갈 때마다 머리 안 넣어도 돼서 너무 편해요. 재구매 의사 있습니다."],
  [4, "사이즈가 살짝 커서 한 치수 작게 사도 될 것 같아요. 그래도 만족합니다."],
  [5, "반사 띠 덕분에 저녁 산책이 안심돼요. 마감도 깔끔합니다."],
  [3, "배송은 빨랐는데 버클이 조금 뻑뻑해요. 쓰다 보면 나아질 것 같습니다."],
  [5, "이름 각인이 또렷하고 예뻐요. 선물용으로 하나 더 주문했습니다."],
  [4, "우리 아이가 제일 좋아하는 장난감이 됐어요. 세탁해도 멀쩡합니다."],
];

const NAMES = ["설기맘", "보리아빠", "콩이네", "두부집사", "모카언니", "호두네", "찰떡이"];
const REVIEW_PHOTOS = [
  "/mock/review-dog-1.svg",
  "/mock/review-dog-2.svg",
  "/mock/review-dog-3.svg",
  "/mock/review-dog-4.svg",
];

function reviewsFor(seed: Seed, detail: ProductDetail): PublicReview[] {
  const count = seed.productNo <= 3 ? 7 : seed.productNo % 3;
  return Array.from({ length: count }, (_, i) => {
    const [rating, content] = REVIEW_TEXTS[(i + seed.productNo) % REVIEW_TEXTS.length] as [
      number,
      string,
    ];
    const variant = detail.variants[i % detail.variants.length];
    const day = 20 - i * 2;
    return {
      reviewId: `rev_${seed.productNo}_${i + 1}`,
      rating,
      content,
      images:
        i % 2 === 0 ? [REVIEW_PHOTOS[(i + seed.productNo) % REVIEW_PHOTOS.length] as string] : [],
      optionName: variant?.name ? variant.name : null,
      variantId: variant?.variantId ?? null,
      writerMaskedName: `${(NAMES[(i + seed.productNo) % NAMES.length] as string).slice(0, 2)}**`,
      sellerReply:
        i === 1
          ? {
              content: "소중한 후기 감사합니다. 산책길이 늘 즐겁기를 바랍니다.",
              repliedAt: `2026-10-${String(day + 1).padStart(2, "0")}T10:00:00.000Z`,
            }
          : null,
      createdAt: `2026-10-${String(day).padStart(2, "0")}T09:30:00.000Z`,
    };
  });
}

function inquiriesFor(seed: Seed): PublicInquiry[] {
  if (seed.productNo > 4) return [];
  return [
    {
      inquiryId: `inq_${seed.productNo}_1`,
      content: "7kg 푸들인데 어떤 사이즈가 맞을까요?",
      secret: false,
      mine: false,
      writerMaskedName: "보리**",
      answer: {
        content: "가슴둘레 40cm 안팎이면 M을 권합니다. 상세의 사이즈 가이드를 참고하십시오.",
        answeredAt: "2026-10-18T11:00:00.000Z",
      },
      createdAt: "2026-10-17T20:10:00.000Z",
      productId: seed.productId,
      productName: seed.name,
      thumbnailUrl: null,
      category: "PRODUCT",
    },
    {
      inquiryId: `inq_${seed.productNo}_2`,
      content: null,
      secret: true,
      mine: false,
      writerMaskedName: "콩이**",
      answer: null,
      createdAt: "2026-10-19T08:00:00.000Z",
      productId: seed.productId,
      productName: seed.name,
      thumbnailUrl: null,
      category: "DELIVERY",
    },
  ];
}

export interface MockProduct {
  card: ProductCard;
  detail: ProductDetail;
  categoryId: string;
  addedAt: number;
  reviews: PublicReview[];
  inquiries: PublicInquiry[];
}

export const mockProducts: MockProduct[] = SEEDS.map((seed) => {
  const detailBase: ProductDetail = {
    productId: seed.productId,
    productNo: seed.productNo,
    name: seed.name,
    thumbnailUrl: seed.images[0] ?? null,
    currency: "KRW",
    availableInMarket: true,
    salePrice: seed.salePrice,
    discountedPrice: seed.discountedPrice ?? null,
    discountRate: seed.discountedPrice
      ? Math.round((1 - seed.discountedPrice / seed.salePrice) * 100)
      : null,
    originalPrice: seed.originalPrice ?? null,
    freeShipping: seed.freeShipping ?? false,
    fulfillment: SHIPPING,
    averageRating: 0,
    reviewCount: 0,
    soldOut: seed.soldOut ?? false,
    description: seed.description,
    images: seed.images,
    optionGroups: [],
    variants: [
      {
        variantId: `var_mock_${seed.productNo}_0`,
        variantNo: `${seed.productNo}-01`,
        valueIds: [],
        name: "",
        additionalPrice: 0,
        soldOut: seed.soldOut ?? false,
      },
    ],
    addonGroups: [],
    customInputs: [],
    returnPeriodDays: 7,
    purchasePoint: seed.purchasePoint ?? null,
    categoryPath: PATHS[seed.categoryId] ?? [],
    notice: null,
    certifications: null,
    infoSections: [],
    ...seed.detail,
  };
  const reviews = reviewsFor(seed, detailBase);
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const detail = { ...detailBase, averageRating, reviewCount: reviews.length };
  const card: ProductCard = {
    productId: detail.productId,
    currency: detail.currency,
    availableInMarket: true,
    productNo: detail.productNo,
    name: detail.name,
    salePrice: detail.salePrice,
    discountedPrice: detail.discountedPrice,
    discountRate: detail.discountRate,
    originalPrice: detail.originalPrice,
    freeShipping: detail.freeShipping,
    thumbnailUrl: detail.thumbnailUrl,
    fulfillment: { type: "SHIPPING", requiresShipping: true },
    averageRating,
    reviewCount: reviews.length,
    soldOut: detail.soldOut,
  };
  return {
    card,
    detail,
    categoryId: seed.categoryId,
    addedAt: seed.addedAt,
    reviews,
    inquiries: inquiriesFor(seed),
  };
});

export interface MockCollection extends StorefrontCollection {
  productIds: string[];
}

export const mockCollections: MockCollection[] = [
  {
    collectionId: "col_autumn_walk",
    slug: "autumn-walk",
    title: "가을 산책 기획전",
    description: "목이 편한 하네스와 밤길에 잘 보이는 리드줄을 모았습니다.",
    imageUrl: "/mock/harness-peach.svg",
    startsAt: "2026-10-01T00:00:00.000Z",
    endsAt: "2026-11-30T14:59:59.000Z",
    productIds: ["prod_fa41d076cb03", "prod_mock_08", "prod_da2807ba7b9a", "prod_ae28281c2355"],
  },
  {
    collectionId: "col_name_tag",
    slug: "name-tag",
    title: "이름표 주문제작",
    description: "이름과 문구를 새기는 금속 이름표입니다.",
    imageUrl: "/mock/tag-bone.svg",
    startsAt: null,
    endsAt: null,
    productIds: ["prod_a000499d23f2", "prod_mock_12", "prod_mock_10"],
  },
];
