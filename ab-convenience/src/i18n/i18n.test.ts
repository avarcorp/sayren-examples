import { describe, expect, it } from "vitest";
import { formatMessage, lazyMessages, m, resolveLocale, toLocale } from "./index";
import { runWithLocale } from "./locale.server";

describe("언어 판정", () => {
  it("?lang= → Accept-Language → ko 순서다", () => {
    const at = (url: string, accept: string | null = null) => resolveLocale(new URL(url), accept);
    expect(at("https://shop.test/?lang=ko-KR", "fr")).toBe("ko");
    expect(at("https://shop.test/", "fr;q=0.9, ko;q=0.5")).toBe("ko");
    expect(at("https://shop.test/?lang=xx", "fr")).toBe("ko");
    expect(toLocale("KO_kr")).toBe("ko");
    expect(toLocale("fr")).toBeUndefined();
  });
});

describe("문구", () => {
  it("요청 언어로 렌더하고 {name}을 채운다", () => {
    expect(runWithLocale("ko", () => m.common_loading())).toBe("불러오는 중");
    expect(formatMessage("{count}개 {missing}", { count: 3 })).toBe("3개 {missing}");
  });

  it("lazyMessages는 읽을 때마다 문구를 만든다", () => {
    let calls = 0;
    const labels = lazyMessages({ A: () => `가${++calls}` });
    expect(calls).toBe(0);
    expect(labels.A).toBe("가1");
    expect(labels.A).toBe("가2");
  });
});
