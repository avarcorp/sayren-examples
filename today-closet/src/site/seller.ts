import type { StorefrontStore } from "@sayren/storefront-sdk";
import { useRouterState } from "@tanstack/react-router";
import { m } from "../i18n";
import type { RootData } from "../routes/__root";

/**
 * 판매자(사업자) 정보 — 푸터·상세의 판매자정보 탭이 이 헬퍼 하나로 읽는다.
 *
 * 스토어프론트 상점 정보(`GET /store`)의 사업자 필드만 쓴다. 비어 있는 항목은 「추후 안내」로 보인다 — 다른 상점의
 * 예시 값으로 채우지 않는다(법정 표시가 틀리게 보인다). 반품 주소는 반품지 API가 없어 사업장 주소를 쓴다.
 */
export interface SellerInfo {
  companyName: string;
  ceo: string;
  /** 표시 형식 `123-45-67890` */
  businessNumber: string;
  mailOrderNumber: string;
  address: string;
  phone: string;
  email: string;
  businessHours: string;
  privacyOfficer: string;
  privacyOfficerEmail: string;
  /** 반품·교환 받는 주소(반품지 API가 없어 사업장 주소) */
  returnAddress: string;
  logoUrl: string | null;
}

type StoreFields = Pick<
  StorefrontStore,
  | "name"
  | "logoUrl"
  | "customerCenterPhone"
  | "businessHours"
  | "businessName"
  | "representativeName"
  | "businessNumber"
  | "mailOrderSalesNumber"
  | "businessAddress"
  | "customerCenterEmail"
  | "privacyOfficerName"
  | "privacyOfficerEmail"
>;

function text(value: string | null | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

/** API는 숫자 10자리로 준다 — `123-45-67890`으로 끊는다. 형식이 다르면 받은 그대로 */
export function formatBusinessNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
    : value;
}

export function sellerInfoOf(store: Partial<StoreFields> | null): SellerInfo {
  const s = store ?? {};
  const pending = m.seller_info_pending();
  const number = text(s.businessNumber);
  const address = text(s.businessAddress);
  return {
    companyName: text(s.businessName) ?? text(s.name) ?? pending,
    ceo: text(s.representativeName) ?? pending,
    businessNumber: number ? formatBusinessNumber(number) : pending,
    mailOrderNumber: text(s.mailOrderSalesNumber) ?? pending,
    address: address ?? pending,
    phone: text(s.customerCenterPhone) ?? pending,
    email: text(s.customerCenterEmail) ?? pending,
    businessHours: text(s.businessHours) ?? pending,
    privacyOfficer: text(s.privacyOfficerName) ?? pending,
    privacyOfficerEmail: text(s.privacyOfficerEmail) ?? pending,
    returnAddress: address ?? pending,
    logoUrl: text(s.logoUrl),
  };
}

/** 루트 loader가 만든 판매자 정보 — 약관·방침·고객센터 화면이 읽는다 */
export function useSellerInfo(): SellerInfo {
  const root = useRouterState({
    select: (state) => state.matches[0]?.loaderData as RootData | undefined,
  });
  return root?.seller ?? sellerInfoOf(null);
}
