import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";
import { strictLayoutProblems } from "./layout-schema";

const LAYOUT_PATH = "src/site/layout.json";

/** JSON 문법 오류와 스키마 위반을 한 목록으로 — 문제가 없으면 빈 배열 */
export function layoutFileProblems(source: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return [`JSON 문법 오류: ${error instanceof Error ? error.message : String(error)}`];
  }
  return strictLayoutProblems(parsed);
}

function report(problems: string[]): string {
  return `${LAYOUT_PATH} 설정 오류 — 섹션과 변형 목록은 src/site/layout.schema.json을 보십시오\n- ${problems.join("\n- ")}`;
}

/**
 * 레이아웃 설정 검사 — 빌드는 설정이 틀리면 실패하고(경로별 메시지), dev·편집 미리보기는 오류 오버레이로 보인다.
 * 설정 파일을 모듈로 읽을 때(`transform`) 검사하므로 고치면 곧바로 다시 검사된다. 이 플러그인을 빼면 틀린 설정이
 * 그대로 배포되고 런타임이 틀린 섹션을 조용히 뺀다.
 */
export function sayrenLayout(): Plugin {
  let root = process.cwd();
  let command: "build" | "serve" = "serve";
  return {
    name: "sayren-layout",
    enforce: "pre",
    configResolved(config) {
      root = config.root;
      command = config.command;
    },
    buildStart() {
      if (command !== "build") return;
      const problems = layoutFileProblems(readFileSync(join(root, LAYOUT_PATH), "utf8"));
      if (problems.length > 0) this.error(report(problems));
    },
    transform(code, id) {
      const path = id.split("?")[0]?.replaceAll("\\", "/") ?? "";
      if (!path.endsWith(`/${LAYOUT_PATH}`)) return null;
      const problems = layoutFileProblems(code);
      if (problems.length > 0) this.error(report(problems));
      return null;
    },
  };
}
