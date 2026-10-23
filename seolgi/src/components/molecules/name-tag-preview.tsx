import type { ProductDetail } from "@sayren/storefront-sdk";
import { nameTagPreview } from "../../site/content";
import { NameTagArt } from "../atoms/name-tag-art";

/** 이름표 미리보기를 그릴 수 있는 상품인가 — 모바일 구매 버튼 글(「이름표 만들기」)에도 쓴다 */
export function hasNameTagPreview(product: ProductDetail): boolean {
  const cfg = nameTagPreview;
  return (
    product.optionGroups.some((g) => g.name === cfg.shapeGroup) &&
    product.optionGroups.some((g) => g.name === cfg.colorGroup) &&
    product.customInputs.some((i) => i.label === cfg.nameInput)
  );
}

/**
 * 이름표 실시간 미리보기 — 상품에 모양·색상 옵션과 각인 칸(사이트 표 `nameTagPreview`)이 있으면 그린다.
 * 그림은 예시이고 실제 각인 결과와 다를 수 있다.
 */
export function NameTagPreview({
  product,
  picks,
  inputs,
}: {
  product: ProductDetail;
  picks: Record<string, string>;
  inputs: Record<string, string>;
}) {
  const cfg = nameTagPreview;
  const shapeGroup = product.optionGroups.find((g) => g.name === cfg.shapeGroup);
  const colorGroup = product.optionGroups.find((g) => g.name === cfg.colorGroup);
  const nameInput = product.customInputs.find((i) => i.label === cfg.nameInput);
  if (!shapeGroup || !colorGroup || !nameInput) return null;
  const shapeName = shapeGroup.values.find((v) => v.valueId === picks[shapeGroup.groupId])?.name;
  const colorName = colorGroup.values.find((v) => v.valueId === picks[colorGroup.groupId])?.name;
  return (
    <div className="flex h-32 items-center justify-center bg-tone-cream">
      <NameTagArt
        name={inputs[nameInput.inputId] ?? ""}
        shape={(shapeName && cfg.shapes[shapeName]) || "circle"}
        metal={colorName ? cfg.metals[colorName] : undefined}
        className="h-[85%]"
      />
    </div>
  );
}
