import { describe, expect, it } from "vitest";
import { baseAddressOf } from "./address-search";

const road = {
  userSelectedType: "R" as const,
  address: "서울 강남구 테헤란로 152",
  roadAddress: "서울 강남구 테헤란로 152",
  jibunAddress: "서울 강남구 역삼동 737",
  bname: "역삼동",
  buildingName: "강남파이낸스센터",
};

describe("주소 검색 결과의 기본 주소", () => {
  it("도로명 주소에 법정동·건물명을 붙인다", () => {
    expect(baseAddressOf(road)).toBe("서울 강남구 테헤란로 152 (역삼동, 강남파이낸스센터)");
  });

  it("동·로·가로 끝나지 않는 법정동(읍·면)은 붙이지 않는다", () => {
    expect(baseAddressOf({ ...road, bname: "조천읍", buildingName: "" })).toBe(
      "서울 강남구 테헤란로 152",
    );
  });

  it("지번을 고르면 지번 주소 그대로다", () => {
    expect(baseAddressOf({ ...road, userSelectedType: "J" })).toBe("서울 강남구 역삼동 737");
  });
});
