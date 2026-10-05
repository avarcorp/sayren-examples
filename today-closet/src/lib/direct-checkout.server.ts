import { clearServerCookie, readServerCookie, writeServerCookie } from "./cookies.server";
import { decodeLine, encodeLine, type LineRequest } from "./line-request";

/**
 * 직접 입력값이 있는 바로구매 — 주문서 진입 의도를 URL 대신 HttpOnly 쿠키에 둔다.
 *
 * 주문서는 진입할 때마다 URL의 조건으로 세션을 새로 만든다(`checkout-intent.ts`). 직접 입력값은 구매자가 적은
 * 글자(각인 문구·선물 메시지 등)라 URL에 실으면 방문 기록·서버 로그·리퍼러에 남는다. 그래서 값은 서버 함수 본문으로
 * 받아 이 쿠키에 두고, URL에는 `direct=1`과 상품 id만 둔다. 주문서는 진입마다 세션을 새로 만드므로 쿠키는 주문서를 만든
 * 뒤에도 남긴다 — 새로고침·결제창 뒤로가기·결제 실패 뒤 「주문서로 돌아가기」가 같은 입력값으로 주문서를 다시 만든다.
 * 지우는 때는 주문 완료 화면 진입·로그아웃·탈퇴이고, 그 밖에는 30분 만료에 맡긴다. 새 바로구매는 쿠키를 덮어쓴다.
 * 쿠키 이름·속성은 `cookies.server.ts`가 정한다(프로덕션은 `__Host-`, HttpOnly, SameSite=Lax).
 *
 * 서버 함수·서버 라우트 안에서만 부른다.
 */
const DIRECT_COOKIE = "sayren_direct";
const MAX_AGE_SEC = 60 * 30;

export function writeDirectLine(line: LineRequest) {
  writeServerCookie(DIRECT_COOKIE, encodeLine(line), MAX_AGE_SEC);
}

export function readDirectLine(): LineRequest | null {
  return decodeLine(readServerCookie(DIRECT_COOKIE));
}

/** 주문 완료·로그아웃 때 지운다 — 입력값을 필요한 것보다 오래 두지 않는다 */
export function clearDirectLine() {
  clearServerCookie(DIRECT_COOKIE);
}
