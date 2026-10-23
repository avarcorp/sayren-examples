import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { z } from "zod";
import { InquiryItem } from "../components/molecules/inquiry-item";
import { Pagination } from "../components/molecules/pagination";
import { AccountTitle } from "../components/templates/account-template";
import { getMyInquiriesFn } from "../lib/account";

const rootRoute = getRouteApi("__root__");

export const Route = createFileRoute("/account/inquiries")({
  validateSearch: z.object({ page: z.number().int().min(1).optional().catch(undefined) }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getMyInquiriesFn({ data: deps }),
  head: () => ({ meta: [{ title: "상품 문의 | 설기로운" }] }),
  component: Inquiries,
});

/** 내가 남긴 상품 문의 — 상품 이름과 답변. 문의는 상품 화면에서 남긴다 */
function Inquiries() {
  const page = Route.useLoaderData();
  const storeName = rootRoute.useLoaderData({ select: (d) => d.store?.name ?? "설기로운" });
  return (
    <>
      <AccountTitle title="상품 문의" aside={`${page.totalElements}건`} />
      {page.contents.length === 0 ? (
        <p className="border-ink border-t py-24 text-center text-muted">
          남긴 상품 문의가 없습니다. 상품 화면의 문의에서 남깁니다.
        </p>
      ) : (
        <ul className="flex flex-col border-ink border-t">
          {page.contents.map((q) => (
            <InquiryItem key={q.inquiryId} inquiry={q} storeName={storeName} showProduct />
          ))}
        </ul>
      )}
      <Pagination page={page.page} totalPages={page.totalPages} />
    </>
  );
}
