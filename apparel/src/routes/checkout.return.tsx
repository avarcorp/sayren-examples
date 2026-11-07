import { type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import type { PaymentResult } from "@sayren/storefront-sdk/payments";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button, ButtonLink } from "../components/ui/button";
import { Container, PageTitle } from "../components/ui/page-title";
import { m } from "../i18n";
import { getPublicConfig } from "../lib/checkout-actions";
import { paymentsFor, recallPaymentOptions } from "../lib/payments";

const POLL_INTERVAL = 2000;
const POLL_LIMIT = 15;

/** 결제 복귀 — 결제창에서 돌아오면 결과를 읽는다. 확인 중이면 기다리고, 실패·취소면 다른 결제수단으로 다시 시도한다 */
export const Route = createFileRoute("/checkout/return")({
  validateSearch: z.object({ sayrenPaymentId: z.string().optional() }),
  loader: async () => ({ config: await getPublicConfig() }),
  preload: false,
  head: () => ({
    meta: [{ title: m.payment_checking() }, { name: "referrer", content: "no-referrer" }],
  }),
  component: PaymentReturn,
});

type View =
  | { kind: "checking" }
  | { kind: "unknown" }
  | { kind: "failed"; paymentId: string; message: string; options: AvailablePaymentOption[] }
  | { kind: "invalid" };

function PaymentReturn() {
  const { config } = Route.useLoaderData();
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;
    const payments = paymentsFor(config);

    const settle = async (result: PaymentResult) => {
      if (cancelled) return;
      if (result.status === "COMPLETED") {
        await navigate({
          to: "/checkout/complete",
          search: { orderId: result.orderId, orderNo: result.orderNo ?? undefined },
          replace: true,
        });
        return;
      }
      if (result.status === "PROCESSING") {
        // 확인 중은 실패가 아니다 — 다시 결제하게 하지 않고 기다린다
        for (let i = 0; i < POLL_LIMIT && !cancelled; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
          const status = await payments.getStatus(result.paymentId).catch(() => null);
          if (status?.result === "COMPLETED" && status.orderId) {
            await navigate({
              to: "/checkout/complete",
              search: { orderId: status.orderId },
              replace: true,
            });
            return;
          }
          if (status?.result === "FAILED" || status?.result === "EXPIRED") {
            setView({
              kind: "failed",
              paymentId: result.paymentId,
              message: m.payment_failed(),
              options: recallPaymentOptions(result.paymentId),
            });
            return;
          }
        }
        if (!cancelled) setView({ kind: "unknown" });
        return;
      }
      if (result.status === "CANCELED" || result.status === "FAILED") {
        setView({
          kind: "failed",
          paymentId: result.paymentId,
          message:
            result.status === "CANCELED"
              ? m.payment_canceled()
              : result.message || m.payment_failed(),
          options: recallPaymentOptions(result.paymentId),
        });
        return;
      }
      setView({ kind: "invalid" });
    };

    void payments.result(window.location.href).then(settle, () => setView({ kind: "unknown" }));
    return () => {
      cancelled = true;
    };
  }, [config, navigate]);

  const retry = async (option: AvailablePaymentOption, paymentId: string) => {
    const payments = paymentsFor(config);
    // 팝업은 클릭 시점에 연다
    const paymentWindow = payments.prepareWindow();
    try {
      const result = await payments.retry(paymentId, { option, window: paymentWindow });
      if (result.status === "COMPLETED") {
        await navigate({
          to: "/checkout/complete",
          search: { orderId: result.orderId, orderNo: result.orderNo ?? undefined },
          replace: true,
        });
      } else if (result.status === "CANCELED" || result.status === "FAILED") {
        setView({
          kind: "failed",
          paymentId,
          message:
            result.status === "CANCELED"
              ? m.payment_canceled()
              : result.message || m.payment_failed(),
          options: recallPaymentOptions(paymentId),
        });
      } else if (result.status === "PROCESSING") {
        setView({ kind: "checking" });
      }
    } catch {
      paymentWindow.close();
      setView({ kind: "unknown" });
    }
  };

  return (
    <Container className="max-w-xl">
      <PageTitle>
        {view.kind === "failed" ? m.payment_failed_title() : m.payment_checking()}
      </PageTitle>
      <div className="flex flex-col items-start gap-5 border-line border-t py-8">
        {view.kind === "checking" ? (
          <p role="status" className="text-body text-sub">
            {m.payment_checking_detail()}
          </p>
        ) : null}
        {view.kind === "unknown" ? (
          <>
            <p role="status" className="text-body text-sub">
              {m.payment_unknown()}
            </p>
            <ButtonLink to="/orders" variant="secondary">
              {m.account_orders()}
            </ButtonLink>
          </>
        ) : null}
        {view.kind === "invalid" ? (
          <ButtonLink to="/cart" variant="secondary">
            {m.payment_back_to_cart()}
          </ButtonLink>
        ) : null}
        {view.kind === "failed" ? (
          <>
            <p role="alert" className="text-body text-sale">
              {view.message}
            </p>
            {view.options.length > 0 ? (
              <div className="flex w-full flex-col gap-2">
                <p className="text-meta text-sub">{m.payment_retry_other()}</p>
                {view.options.map((option) => (
                  <Button
                    key={paymentOptionKey(option)}
                    variant="secondary"
                    className="w-full justify-between"
                    onClick={() => retry(option, view.paymentId)}
                  >
                    <span>{option.label}</span>
                    <span className="text-caption text-muted">{option.pgName}</span>
                  </Button>
                ))}
              </div>
            ) : (
              <ButtonLink to="/cart" variant="secondary">
                {m.payment_back_to_cart()}
              </ButtonLink>
            )}
          </>
        ) : null}
      </div>
    </Container>
  );
}
