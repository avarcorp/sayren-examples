import { Link } from "@tanstack/react-router";
import type { StoreInfo } from "../../lib/store";

/** 푸터 — 상점 정보 API의 사업자 정보를 받은 그대로 보인다. 비어 있는 칸은 그리지 않는다 */
export function SiteFooter({ store }: { store: StoreInfo | null }) {
  const lines = store
    ? [
        store.businessName && `상호 ${store.businessName}`,
        store.representativeName && `대표 ${store.representativeName}`,
        store.businessNumber && `사업자등록번호 ${formatBizNo(store.businessNumber)}`,
        store.mailOrderSalesNumber && `통신판매업 신고번호 ${store.mailOrderSalesNumber}`,
        store.businessAddress,
        store.privacyOfficerName &&
          `개인정보 보호책임자 ${store.privacyOfficerName}${store.privacyOfficerEmail ? ` (${store.privacyOfficerEmail})` : ""}`,
      ].filter(Boolean)
    : [];
  return (
    <footer className="mt-24 border-line border-t">
      <div className="mx-auto flex max-w-page flex-wrap gap-12 px-4 pt-12 pb-16 text-small text-muted leading-7 md:px-10">
        <div className="min-w-0 flex-[1_1_420px]">
          <p className="font-display text-title text-ink">{store?.name ?? "설기로운"}</p>
          {lines.map((line) => (
            <p key={String(line)}>{line}</p>
          ))}
        </div>
        <div className="flex-[0_1_280px]">
          {store?.customerCenterPhone ? (
            <p className="font-medium text-ink">고객센터 {store.customerCenterPhone}</p>
          ) : null}
          {store?.businessHours ? <p>{store.businessHours}</p> : null}
          {store?.customerCenterEmail ? <p>{store.customerCenterEmail}</p> : null}
          <p className="mt-2 flex flex-wrap gap-x-3">
            <Link to="/terms" className="hover:text-ink">
              이용약관
            </Link>
            <Link to="/privacy" className="font-bold text-ink">
              개인정보처리방침
            </Link>
            <Link to="/guest-order" className="hover:text-ink">
              비회원 주문 조회
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** 숫자 10자리 사업자등록번호를 123-45-67890으로 끊는다 */
function formatBizNo(value: string): string {
  return /^\d{10}$/.test(value)
    ? `${value.slice(0, 3)}-${value.slice(3, 5)}-${value.slice(5)}`
    : value;
}
