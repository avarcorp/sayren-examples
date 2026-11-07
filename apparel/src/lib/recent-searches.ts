/**
 * 최근 검색어 — 이 브라우저에만 남는 편의 기록이다(서버 데이터·개인정보 아님). 저장소를 못 쓰면 빈 목록이다.
 * 브라우저에서만 부른다(effect·이벤트 안).
 */
const KEY = "daily-basic:recent-searches";
const MAX = 8;

export function readRecentSearches(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function write(list: string[]): string[] {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)이면 기록하지 않는다
  }
  return list;
}

export function rememberSearch(word: string): string[] {
  return write([word, ...readRecentSearches().filter((w) => w !== word)].slice(0, MAX));
}

export function removeRecentSearch(word: string): string[] {
  return write(readRecentSearches().filter((w) => w !== word));
}
