import { describe, expect, it } from "vitest";
import {
  appendImages,
  checkImageFile,
  MAX_REVIEW_IMAGE_BYTES,
  moveImage,
  remainingSlots,
  removeImage,
} from "./review-images";

describe("리뷰 사진 목록", () => {
  it("형식·크기를 미리 검사한다", () => {
    expect(checkImageFile({ type: "image/jpeg", size: 1000 })).toBe("OK");
    expect(checkImageFile({ type: "image/svg+xml", size: 1000 })).toBe("UNSUPPORTED_FILE_TYPE");
    expect(checkImageFile({ type: "image/png", size: MAX_REVIEW_IMAGE_BYTES + 1 })).toBe(
      "FILE_TOO_LARGE",
    );
  });
  it("최대 5장까지만 붙고 남은 장수를 센다", () => {
    const four = ["a", "b", "c", "d"];
    expect(remainingSlots(four)).toBe(1);
    expect(appendImages(four, ["e", "f"])).toEqual(["a", "b", "c", "d", "e"]);
    expect(remainingSlots(appendImages(four, ["e"]))).toBe(0);
  });
  it("순서를 앞뒤로 바꾸고, 끝을 넘으면 그대로다. 삭제한다", () => {
    expect(moveImage(["a", "b", "c"], 1, -1)).toEqual(["b", "a", "c"]);
    expect(moveImage(["a", "b", "c"], 1, 1)).toEqual(["a", "c", "b"]);
    expect(moveImage(["a", "b"], 0, -1)).toEqual(["a", "b"]);
    expect(removeImage(["a", "b", "c"], 1)).toEqual(["a", "c"]);
  });
});
