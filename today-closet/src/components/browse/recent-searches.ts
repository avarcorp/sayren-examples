import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "today-closet:recent-searches";
const MAX = 10;

/** 저장소를 못 쓰는 브라우저(사생활 보호 창·차단)에서는 기록 없이 동작한다 */
function read(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

function write(items: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 기록하지 못해도 검색은 그대로 된다
  }
}

/** 새 검색어를 맨 앞에 — 같은 검색어는 한 번만, 최대 10개 */
export function pushRecent(items: readonly string[], keyword: string): string[] {
  const value = keyword.trim();
  if (!value) return [...items];
  return [value, ...items.filter((item) => item !== value)].slice(0, MAX);
}

/**
 * 최근 검색어 — 이 브라우저에만 남는다(서버에 보내지 않는다). 서버 렌더에서는 비어 있고 하이드레이션 뒤에 읽는다.
 */
export function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);
  useEffect(() => setItems(read()), []);
  const update = useCallback((next: (current: string[]) => string[]) => {
    // 다른 탭에서 바꾼 기록 위에 더한다 — 저장소를 다시 읽고 고친다
    const value = next(read());
    write(value);
    setItems(value);
  }, []);
  return {
    items,
    add: useCallback(
      (keyword: string) => update((current) => pushRecent(current, keyword)),
      [update],
    ),
    remove: useCallback(
      (keyword: string) => update((current) => current.filter((item) => item !== keyword)),
      [update],
    ),
    clear: useCallback(() => update(() => []), [update]),
  };
}
