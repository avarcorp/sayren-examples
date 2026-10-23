import type { ProductDetail } from "@sayren/storefront-sdk";
import { formatMoney } from "../../lib/format";
import { valueExtraPrice, valueInStock } from "../../lib/variant-pick";
import { Swatch } from "../atoms/swatch";

type Group = ProductDetail["optionGroups"][number];

/**
 * 옵션 한 그룹 — 값 이름이 모두 색 표(`colors`)에 있으면 원형 스와치, 아니면 글자 버튼 격자.
 * 품절은 그 값이 든 조합이 전부 품절일 때만 막는다(서버 `soldOut`).
 */
export function OptionGroup({
  group,
  variants,
  picked,
  colors,
  describedBy,
  onPick,
}: {
  group: Group;
  variants: ProductDetail["variants"];
  picked: string | undefined;
  colors: Record<string, string>;
  describedBy?: string;
  onPick: (valueId: string) => void;
}) {
  const swatches = group.values.every((v) => colors[v.name]);
  const pickedName = group.values.find((v) => v.valueId === picked)?.name;
  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={describedBy}>
      <legend className="flex w-full justify-between pb-3 text-small">
        <span className="font-medium">{group.name}</span>
        <span className="text-muted">{pickedName}</span>
      </legend>
      {swatches ? (
        <div className="flex flex-wrap gap-2.5">
          {group.values.map((value) => (
            <Swatch
              key={value.valueId}
              name={value.name}
              color={colors[value.name] as string}
              on={picked === value.valueId}
              disabled={!valueInStock(variants, value.valueId)}
              onClick={() => onPick(value.valueId)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1.5">
          {group.values.map((value) => {
            const on = picked === value.valueId;
            const available = valueInStock(variants, value.valueId);
            const extra = valueExtraPrice(variants, value.valueId);
            return (
              <button
                key={value.valueId}
                type="button"
                aria-pressed={on}
                disabled={!available}
                onClick={() => onPick(value.valueId)}
                className={`flex min-h-14 flex-col items-center justify-center px-2 py-1.5 text-body ${
                  !available
                    ? "border border-line text-muted"
                    : on
                      ? "border border-primary bg-primary text-white"
                      : "border border-line-strong hover:border-ink"
                }`}
              >
                <span className={available ? "" : "line-through"}>{value.name}</span>
                {!available ? <span className="text-caption">품절</span> : null}
                {available && extra ? (
                  <span className={`text-caption ${on ? "text-white/80" : "text-muted"}`}>
                    +{formatMoney(extra)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
