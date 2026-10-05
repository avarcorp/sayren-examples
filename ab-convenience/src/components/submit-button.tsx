import { useHydrated } from "@tanstack/react-router";

/**
 * 제출 버튼 — 하이드레이션 전 클릭은 onSubmit이 붙기 전이라 유실되거나 문서를 다시 부른다.
 * 붙은 뒤에만 누를 수 있게 한다.
 */
export function SubmitButton({
  disabled,
  className,
  name,
  value,
  form,
  ariaLabel,
  ariaDescribedBy,
  children,
}: {
  disabled?: boolean;
  className: string;
  name?: string;
  value?: string;
  /** 폼 밖에 둔 버튼(화면 아래 고정 결제 버튼)이 가리키는 폼 id */
  form?: string;
  /** 버튼 글자만으로 무엇을 하는지 알 수 없을 때(목록의 [삭제] 등) 붙이는 접근성 이름 */
  ariaLabel?: string;
  /** 같은 이름의 버튼이 여러 개일 때 구분하는 설명(예: 장바구니 줄의 옵션) */
  ariaDescribedBy?: string;
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      form={form}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      disabled={!hydrated || disabled}
      className={className}
    >
      {children}
    </button>
  );
}
