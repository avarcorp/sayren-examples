import { Search } from "lucide-react";
import { useState } from "react";
import { type Address, KakaoPostcodeEmbed, loadPostcode } from "react-daum-postcode";
import { m } from "../../i18n";
import { buttonClass } from "../ui/button";
import { Sheet } from "../ui/sheet";

/** 검색 결과의 기본 주소 — 도로명 주소 + (법정동, 건물명). 지번을 고르면 지번 주소 그대로다 */
export function baseAddressOf(
  address: Pick<
    Address,
    "userSelectedType" | "address" | "roadAddress" | "jibunAddress" | "bname" | "buildingName"
  >,
): string {
  if (address.userSelectedType === "J") return address.jibunAddress || address.address;
  const road = address.roadAddress || address.address;
  // 법정동은 「동·로·가」로 끝날 때만 붙인다(카카오 우편번호 안내의 참고 항목 규칙)
  const extra = [/[동로가]$/.test(address.bname) ? address.bname : "", address.buildingName]
    .filter(Boolean)
    .join(", ");
  return extra ? `${road} (${extra})` : road;
}

/**
 * 주소 검색 버튼 — 카카오 우편번호 서비스를 시트(모바일 아래 시트·데스크톱 대화상자) 안에 띄운다.
 * 고르면 `onSelect`로 우편번호·기본 주소를 넘긴다. 스크립트를 불러오지 못하면 `onUnavailable` — 화면이 손 입력으로 되돌린다.
 */
export function AddressSearchButton({
  onSelect,
  onUnavailable,
}: {
  onSelect: (value: { zipCode: string; address1: string }) => void;
  onUnavailable: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const close = () => setOpen(false);

  const start = () => {
    if (loading) return;
    setLoading(true);
    // 시트를 열기 전에 스크립트를 먼저 불러 본다 — 막힌 환경(광고 차단·사내망)이면 빈 시트 대신 손 입력으로 돌린다
    loadPostcode()
      .then(() => setOpen(true))
      .catch(() => onUnavailable())
      .finally(() => setLoading(false));
  };

  return (
    <>
      <button
        type="button"
        onClick={start}
        aria-busy={loading || undefined}
        className={buttonClass({ variant: "outline", size: "md", className: "font-medium" })}
      >
        <Search aria-hidden="true" className="size-4" strokeWidth={1.8} />
        {m.checkout_address_search()}
      </button>
      <Sheet
        open={open}
        onClose={close}
        title={m.checkout_address_search()}
        closeLabel={m.checkout_address_search_close()}
      >
        <div className="-m-4 h-[70dvh] md:h-[30rem]">
          <KakaoPostcodeEmbed
            style={{ height: "100%" }}
            autoClose={false}
            onComplete={(address) => {
              close();
              // 시트가 닫히며 초점을 버튼으로 돌려준 뒤에 넘긴다 — 화면이 상세 주소 칸으로 초점을 옮길 수 있게
              const value = { zipCode: address.zonecode, address1: baseAddressOf(address) };
              window.setTimeout(() => onSelect(value), 0);
            }}
            errorMessage={
              <p className="p-4 text-body text-sub">{m.checkout_address_search_unavailable()}</p>
            }
          />
        </div>
      </Sheet>
    </>
  );
}
