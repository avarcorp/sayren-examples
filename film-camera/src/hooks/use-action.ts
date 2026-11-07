import { useState } from "react";
import type { ActionResult } from "../lib/result";

/**
 * 쓰기 서버 함수 실행 — 진행 중 표시와 실패 문구를 들고 있다. 성공 값은 호출부가 받는다.
 * 실패 문구는 서버가 준 `message`를 그대로 보인다
 */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(call: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
    setPending(true);
    setError(null);
    try {
      const result = await call();
      if (!result.ok) setError(result.message);
      return result;
    } finally {
      setPending(false);
    }
  }

  return { pending, error, setError, run };
}
