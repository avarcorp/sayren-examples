import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import { nextActiveIndex, type StepValue } from "../lib/option-steps";
import { additionalPriceLabel } from "../lib/product-options";

/**
 * 단계형 옵션의 한 단계 — 버튼을 누르면 값 목록(listbox)이 펼쳐진다.
 *
 * 키보드: 버튼에서 ↓·Enter·Space로 열고, 목록에서 ↑↓·Home·End로 움직이며 Enter·Space로 고른다. Esc는 닫고 버튼으로
 * 돌아간다. 품절 값은 `aria-disabled`이고 키보드 이동에서 건너뛴다. 앞 단계를 고르기 전에는 버튼이 비활성이다.
 *
 * `inline`이면 목록을 띄우지 않고 버튼 아래 흐름에 펼친다. 스크롤 몸통 안(모바일 옵션 시트)에서 띄운 목록은
 * 몸통 높이에 들어가지 않아 잘리므로, 펼친 만큼 몸통이 늘어나게 한다.
 */
export function OptionDropdown({
  name,
  values,
  selectedValueId,
  locked,
  onSelect,
  buttonRef,
  defaultOpen = false,
  inline = false,
}: {
  /** 옵션 축 이름(색상·사이즈) */
  name: string;
  values: StepValue[];
  selectedValueId: string | null;
  /** 앞 단계를 아직 고르지 않았다 */
  locked: boolean;
  onSelect: (valueId: string) => void;
  /** 다음 단계로 포커스를 옮길 때 쓴다 */
  buttonRef?: React.Ref<HTMLButtonElement>;
  /** 처음부터 펼친다 — 서버 렌더 테스트용 */
  defaultOpen?: boolean;
  /** 목록을 띄우지 않고 흐름 안에 펼친다 — 스크롤 몸통 안에 둘 때 */
  inline?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const ownButton = useRef<HTMLButtonElement | null>(null);
  const disabled = values.map((value) => value.soldOut);
  const selected = values.find((value) => value.valueId === selectedValueId) ?? null;

  // 바깥을 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus({ preventScroll: true });
    // 흐름 안에 펼친 목록은 스크롤 몸통 아래로 넘칠 수 있어 보이는 곳까지 끌어온다
    if (inline) listRef.current?.scrollIntoView({ block: "nearest" });
  }, [open, inline]);

  const openList = () => {
    if (locked) return;
    const start = values.findIndex((value) => value.valueId === selectedValueId);
    setActive(start >= 0 && !disabled[start] ? start : nextActiveIndex(disabled, -1, "Home"));
    setOpen(true);
  };
  const closeList = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) ownButton.current?.focus();
  };
  const pick = (index: number) => {
    const value = values[index];
    if (!value || value.soldOut) return;
    setOpen(false);
    onSelect(value.valueId);
  };

  const labelOf = (value: StepValue) => {
    const price =
      value.additionalPrice != null ? additionalPriceLabel(value.additionalPrice, formatPrice) : "";
    const text = `${value.name}${price}`;
    return value.soldOut ? m.pd_option_sold_out({ name: text }) : text;
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={(node) => {
          ownButton.current = node;
          if (typeof buttonRef === "function") buttonRef(node);
          else if (buttonRef)
            (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={
          locked
            ? m.pd_option_locked({ name })
            : selected
              ? m.pd_option_selected({ name, value: selected.name })
              : name
        }
        disabled={locked}
        onClick={() => (open ? closeList(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openList();
          }
        }}
        className={`flex h-12 w-full min-w-0 items-center justify-between gap-2 border bg-page px-3.5 text-left text-body focus:outline-none focus-visible:border-ink focus-visible:outline-1 focus-visible:outline-ink ${
          open ? "border-ink" : "border-line-strong hover:border-ink"
        } disabled:cursor-not-allowed disabled:border-line disabled:bg-chip disabled:text-muted`}
      >
        <span className={`min-w-0 truncate ${selected ? "text-ink" : "text-muted"}`}>
          {selected ? m.pd_option_selected({ name, value: selected.name }) : name}
        </span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={1.6}
          className={`size-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={name}
          tabIndex={-1}
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          onKeyDown={(event) => {
            if (
              event.key === "ArrowDown" ||
              event.key === "ArrowUp" ||
              event.key === "Home" ||
              event.key === "End"
            ) {
              event.preventDefault();
              setActive((current) => nextActiveIndex(disabled, current, event.key as "Home"));
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              pick(active);
            } else if (event.key === "Escape") {
              event.preventDefault();
              closeList(true);
            } else if (event.key === "Tab") {
              setOpen(false);
            }
          }}
          className={`max-h-72 overflow-y-auto border border-ink border-t-0 bg-page outline-none ${
            inline ? "" : "absolute inset-x-0 top-full z-30"
          }`}
        >
          {values.map((value, index) => {
            const isSelected = value.valueId === selectedValueId;
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: 키보드는 목록(listbox)의 aria-activedescendant로 다룬다
              <div
                key={value.valueId}
                id={`${id}-opt-${index}`}
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                aria-disabled={value.soldOut || undefined}
                onMouseEnter={() => !value.soldOut && setActive(index)}
                onClick={() => pick(index)}
                className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 text-body ${
                  index === active ? "bg-chip" : ""
                } ${isSelected ? "font-bold" : ""} ${value.soldOut ? "cursor-not-allowed text-muted/70" : ""}`}
              >
                <span className="min-w-0 break-words">{labelOf(value)}</span>
                {isSelected ? (
                  <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
