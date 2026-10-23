import type { ClaimPreview, MyOrderItem } from "@sayren/storefront-sdk";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "../../lib/format";
import { CLAIM_REASONS } from "../../lib/order-status";
import { Button } from "../atoms/button";

export type ClaimKind = "CANCEL" | "RETURN" | "EXCHANGE";
type Reason = (typeof CLAIM_REASONS)[number]["value"];

/**
 * 취소·반품·교환 신청 (와이어프레임 Account) — 사유를 고르면 서버 미리보기로 환불 예정 금액·배송비를 보인다.
 * 금액은 서버 값이다. 신청하면 닫고 주문을 다시 읽는다.
 */
export function ClaimDialog({
  item,
  kinds,
  onPreview,
  onSubmit,
  onClose,
}: {
  item: MyOrderItem;
  kinds: ClaimKind[];
  onPreview: (input: { type: ClaimKind; reason: Reason }) => Promise<ClaimPreview | null>;
  onSubmit: (input: {
    type: ClaimKind;
    reason: Reason;
    reasonDetail?: string;
  }) => Promise<string | null>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<ClaimKind>(kinds[0] ?? "CANCEL");
  const [reason, setReason] = useState<Reason>("CHANGE_OF_MIND");
  const [detail, setDetail] = useState("");
  const [preview, setPreview] = useState<ClaimPreview | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  // 미리보기는 종류·사유가 바뀔 때만 다시 부른다(부르는 쪽 함수가 렌더마다 새로 만들어져도)
  const previewRef = useRef(onPreview);
  previewRef.current = onPreview;
  useEffect(() => {
    let alive = true;
    setPreview(null);
    setPreviewFailed(false);
    void previewRef
      .current({ type, reason })
      .catch(() => null)
      .then((p) => {
        if (!alive) return;
        setPreview(p);
        setPreviewFailed(p === null);
      });
    return () => {
      alive = false;
    };
  }, [type, reason]);
  const label = { CANCEL: "취소", RETURN: "반품", EXCHANGE: "교환" }[type];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="claim-title"
      onClose={onClose}
      className="m-auto w-[min(480px,calc(100vw-2rem))] bg-page p-0 backdrop:bg-ink/40"
    >
      <form
        method="dialog"
        className="flex flex-col gap-5 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const message = await onSubmit({ type, reason, reasonDetail: detail || undefined });
            if (message) setError(message);
            else dialog.current?.close();
          } catch {
            setError("신청하지 못했습니다. 다시 시도하십시오.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="claim-title" className="font-display text-h3">
            {label} 신청
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={() => dialog.current?.close()}
            className="-mt-2 -mr-2 grid size-11 place-items-center"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <p className="text-body">{item.productName}</p>
        {kinds.length > 1 ? (
          <fieldset className="flex gap-2">
            <legend className="sr-only">신청 종류</legend>
            {kinds.map((k) => (
              <label
                key={k}
                className={`flex h-11 flex-1 cursor-pointer items-center justify-center text-body ${k === type ? "border border-primary bg-primary text-white" : "border border-line-strong"}`}
              >
                <input
                  type="radio"
                  name="claim-type"
                  className="sr-only"
                  checked={k === type}
                  onChange={() => setType(k)}
                />
                {{ CANCEL: "취소", RETURN: "반품", EXCHANGE: "교환" }[k]}
              </label>
            ))}
          </fieldset>
        ) : null}
        <label className="flex flex-col gap-2 font-medium text-small">
          사유
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as Reason)}
            className="h-12 border-0 border-ink border-b bg-transparent font-normal text-body"
          >
            {CLAIM_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 font-medium text-small">
          <span>
            자세한 사유 <span className="font-normal text-muted">선택</span>
          </span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={1000}
            rows={3}
            className="border border-line-strong p-3 font-normal text-body outline-none focus:border-ink"
          />
        </label>
        <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-2.5 border-ink border-t pt-4 text-body">
          <dt className="text-muted">상품 금액</dt>
          <dd>{formatMoney(item.totalPrice)}</dd>
          {preview?.claimDeliveryFee ? (
            <>
              <dt className="text-muted">{type === "EXCHANGE" ? "교환 배송비" : "반품 배송비"}</dt>
              <dd className="text-primary">−{formatMoney(preview.claimDeliveryFee)}</dd>
            </>
          ) : null}
          {preview?.couponChargeAmount ? (
            <>
              <dt className="text-muted">쿠폰 할인 회수</dt>
              <dd className="text-primary">−{formatMoney(preview.couponChargeAmount)}</dd>
            </>
          ) : null}
          {type !== "EXCHANGE" ? (
            <>
              <dt className="font-medium">환불 예정 금액</dt>
              <dd className="font-bold">
                {preview?.expectedRefundAmount != null
                  ? formatMoney(preview.expectedRefundAmount)
                  : previewFailed
                    ? "계산하지 못했습니다"
                    : "계산 중"}
              </dd>
            </>
          ) : null}
        </dl>
        {error ? (
          <p role="alert" className="text-primary text-small">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" block disabled={busy}>
          {label} 신청
        </Button>
      </form>
    </dialog>
  );
}
