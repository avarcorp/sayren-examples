import { ChevronDown } from "lucide-react";
import { m } from "../../i18n";

/**
 * 정렬 — 데스크톱은 글자 탭, 모바일은 네이티브 선택 상자(OS 선택 시트가 열린다).
 */
export function SortControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <>
      <fieldset className="hidden min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-meta md:flex">
        <legend className="sr-only">{m.products_sort()}</legend>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
            className={option.value === value ? "font-bold text-ink" : "text-muted hover:text-ink"}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
      <label className="relative flex items-center md:hidden">
        <span className="sr-only">{m.products_sort()}</span>
        <select
          value={value}
          onChange={(event) => {
            const next = options.find((option) => option.value === event.target.value);
            if (next) onChange(next.value);
          }}
          className="h-9 appearance-none bg-transparent pr-5 text-right text-meta outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-0 size-4"
          strokeWidth={1.6}
        />
      </label>
    </>
  );
}
