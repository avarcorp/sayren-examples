/** 최근 검색어 — 이 브라우저에만 남기는 편의 기능이다. 저장소를 못 쓰면 빈 목록으로 동작한다 */
const KEY = "wsg-recent-searches";
const MAX = 8;

export function readRecentSearches(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(keyword: string): string[] {
  const next = [keyword, ...readRecentSearches().filter((v) => v !== keyword)].slice(0, MAX);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장소를 못 쓰는 브라우저
  }
  return next;
}

export function clearRecentSearches() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // 저장소를 못 쓰는 브라우저
  }
}
