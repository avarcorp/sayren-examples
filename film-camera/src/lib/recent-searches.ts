/** 최근 검색어 — 이 기기 브라우저에만 남기는 편의 기능이다(서버 데이터가 아니다). 저장소를 못 쓰면 빈 목록이다 */
const KEY = "recent-searches";
const MAX = 8;

export function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function writeRecentSearches(list: string[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // 저장소를 못 쓰는 브라우저 — 최근 검색어 없이 동작한다
  }
}

export function pushRecentSearch(keyword: string): string[] {
  const next = [keyword, ...readRecentSearches().filter((k) => k !== keyword)].slice(0, MAX);
  writeRecentSearches(next);
  return next;
}
