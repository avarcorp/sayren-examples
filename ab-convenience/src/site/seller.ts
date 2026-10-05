import type { StorefrontStore } from "@sayren/storefront-sdk";
import { BUSINESS_INFO, SHOP_POLICY } from "./business";

/**
 * 판매자(사업자) 정보 — 푸터·상세의 판매자정보 탭이 이 헬퍼 하나로 읽는다.
 *
 * 스토어프론트 상점 정보(`GET /store`, storefront-sdk 0.18.2)의 사업자 필드를 먼저 쓰고, 비어 있는 항목만
 * `business.ts`의 예시 값으로 채운다. 반품 주소는 상점 정보에 없어 늘 `SHOP_POLICY` 값이다(반품지 API 없음, GAPS G2).
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
  /** 반품·교환 받는 주소(반품지 API가 없어 예시 값) */
  returnAddress: string;
  logoUrl: string | null;
}

type StoreFields = Pick<
  StorefrontStore,
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
  const number = text(s.businessNumber);
  return {
    companyName: text(s.businessName) ?? BUSINESS_INFO.companyName,
    ceo: text(s.representativeName) ?? BUSINESS_INFO.ceo,
    businessNumber: number ? formatBusinessNumber(number) : BUSINESS_INFO.businessNumber,
    mailOrderNumber: text(s.mailOrderSalesNumber) ?? BUSINESS_INFO.mailOrderNumber,
    address: text(s.businessAddress) ?? BUSINESS_INFO.address,
    phone: text(s.customerCenterPhone) ?? BUSINESS_INFO.phone,
    email: text(s.customerCenterEmail) ?? BUSINESS_INFO.email,
    businessHours: text(s.businessHours) ?? BUSINESS_INFO.businessHours,
    privacyOfficer: text(s.privacyOfficerName) ?? BUSINESS_INFO.privacyOfficer,
    privacyOfficerEmail: text(s.privacyOfficerEmail) ?? BUSINESS_INFO.privacyOfficerEmail,
    returnAddress: SHOP_POLICY.returnAddress,
    logoUrl: text(s.logoUrl),
  };
}
