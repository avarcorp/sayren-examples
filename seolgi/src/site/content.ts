/**
 * 셀러가 바꾸는 사이트 문구·표 — 화면 코드에 흩어 두지 않는다. 상품명·가격은 여기 두지 않는다(API 값을 쓴다).
 */
export const siteContent = {
  /** 상단 띠 — 상점의 배송비 정책과 맞춰 셀러가 고친다 */
  promoBand: "30,000원 이상 무료배송",
} as const;

export const homeContent = {
  hero: {
    eyebrow: "가을 산책 기획전",
    title: "오늘도 꼬리 흔드는 산책",
    body: "목이 편한 하네스와 이름표를 한 번에 맞춥니다.",
    cta: "하네스 보기",
    /** 버튼이 여는 카테고리 이름(대분류·중분류 어디든) */
    ctaCategory: "하네스",
  },
  rails: [
    { title: "새로 들어온 상품", sort: "latest" },
    { title: "많이 찾는 상품", sort: "reviewCount" },
  ] as const,
  nameTag: {
    eyebrow: "주문제작",
    title: "우리 아이 이름을\n새겨 드립니다",
    body: "모양과 색을 고르고 이름을 입력하면 만들어 보냅니다.",
    cta: "이름표 만들기",
    category: "이름표 제작",
  },
} as const;

/**
 * 색상 옵션 스와치 — 옵션 값 이름이 이 표에 있으면 원형 스와치로, 없으면 글자 버튼으로 그린다.
 * 셀러가 새 색을 등록하면 여기에 색 값을 더한다.
 */
export const colorSwatches: Record<string, string> = {
  크림: "#f4ead8",
  피치: "#f6c1a8",
  민트: "#bfe3d6",
  차콜: "#3a3a3a",
  블랙: "#1b1b1b",
  네이비: "#24304a",
  코랄: "#f08a6c",
  골드: "#e6cf9f",
  실버: "#dcdde0",
  로즈골드: "#efc2b3",
};

/** 이름표 미리보기 — 모양·색상 옵션 이름과 각인 칸 이름이 이 표와 맞으면 상세에서 미리보기를 그린다 */
export const nameTagPreview = {
  shapeGroup: "모양",
  colorGroup: "색상",
  nameInput: "앞면 이름",
  shapes: { 원형: "circle", 뼈다귀: "bone", 하트: "heart" } as Record<
    string,
    "circle" | "bone" | "heart"
  >,
  metals: {
    골드: { face: "#e6cf9f", edge: "#cdb07a", ink: "#6b5330" },
    실버: { face: "#dcdde0", edge: "#babcc2", ink: "#45474d" },
    로즈골드: { face: "#efc2b3", edge: "#d9a08d", ink: "#6e3f31" },
  } as Record<string, { face: string; edge: string; ink: string }>,
} as const;
