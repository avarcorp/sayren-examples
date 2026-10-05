import { m } from "../i18n";
import { type ReceiveMethod, setReceiveMethod } from "../lib/receive-method";

/**
 * 배달·포장 전환 — 두 칸 세그먼트. 값은 `lib/receive-method.ts`가 브라우저에 둔다.
 * `onChange`를 주면(주문서) 저장한 뒤 그 함수도 부른다.
 */
export function ReceiveMethodToggle({
  value,
  onChange,
  className = "",
}: {
  value: ReceiveMethod;
  onChange?: (method: ReceiveMethod) => void;
  className?: string;
}) {
  const options: { method: ReceiveMethod; label: string }[] = [
    { method: "DIRECT", label: m.receive_method_direct() },
    { method: "PICKUP", label: m.receive_method_pickup() },
  ];
  return (
    <fieldset
      className={`grid grid-cols-2 gap-1 rounded-control bg-ground p-1 ${className}`}
      aria-label={m.receive_method_label()}
    >
      {options.map((option) => {
        const on = option.method === value;
        return (
          <button
            key={option.method}
            type="button"
            aria-pressed={on}
            onClick={() => {
              setReceiveMethod(option.method);
              onChange?.(option.method);
            }}
            className={
              on
                ? "h-10 rounded-[0.625rem] bg-page font-bold text-body-lg text-ink shadow-sm"
                : "h-10 rounded-[0.625rem] text-body-lg text-sub"
            }
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
