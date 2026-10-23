import type { StoreInfo } from "../lib/store";

/**
 * 이용약관·개인정보처리방침 — 셀러가 고쳐 쓰는 문서라 화면 코드가 아니라 여기 둔다.
 * 사업자 이름·연락처는 상점 정보(`GET /store`)에서 오고, 비어 있으면 그 문장에서 빼거나 「고객센터」로 쓴다.
 */
export interface PolicyDocument {
  title: string;
  updatedAt: string;
  sections: { heading: string; paragraphs: string[] }[];
}

function seller(store: StoreInfo | null) {
  return {
    company: store?.businessName ?? store?.name ?? "회사",
    contact:
      [store?.customerCenterPhone, store?.customerCenterEmail].filter(Boolean).join(", ") ||
      "고객센터",
    officer: store?.privacyOfficerName ?? "개인정보보호책임자",
    officerContact: [
      store?.customerCenterPhone,
      store?.privacyOfficerEmail ?? store?.customerCenterEmail,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

export function termsOf(store: StoreInfo | null): PolicyDocument {
  const s = seller(store);
  return {
    title: "이용약관",
    updatedAt: "2026년 10월 1일",
    sections: [
      {
        heading: "제1조 (목적)",
        paragraphs: [
          `이 약관은 ${s.company}(이하 "회사")가 운영하는 온라인 쇼핑몰에서 제공하는 전자상거래 관련 서비스를 이용할 때 회사와 이용자의 권리·의무 및 책임 사항을 정하는 것을 목적으로 합니다.`,
        ],
      },
      {
        heading: "제2조 (회원가입)",
        paragraphs: [
          "이용자는 회사가 정한 양식에 따라 회원정보를 입력하고 이 약관에 동의하여 회원가입을 신청합니다.",
          "회원은 등록한 정보가 바뀌면 마이페이지에서 수정해야 합니다.",
        ],
      },
      {
        heading: "제3조 (구매 신청과 계약 성립)",
        paragraphs: [
          "이용자는 상품 선택, 배송지·연락처 입력, 결제 수단 선택, 약관 동의의 절차로 구매를 신청합니다.",
          "회사가 결제 완료를 확인하면 구매 계약이 성립합니다. 재고 부족 등으로 공급이 어려우면 지체 없이 알리고 결제 금액을 환불합니다.",
        ],
      },
      {
        heading: "제4조 (주문제작 상품)",
        paragraphs: [
          "이름표 각인처럼 이용자가 입력한 내용으로 만드는 상품은 제작을 시작한 뒤에는 단순 변심에 의한 교환·반품이 제한됩니다. 제작 전 취소는 주문 상세에서 신청합니다.",
        ],
      },
      {
        heading: "제5조 (배송)",
        paragraphs: [
          "배송비·무료배송 기준·예상 배송 기간은 상품 상세의 배송 안내에 표시합니다.",
          "제주·도서산간 지역은 추가 배송비가 있을 수 있습니다.",
        ],
      },
      {
        heading: "제6조 (청약철회·교환·반품)",
        paragraphs: [
          "이용자는 상품을 받은 날부터 7일 이내에 청약을 철회(반품)하거나 교환을 신청할 수 있습니다.",
          "단순 변심에 의한 반품·교환 배송비는 상품 상세의 교환·반품 안내에 표시한 금액이며 이용자가 부담합니다. 상품 불량·오배송은 회사가 부담합니다.",
        ],
      },
      {
        heading: "제7조 (환불)",
        paragraphs: ["반품 상품이 회수·검수되면 3영업일 안에 결제 수단으로 환불합니다."],
      },
      {
        heading: "제8조 (분쟁 해결)",
        paragraphs: [
          `이용자의 불만과 의견은 ${s.contact}로 접수하며, 회사는 접수 순서대로 신속히 처리합니다.`,
        ],
      },
    ],
  };
}

export function privacyOf(store: StoreInfo | null): PolicyDocument {
  const s = seller(store);
  return {
    title: "개인정보처리방침",
    updatedAt: "2026년 10월 1일",
    sections: [
      {
        heading: "1. 수집하는 개인정보 항목",
        paragraphs: [
          "회원가입: 이메일, 비밀번호, 이름, 휴대폰 번호(선택)",
          "주문·배송: 주문자 이름·연락처·이메일, 받는 분 이름·연락처·주소, 비회원 주문 조회 비밀번호",
          "결제: 결제 수단 정보는 결제대행사가 처리하며 회사는 카드번호를 저장하지 않습니다.",
        ],
      },
      {
        heading: "2. 수집·이용 목적",
        paragraphs: [
          "주문 처리와 상품 배송, 교환·반품·환불 처리, 고객 문의 응대, 회원 관리에 이용합니다.",
        ],
      },
      {
        heading: "3. 보유·이용 기간",
        paragraphs: [
          "회원 탈퇴 시 지체 없이 파기합니다. 단, 전자상거래법에 따라 계약·청약철회 기록과 대금결제·재화 공급 기록은 5년, 소비자 불만·분쟁 처리 기록은 3년 보관합니다.",
        ],
      },
      {
        heading: "4. 제3자 제공·처리 위탁",
        paragraphs: [
          "상품 배송을 위해 택배사에 받는 분 정보를, 결제 처리를 위해 결제대행사에 결제 정보를 제공합니다. 쇼핑몰 운영 시스템은 sayren 플랫폼에 위탁합니다.",
        ],
      },
      {
        heading: "5. 이용자의 권리",
        paragraphs: ["이용자는 언제든지 마이페이지에서 개인정보를 조회·수정할 수 있습니다."],
      },
      {
        heading: "6. 개인정보보호책임자",
        paragraphs: [`책임자 ${s.officer}${s.officerContact ? ` · ${s.officerContact}` : ""}`],
      },
    ],
  };
}
