import { type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import type { PaymentResult } from "@sayren/storefront-sdk/payments";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button, Chip, Container, ErrorText, LinkButton, PageTitle } from "../../components/ui";
import { m } from "../../i18n";
import { paymentsFor, recallPaymentOptions } from "../../lib/payments";
import { getPaymentConfig } from "../../lib/shop-actions";

const POLL_MS = 2000;
const POLL_LIMIT = 20;

/**
 * 결제 복귀 — 브라우저에서 `payments.result(현재 주소)`로 결과를 읽는다(`sayrenPaymentId`를 지운 주소로 바꾸지 않는다).
 * 확인 중(PROCESSING)은 실패가 아니다 — 확정될 때까지 조회하고 다시 결제하게 하지 않는다. 취소·실패면 다른 결제 수단으로 다시 시도한다
 */
export const Route = createFileRoute("/checkout/return")({
  validateSearch: z.object({ sayrenPaymentId: z.string().optional() }),
  loader: async () => ({ config: await getPaymentConfig() }),
  preload: false,
  component: PaymentReturn,
});

type View =
  | { kind: "checking" }
  | { kind: "processing" }
  | { kind: "retry"; paymentId: string; message: string; options: AvailablePaymentOption[] }
  | { kind: "invalid"; message: string };

function PaymentReturn() {
  const { config } = Route.useLoaderData();
  const navigate = useNavigate();
  const [view, setView] = useState<View>({ kind: "checking" });
  const [optionKey, setOptionKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let alive = true;
    const payments = paymentsFor(config);
    const settle = async (result: PaymentResult) => {
      if (!alive) return;
      if (result.status === "COMPLETED") {
        await navigate({
          to: "/checkout/complete",
          search: { orderId: result.orderId },
          replace: true,
        });
        return;
      }
      if (result.status === "PROCESSING") {
        setView({ kind: "processing" });
        for (let i = 0; i < POLL_LIMIT && alive; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, POLL_MS));
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
              kind: "retry",
              paymentId: result.paymentId,
              message: m.checkout_payment_failed(),
              options: recallPaymentOptions(result.paymentId),
            });
            return;
          }
        }
        return;
      }
      if (result.status === "CANCELED" || result.status === "FAILED") {
        setView({
          kind: "retry",
          paymentId: result.paymentId,
          message: result.message || m.checkout_payment_failed(),
          options: recallPaymentOptions(result.paymentId),
        });
        return;
      }
      setView({ kind: "invalid", message: result.message });
    };
    payments
      .result(window.location.href)
      .then(settle)
      .catch(() => alive && setView({ kind: "invalid", message: m.return_invalid() }));
    return () => {
      alive = false;
    };
  }, [config, navigate]);

  const retry = async () => {
    if (view.kind !== "retry") return;
    const payments = paymentsFor(config);
    const prepared = payments.prepareWindow();
    const option = view.options.find((o) => paymentOptionKey(o) === optionKey);
    if (!option) {
      prepared.close();
      setError(m.checkout_option_needed());
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await payments.retry(view.paymentId, { option, window: prepared });
      if (result.status === "COMPLETED") {
        await navigate({ to: "/checkout/complete", search: { orderId: result.orderId } });
      } else if (result.status === "CANCELED" || result.status === "FAILED") {
        setError(result.message || m.checkout_payment_failed());
      } else if (result.status === "PROCESSING") {
        setView({ kind: "processing" });
      }
    } catch (cause) {
      prepared.close();
      setError(cause instanceof Error ? cause.message : m.checkout_payment_failed());
    } finally {
      setPending(false);
    }
  };

  return (
    <Container className="flex flex-col gap-5 pt-8">
      {view.kind === "checking" || view.kind === "processing" ? (
        <>
          <PageTitle>{m.return_checking_title()}</PageTitle>
          <p role="status" className="text-body text-sub">
            {view.kind === "checking" ? m.return_checking() : m.return_processing()}
          </p>
          {view.kind === "processing" ? (
            <LinkButton to="/orders" variant="secondary" className="w-fit">
              {m.account_menu_orders()}
            </LinkButton>
          ) : null}
        </>
      ) : view.kind === "retry" ? (
        <>
          <PageTitle>{m.return_failed_title()}</PageTitle>
          <ErrorText>{view.message}</ErrorText>
          {view.options.length > 0 ? (
            <>
              <p className="text-body text-sub">{m.return_choose_again()}</p>
              <div className="grid grid-cols-2 gap-2">
                {view.options.map((o) => (
                  <Chip
                    key={paymentOptionKey(o)}
                    selected={paymentOptionKey(o) === optionKey}
                    onClick={() => setOptionKey(paymentOptionKey(o))}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
              {error ? <ErrorText>{error}</ErrorText> : null}
              <Button disabled={pending} onClick={retry}>
                {m.return_retry()}
              </Button>
            </>
          ) : (
            <LinkButton to="/cart" variant="secondary" className="w-fit">
              {m.return_back_cart()}
            </LinkButton>
          )}
        </>
      ) : (
        <>
          <PageTitle>{m.return_invalid_title()}</PageTitle>
          <p className="text-body text-sub">{view.message}</p>
          <LinkButton to="/cart" variant="secondary" className="w-fit">
            {m.return_back_cart()}
          </LinkButton>
        </>
      )}
    </Container>
  );
}
