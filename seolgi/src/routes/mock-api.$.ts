import { createFileRoute } from "@tanstack/react-router";

/**
 * mock 모드의 브라우저용 API — 결제 SDK(`createPayments`)가 브라우저에서 부르는 결제 상태 조회 등을
 * 서버의 mock 응답으로 돌려준다. mock 모드가 아니면 404다. 업로드 자리(`/mock-api/upload`)는 파일을 버리고 200이다.
 */
async function handle({ request }: { request: Request }): Promise<Response> {
  const { MOCK } = await import("../lib/config.server");
  if (!MOCK) return new Response(null, { status: 404 });
  const url = new URL(request.url);
  if (url.pathname === "/mock-api/upload") return new Response(null, { status: 200 });
  const { mockFetch } = await import("../mock");
  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  return mockFetch(url.origin)(url.toString(), {
    method: request.method,
    headers: request.headers,
    body,
  });
}

export const Route = createFileRoute("/mock-api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
