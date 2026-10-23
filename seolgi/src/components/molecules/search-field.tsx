import { Search } from "lucide-react";

/** 큰 검색칸 — 밑줄 하나와 돋보기. 제출하면 검색어를 넘긴다 */
export function SearchField({
  defaultValue,
  onSubmit,
}: {
  defaultValue?: string;
  onSubmit: (keyword: string) => void;
}) {
  return (
    <search>
      <form
        className="flex max-w-[640px] items-center gap-3 border-ink border-b pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(String(new FormData(e.currentTarget).get("keyword") ?? "").trim());
        }}
      >
        <Search className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
        <input
          name="keyword"
          type="search"
          aria-label="검색어"
          defaultValue={defaultValue}
          placeholder="찾는 상품을 입력합니다"
          className="w-full bg-transparent text-h3 outline-none placeholder:text-muted md:text-h2"
        />
      </form>
    </search>
  );
}
