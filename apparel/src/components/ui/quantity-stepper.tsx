import { Minus, Plus } from "lucide-react";
import { m } from "../../i18n";

/** 수량 −/+ — 터치 영역 44px */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center border border-line-strong">
      <button
        type="button"
        className="grid size-11 place-items-center disabled:opacity-30"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= min}
        aria-label={m.qty_decrease()}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="tabular w-10 text-center text-body" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="grid size-11 place-items-center disabled:opacity-30"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={m.qty_increase()}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
