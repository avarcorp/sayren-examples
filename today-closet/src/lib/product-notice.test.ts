import { describe, expect, it } from "vitest";
import { NOTICE_FALLBACK, productNoticeRows } from "./product-notice";

describe("상품정보 제공고시", () => {
  it("옵션 축과 상세설명의 소재·세탁 방법을 읽고 나머지는 상세 참조로 둔다", () => {
    const rows = productNoticeRows(
      {
        description:
          "<h2>상품 소개</h2><p>소개</p><ul><li>소재: 울 60%, 폴리에스터 40%</li><li>핏: 오버핏</li></ul>" +
          "<h3>세탁 방법</h3><p>드라이클리닝을 권장합니다 &amp; 그늘에서 말립니다.</p>",
        optionGroups: [
          {
            groupId: "c",
            name: "색상",
            values: [
              { valueId: "1", name: "네이비" },
              { valueId: "2", name: "브라운" },
            ],
          },
          {
            groupId: "s",
            name: "사이즈",
            values: [
              { valueId: "3", name: "S" },
              { valueId: "4", name: "M" },
            ],
          },
        ],
      },
      "1588-0000",
    );
    const value = (label: string) => rows.find((row) => row.label === label)?.value;
    expect(value("제품 소재")).toBe("울 60%, 폴리에스터 40%");
    expect(value("색상")).toBe("네이비, 브라운");
    expect(value("치수")).toBe("S, M");
    expect(value("세탁 방법 및 취급 시 주의사항")).toBe(
      "드라이클리닝을 권장합니다 & 그늘에서 말립니다.",
    );
    expect(value("제조국")).toBe(NOTICE_FALLBACK);
    expect(value("A/S 책임자와 전화번호")).toBe("고객센터 1588-0000");
  });

  it("상세설명이 평문이거나 옵션이 없으면 모두 상세 참조다", () => {
    const rows = productNoticeRows({ description: "그냥 글", optionGroups: [] }, null);
    expect(rows.every((row) => row.value === NOTICE_FALLBACK)).toBe(true);
  });
});
