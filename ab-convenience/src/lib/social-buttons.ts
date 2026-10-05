import { m } from "../i18n";

/** 공급자 표시 — 버튼 문구·색. 로고는 각 사 가이드의 공식 버튼 자산으로 바꿔 쓴다 */
export const SOCIAL_BUTTONS = {
  kakao: {
    get label() {
      return m.social_buttons_kakao();
    },
    className: "bg-[#FEE500] text-[#191600]",
  },
  naver: {
    get label() {
      return m.social_buttons_naver();
    },
    className: "bg-[#03A94D] text-white",
  },
  google: {
    get label() {
      return m.social_buttons_google();
    },
    className: "border border-line bg-white text-ink",
  },
} as const;
