import { m } from "../i18n";
import type { NoticeRow } from "../lib/product-notice";

/** 상품정보 제공고시 표 — 값은 `productNoticeRows`가 상품 데이터에서 만든다. 넓으면 표 안에서만 가로로 밀린다 */
export function ProductNoticeTable({ rows }: { rows: NoticeRow[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="font-bold text-body-lg">{m.pd_notice_title()}</h3>
      <div className="min-w-0 overflow-x-auto">
        <table className="w-full border-collapse border-ink border-t text-meta md:text-body">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-line border-b">
                <th
                  scope="row"
                  className="w-28 bg-chip px-3 py-2.5 text-left align-top font-normal text-sub md:w-48"
                >
                  {row.label}
                </th>
                <td className="break-words px-3 py-2.5">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
