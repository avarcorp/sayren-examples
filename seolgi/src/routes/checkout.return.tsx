import { ApiError, type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import type { PaymentResult } from "@sayren/storefront-sdk/payments";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  PaymentReturnTemplate,
  type ReturnView,
} from "../components/templates/payment-return-template";
import type { PublicConfig } from "../lib/config";
import { publicConfig } from "../lib/config.server";
import { forgetPaymentOptions, recallPaymentOptions } from "../lib/payment-options";
import { paymentsFor } from "../lib/payments";
import { safeRedirect } from "../lib/safe-redirect";

// `back`은 결제사를 거쳐 돌아오는 값이라 누구나 바꿀 수 있다 — 같은 사이트 경로만 쓴다
const returnSearch = z.object({
  back: z
    .string()
    .optional()
    .catch(undefined)
    .transform((v) => (v !== undefined && safeRedirect(v) === v ? v : undefined)),
  sayrenPaymentId: z.string().optional().catch(undefined),
  sayrenResult: z.string().optional().catch(undefined),
});

const getConfigFn = createServerFn({ method: "GET" }).handler((): PublicConfig => publicConfig());

const POLL_MS = 2000;
const POLL_TIMES = 15;

/**
 * 결제 복귀 — 주소의 결제 id로 결제 상태를 조회해 결과를 정한다(`payments.result`). 새로고침·뒤로 가기에도 안전하다.
 * 실패·취소면 주문서가 남겨 둔 결제 옵션으로 같은 결제를 다시 시도한다(`payments.retry`).
 */
export const Route = createFileRoute("/checkout/return")({
  validateSearch: returnSearch,
  loader: () => getConfigFn(),
  // 복귀 주소의 결제 id가 외부 요청의 Referer로 새지 않게 한다
  head: () => ({
    meta: [{ title: "결제 확인 | 설기로운" }, { name: "referrer", content: "no-referrer" }],
  }),
  staticData: { checkoutStep: 2 },
  component: PaymentReturn,
});

function PaymentReturn() {
  const config = Route.useLoaderData();
  const { back } = Route.useSearch();
  const navigate = useNavigate();
  const [view, setView] = useState<ReturnView>({ kind: "working" });
  const [retryError, setRetryError] = useState<string | null>(null);
  const [options, setOptions] = useState<AvailablePaymentOption[]>([]);
  const [blocked, setBlocked] = useState<ReadonlySet<string>>(new Set());
  const [round, setRound] = useState(0);

  const show = useCallback(
    (result: PaymentResult): boolean => {
      if (result.status === "COMPLETED") {
        forgetPaymentOptions(result.paymentId);
        void navigate({
          to: "/checkout/complete",
          search: { orderId: result.orderId },
          replace: true,
        });
        return true;
      }
      if (result.status === "CANCELED" || result.status === "FAILED") {
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
    [navigate],
  );

  useEffect(() => {
    let active = true;
    const payments = paymentsFor(config);
    const run = async () => {
      if (round > 0) setView({ kind: "processing" });
      const first = await payments.result().catch(() => null);
      if (!active || (first && show(first))) return;
      setView({ kind: "processing" });
      for (let i = 0; i < POLL_TIMES && active; i += 1) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (!active) return;
        const next = await payments.result().catch(() => null);
        if (!active || (next && show(next))) return;
      }
      if (active) setView({ kind: "unknown" });
    };
    void run();
    return () => {
      active = false;
    };
  }, [config, show, round]);

  return (
    <PaymentReturnTemplate
      view={view}
      options={options.filter((o) => !blocked.has(paymentOptionKey(o)))}
      retryError={retryError}
      back={back}
      onRetry={(option) => {
        if (view.kind !== "failed") return;
        const previous = view;
        setRetryError(null);
        setView({ kind: "working" });
        paymentsFor(config)
          .retry(previous.paymentId, { option })
          .then((result) => {
            if (result.status === "PROCESSING") {
              setRound((v) => v + 1);
              return;
            }
            if (show(result) && result.status === "FAILED" && result.optionUnavailable) {
              setBlocked((current) => new Set(current).add(paymentOptionKey(option)));
            }
          })
          .catch((error: unknown) => {
            setView(previous);
            const code = error instanceof ApiError ? error.code : null;
            setRetryError(
              code === "PAYMENT_EXPIRED" || code === "ALREADY_PROCESSED"
                ? "결제 시간이 지났습니다. 주문서로 돌아가 다시 결제하십시오."
                : code === "PAYMENT_OPTION_UNAVAILABLE"
                  ? "이 결제수단은 지금 사용할 수 없습니다."
                  : "결제를 다시 시도하지 못했습니다.",
            );
            if (code === "PAYMENT_EXPIRED" || code === "ALREADY_PROCESSED") {
              forgetPaymentOptions(previous.paymentId);
              setOptions([]);
            }
          });
      }}
    />
  );
}
