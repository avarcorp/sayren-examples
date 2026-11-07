import type { OptionChoices } from "@sayren/storefront-sdk";
import { m } from "../../i18n";
import { formatMoney } from "../../lib/format";

/**
 * 조합 옵션 버튼 — `optionChoicesOf` 결과만 그린다. 품절은 글자로 알리고 고를 수 없다.
 * 선택한 값은 네이비 테두리(바탕색 없음)
 */
export function OptionPicker({
  groups,
  currency,
  onChoose,
}: {
  groups: OptionChoices["groups"];
  currency: string;
  onChoose: (groupIndex: number, valueId: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group, g) => {
        const selected = group.values.find((v) => v.selected);
        return (
          <fieldset key={group.groupId} className="flex flex-col gap-2">
            <legend className="pb-2 text-meta">
              <span className="text-sub">{group.name}</span>
              {selected ? <span className="ml-2 font-semibold">{selected.name}</span> : null}
            </legend>
            <div className="flex flex-wrap gap-2">
              {group.values.map((value) => {
                const disabled = value.state !== "AVAILABLE";
                return (
                  <button
                    key={value.valueId}
                    type="button"
                    aria-pressed={value.selected}
                    disabled={disabled}
                    onClick={() => onChoose(g, value.selected ? null : value.valueId)}
                    className={`flex min-h-11 min-w-14 items-center justify-center gap-1 border px-3 text-meta ${
                      value.selected
                        ? "border-point font-semibold text-point outline outline-1 outline-point"
                        : "border-line-strong hover:border-ink"
                    } disabled:cursor-not-allowed disabled:border-line disabled:text-muted`}
                  >
                    <span className={value.state === "SOLD_OUT" ? "line-through" : ""}>
                      {value.name}
                    </span>
                    {value.state === "SOLD_OUT" ? (
                      <span className="text-caption">{m.badge_sold_out()}</span>
                    ) : null}
                    {value.additionalPrice ? (
                      <span className="text-caption text-sub">
                        +{formatMoney(value.additionalPrice, currency)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
