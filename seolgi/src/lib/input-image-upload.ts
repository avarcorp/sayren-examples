import { ApiError } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cartApi } from "./cart-api.server";

export type InputImageFailure =
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_REQUESTS"
  | "UNKNOWN";

/** 서버와 같은 제한 — 올리기 전에 걸러 헛발급을 줄인다 */
export const INPUT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX_INPUT_IMAGE_BYTES = 10 * 1024 * 1024;

export function checkInputImage(file: { type: string; size: number }): InputImageFailure | "OK" {
  if (!INPUT_IMAGE_ACCEPT.split(",").includes(file.type)) return "UNSUPPORTED_FILE_TYPE";
  if (file.size > MAX_INPUT_IMAGE_BYTES) return "FILE_TOO_LARGE";
  return "OK";
}

function failureOf(error: unknown): InputImageFailure {
  if (!(error instanceof ApiError)) return "UNKNOWN";
  if (error.status === 429) return "TOO_MANY_REQUESTS";
  if (error.status === 413) return "FILE_TOO_LARGE";
  if (error.status === 400 && error.code === "UNSUPPORTED_FILE_TYPE")
    return "UNSUPPORTED_FILE_TYPE";
  return "UNKNOWN";
}

/** 직접 입력 이미지 업로드 자리 — 구매자 토큰은 서버에만 두고 브라우저는 서명된 주소에 바로 올린다 */
export const createInputImageUploadFn = createServerFn({ method: "POST" })
  .validator(z.object({ filename: z.string().min(1).max(200), size: z.number().int().positive() }))
  .handler(
    async ({
      data,
    }): Promise<{ url: string; uploadUrl: string } | { failure: InputImageFailure }> => {
      try {
        // 담기 전 비회원도 장바구니 토큰으로 올린다 — 토큰이 없으면 서버 한도가 상점 전체 비회원에 묶인다
        const { api, persist, hasCart } = cartApi();
        if (!hasCart) await api.cart.get();
        persist();
        return await api.cart.createInputImageUpload(data);
      } catch (error) {
        return { failure: failureOf(error) };
      }
    },
  );
