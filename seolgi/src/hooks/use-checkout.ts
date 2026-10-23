import { zodResolver } from "@hookform/resolvers/zod";
import {
  ApiError,
  type AvailablePaymentOption,
  type CheckoutPricing,
  cashReceiptAvailable,
  cashReceiptRequestSchema,
  type DeliveryQuoteResult,
  type MemberAddress,
  paymentOptionKey,
  paymentStartSchema,
} from "@sayren/storefront-sdk";
import type { PaymentResult } from "@sayren/storefront-sdk/payments";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  type CheckoutData,
  type CouponRef,
  couponErrorMessage,
  couponRejectMessage,
  pointRejectMessage,
  previewPricingFn,
  quoteDeliveryFn,
  saveAddressFn,
  startPaymentFn,
} from "../lib/checkout";
import {
  type CheckoutFormInput,
  type CheckoutFormValues,
  checkoutFormSchema,
  MEMO_PRESETS,
  memoOf,
} from "../lib/checkout-form";
import { forgetPaymentOptions, rememberPaymentOptions } from "../lib/payment-options";
import { paymentsFor } from "../lib/payments";

export interface AppliedCoupon {
  ref: NonNullable<CouponRef>;
  name: string;
  discountAmount: number;
}

/**
 * 주문서 상태 — 배송지, 쿠폰·적립금 미리보기, 결제수단, 결제 시작·결과. 금액은 늘 서버 값이다
 * (결제 시작 응답 → 미리보기 → 배송비 견적 → 주문서 순서로 최신 값을 보인다).
 */
export function useCheckout(data: CheckoutData) {
  const { checkout, member, addresses, config } = data;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const options = checkout.paymentOptions;
  const initialAddress = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  const schema = useMemo(() => checkoutFormSchema({ guest: !member }), [member]);
  const form = useForm<CheckoutFormInput, unknown, CheckoutFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      receiverName: initialAddress?.receiverName ?? member?.name ?? "",
      phone: initialAddress?.phone ?? member?.phone ?? "",
      zipCode: initialAddress?.zipCode ?? "",
      address1: initialAddress?.address1 ?? "",
      address2: initialAddress?.address2 ?? "",
      memoChoice: MEMO_PRESETS[0],
      memoText: "",
      agree: false as unknown as true,
    },
  });

  const [addressMode, setAddressMode] = useState<"saved" | "new">(initialAddress ? "saved" : "new");
  const [selectedAddress, setSelectedAddress] = useState<MemberAddress | null>(initialAddress);
  const [saveAsDefault, setSaveAsDefault] = useState(addresses.length === 0 && Boolean(member));

  const [quote, setQuote] = useState<DeliveryQuoteResult | null>(null);
  const [quotedZip, setQuotedZip] = useState<string | null>(null);
  const [pricing, setPricing] = useState<CheckoutPricing | null>(null);
  const [confirmed, setConfirmed] = useState<CheckoutPricing["amounts"] | null>(null);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pointAmount, setPointAmount] = useState(0);
  const [pointError, setPointError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [optionKey, setOptionKey] = useState(options[0] ? paymentOptionKey(options[0]) : "");
  const [unavailableKeys, setUnavailableKeys] = useState<ReadonlySet<string>>(new Set());
  const [cashReceipt, setCashReceipt] = useState<{
    on: boolean;
    type: "INCOME_DEDUCTION" | "EXPENSE_PROOF";
    number: string;
  }>({ on: false, type: "INCOME_DEDUCTION", number: "" });
  const [cashReceiptError, setCashReceiptError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<{ paymentId: string; signature: string } | null>(null);

  const amounts = confirmed ?? pricing?.amounts ?? quote?.amounts ?? checkout.amounts;
  const paymentRequired = pricing ? pricing.paymentRequired : amounts.totalAmount > 0;
  const selectedOption = options.find((o) => paymentOptionKey(o) === optionKey) ?? null;

  /**
   * 서버 금액 미리보기 — 쿠폰·적립금·우편번호를 함께 보낸다. `target`은 이번에 바꾼 칸이다.
   * 바꾼 칸이 거절·실패하면 그 칸에만 안내하고 앞서 적용한 상태(쿠폰·적립금·금액)는 그대로 둔다.
   * 다른 칸을 바꾸다 적용해 둔 쿠폰·적립금이 더는 맞지 않게 되면 그것을 빼고 다시 계산한다.
   */
  async function reprice(
    next: { coupon: AppliedCoupon | null; pointAmount: number },
    target: "coupon" | "points" | "refresh",
  ): Promise<boolean> {
    if (target === "coupon") setCouponError(null);
    if (target === "points") setPointError(null);
    if (!next.coupon && !next.pointAmount) {
      setPricing(null);
      setCoupon(null);
      setPointAmount(0);
      setConfirmed(null);
      return true;
    }
    setBusy(true);
    try {
      const {
        pricing: result,
        code,
        reason,
      } = await previewPricingFn({
        data: {
          checkoutId: checkout.checkoutId,
          coupon: next.coupon?.ref ?? null,
          pointAmount: next.pointAmount,
          zipCode: form.getValues("zipCode") ?? "",
        },
      });
      if (!result) {
        const pointFailed = Boolean(code?.startsWith("POINT")) && next.pointAmount > 0;
        if (target === "points") {
          setPointError(
            pointFailed
              ? pointRejectMessage(reason, checkout.points?.minAmount ?? 0)
              : "적립금을 적용하지 못했습니다. 다시 시도하십시오.",
          );
          return false;
        }
        // 쿠폰을 바꾸니 적립금 사용액이 맞지 않게 됐다 — 적립금을 빼고 다시 계산한다
        if (pointFailed) return reprice({ coupon: next.coupon, pointAmount: 0 }, target);
        if (target === "coupon") {
          setCouponError(couponErrorMessage(code));
          return false;
        }
        if (next.coupon) return reprice({ coupon: null, pointAmount: next.pointAmount }, target);
        return false;
      }
      const c = result.coupons[0];
      if (next.coupon && c && !c.applied) {
        if (target === "coupon") {
          setCouponError(couponRejectMessage(c.rejectReason));
          return false;
        }
        return reprice({ coupon: null, pointAmount: next.pointAmount }, target);
      }
      const reject = result.points?.rejectReason ?? null;
      if (next.pointAmount && reject) {
        if (target === "points") {
          setPointError(pointRejectMessage(reject, checkout.points?.minAmount ?? 0));
          return false;
        }
        return reprice({ coupon: next.coupon, pointAmount: 0 }, target);
      }
      setCoupon(
        next.coupon && c
          ? { ...next.coupon, name: c.name, discountAmount: c.discountAmount }
          : null,
      );
      setPointAmount(result.amounts.pointAmount);
      if (result.points?.adjustReason === "MIN_PAYMENT")
        setPointError("결제 금액 100원을 남기려고 사용액을 줄였습니다.");
      setPricing(result);
      setConfirmed(null);
      return true;
    } finally {
      setBusy(false);
    }
  }

  /** 우편번호가 정해지면 배송비(제주·도서산간)를 다시 받는다 */
  function quoteZip(zipCode: string) {
    if (!/^[0-9]{5}$/.test(zipCode) || zipCode === quotedZip) return;
    setQuotedZip(zipCode);
    void quoteDeliveryFn({ data: { checkoutId: checkout.checkoutId, zipCode } }).then((next) => {
      if (!next) {
        setQuotedZip(null);
        return;
      }
      setQuote(next);
      setConfirmed(null);
      if (coupon || pointAmount) void reprice({ coupon, pointAmount }, "refresh");
    });
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: 처음 채운 배송지로 한 번만 확인한다
  useEffect(() => {
    if (initialAddress) quoteZip(initialAddress.zipCode);
  }, []);

  function pickAddress(address: MemberAddress) {
    setSelectedAddress(address);
    setAddressMode("saved");
    form.setValue("receiverName", address.receiverName);
    form.setValue("phone", address.phone);
    form.setValue("zipCode", address.zipCode);
    form.setValue("address1", address.address1);
    form.setValue("address2", address.address2 ?? "");
    form.clearErrors();
    quoteZip(address.zipCode);
  }

  function newAddress() {
    setSelectedAddress(null);
    setAddressMode("new");
    for (const key of ["zipCode", "address1", "address2"] as const) form.setValue(key, "");
    setQuote(null);
    setQuotedZip(null);
  }

  function settle(result: PaymentResult, back: string, signature: string) {
    if (result.status === "COMPLETED") {
      forgetPaymentOptions(result.paymentId);
      void queryClient.invalidateQueries({ queryKey: ["cart"] });
      void navigate({
        to: "/checkout/complete",
        search: { orderId: result.orderId },
        replace: true,
      });
      return;
    }
    if (result.status === "PROCESSING") {
      void navigate({
        to: "/checkout/return",
        search: { back, sayrenPaymentId: result.paymentId },
        replace: true,
      });
      return;
    }
    if (result.status !== "INVALID") setPending({ paymentId: result.paymentId, signature });
    if (result.status === "FAILED" && result.optionUnavailable) {
      const blocked = new Set(unavailableKeys).add(optionKey);
      setUnavailableKeys(blocked);
      const next = options.find((o) => !blocked.has(paymentOptionKey(o)));
      setOptionKey(next ? paymentOptionKey(next) : "");
    }
    setNotice(
      result.status === "CANCELED"
        ? "결제를 취소했습니다. 다시 결제할 수 있습니다."
        : result.status === "FAILED"
          ? result.message
          : "결제 결과를 확인하지 못했습니다. 주문 내역을 확인하십시오.",
    );
  }

  const submit = form.handleSubmit(async (values) => {
    if (paymentRequired && (!selectedOption || unavailableKeys.has(optionKey))) {
      setNotice("결제수단을 선택하십시오.");
      return;
    }
    let receipt: { type: "INCOME_DEDUCTION" | "EXPENSE_PROOF"; identityNumber: string } | undefined;
    if (selectedOption && cashReceiptAvailable(selectedOption.method) && cashReceipt.on) {
      const parsed = cashReceiptRequestSchema.safeParse({
        type: cashReceipt.type,
        identityNumber: cashReceipt.number,
      });
      if (!parsed.success) {
        setCashReceiptError(parsed.error.issues[0]?.message ?? "번호를 다시 확인하십시오");
        return;
      }
      receipt = parsed.data;
    }
    setCashReceiptError(null);
    const option = paymentRequired ? (selectedOption ?? undefined) : undefined;
    const back = window.location.pathname + window.location.search;
    const signature = JSON.stringify([values, coupon?.ref ?? null, pointAmount]);
    const payments = paymentsFor(config);
    setSubmitting(true);
    setNotice(null);
    try {
      // 팝업·결제창에서 취소·실패한 결제 — 입력이 같으면 새 결제를 만들지 않고 이어서 다시 시도한다
      if (option && pending && pending.signature === signature) {
        try {
          settle(
            await payments.retry(pending.paymentId, { option, cashReceipt: receipt }),
            back,
            signature,
          );
        } catch (error) {
          setPending(null);
          setNotice(
            error instanceof ApiError && error.code === "PAYMENT_EXPIRED"
              ? "결제 시간이 지났습니다. 다시 결제하십시오."
              : "결제를 다시 시도하지 못했습니다.",
          );
        }
        return;
      }
      setPending(null);
      if (member && addressMode === "new" && saveAsDefault) {
        await saveAddressFn({
          data: {
            alias: values.receiverName.slice(0, 20),
            receiverName: values.receiverName,
            phone: values.phone,
            zipCode: values.zipCode,
            address1: values.address1,
            address2: values.address2 || undefined,
            isDefault: true,
          },
        }).catch(() => undefined);
      }
      const { start, error, failed } = await startPaymentFn({
        data: {
          checkoutId: checkout.checkoutId,
          option,
          back,
          shippingAddress: {
            receiverName: values.receiverName,
            phone: values.phone,
            zipCode: values.zipCode,
            address1: values.address1,
            address2: values.address2 || undefined,
            deliveryMemo: memoOf(values),
          },
          guest: member
            ? undefined
            : {
                name: values.guestName ?? "",
                phone: values.phone,
                email: values.guestEmail ?? "",
                orderPassword: values.orderPassword ?? "",
              },
          cashReceipt: receipt,
          coupon: coupon?.ref ?? null,
          pointAmount,
        },
      });
      if (!start) {
        if (failed === "coupon") {
          setCouponError(error);
          void reprice({ coupon: null, pointAmount }, "refresh");
        } else if (failed === "points") {
          setPointError(error);
          void reprice({ coupon, pointAmount: 0 }, "refresh");
        } else setNotice(error);
        return;
      }
      const paymentStart = paymentStartSchema.parse(JSON.parse(start));
      setConfirmed(paymentStart.amounts);
      rememberPaymentOptions(paymentStart.paymentId, options);
      settle(await payments.open(paymentStart), back, signature);
    } catch {
      setNotice("결제를 시작하지 못했습니다. 다시 시도하십시오.");
    } finally {
      setSubmitting(false);
    }
  });

  return {
    data,
    form,
    amounts,
    paymentRequired,
    address: {
      mode: addressMode,
      selected: selectedAddress,
      list: addresses,
      saveAsDefault,
      setSaveAsDefault,
      pick: pickAddress,
      startNew: newAddress,
      quoteZip,
    },
    coupon: {
      applied: coupon,
      error: couponError,
      available: data.coupons,
      apply: (ref: NonNullable<CouponRef>) =>
        reprice({ coupon: { ref, name: "", discountAmount: 0 }, pointAmount }, "coupon"),
      remove: () => reprice({ coupon: null, pointAmount }, "coupon"),
    },
    points: {
      info: checkout.points,
      applied: pointAmount,
      error: pointError,
      apply: (amount: number) => reprice({ coupon, pointAmount: amount }, "points"),
    },
    payment: {
      options,
      selected: selectedOption,
      selectedKey: optionKey,
      unavailableKeys,
      select: setOptionKey,
      cashReceipt,
      setCashReceipt,
      cashReceiptError,
    },
    busy,
    submitting,
    notice,
    submit,
  };
}

export type CheckoutState = ReturnType<typeof useCheckout>;
export type { AvailablePaymentOption };
