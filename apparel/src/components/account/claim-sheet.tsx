import { useState } from "react";
import { lazyMessages, m } from "../../i18n";
import { createClaim, previewClaim } from "../../lib/account-actions";
import { formatMoney } from "../../lib/format";
import { Button } from "../ui/button";
import { SelectField } from "../ui/fields";
import { Sheet } from "../ui/sheet";

export type ClaimKind = "CANCEL" | "RETURN" | "EXCHANGE";

export const CLAIM_LABELS = lazyMessages<ClaimKind>({
  CANCEL: () => m.claim_cancel(),
  RETURN: () => m.claim_return(),
  EXCHANGE: () => m.claim_exchange(),
});

const REASONS = lazyMessages({
  CHANGE_OF_MIND: () => m.claim_reason_change_of_mind(),
  WRONG_ORDER: () => m.claim_reason_wrong_order(),
  DEFECTIVE: () => m.claim_reason_defective(),
  WRONG_DELIVERY: () => m.claim_reason_wrong_item(),
});

/** 취소·반품·교환 신청 — 먼저 미리보기로 환불 예정 금액을 보이고, 확인하면 신청한다 */
export function ClaimSheet({
  open,
  onClose,
  orderItemId,
  kind,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  orderItemId: string;
  kind: ClaimKind;
  onDone: () => void;
}) {
  const [reason, setReason] = useState<keyof typeof REASONS>("CHANGE_OF_MIND");
  const [preview, setPreview] = useState<{ refundAmount: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const body = { orderItemId, type: kind, reason };

  return (
    <Sheet open={open} onClose={onClose} title={CLAIM_LABELS[kind]}>
      <SelectField
        label={m.claim_reason()}
        name="reason"
        value={reason}
        onChange={(e) => {
          setReason(e.target.value as keyof typeof REASONS);
          setPreview(null);
        }}
      >
        {(Object.keys(REASONS) as (keyof typeof REASONS)[]).map((key) => (
          <option key={key} value={key}>
            {REASONS[key]}
          </option>
        ))}
      </SelectField>
      {preview?.refundAmount != null ? (
        <p className="text-body">
          {m.claim_refund_preview({ amount: formatMoney(preview.refundAmount) })}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-meta text-sale">
          {error}
        </p>
      ) : null}
      {preview ? (
        <Button
          onClick={async () => {
            const result = await createClaim({ data: body }).catch(() => null);
            if (result?.ok) onDone();
            else setError(result?.message ?? m.common_error_retry());
          }}
        >
          {m.claim_submit({ kind: CLAIM_LABELS[kind] })}
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={async () => {
            const result = await previewClaim({ data: body }).catch(() => null);
            if (result?.ok) setPreview(result);
            else setError(result?.message ?? m.common_error_retry());
          }}
        >
          {m.claim_preview()}
        </Button>
      )}
    </Sheet>
  );
}
