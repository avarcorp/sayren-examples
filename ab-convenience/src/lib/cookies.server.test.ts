import { afterEach, describe, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => ({
  set: [] as unknown[][],
  get: [] as unknown[][],
  delete: [] as unknown[][],
}));

vi.mock("@tanstack/react-start/server", () => ({
  setCookie: (...args: unknown[]) => calls.set.push(args),
  getCookie: (...args: unknown[]) => {
    calls.get.push(args);
    return "v";
  },
  deleteCookie: (...args: unknown[]) => calls.delete.push(args),
}));

async function load(prod: boolean) {
  vi.resetModules();
  vi.stubEnv("PROD", prod);
  return import("./cookies.server");
}

afterEach(() => {
  vi.unstubAllEnvs();
  calls.set.length = 0;
  calls.get.length = 0;
  calls.delete.length = 0;
});

describe("서버 쿠키", () => {
  it("프로덕션은 __Host- 접두사 + Secure·Path=/·Domain 없음으로 쓰고 지운다", async () => {
    const cookies = await load(true);
    cookies.writeServerCookie("sayren_member", "x", 60);
    cookies.readServerCookie("sayren_member");
    cookies.clearServerCookie("sayren_member");
    expect(calls.set[0]).toEqual([
      "__Host-sayren_member",
      "x",
      { httpOnly: true, sameSite: "lax", path: "/", secure: true, maxAge: 60 },
    ]);
    expect(calls.get[0]).toEqual(["__Host-sayren_member"]);
    // 옛 이름은 읽지 않는다 — 읽으면 다른 사이트가 심은 쿠키가 다시 통한다
    expect(calls.get).toHaveLength(1);
    expect(calls.delete[0]).toEqual(["__Host-sayren_member", { path: "/", secure: true }]);
  });

  it("개발 서버(http)는 접두사 없이 Secure 없이 쓴다", async () => {
    const cookies = await load(false);
    cookies.writeServerCookie("sayren_cart", "t", 10);
    expect(calls.set[0]?.[0]).toBe("sayren_cart");
    expect(calls.set[0]?.[2]).toMatchObject({ httpOnly: true, secure: false, path: "/" });
  });
});
