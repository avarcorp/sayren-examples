import { createFileRoute } from "@tanstack/react-router";

/** 사진 출처 — 상품 사진은 예시 이미지(CC BY)라 원본·저작자·라이선스를 표기한다. 원천은 docs/image-credits.md */
const CREDITS = [
  [
    "소프트 메쉬 하네스",
    "https://www.flickr.com/photos/68679992@N00/5281466809",
    "jkbrooks85",
    "CC BY 2.0",
  ],
  [
    "소프트 메쉬 하네스",
    "https://www.flickr.com/photos/78428166@N00/5521385349",
    "Tobyotter",
    "CC BY 2.0",
  ],
  [
    "각인 이름표 주문제작",
    "https://www.flickr.com/photos/9417211@N06/9265756525",
    "ylmworkshop",
    "CC BY 2.0",
  ],
  [
    "양털 터그 장난감",
    "https://www.flickr.com/photos/39908901@N06/8726732547",
    "m01229",
    "CC BY 2.0",
  ],
  [
    "양털 터그 장난감",
    "https://www.flickr.com/photos/68474098@N07/8744170530",
    "rpavich",
    "CC BY 2.0",
  ],
  [
    "반사 리드줄 1.5m",
    "https://www.flickr.com/photos/93887713@N00/9843350783",
    "Paris on Ponce & Le Maison Rouge",
    "CC BY 2.0",
  ],
  [
    "반사 리드줄 1.5m",
    "https://www.flickr.com/photos/40837632@N05/5500041617",
    "Gareth1953 All Right Now",
    "CC BY 2.0",
  ],
  [
    "가죽 목줄",
    "https://commons.wikimedia.org/wiki/File:Leather_dog_collar_made_by_Les_cuirs_d%27Agathe_(DSC06406).jpg",
    "Trougnouf (Benoit Brummer)",
    "CC BY 4.0",
  ],
  [
    "가죽 목줄",
    "https://commons.wikimedia.org/wiki/File:Leather_dog_collar_made_by_Les_cuirs_d%27Agathe_(DSC07529).jpg",
    "Trougnouf (Benoit Brummer)",
    "CC BY 4.0",
  ],
  [
    "도넛 쿠션 방석",
    "https://www.flickr.com/photos/16947083@N06/4245405188",
    "Howard O. Young",
    "CC BY 2.0",
  ],
  [
    "도넛 쿠션 방석",
    "https://www.flickr.com/photos/45257015@N03/6495139857",
    "Hey Paul Studios",
    "CC BY 2.0",
  ],
] as const;

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "사진 출처 | 설기로운" }] }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <article className="mx-auto flex max-w-[860px] flex-col gap-6 px-4 pt-12 pb-24 md:px-0">
      <h1 className="border-ink border-b pb-6 font-display text-h1">사진 출처</h1>
      <p className="text-body text-prose">
        상품 사진은 예시 이미지예요. 원본과 저작자는 아래와 같아요.
      </p>
      <ul className="flex flex-col gap-3 text-small leading-6">
        {CREDITS.map(([product, url, author, license]) => (
          <li key={url} className="break-words">
            <span className="font-medium text-ink">{product}</span> ·{" "}
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline">
              원본
            </a>{" "}
            · {author} · {license}
          </li>
        ))}
      </ul>
    </article>
  );
}
