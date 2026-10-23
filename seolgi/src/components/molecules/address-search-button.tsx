import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type Address, KakaoPostcodeEmbed, loadPostcode } from "react-daum-postcode";
import { buttonClass } from "../atoms/button";

/** 검색 결과의 기본 주소 — 도로명 + (법정동, 건물명). 지번을 고르면 지번 주소 */
export function baseAddressOf(
  a: Pick<
    Address,
    "userSelectedType" | "address" | "roadAddress" | "jibunAddress" | "bname" | "buildingName"
  >,
) {
  if (a.userSelectedType === "J") return a.jibunAddress || a.address;
  const road = a.roadAddress || a.address;
  const extra = [/[동로가]$/.test(a.bname) ? a.bname : "", a.buildingName]
    .filter(Boolean)
    .join(", ");
  return extra ? `${road} (${extra})` : road;
}

/**
 * 주소 검색 — 카카오 우편번호 서비스를 대화상자에 띄운다. 스크립트를 불러오지 못하면(차단된 환경)
 * `onUnavailable`로 손 입력을 열게 한다.
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <>
      <button
        type="button"
        aria-busy={loading || undefined}
        onClick={() => {
          if (loading) return;
          setLoading(true);
          loadPostcode()
            .then(() => setOpen(true))
            .catch(onUnavailable)
            .finally(() => setLoading(false));
        }}
        className={buttonClass({ variant: "subtle", size: "sm" })}
      >
        <Search className="size-4" strokeWidth={1.8} aria-hidden />
        주소 검색
      </button>
      <dialog
        ref={dialog}
        aria-label="주소 검색"
        onClose={() => setOpen(false)}
        className="m-auto w-[min(520px,calc(100vw-2rem))] bg-page p-0 backdrop:bg-ink/40"
      >
        <div className="flex items-center justify-between border-line border-b px-4">
          <span className="font-medium text-body">주소 검색</span>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setOpen(false)}
            className="grid size-11 place-items-center"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="h-[min(70dvh,480px)]">
          {open ? (
            <KakaoPostcodeEmbed
              style={{ height: "100%" }}
              autoClose={false}
              onComplete={(a) => {
                setOpen(false);
                const value = { zipCode: a.zonecode, address1: baseAddressOf(a) };
                window.setTimeout(() => onSelect(value), 0);
              }}
            />
          ) : null}
        </div>
      </dialog>
    </>
  );
}
