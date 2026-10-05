import { ApiError } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";
import { readCartToken } from "./cart-session.server";
import { readToken } from "./session.server";

/**
 * 직접 입력 이미지(`type: "image"`) 업로드 — 서버 함수가 업로드 자리를 받고(구매자 토큰은 서버에만), 브라우저가 서명된
 * `uploadUrl`에 바로 PUT한다. 끝나면 공개 주소(`url`)를 입력값에 줄바꿈으로 잇는다. 비회원도 올릴 수 있다.
 */

export type InputImageFailure =
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_REQUESTS"
  | "UNKNOWN";

/** 서버와 같은 제한(상품 이미지와 같다) — 올리기 전에 걸러 헛발급을 줄인다 */
export const INPUT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX_INPUT_IMAGE_BYTES = 10 * 1024 * 1024;

export function checkInputImage(file: { type: string; size: number }): InputImageFailure | "OK" {
  if (!INPUT_IMAGE_ACCEPT.split(",").includes(file.type)) return "UNSUPPORTED_FILE_TYPE";
  if (file.size > MAX_INPUT_IMAGE_BYTES) return "FILE_TOO_LARGE";
  return "OK";
}

export function inputImageFailureOf(error: unknown): InputImageFailure {
  if (!(error instanceof ApiError)) return "UNKNOWN";
  if (error.status === 429) return "TOO_MANY_REQUESTS";
  if (error.status === 413) return "FILE_TOO_LARGE";
  if (error.status === 400 && error.code === "UNSUPPORTED_FILE_TYPE")
    return "UNSUPPORTED_FILE_TYPE";
  return "UNKNOWN";
}

export const createInputImageUpload = createServerFn({ method: "POST" })
  .validator(z.object({ filename: z.string().min(1).max(200), size: z.number().int().positive() }))
  .handler(
    async ({
      data,
    }): Promise<{ url: string; uploadUrl: string } | { failure: InputImageFailure }> => {
      try {
        return await apiFor({
          accessToken: readToken(),
          cartToken: readCartToken(),
        }).cart.createInputImageUpload(data);
      } catch (error) {
        return { failure: inputImageFailureOf(error) };
      }
    },
  );
