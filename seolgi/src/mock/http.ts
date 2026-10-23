/**
 * mock API의 HTTP 틀 — SDK가 넘기는 fetch 자리에 끼워 운영 API 대신 응답한다.
 * 응답은 운영과 같은 엔벨로프(`{ meta, data, error }`)라 SDK가 같은 스키마로 검사한다.
 */
export interface MockRequest {
  method: string;
  path: string;
  params: string[];
  query: URLSearchParams;
  body: unknown;
  headers: Headers;
  /** 사이트 주소 — 그림 주소(`/mock/…`)를 절대 주소로 바꿀 때 쓴다 */
  origin: string;
}

export type MockResult =
  | { status?: number; data?: unknown; headers?: Record<string, string> }
  | MockError;

export class MockError {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly message: string,
  ) {}
}

export type Handler = (req: MockRequest) => MockResult | Promise<MockResult>;
export type Route = [method: string, pattern: RegExp, handler: Handler];

export function fail(status: number, code: string, message: string): never {
  throw new MockError(status, code, message);
}

export function pageOf<T>(items: T[], query: URLSearchParams, defaultSize = 20) {
  const size = Math.max(1, Number(query.get("size") ?? defaultSize));
  const page = Math.max(1, Number(query.get("page") ?? 1));
  return {
    page,
    size,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
    contents: items.slice((page - 1) * size, page * size),
  };
}

export function now(): string {
  return new Date().toISOString();
}

let seq = 0;
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}_mock${Date.now().toString(36)}${seq}`;
}

function envelope(status: number, data: unknown, error: { code: string; message: string } | null) {
  return {
    meta: {
      status,
      code: error?.code ?? "OK",
      message: error?.message ?? "OK",
      isSuccess: !error,
    },
    data: data ?? null,
    error,
  };
}

/** 응답 안의 `/mock/…` 그림 주소를 사이트 절대 주소로 바꾼다(스키마가 절대 URL을 요구한다) */
function absolutize(json: string, origin: string): string {
  return json
    .replaceAll('"/mock/', `"${origin}/mock/`)
    .replaceAll('src=\\"/mock/', `src=\\"${origin}/mock/`);
}

export function createMockFetch(routes: Route[], origin: string): typeof fetch {
  return async (input, init) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input : input.url,
    );
    // baseUrl(`…/storefront/v1`) 뒤의 경로만 본다
    const path = url.pathname.replace(/^.*?\/storefront\/v1/, "") || "/";
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === "string" && init.body ? JSON.parse(init.body) : undefined;
    for (const [m, pattern, handler] of routes) {
      if (m !== method) continue;
      const match = pattern.exec(path);
      if (!match) continue;
      try {
        const result = await handler({
          method,
          path,
          params: match.slice(1).map(decodeURIComponent),
          query: url.searchParams,
          body,
          headers,
          origin,
        });
        if (result instanceof MockError) throw result;
        const status = result.status ?? (result.data === undefined ? 204 : 200);
        if (status === 204) return new Response(null, { status, headers: result.headers });
        return new Response(
          absolutize(JSON.stringify(envelope(status, result.data, null)), origin),
          {
            status,
            headers: { "content-type": "application/json", ...result.headers },
          },
        );
      } catch (error) {
        if (!(error instanceof MockError)) throw error;
        return Response.json(
          envelope(error.status, null, { code: error.code, message: error.message }),
          {
            status: error.status,
          },
        );
      }
    }
    return Response.json(
      envelope(404, null, { code: "NOT_FOUND", message: "mock에 없는 경로입니다" }),
      {
        status: 404,
      },
    );
  };
}
