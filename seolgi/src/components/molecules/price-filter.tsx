import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "../../lib/format";
import { Button } from "../atoms/button";

export interface PriceBounds {
  min?: number;
  max?: number;
}

const PRESETS: { label: string; value: PriceBounds }[] = [
  { label: "1만원 이하", value: { max: 10000 } },
  { label: "1만원~3만원", value: { min: 10000, max: 30000 } },
  { label: "3만원 이상", value: { min: 30000 } },
];

/** 가격 필터 — 버튼을 누르면 범위 바로 고르기와 직접 입력이 열린다. 값은 주소에 둔다 */
export function PriceFilter({
  value,
  range,
  onChange,
}: {
  value: PriceBounds;
  /** 지금 조건의 최저·최고가 — 입력칸 안내 글자 */
  range?: { min: number; max: number };
  onChange: (value: PriceBounds) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const active = value.min !== undefined || value.max !== undefined;
  const label = active
    ? `${value.min !== undefined ? formatMoney(value.min) : ""}~${value.max !== undefined ? formatMoney(value.max) : ""}`
    : "가격";
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-11 items-center gap-1.5 ${active ? "font-medium text-primary" : ""}`}
      >
        {label}
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <form
          className="absolute top-full left-0 z-20 flex w-[min(320px,calc(100vw-2rem))] flex-col gap-4 border border-ink bg-page p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const num = (k: string) => {
              const v = Number(String(form.get(k) ?? "").replaceAll(",", ""));
              return v > 0 ? v : undefined;
            };
            onChange({ min: num("min"), max: num("max") });
            setOpen(false);
          }}
        >
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="h-9 border border-line-strong px-3 text-small hover:border-ink"
                onClick={() => {
                  onChange(p.value);
                  setOpen(false);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-body">
            <input
              name="min"
              inputMode="numeric"
              aria-label="최저 가격"
              defaultValue={value.min}
              placeholder={range ? String(range.min) : "최저"}
              className="h-11 w-full min-w-0 border-ink border-b bg-transparent outline-none"
            />
            ~
            <input
              name="max"
              inputMode="numeric"
              aria-label="최고 가격"
              defaultValue={value.max}
              placeholder={range ? String(range.max) : "최고"}
              className="h-11 w-full min-w-0 border-ink border-b bg-transparent outline-none"
            />
          </div>
          <div className="flex gap-2">
            {active ? (
              <Button
                variant="subtle"
                size="sm"
                className="flex-1"
                onClick={() => {
                  onChange({});
                  setOpen(false);
                }}
              >
                초기화
              </Button>
            ) : null}
            <Button type="submit" size="sm" className="flex-1">
              적용
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
