// type(scope): 제목 — scope는 예제 폴더 이름(feat(today-closet): …). 한국어 제목이라 대소문자 규칙은 끈다
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    "subject-case": [0],
    "body-max-line-length": [0],
  },
};
