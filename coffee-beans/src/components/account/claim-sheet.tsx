import type { ClaimPreview, ClaimReason } from "@sayren/storefront-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { lazyMessages, m } from "../../i18n";
import { createClaim } from "../../lib/account-actions";
import { previewClaim } from "../../lib/account-queries";
import { formatMoney } from "../../lib/format";
import { productQuery } from "../../lib/queries";
import { Button, Chip, ErrorText, Field, Select, Textarea } from "../ui";

export type ClaimType = "CANCEL" | "RETURN" | "EXCHANGE";

/** 흐름 행동의 하위 흐름(`core.claim.return@1` 등)을 클레임 유형으로 — 클레임이 아니면 undefined */
export function claimTypeOfSubflow(subflow: string | undefined): ClaimType | undefined {
  const name = subflow?.match(/claim\.(cancel|return|exchange)/)?.[1];
  return name === "cancel"
    ? "CANCEL"
    : name === "return"
      ? "RETURN"
      : name === "exchange"
        ? "EXCHANGE"
        : undefined;
}

const REASONS = lazyMessages<ClaimReason>({
  CHANGE_OF_MIND: () => m.reason_change_of_mind(),
  WRONG_ORDER: () => m.reason_wrong_order(),
  DEFECTIVE: () => m.reason_defective(),
  WRONG_DELIVERY: () => m.reason_wrong_delivery(),
  DIFFERENT_FROM_PAGE: () => m.reason_different(),
  DELAY: () => m.reason_delay(),
});

const TITLES = lazyMessages<ClaimType>({
  CANCEL: () => m.claim_cancel_title(),
  RETURN: () => m.claim_return_title(),
  EXCHANGE: () => m.claim_exchange_title(),
});

const REASON_KEYS: ClaimReason[] = [
  "CHANGE_OF_MIND",
  "WRONG_ORDER",
  "DEFECTIVE",
  "WRONG_DELIVERY",
  "DIFFERENT_FROM_PAGE",
  "DELAY",
];

/** 취소·반품·교환 신청 — 사유를 고르면 서버가 계산한 예상 환불액·배송비를 먼저 보이고, 확인하면 접수한다 */
export function ClaimSheet({
  orderItemId,
  productId,
  optionName,
  type,
  currency,
  onClose,
}: {
  orderItemId: string;
  productId: string;
  optionName: string | null;
  type: ClaimType;
  currency: string;
  onClose: () => void;
}) {
  // 교환은 받을 옵션(용량)을 고른다 — 상품의 판매 중인 조합에서, 처음에는 주문한 옵션
  const product = useQuery({ ...productQuery(productId), enabled: type === "EXCHANGE" });
  const variants = (product.data?.variants ?? []).filter((v) => !v.soldOut);
  const [exchangeOptionId, setExchangeOptionId] = useState<string | undefined>(undefined);
  const chosenOption =
    type === "EXCHANGE"
      ? (exchangeOptionId ??
        variants.find((v) => v.name === optionName)?.variantId ??
        variants[0]?.variantId)
      : undefined;
  const [reason, setReason] = useState<ClaimReason>("CHANGE_OF_MIND");
  const [detail, setDetail] = useState("");
  const [preview, setPreview] = useState<ClaimPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let alive = true;
    setPreview(null);
    if (type === "EXCHANGE" && !chosenOption) return;
    previewClaim({ data: { orderItemId, type, reason, exchangeOptionId: chosenOption } })
      .then((result) => alive && setPreview(result))
      .catch((cause: unknown) => alive && setError(cause instanceof Error ? cause.message : null));
    return () => {
      alive = false;
    };
  }, [orderItemId, type, reason, chosenOption]);

  const submit = async () => {
    setPending(true);
    const result = await createClaim({
      data: {
        orderItemId,
        type,
        reason,
        reasonDetail: detail || undefined,
        exchangeOptionId: chosenOption,
      },
    });
    setPending(false);
    if (!result.ok) return setError(result.message);
    await queryClient.invalidateQueries({ queryKey: ["me"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={m.nav_close()}
        className="absolute inset-0 bg-ink/30"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90vh] max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[12px] bg-page p-4 md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:rounded-[12px]">
        <div className="flex items-center justify-between">
          <span className="font-bold text-body-lg">{TITLES[type]}</span>
          <button
            type="button"
            aria-label={m.nav_close()}
            className="grid size-11 place-items-center"
            onClick={onClose}
          >
            <X className="size-5" />
          </button>
        </div>
        <Field label={m.claim_reason()}>
          <Select value={reason} onChange={(e) => setReason(e.target.value as ClaimReason)}>
            {REASON_KEYS.map((key) => (
              <option key={key} value={key}>
                {REASONS[key]}
              </option>
            ))}
          </Select>
        </Field>
        {type === "EXCHANGE" && variants.length > 1 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="pb-2 font-semibold text-meta">{m.claim_exchange_option()}</legend>
            <div className="grid grid-cols-3 gap-2">
              {variants.map((v) => (
                <Chip
                  key={v.variantId}
                  selected={v.variantId === chosenOption}
                  onClick={() => setExchangeOptionId(v.variantId)}
                >
                  {v.name}
                </Chip>
              ))}
            </div>
          </fieldset>
        ) : null}
        <Field label={m.claim_detail()}>
          <Textarea value={detail} maxLength={1000} onChange={(e) => setDetail(e.target.value)} />
        </Field>
        {preview ? (
          <dl className="flex flex-col gap-1.5 rounded-card border border-line p-3 text-meta">
            {preview.claimDeliveryFee > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted">{m.claim_delivery_fee()}</dt>
                <dd className="tabular">{formatMoney(preview.claimDeliveryFee, currency)}</dd>
              </div>
            ) : null}
            {preview.expectedRefundAmount !== null ? (
              <div className="flex justify-between">
                <dt className="text-muted">{m.claim_refund()}</dt>
                <dd className="font-semibold tabular">
                  {formatMoney(preview.expectedRefundAmount, currency)}
                </dd>
              </div>
            ) : null}
            {preview.deliveryFeeRefundAmount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted">{m.claim_delivery_refund()}</dt>
                <dd className="tabular">
                  {formatMoney(preview.deliveryFeeRefundAmount, currency)}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button disabled={pending} onClick={submit}>
          {m.claim_submit()}
        </Button>
      </div>
    </div>
  );
}
