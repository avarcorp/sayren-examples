import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { m } from "../i18n";
import { apiFor } from "../lib/api.server";
import { siteLayout } from "../site/layout";
import { loadSectionData } from "../site/sections/loaders.server";
import { SiteSection } from "../site/sections/registry";
import { useStoreName } from "../site/site-link";

/**
 * 홈 — 섹션 구성은 `src/site/layout.json`의 `home`이다(섹션과 변형 목록은 `src/site/layout.schema.json`).
 * 서버가 섹션마다 데이터를 먼저 받아 그린다(SSR). 섹션 하나가 실패하면 그 섹션만 숨긴다.
 * 확장 지점: 배너·기획전을 더하려면 먼저 `layout.json`에 섹션을 넣는다. 없는 모양이 필요할 때만 `src/site/sections/`를 고친다.
 */
const getHome = createServerFn({ method: "GET" }).handler(async () => ({
  sections: await loadSectionData(apiFor(), siteLayout.home),
}));

export const Route = createFileRoute("/")({
  // 제목은 루트가 상점 이름으로 정한다
  head: () => ({ meta: [{ name: "description", content: m.home_description() }] }),
  loader: () => getHome(),
  component: Home,
});

function Home() {
  const { sections } = Route.useLoaderData();
  const storeName = useStoreName();

  // 첫 섹션이 배너면 모바일에서 헤더 바로 아래 붙인다(본문 위 여백을 지운다)
  const flush = siteLayout.home[0]?.type === "hero";
  return (
    <div className={`flex flex-col gap-10 md:gap-16 ${flush ? "-mt-8 md:mt-0" : ""}`}>
      {siteLayout.home.map((section) => (
        <SiteSection
          key={section.id}
          section={section}
          data={sections[section.id]}
          storeName={storeName}
        />
      ))}
    </div>
  );
}
