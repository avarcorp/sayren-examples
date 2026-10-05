import { describe, expect, it } from "vitest";
import { type FlowInputField, flowInputFromForm, flowInputText } from "./flow-input";

describe("흐름 행동 입력", () => {
  const fields: FlowInputField[] = [
    { key: "note", type: "textarea", required: true, label: "수정 내용" },
    { key: "font", type: "radio", required: false, label: "글꼴", options: ["명조", "고딕"] },
    { key: "extras", type: "checkbox", required: false, label: "추가", options: ["포장", "카드"] },
    { key: "agree", type: "boolean", required: false, label: "확인" },
    { key: "count", type: "number", required: false, label: "수량" },
    { key: "at", type: "datetime", required: false, label: "일시" },
    { key: "photo", type: "image", required: false, label: "사진" },
  ];

  it("폼 값을 서버 형식으로 모은다 — 비운 칸은 빼고 일시는 한국 시간 오프셋을 붙인다", () => {
    const form = new FormData();
    form.set("note", " 글씨를 크게 ");
    form.set("font", "고딕");
    form.append("extras", "포장");
    form.append("extras", "카드");
    form.set("count", "");
    form.set("at", "2026-10-12T15:00");
    expect(flowInputFromForm(fields, form, { photo: ["https://cdn.example/a.png"] })).toEqual({
      note: "글씨를 크게",
      font: "고딕",
      extras: ["포장", "카드"],
      agree: false,
      at: "2026-10-12T15:00:00+09:00",
      photo: ["https://cdn.example/a.png"],
    });
  });

  it("상태의 입력값을 글자로 보인다", () => {
    expect(flowInputText({ key: "agree", label: "확인", type: "boolean", value: true })).toBe("예");
    expect(
      flowInputText({ key: "extras", label: "추가", type: "checkbox", value: ["포장", "카드"] }),
    ).toBe("포장, 카드");
  });
});
