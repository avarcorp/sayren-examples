import { type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { ChevronRight, CircleAlert, CircleHelp, LoaderCircle } from "lucide-react";
import { buttonClass } from "../atoms/button";

export type ReturnView =
  | { kind: "working" }
  | { kind: "processing" }
  | { kind: "failed"; paymentId: string; canceled: boolean; message: string }
  | { kind: "unknown" };

/**
 * 결제 복귀 (와이어프레임 Complete) — 확인 중, 실패·취소(다른 결제수단으로 다시 결제), 결과 불명.
 * 확인 중(`PROCESSING`)은 실패가 아니다 — 다시 결제하게 하지 않는다.
 */
export function PaymentReturnTemplate({
  view,
  options,
  retryError,
  back,
  onRetry,
}: {
  view: ReturnView;
  options: AvailablePaymentOption[];
  retryError: string | null;
  back: string | undefined;
  onRetry: (option: AvailablePaymentOption) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-16 text-center md:py-24">
      {view.kind === "working" || view.kind === "processing" ? (
        <>
          <LoaderCircle
            aria-hidden
            className="size-12 animate-spin text-line-strong"
            strokeWidth={1.4}
          />
          <h1 className="font-display text-h2">결제를 확인하고 있습니다</h1>
          <p className="text-body text-muted">
            {view.kind === "processing"
              ? "결제사 응답을 기다리고 있습니다. 창을 닫지 마십시오."
              : "창을 닫지 마십시오. 확인이 끝나면 주문 완료 화면으로 이동합니다."}
          </p>
        </>
      ) : view.kind === "failed" ? (
        <>
          <CircleAlert aria-hidden className="size-12 text-primary" strokeWidth={1.4} />
          <h1 className="font-display text-h2">
            {view.canceled ? "결제를 취소했습니다" : "결제가 완료되지 않았습니다"}
          </h1>
          {view.canceled ? null : (
            <p className="break-words text-body text-muted">{view.message}</p>
          )}
          {options.length ? (
            <section aria-labelledby="retry-title" className="flex w-full flex-col gap-3 text-left">
              <h2 id="retry-title" className="font-medium text-body">
                다른 결제수단으로 다시 결제
              </h2>
              <div className="flex flex-col border-ink border-t">
                {options.map((option) => (
                  <button
                    key={paymentOptionKey(option)}
                    type="button"
                    onClick={() => onRetry(option)}
                    className="flex items-center justify-between gap-3 border-line border-b px-1 py-4 text-left hover:bg-tone-plain"
                  >
                    <span className="font-medium text-lead">{option.label}</span>
                    <ChevronRight aria-hidden className="size-4 text-muted" />
                  </button>
                ))}
              </div>
              {retryError ? (
                <p role="alert" className="text-body text-primary">
                  {retryError}
                </p>
              ) : null}
            </section>
          ) : null}
          <a
            href={back ?? "/cart"}
            className={
              options.length
                ? buttonClass({ variant: "text" })
                : buttonClass({ size: "lg", block: true })
            }
          >
            {options.length ? "주문서로 돌아가기" : "주문서로 돌아가 다시 결제하기"}
          </a>
        </>
      ) : (
        <>
          <CircleHelp aria-hidden className="size-12 text-line-strong" strokeWidth={1.4} />
          <h1 className="font-display text-h2">결제 결과를 확인하지 못했습니다</h1>
          <p className="text-body text-muted">
            결제가 끝났다면 주문 내역에 곧 나타납니다. 중복 결제를 막으려면 다시 결제하기 전에 주문
            내역을 확인하십시오.
          </p>
          <Link
            to="/account"
            className={buttonClass({ variant: "outline", size: "lg", block: true })}
          >
            주문 내역 보기
          </Link>
        </>
      )}
    </div>
  );
}
