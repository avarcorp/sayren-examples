import type { CategoryNode, MemberConsents, StorefrontStore } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { apiFor } from "./api.server";
import { ANALYTICS_DEBUG, API_BASE_URL, MOCK, resolveStoreCode } from "./config.server";
import { readToken } from "./session.server";

/** 헤더·푸터·주문 가능 여부에 쓰는 상점 정보 */
export type StoreInfo = Pick<
  StorefrontStore,
  | "name"
  | "customerCenterPhone"
  | "customerCenterEmail"
  | "businessHours"
  | "businessName"
  | "representativeName"
  | "businessNumber"
  | "mailOrderSalesNumber"
  | "businessAddress"
  | "privacyOfficerName"
  | "privacyOfficerEmail"
  | "checkoutAvailable"
  | "checkoutMode"
  | "guestCheckout"
  | "loginMethods"
>;

export interface RootData {
  store: StoreInfo | null;
  categories: CategoryNode[];
  /**
   * 다시 동의받아야 하는 회원의 동의 상태 — 소셜로 처음 가입했거나 약관이 바뀌었으면 어느 화면에서든 동의를 먼저 받는다.
   * 로그인하지 않았거나 동의가 끝났으면 null
   */
  reconsent: MemberConsents | null;
  /** 진행 중인 기획전이 있는가 — 헤더 메뉴와 홈 바로가기의 「기획전」 */
  hasCollections: boolean;
  /** 방문 분석 설정 — mock 모드에서는 운영 상점에 이벤트를 보내지 않도록 null */
  analytics: { apiBaseUrl: string; storeCode: string; debug: boolean } | null;
}

/**
 * 루트에서 한 번 받는 상점 정보·카테고리. 상점 정보를 못 읽어도 화면은 그린다(주문은 열린 것으로 본다).
 */
export const getRootData = createServerFn({ method: "GET" }).handler(
  async (): Promise<RootData> => {
    const api = apiFor();
    const accessToken = readToken();
    const [store, categories, collections, consents] = await Promise.all([
      api.store.get().catch(() => null),
      api.catalog.listCategories().catch(() => [] as CategoryNode[]),
      api.catalog.listCollections({ size: 1 }).catch(() => null),
      accessToken
        ? apiFor({ accessToken })
            .member.consents()
            .catch(() => null)
        : null,
    ]);
    return {
      store: store
        ? {
            name: store.name,
            customerCenterPhone: store.customerCenterPhone,
            customerCenterEmail: store.customerCenterEmail,
            businessHours: store.businessHours,
            businessName: store.businessName,
            representativeName: store.representativeName,
            businessNumber: store.businessNumber,
            mailOrderSalesNumber: store.mailOrderSalesNumber,
            businessAddress: store.businessAddress,
            privacyOfficerName: store.privacyOfficerName,
            privacyOfficerEmail: store.privacyOfficerEmail,
            checkoutAvailable: store.checkoutAvailable,
            checkoutMode: store.checkoutMode,
            guestCheckout: store.guestCheckout,
            loginMethods: store.loginMethods,
          }
        : null,
      categories,
      reconsent: consents?.reconsentRequired ? consents : null,
      hasCollections: (collections?.totalElements ?? 0) > 0,
      analytics: MOCK
        ? null
        : { apiBaseUrl: API_BASE_URL, storeCode: resolveStoreCode(), debug: ANALYTICS_DEBUG },
    };
  },
);
