import type { ReactNode } from "react";

/**
 * 주문서 폼 행 — 데스크톱은 라벨 120px | 내용, 모바일은 위아래다. 입력 하나짜리 칸은 `TextField row`를 쓰고,
 * 칸이 여럿이거나(주소) 입력 + 버튼(쿠폰·적립금)인 행에 쓴다. 라벨은 묶음 이름이라 각 입력은 자기 이름(aria-label)을 가진다.
 */
export function FormRow({
  label,
  required,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    // 그리드 안에서 legend는 칸으로 놓이지 않는다 — 이름은 숨긴 legend가, 눈에 보이는 라벨은 첫 칸이 맡는다
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="grid min-w-0 gap-2 md:grid-cols-[120px_minmax(0,1fr)] md:gap-4">
        <span aria-hidden="true" className="font-medium text-meta md:pt-3 md:text-body">
          {label}
          {required ? <span className="text-point"> *</span> : null}
        </span>
        <div className="flex min-w-0 flex-col gap-2">{children}</div>
      </div>
    </fieldset>
  );
}
