import { ApiError, type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import type { PaymentResult } from "@sayren/storefront-sdk/payments";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ChevronRight, CircleAlert, CircleHelp, LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { buttonClass } from "../components/ui/button";
import { m } from "../i18n";
import type { PublicConfig } from "../lib/config";
import { API_BASE_URL, resolveStoreCode } from "../lib/config.server";
import { pageTitle } from "../lib/page-title";
import { forgetPaymentOptions, recallPaymentOptions } from "../lib/payment-options";
import { paymentsFor } from "../lib/payments";
import { safeRedirect } from "../lib/safe-redirect";

// `back`은 결제 서비스를 거쳐 돌아오는 값이라 누구나 바꿀 수 있다 — 같은 사이트 경로만 쓴다(열린 리다이렉트·javascript: 방지)
const returnSearch = z.object({
  back: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) =>
      value !== undefined && safeRedirect(value) === value ? value : undefined,
    ),
  /** 결제 서비스가 붙이는 결제 id — SDK가 주소에서 읽으므로 주소에 그대로 남긴다 */
  sayrenPaymentId: z.string().optional().catch(undefined),
  /** 참고용 결과 — 결과의 원천은 결제 상태 조회다 */
  sayrenResult: z.string().optional().catch(undefined),
});

const getConfig = createServerFn({ method: "GET" }).handler(
  (): PublicConfig => ({ apiBaseUrl: API_BASE_URL, storeCode: resolveStoreCode() }),
);

/** 결과 확인 중일 때 상태를 다시 보는 간격과 횟수 */
const POLL_MS = 2000;
const POLL_TIMES = 15;

type View =
  | { kind: "working" }
  | { kind: "processing" }
  | { kind: "failed"; paymentId: string; canceled: boolean; message: string }
  | { kind: "unknown" };

/**
 * 결제 복귀 화면 — 결제 서비스가 리다이렉트 결제를 마치고 돌려보내는 곳이다. 결과는 주소의 결제 id로
 * 결제 상태를 조회해 정한다(`payments.result`). 같은 주소로 다시 열어도(뒤로 가기·새로고침) 안전하다.
 *
 * 실패·취소면 같은 결제를 다른 결제 옵션으로 다시 시도한다(`payments.retry`). 옵션은 주문서가 결제창을 열기 전에
 * 남겨 둔 목록이다(`payment-options.ts`). 목록이 없으면 주문서로 돌아가 새로 결제한다.
 */
export const Route = createFileRoute("/checkout/return")({
  validateSearch: returnSearch,
  loader: () => getConfig(),
  // 복귀 주소의 결제 id가 외부 리소스 요청의 Referer로 새지 않게 한다
  head: ({ matches }) => ({
    meta: [
      { title: pageTitle(matches, m.checkout_return_title()) },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: PaymentReturn,
});

function PaymentReturn() {
  const config = Route.useLoaderData();
  const { back } = Route.useSearch();
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ kind: "working" });
  const [retryError, setRetryError] = useState<string | null>(null);
  // 남겨 둔 옵션은 탭 저장소에 있다 — 서버 렌더에는 없으므로 실패가 확정된 뒤(브라우저)에 읽는다
  const [options, setOptions] = useState<AvailablePaymentOption[]>([]);
  /** 다시 시도했다가 구매자가 고칠 수 없는 실패(`optionUnavailable`)로 끝난 옵션 — 목록에서 뺀다 */
  const [unavailableKeys, setUnavailableKeys] = useState<ReadonlySet<string>>(new Set());
  const retryOptions = options.filter((option) => !unavailableKeys.has(paymentOptionKey(option)));
  /** 다시 시도한 결제의 결과가 확인 중이면 올려서 결제 상태 조회를 처음부터 다시 돌린다(같은 결제 id다) */
  const [round, setRound] = useState(0);

  const complete = useCallback(
    (paymentId: string, orderId: string) => {
      forgetPaymentOptions(paymentId);
      void navigate({ to: "/checkout/complete", search: { orderId }, replace: true });
    },
    [navigate],
  );

  /** 확정된 결과면 화면을 정하고 true. `PROCESSING`이면 false — 실패로 단정하지 않는다 */
  const show = useCallback(
    (result: PaymentResult): boolean => {
      if (result.status === "COMPLETED") {
        complete(result.paymentId, result.orderId);
        return true;
      }
      if (result.status === "CANCELED" || result.status === "FAILED") {
        // 만료된 결제는 다시 시도할 수 없다(409 PAYMENT_EXPIRED) — 주문서로 돌아가 새로 결제한다
        if (result.code === "EXPIRED") forgetPaymentOptions(result.paymentId);
        setOptions(result.code === "EXPIRED" ? [] : recallPaymentOptions(result.paymentId));
        setView({
          kind: "failed",
          paymentId: result.paymentId,
          canceled: result.status === "CANCELED",
          message: result.message,
        });
        return true;
      }
      if (result.status === "INVALID") {
        setView({ kind: "unknown" });
        return true;
      }
      return false;
    },
    [complete],
  );

  useEffect(() => {
    let active = true;
    const payments = paymentsFor(config);
    const settle = (result: PaymentResult): boolean => {
      if (!active) return true;
      return show(result);
    };

    const run = async () => {
      // 다시 시도한 결제를 확인하는 중이면 처음부터 확인 중으로 보인다
      if (round > 0) setView({ kind: "processing" });
      const first = await payments.result(window.location.href).catch(() => null);
      if (!active) return;
      if (first && settle(first)) return;
      // 결과 확인 중 — 실패로 단정하지 않고 결제 상태를 다시 조회한다
      setView({ kind: "processing" });
      for (let i = 0; i < POLL_TIMES && active; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
        if (!active) return;
        const next = await payments.result(window.location.href).catch(() => null);
        if (!active) return;
        if (next && settle(next)) return;
      }
      if (active) setView({ kind: "unknown" });
    };

    void run();
    return () => {
      active = false;
    };
  }, [config, show, round]);

  /**
   * 같은 결제를 다른 옵션으로 다시 시도한다. 클릭 핸들러에서 바로 부른다 — 팝업은 클릭 시점에 열어야 차단되지 않는다.
   * 복귀 주소는 결제 시작 때의 값을 그대로 쓴다. 모바일은 이 탭이 결제 서비스로 이동했다가 다시 이 화면으로 돌아온다.
   */
  const retry = (paymentId: string, option: AvailablePaymentOption, previous: View) => {
    setRetryError(null);
    setView({ kind: "working" });
    paymentsFor(config)
      .retry(paymentId, { option })
      .then((result) => {
        if (result.status === "PROCESSING") {
          setRound((value) => value + 1);
          return;
        }
        if (show(result) && result.status === "FAILED" && result.optionUnavailable) {
          // 상점의 PG 설정 문제라 이 옵션은 다시 시도해도 실패한다 — 목록에서 뺀다(안내는 result.message)
          setUnavailableKeys((current) => new Set(current).add(paymentOptionKey(option)));
        }
      })
      .catch((error: unknown) => {
        // 결제창을 열지 못했다 — 방금 보던 실패 화면으로 되돌린다
        setView(previous);
        setRetryError(retryErrorMessage(error));
        // 더 진행할 수 없는 결제면 옵션을 거두고 주문서로 돌아가게 한다
        if (
          error instanceof ApiError &&
          (error.code === "PAYMENT_EXPIRED" || error.code === "ALREADY_PROCESSED")
        ) {
          forgetPaymentOptions(paymentId);
          setOptions([]);
        }
      });
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-12 text-center md:py-20">
      {view.kind === "working" || view.kind === "processing" ? (
        <>
          <LoaderCircle
            aria-hidden="true"
            className="size-12 animate-spin text-line-strong"
            strokeWidth={1.4}
          />
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-xl md:text-2xl">{m.checkout_return_checking()}</h1>
            <p className="text-body text-sub">
              {view.kind === "processing"
                ? m.checkout_return_processing()
                : m.checkout_return_wait()}
            </p>
          </div>
        </>
      ) : view.kind === "failed" ? (
        <>
          <CircleAlert aria-hidden="true" className="size-12 text-point" strokeWidth={1.4} />
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-xl md:text-2xl">
              {view.canceled ? m.checkout_return_canceled() : m.checkout_return_failed()}
            </h1>
            {view.canceled ? null : (
              <p className="break-words text-body text-sub">{view.message}</p>
            )}
          </div>
          {retryOptions.length ? (
            <section
              aria-labelledby="retry-heading"
              className="flex w-full flex-col gap-3 text-left"
            >
              <h2 id="retry-heading" className="font-bold text-body">
                {m.checkout_return_retry_heading()}
              </h2>
              <div className="flex flex-col border-ink border-t">
                {retryOptions.map((option) => (
                  <button
                    key={paymentOptionKey(option)}
                    type="button"
                    data-testid="retry-option"
                    onClick={() => retry(view.paymentId, option, view)}
                    className="flex min-w-0 items-center justify-between gap-3 border-line border-b px-1 py-4 text-left hover:bg-chip"
                  >
                    <span className="min-w-0 break-words font-medium text-body-lg">
                      {option.label}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-caption text-muted">
                      {option.pgName}
                      <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.6} />
                    </span>
                  </button>
                ))}
              </div>
              {retryError ? (
                <p role="alert" className="text-body text-point">
                  {retryError}
                </p>
              ) : null}
            </section>
          ) : null}
          <a
            href={back ?? "/cart"}
            className={
              retryOptions.length
                ? buttonClass({ variant: "ghost", className: "text-body" })
                : buttonClass({ variant: "primary", size: "md", block: true })
            }
          >
            {retryOptions.length ? m.checkout_return_back() : m.checkout_return_back_and_pay()}
          </a>
        </>
      ) : (
        <>
          <CircleHelp aria-hidden="true" className="size-12 text-line-strong" strokeWidth={1.4} />
          <div className="flex flex-col gap-2">
            <h1 className="font-bold text-xl md:text-2xl">{m.checkout_return_unknown()}</h1>
            <p className="text-body text-sub">{m.checkout_return_unknown_description()}</p>
          </div>
          <Link
            to="/orders"
            className={buttonClass({ variant: "outline", size: "md", block: true })}
          >
            {m.checkout_return_orders()}
          </Link>
        </>
      )}
    </div>
  );
}

function retryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "PAYMENT_OPTION_UNAVAILABLE":
        return m.checkout_return_option_unavailable();
      case "PAYMENT_PROVIDER_UNAVAILABLE":
        return m.checkout_return_provider_unavailable();
      case "PAYMENT_IN_PROGRESS":
        return m.checkout_return_in_progress();
      case "PAYMENT_EXPIRED":
      case "ALREADY_PROCESSED":
        return m.checkout_return_expired();
    }
  }
  return m.checkout_return_retry_failed();
}
