import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import { type LineOptionSource, lineOptionRows } from "../lib/line-options";

/**
 * 장바구니·주문서·주문 줄의 옵션 표시 — 조합 이름, 추가 선택 값(추가금), 직접 입력값을 한 줄씩 보인다.
 * 항목명은 담을 때·주문할 때의 이름이다(셀러가 뒤에 바꿔도 이 줄은 그대로다).
 *
 * `id`를 주면 같은 상품이 여러 줄일 때 수량·삭제 버튼이 `aria-describedby`로 이 줄의 옵션을 함께 읽힌다.
 */
export function LineOptions({ item, id }: { item: LineOptionSource; id?: string }) {
  const rows = lineOptionRows(item, formatPrice);
  // id를 받으면 비어 있어도 그린다 — 가리키는 aria-describedby가 끊기지 않게
  if (!rows.length && !id) return null;
  return (
    <span id={id} className="flex flex-col gap-0.5">
      {rows.map((row) => (
        <span key={row.key} className="break-all text-muted text-xs">
          {row.label ? `${row.label}: ` : null}
          {row.value}
          {row.images?.length ? (
            <span className="mt-1 flex flex-wrap gap-1">
              {row.images.map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={m.line_options_image_alt({ label: row.label ?? "", index: index + 1 })}
                  className="size-10 object-cover"
                  loading="lazy"
                />
              ))}
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
