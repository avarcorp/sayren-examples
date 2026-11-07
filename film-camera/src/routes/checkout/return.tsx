import { type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import type { PaymentResult } from "@sayren/storefront-sdk/payments";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PaymentOptions } from "../../components/checkout/payment-options";
import { Button, ButtonLink, ErrorState, PageHeader } from "../../components/ui";
import { m } from "../../i18n";
import { paymentsFor, recallPaymentOptions } from "../../lib/payments";
import { getPaymentConfig } from "../../lib/shop-actions";

/**
 * 결제 복귀 — 결제창에서 돌아와 `payments.result()`로 결과를 읽는다(브라우저에서만). 주소의 `sayrenPaymentId`는 SDK가 읽는다.
 * 확인 중(PROCESSING)은 실패가 아니다 — 확정될 때까지 상태를 다시 조회하고 재결제 버튼을 주지 않는다.
 * 실패·취소면 같은 결제를 다른 결제 옵션으로 다시 시도한다(`payments.retry`)
 */
export const Route = createFileRoute("/checkout/return")({
  loader: async () => ({ paymentConfig: await getPaymentConfig() }),
  component: PaymentReturn,
});

const POLL_INTERVAL_MS = 2000;
const POLL_TRIES = 20;

type View =
  | { kind: "processing" }
  | { kind: "unknown" }
  | {
      kind: "failed";
      paymentId: string;
      canceled: boolean;
      message: string;
      options: AvailablePaymentOption[];
    }
  | { kind: "invalid"; message: string };

function PaymentReturn() {
  const { paymentConfig } = Route.useLoaderData();
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ kind: "processing" });
  const [option, setOption] = useState("");

  useEffect(() => {
    let active = true;
    const payments = paymentsFor(paymentConfig);

    const settle = async (result: PaymentResult) => {
      if (!active) return;
      if (result.status === "COMPLETED") {
        await navigate({
          to: "/checkout/complete",
          search: { orderId: result.orderId, orderNo: result.orderNo ?? undefined },
          replace: true,
        });
        return;
      }
      if (result.status === "PROCESSING") {
        for (let i = 0; i < POLL_TRIES && active; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          const status = await payments.getStatus(result.paymentId);
          if (status.result === "COMPLETED" && status.orderId) {
            await navigate({
              to: "/checkout/complete",
              search: { orderId: status.orderId, orderNo: status.orderNo ?? undefined },
              replace: true,
            });
            return;
          }
          if (status.result === "FAILED" || status.result === "EXPIRED") {
            showRetry(result.paymentId, false, status.lastFailure?.message ?? m.return_failed());
            return;
          }
        }
        if (active) setView({ kind: "unknown" });
        return;
      }
      if (result.status === "INVALID") {
        setView({ kind: "invalid", message: result.message });
        return;
      }
      showRetry(result.paymentId, result.status === "CANCELED", result.message);
    };

    const showRetry = (paymentId: string, canceled: boolean, message: string) => {
      const options = recallPaymentOptions(paymentId);
      setOption(options[0] ? paymentOptionKey(options[0]) : "");
      setView({ kind: "failed", paymentId, canceled, message, options });
    };

    payments
      .result(window.location.href)
      .then(settle, () => active && setView({ kind: "unknown" }));
    return () => {
      active = false;
    };
  }, [navigate, paymentConfig]);

  const retry = async (paymentId: string, options: AvailablePaymentOption[]) => {
    const payments = paymentsFor(paymentConfig);
    const prepared = payments.prepareWindow();
    const selected = options.find((o) => paymentOptionKey(o) === option);
    if (!selected) {
      prepared.close();
      return;
    }
    setView({ kind: "processing" });
    const result = await payments.retry(paymentId, { option: selected, window: prepared });
    if (result.status === "COMPLETED") {
      await navigate({
        to: "/checkout/complete",
        search: { orderId: result.orderId, orderNo: result.orderNo ?? undefined },
      });
    } else if (result.status === "FAILED" || result.status === "CANCELED") {
      setView({
        kind: "failed",
        paymentId,
        canceled: result.status === "CANCELED",
        message: result.message,
        options,
      });
    }
  };

  return (
    <main className="flex flex-col gap-6 lg:max-w-[40rem]">
      <PageHeader title={m.return_title()} />
      {view.kind === "processing" ? <ProcessingView /> : null}
      {view.kind === "unknown" ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-body-lg">{m.return_unknown()}</p>
          <ButtonLink to="/orders" variant="secondary">
            {m.return_orders()}
          </ButtonLink>
        </div>
      ) : null}
      {view.kind === "invalid" ? (
        <ErrorState
          message={view.message}
          action={
            <ButtonLink to="/cart" variant="secondary">
              {m.checkout_go_cart()}
            </ButtonLink>
          }
        />
      ) : null}
      {view.kind === "failed" ? (
        <div className="flex flex-col gap-6">
          <ErrorState
            message={view.canceled ? m.return_canceled() : view.message || m.return_failed()}
          />
          {view.options.length > 0 ? (
            <>
              <PaymentOptions
                title={m.return_retry_title()}
                options={view.options}
                value={option}
                onChange={setOption}
              />
              <Button className="self-start" onClick={() => retry(view.paymentId, view.options)}>
                {m.return_retry_title()}
              </Button>
            </>
          ) : null}
          <ButtonLink to="/orders" variant="secondary" className="self-start">
            {m.return_orders()}
          </ButtonLink>
        </div>
      ) : null}
    </main>
  );
}

function ProcessingView() {
  return (
    <div role="status" className="flex flex-col gap-4 py-6">
      <span
        aria-hidden="true"
        className="block h-1 w-24 animate-pulse bg-point motion-reduce:animate-none"
      />
      <p className="text-body-lg">{m.return_processing()}</p>
    </div>
  );
}
