import type { ClaimPreview, ClaimReason } from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useAction } from "../../hooks/use-action";
import { lazyMessages, m } from "../../i18n";
import { createClaim } from "../../lib/account-actions";
import { previewClaim } from "../../lib/account-queries";
import { formatMoney } from "../../lib/format";
import { Button, InfoRows, Select, TextArea } from "../ui";

export type ClaimKind = "CANCEL" | "RETURN" | "EXCHANGE";

const REASONS: ClaimReason[] = [
  "DEFECTIVE",
  "WRONG_DELIVERY",
  "DIFFERENT_FROM_PAGE",
  "CHANGE_OF_MIND",
  "WRONG_ORDER",
  "DELAY",
];
const REASON_LABEL = lazyMessages<ClaimReason>({
  CHANGE_OF_MIND: () => m.claim_reason_CHANGE_OF_MIND(),
  WRONG_ORDER: () => m.claim_reason_WRONG_ORDER(),
  DEFECTIVE: () => m.claim_reason_DEFECTIVE(),
  WRONG_DELIVERY: () => m.claim_reason_WRONG_DELIVERY(),
  DIFFERENT_FROM_PAGE: () => m.claim_reason_DIFFERENT_FROM_PAGE(),
  DELAY: () => m.claim_reason_DELAY(),
});

/** 반품·교환 신청 시트 — 사유를 고르면 서버 미리보기로 예상 환불 금액·반품 배송비를 보인다 */
export function ClaimSheet({
  kind,
  orderItemId,
  currency,
  onClose,
}: {
  kind: ClaimKind;
  orderItemId: string;
  currency: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ClaimReason>("DEFECTIVE");
  const [preview, setPreview] = useState<ClaimPreview | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const title =
    kind === "RETURN"
      ? m.claim_action_RETURN_REQUEST()
      : kind === "EXCHANGE"
        ? m.claim_action_EXCHANGE_REQUEST()
        : m.claim_action_CANCEL();
  const queryClient = useQueryClient();
  const { pending, error, run } = useAction();
  const [detail, setDetail] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() =>
      createClaim({ data: { orderItemId, type: kind, reason, reasonDetail: detail } }),
    );
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      onClose();
    }
  };

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    previewClaim({ data: { orderItemId, type: kind, reason } })
      .then((result) => {
        if (active) setPreview(result);
      })
      .catch(() => {
        if (active) setPreview(null);
      });
    return () => {
      active = false;
    };
  }, [orderItemId, kind, reason]);

  const money = (n: number) => formatMoney(n, currency);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:items-center">
      <button
        type="button"
        aria-label={m.common_close()}
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-title"
        className="relative flex max-h-[90vh] w-full flex-col gap-5 overflow-y-auto bg-page px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:max-w-[28rem] lg:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 id="claim-title" className="font-bold text-lg">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={m.common_close()}
            onClick={onClose}
            className="-mr-2 inline-flex size-11 items-center justify-center"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Select
            id="claim-reason"
            label={m.claim_reason()}
            value={reason}
            onChange={(event) => setReason(event.target.value as ClaimReason)}
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {REASON_LABEL[r]}
              </option>
            ))}
          </Select>
          <TextArea
            id="claim-detail"
            label={m.claim_detail()}
            maxLength={1000}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />
          {preview ? (
            <InfoRows
              rows={[
                ...(kind === "RETURN" && preview.expectedRefundAmount !== null
                  ? [
                      {
                        label: m.claim_preview_refund(),
                        value: money(preview.expectedRefundAmount),
                      },
                    ]
                  : []),
                { label: m.claim_preview_fee(), value: money(preview.claimDeliveryFee) },
              ]}
            />
          ) : null}
          <p className="text-meta text-sub">{m.claim_seller_fault()}</p>
          {error ? (
            <p role="alert" className="text-meta text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {m.claim_submit()}
          </Button>
        </form>
      </div>
    </div>
  );
}
