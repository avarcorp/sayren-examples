import { m } from "../i18n";

/** 띠 공지 한 줄 — 흰 바탕, 아래 선, 대표 색 글자 */
export function AnnouncementBar() {
  return (
    <div className="border-line border-b">
      <p className="mx-auto max-w-page truncate px-4 py-2 text-center font-medium text-meta text-point">
        {m.announcement()}
      </p>
    </div>
  );
}
