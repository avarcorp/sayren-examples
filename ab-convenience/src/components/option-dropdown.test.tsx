import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OptionDropdown } from "./option-dropdown";

const values = [
  { valueId: "s", name: "S", soldOut: false, additionalPrice: 0 },
  { valueId: "m", name: "M", soldOut: false, additionalPrice: 2000 },
  { valueId: "l", name: "L", soldOut: true, additionalPrice: 0 },
];

describe("옵션 드롭다운 마크업", () => {
  it("닫힌 버튼은 listbox를 가리키는 aria 속성을 갖는다", () => {
    const html = renderToString(
      <OptionDropdown
        name="사이즈"
        values={values}
        selectedValueId={null}
        locked={false}
        onSelect={() => {}}
      />,
    );
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('role="listbox"');
  });

  it("앞 단계를 고르기 전에는 버튼이 비활성이고 이유를 접근성 이름에 담는다", () => {
    const html = renderToString(
      <OptionDropdown
        name="사이즈"
        values={values}
        selectedValueId={null}
        locked
        onSelect={() => {}}
      />,
    );
    expect(html).toMatch(/<button[^>]*disabled=""/);
    expect(html).toContain("사이즈 — 앞 옵션을 먼저 선택해 주십시오");
  });

  it("펼친 목록: 고른 값은 aria-selected, 품절 값은 aria-disabled와 「(품절)」, 추가금은 값 옆에 붙는다", () => {
    const html = renderToString(
      <OptionDropdown
        name="사이즈"
        values={values}
        selectedValueId="s"
        locked={false}
        onSelect={() => {}}
        defaultOpen
      />,
    );
    expect(html).toContain('role="listbox"');
    expect(html).toContain('aria-expanded="true"');
    const options = html.match(/<div[^>]*role="option"[^>]*>[\s\S]*?<\/div>/g) ?? [];
    expect(options).toHaveLength(3);
    expect(options[0]).toContain('aria-selected="true"');
    expect(options[1]).toContain('aria-selected="false"');
    expect(options[1]).toContain("M (+2,000원)");
    expect(options[2]).toContain('aria-disabled="true"');
    expect(options[2]).toContain("L (품절)");
  });

  it("기본 목록은 버튼 위에 띄우고, inline 목록은 흐름 안에 펼친다(시트 몸통에 잘리지 않게)", () => {
    const listOf = (inline: boolean) =>
      renderToString(
        <OptionDropdown
          name="색상"
          values={values}
          selectedValueId={null}
          locked={false}
          onSelect={() => {}}
          defaultOpen
          inline={inline}
        />,
      ).match(/<div[^>]*role="listbox"[^>]*>/)?.[0] ?? "";
    expect(listOf(false)).toContain("absolute");
    expect(listOf(true)).toContain('role="listbox"');
    expect(listOf(true)).not.toContain("absolute");
  });
});
