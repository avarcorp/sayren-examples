import { Minus, Plus } from "lucide-react";

/** 수량 버튼 — − 수 + . 한도 밖이면 그 쪽 버튼을 막는다 */
export function QuantityStepper({
  value,
  min = 1,
  max = 999,
  disabled,
  onChange,
  size = "md",
}: {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  size?: "sm" | "md";
}) {
  const btn = `grid place-items-center disabled:opacity-30 ${size === "sm" ? "size-10" : "size-11"}`;
  return (
    <div className="flex items-center self-start border border-line-strong bg-page">
      <button
        type="button"
        aria-label="수량 줄이기"
        disabled={disabled || value <= min}
        className={btn}
        onClick={() => onChange(value - 1)}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <output aria-label="수량" className="w-10 text-center">
        {value}
      </output>
      <button
        type="button"
        aria-label="수량 늘리기"
        disabled={disabled || value >= max}
        className={btn}
        onClick={() => onChange(value + 1)}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
