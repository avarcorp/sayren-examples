/**
 * 상품명 표기 규칙 「기종 + 렌즈 (A급)」을 화면용으로 나눈다. 셀러가 정한 상품명 문자열만 읽고 값을 지어내지 않는다.
 * 규칙에 맞지 않는 이름이면 전체를 기종으로 두고 렌즈·등급은 비운다.
 */
export type Grade = "A" | "B";

export interface CameraName {
  /** 등급 표기를 뗀 상품명 — 등급은 배지로 따로 보인다 */
  base: string;
  model: string;
  lens: string | null;
  grade: Grade | null;
}

const GRADE_SUFFIX = /\s*\(([AB])급\)\s*$/;

export function parseCameraName(name: string): CameraName {
  const gradeMatch = name.match(GRADE_SUFFIX);
  const grade = (gradeMatch?.[1] as Grade | undefined) ?? null;
  const rest = (gradeMatch ? name.slice(0, gradeMatch.index) : name).trim();
  const plus = rest.indexOf(" + ");
  return plus === -1
    ? { base: rest, model: rest, lens: null, grade }
    : { base: rest, model: rest.slice(0, plus).trim(), lens: rest.slice(plus + 3).trim(), grade };
}
