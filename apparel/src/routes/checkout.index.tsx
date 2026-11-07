import {
  type AvailablePaymentOption,
  type CheckoutSession,
  guestInfoSchema,
  paymentOptionKey,
  paymentStartSchema,
  shippingAddressInputSchema,
} from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import {
  AddressFields,
  type AddressValue,
  EMPTY_ADDRESS,
} from "../components/checkout/address-fields";
import { ProductImage } from "../components/product/product-image";
import { Button } from "../components/ui/button";
import { TextField } from "../components/ui/fields";
import { MoneyRow, SummaryBox } from "../components/ui/money";
import { Container, PageTitle } from "../components/ui/page-title";
import { m } from "../i18n";
import { checkoutQuery } from "../lib/account-queries";
import {
  getPublicConfig,
  previewPricing,
  quoteDelivery,
  startPayment,
} from "../lib/checkout-actions";
import { formatMoney } from "../lib/format";
import { paymentsFor, rememberPaymentOptions } from "../lib/payments";

export const Route = createFileRoute("/checkout/")({
  validateSearch: z.object({ id: z.string().optional() }),
  loaderDeps: ({ search }) => ({ id: search.id }),
  loader: async ({ context, deps }) => {
    if (!deps.id) throw redirect({ to: "/cart" });
    const [config] = await Promise.all([
      getPublicConfig(),
      context.queryClient.ensureQueryData(checkoutQuery(deps.id)),
    ]);
    return { config };
  },
  preload: false,
  head: () => ({ meta: [{ title: m.checkout_title() }] }),
  component: CheckoutPage,
});

type Amounts = CheckoutSession["amounts"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-line border-t py-6">
      <h2 className="font-semibold text-body-lg">{title}</h2>
      {children}
    </section>
  );
}

function CheckoutPage() {
  const { id = "" } = Route.useSearch();
  const { config } = Route.useLoaderData();
  const navigate = useNavigate();
  const { checkout, addresses } = useSuspenseQuery(checkoutQuery(id)).data;
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [address, setAddress] = useState<AddressValue>(
    defaultAddress
      ? {
          receiverName: defaultAddress.receiverName,
          phone: defaultAddress.phone,
          zipCode: defaultAddress.zipCode,
          address1: defaultAddress.address1,
          address2: defaultAddress.address2 ?? "",
          deliveryMemo: "",
        }
      : EMPTY_ADDRESS,
  );
  const [guest, setGuest] = useState({ name: "", phone: "", email: "", orderPassword: "" });
  const [guestErrors, setGuestErrors] = useState<Partial<Record<keyof typeof guest, string>>>({});
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressValue, string>>>(
    {},
  );
  const [pointInput, setPointInput] = useState("");
  const [amounts, setAmounts] = useState<Amounts>(checkout.amounts);
  const [paymentRequired, setPaymentRequired] = useState(true);
  const [option, setOption] = useState(
    checkout.paymentOptions[0] ? paymentOptionKey(checkout.paymentOptions[0]) : "",
  );
  const [disabledOptions, setDisabledOptions] = useState<string[]>([]);
  const [failed, setFailed] = useState<{ paymentId: string; signature: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isGuest = !checkout.memberOrder;
  const zipCode = /^\d{5}$/.test(address.zipCode) ? address.zipCode : undefined;

  const onZipChange = async (zip: string) => {
    const result = await quoteDelivery({
      data: { checkoutId: checkout.checkoutId, zipCode: zip },
    }).catch(() => null);
    if (result?.ok) setAmounts((prev) => ({ ...prev, ...result.amounts }));
  };

  const applyPoints = async (value: number) => {
    const result = await previewPricing({
      data: { checkoutId: checkout.checkoutId, pointAmount: value, zipCode },
    }).catch(() => null);
    if (result?.ok) {
      setAmounts((prev) => ({ ...prev, ...result.amounts }));
      setPaymentRequired(result.paymentRequired);
      setPointInput(String(result.amounts.pointAmount));
    } else setMessage(result?.message ?? m.common_error_retry());
  };

  const validate = () => {
    let valid = true;
    let shippingAddress: z.infer<typeof shippingAddressInputSchema> | undefined;
    if (checkout.requiresShipping) {
      const parsed = shippingAddressInputSchema.safeParse({
        receiverName: address.receiverName,
        phone: address.phone.replace(/\D/g, ""),
        zipCode: address.zipCode,
        address1: address.address1,
        address2: address.address2 || undefined,
        deliveryMemo: address.deliveryMemo || undefined,
      });
      if (parsed.success) {
        shippingAddress = parsed.data;
        setAddressErrors({});
      } else {
        valid = false;
        setAddressErrors(
          Object.fromEntries(
            parsed.error.issues.map((i) => [String(i.path[0]), m.checkout_field_invalid()]),
          ),
        );
      }
    }
    let guestInfo: z.infer<typeof guestInfoSchema> | undefined;
    if (isGuest) {
      const parsed = guestInfoSchema.safeParse({ ...guest, phone: guest.phone.replace(/\D/g, "") });
      if (parsed.success) {
        guestInfo = parsed.data;
        setGuestErrors({});
      } else {
        valid = false;
        setGuestErrors(
          Object.fromEntries(
            parsed.error.issues.map((i) => [String(i.path[0]), m.checkout_field_invalid()]),
          ),
        );
      }
    }
    return { valid, shippingAddress, guestInfo };
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    const chosen = checkout.paymentOptions.find((o) => paymentOptionKey(o) === option);
    if (paymentRequired && !chosen) {
      setMessage(m.checkout_choose_payment());
      return;
    }
    const { valid, shippingAddress, guestInfo } = validate();
    if (!valid) {
      setMessage(m.checkout_check_fields());
      return;
    }
    const payments = paymentsFor(config);
    // 팝업은 클릭 시점에 연다 — await 전에 동기로
    const paymentWindow = paymentRequired ? payments.prepareWindow() : null;
    setPending(true);
    try {
      const pointAmount = Number(pointInput) || 0;
      const signature = JSON.stringify({ shippingAddress, guestInfo, pointAmount });
      // 같은 입력으로 실패·취소한 결제가 있으면 새 결제 대신 같은 결제를 다른 옵션으로 다시 시도한다
      if (failed && failed.signature === signature && chosen) {
        settle(
          await payments.retry(failed.paymentId, {
            option: chosen,
            window: paymentWindow ?? undefined,
          }),
          signature,
        );
        return;
      }
      const result = await startPayment({
        data: {
          checkoutId: checkout.checkoutId,
          option: paymentRequired ? chosen : undefined,
          shippingAddress,
          guest: guestInfo,
          pointAmount,
        },
      });
      if (!result.ok) {
        paymentWindow?.close();
        setMessage(result.message);
        return;
      }
      const start = paymentStartSchema.parse(JSON.parse(result.start));
      // 확정 금액 — 결제 시작이 보낸 배송지로 배송비를 다시 계산했다
      setAmounts((prev) => ({ ...prev, ...start.amounts }));
      rememberPaymentOptions(start.paymentId, checkout.paymentOptions);
      settle(await payments.open(start, { window: paymentWindow ?? undefined }), signature);
    } catch {
      paymentWindow?.close();
      setMessage(m.common_error_retry());
    } finally {
      setPending(false);
    }
  };

  const settle = (
    result: Awaited<ReturnType<ReturnType<typeof paymentsFor>["open"]>>,
    signature: string,
  ) => {
    switch (result.status) {
      case "COMPLETED":
        void navigate({
          to: "/checkout/complete",
          search: { orderId: result.orderId, orderNo: result.orderNo ?? undefined },
          replace: true,
        });
        return;
      case "PROCESSING":
        void navigate({ to: "/checkout/return", search: { sayrenPaymentId: result.paymentId } });
        return;
      case "CANCELED":
        setFailed({ paymentId: result.paymentId, signature });
        setMessage(m.payment_canceled());
        return;
      case "FAILED":
        setFailed({ paymentId: result.paymentId, signature });
        if (result.optionUnavailable) setDisabledOptions((prev) => [...prev, option]);
        setMessage(result.message || m.payment_failed());
        return;
      default:
        setMessage(m.common_error_retry());
    }
  };

  const options = checkout.paymentOptions as AvailablePaymentOption[];

  return (
    <Container className="pb-28 md:pb-0">
      <PageTitle>{m.checkout_title()}</PageTitle>
      {checkout.testPayment ? (
        <p className="mb-4 border border-point px-3 py-2 text-meta text-point">
          {m.checkout_test_notice()}
        </p>
      ) : null}
      <form onSubmit={submit} noValidate className="grid gap-8 md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <Section title={m.checkout_items({ count: checkout.items.length })}>
            <ul className="flex flex-col gap-3">
              {checkout.items.map((item) => (
                <li
                  key={item.lineId ?? `${item.productId}-${item.optionId}`}
                  className="flex gap-3"
                >
                  <div className="w-16 shrink-0">
                    <ProductImage src={item.thumbnailUrl ?? null} alt={item.productName} />
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 text-meta">
                    <p className="line-clamp-2 break-words text-body">{item.productName}</p>
                    <p className="text-sub">
                      {[item.optionName, m.checkout_qty({ count: item.quantity })]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="tabular font-semibold">
                      {formatMoney(item.totalPrice, checkout.currency)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          {isGuest ? (
            <Section title={m.checkout_orderer()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={m.guest_name()}
                  name="guestName"
                  autoComplete="name"
                  required
                  value={guest.name}
                  error={guestErrors.name}
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                />
                <TextField
                  label={m.guest_phone()}
                  name="guestPhone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  value={guest.phone}
                  error={guestErrors.phone}
                  onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                />
                <TextField
                  label={m.guest_email()}
                  name="guestEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={guest.email}
                  error={guestErrors.email}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                />
                <TextField
                  label={m.guest_password()}
                  name="orderPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  hint={m.guest_password_hint()}
                  value={guest.orderPassword}
                  error={guestErrors.orderPassword}
                  onChange={(e) => setGuest({ ...guest, orderPassword: e.target.value })}
                />
              </div>
            </Section>
          ) : null}

          {checkout.requiresShipping ? (
            <Section title={m.checkout_address()}>
              <AddressFields
                value={address}
                onChange={setAddress}
                onZipChange={onZipChange}
                errors={addressErrors}
              />
            </Section>
          ) : null}

          {checkout.points?.enabled ? (
            <Section title={m.checkout_points()}>
              <div className="flex items-end gap-2">
                <TextField
                  label={m.checkout_points_use()}
                  name="points"
                  inputMode="numeric"
                  value={pointInput}
                  onChange={(e) => setPointInput(e.target.value.replace(/\D/g, ""))}
                  onBlur={() => applyPoints(Number(pointInput) || 0)}
                  hint={m.checkout_points_balance({
                    amount: formatMoney(checkout.points.balance, checkout.currency),
                  })}
                  className="flex-1"
                />
                <Button
                  variant="secondary"
                  className="mb-6"
                  onClick={() => applyPoints(checkout.points?.maxUsable ?? 0)}
                >
                  {m.checkout_points_all()}
                </Button>
              </div>
            </Section>
          ) : null}

          {paymentRequired ? (
            <Section title={m.checkout_payment()}>
              {options.length === 0 ? (
                <p className="text-body text-sub">{m.checkout_no_payment()}</p>
              ) : (
                <div
                  className="flex flex-col gap-2"
                  role="radiogroup"
                  aria-label={m.checkout_payment()}
                >
                  {options.map((opt) => {
                    const key = paymentOptionKey(opt);
                    const off = disabledOptions.includes(key);
                    return (
                      <label
                        key={key}
                        className={`flex min-h-12 cursor-pointer items-center gap-3 border px-3 text-body ${option === key ? "border-point" : "border-line-strong"} ${off ? "opacity-40" : ""}`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={key}
                          checked={option === key}
                          disabled={off}
                          onChange={() => setOption(key)}
                          className="accent-point"
                        />
                        {opt.logoUrl ? (
                          <img src={`${opt.logoUrl}?w=48&f=webp`} alt="" className="size-6" />
                        ) : null}
                        <span className="min-w-0 flex-1">{opt.label}</span>
                        <span className="text-caption text-muted">{opt.pgName}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </Section>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 md:sticky md:top-28 md:self-start md:pt-6">
          <SummaryBox>
            <MoneyRow
              label={m.amount_products()}
              amount={amounts.productAmount}
              currency={checkout.currency}
            />
            {checkout.requiresShipping ? (
              <MoneyRow
                label={m.amount_delivery()}
                amount={amounts.deliveryFee}
                currency={checkout.currency}
              />
            ) : null}
            {amounts.couponDiscountAmount > 0 ? (
              <MoneyRow
                label={m.amount_coupon()}
                amount={amounts.couponDiscountAmount}
                currency={checkout.currency}
                sign="-"
              />
            ) : null}
            {amounts.pointAmount > 0 ? (
              <MoneyRow
                label={m.amount_points()}
                amount={amounts.pointAmount}
                currency={checkout.currency}
                sign="-"
              />
            ) : null}
            <div className="border-line border-t pt-2.5">
              <MoneyRow
                label={m.amount_pay()}
                amount={amounts.totalAmount}
                currency={checkout.currency}
                strong
              />
            </div>
          </SummaryBox>
          <p className="text-caption text-muted">{m.checkout_agree()}</p>
          {message ? (
            <p role="alert" className="text-meta text-sale">
              {message}
            </p>
          ) : null}
          <div className="fixed inset-x-0 bottom-0 z-30 border-line border-t bg-page p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:border-0 md:p-0">
            <Button type="submit" className="w-full" disabled={pending}>
              {m.checkout_pay({ amount: formatMoney(amounts.totalAmount, checkout.currency) })}
            </Button>
          </div>
        </div>
      </form>
    </Container>
  );
}
