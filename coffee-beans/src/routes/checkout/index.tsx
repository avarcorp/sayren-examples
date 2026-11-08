import {
  type AvailablePaymentOption,
  type CheckoutSession,
  guestInfoSchema,
  type PaymentStart,
  paymentOptionKey,
  shippingAddressInputSchema,
} from "@sayren/storefront-sdk";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AddressForm, type AddressValue, EMPTY_ADDRESS } from "../../components/address-form";
import { AmountSummary } from "../../components/amount-summary";
import { LineItem } from "../../components/line-item";
import {
  Badge,
  Button,
  Chip,
  Container,
  ErrorText,
  Field,
  Input,
  PageTitle,
  SectionTitle,
} from "../../components/ui";
import { useAddresses, useCheckout, useSession } from "../../hooks/use-account";
import { m } from "../../i18n";
import { addressesQuery, checkoutQuery, sessionQuery } from "../../lib/account-queries";
import { paymentsFor, rememberPaymentOptions } from "../../lib/payments";
import { getPaymentConfig, quoteDelivery, startPayment } from "../../lib/shop-actions";

/**
 * 주문서 — 주문자(비회원)·배송지·결제 수단·금액. 금액은 서버 값이고, 우편번호가 정해지면 배송비를 다시 받는다.
 * 결제는 클릭 순간 결제창을 준비하고(prepareWindow) 서버 함수로 결제를 시작한 뒤 브라우저가 `/payments`의 open으로 연다
 */
export const Route = createFileRoute("/checkout/")({
  validateSearch: z.object({ id: z.string().min(1) }),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const [checkout, member] = await Promise.all([
      context.queryClient.ensureQueryData(checkoutQuery(deps.id)),
      context.queryClient.ensureQueryData(sessionQuery()),
    ]);
    if (!checkout) throw notFound();
    if (member) await context.queryClient.ensureQueryData(addressesQuery());
    return { config: await getPaymentConfig() };
  },
  preload: false,
  component: CheckoutPage,
});

type Amounts = CheckoutSession["amounts"];

function CheckoutPage() {
  const { id } = Route.useSearch();
  const checkout = useCheckout(id);
  if (!checkout) return null;
  return <CheckoutForm checkout={checkout} />;
}

function CheckoutForm({ checkout }: { checkout: CheckoutSession }) {
  const member = useSession();
  const { config } = Route.useLoaderData();
  const navigate = useNavigate();
  const [amounts, setAmounts] = useState<Amounts>(checkout.amounts);
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressValue, string>>>(
    {},
  );
  const [guest, setGuest] = useState({ name: "", phone: "", email: "", orderPassword: "" });
  const [guestErrors, setGuestErrors] = useState<Partial<Record<keyof typeof guest, string>>>({});
  const [optionKey, setOptionKey] = useState(() =>
    checkout.paymentOptions[0] ? paymentOptionKey(checkout.paymentOptions[0]) : "",
  );
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const option = checkout.paymentOptions.find((o) => paymentOptionKey(o) === optionKey);

  const onZipCode = async (zipCode: string) => {
    const result = await quoteDelivery({ data: { checkoutId: checkout.checkoutId, zipCode } });
    if (result.ok) setAmounts(result.data.amounts);
  };

  const pay = async () => {
    // 결제창은 클릭 순간에 준비한다 — await 뒤에 열면 브라우저가 팝업을 막는다
    const payments = paymentsFor(config);
    const prepared = payments.prepareWindow();
    const fail = (message: string) => {
      prepared.close();
      setError(message);
      setPending(false);
    };
    setError(null);
    setPending(true);
    if (!agree) return fail(m.checkout_agree_needed());
    if (!option) return fail(m.checkout_option_needed());

    let guestInfo: z.infer<typeof guestInfoSchema> | undefined;
    if (!member) {
      const parsed = guestInfoSchema.safeParse(guest);
      if (!parsed.success) {
        const next: Partial<Record<keyof typeof guest, string>> = {};
        for (const issue of parsed.error.issues)
          next[issue.path[0] as keyof typeof guest] = m.checkout_field_invalid();
        setGuestErrors(next);
        return fail(m.checkout_fix_fields());
      }
      setGuestErrors({});
      guestInfo = parsed.data;
    }

    let shippingAddress: z.infer<typeof shippingAddressInputSchema> | undefined;
    if (checkout.requiresShipping) {
      const parsed = shippingAddressInputSchema.safeParse({
        receiverName: address.receiverName,
        phone: address.phone,
        zipCode: address.zipCode,
        address1: address.address1,
        address2: address.address2 || undefined,
        deliveryMemo: address.deliveryMemo || undefined,
      });
      if (!parsed.success) {
        const next: Partial<Record<keyof AddressValue, string>> = {};
        for (const issue of parsed.error.issues)
          next[issue.path[0] as keyof AddressValue] = m.checkout_field_invalid();
        setAddressErrors(next);
        return fail(m.checkout_fix_fields());
      }
      setAddressErrors({});
      shippingAddress = parsed.data;
    }

    const result = await startPayment({
      data: { checkoutId: checkout.checkoutId, option, shippingAddress, guest: guestInfo },
    });
    if (!result.ok) return fail(result.message);
    const start = JSON.parse(result.data) as PaymentStart;
    // 결제창을 열기 전에 확정 금액으로 바꿔 보인다
    setAmounts(start.amounts);
    rememberPaymentOptions(start.paymentId, checkout.paymentOptions);
    const outcome = await payments.open(start, { window: prepared });
    setPending(false);
    if (outcome.status === "COMPLETED") {
      await navigate({ to: "/checkout/complete", search: { orderId: outcome.orderId } });
    } else if (outcome.status === "PROCESSING") {
      await navigate({ to: "/checkout/return", search: { sayrenPaymentId: outcome.paymentId } });
    } else if (outcome.status === "CANCELED" || outcome.status === "FAILED") {
      setError(outcome.message || m.checkout_payment_failed());
    } else {
      setError(outcome.message);
    }
  };

  return (
    <Container className="flex flex-col gap-6 pt-5 pb-10">
      <div className="flex flex-wrap items-center gap-2">
        <PageTitle>{m.checkout_title()}</PageTitle>
        {checkout.testPayment ? <Badge tone="muted">{m.checkout_test_payment()}</Badge> : null}
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-4">
            <SectionTitle>{m.checkout_items()}</SectionTitle>
            <ul className="flex flex-col gap-4">
              {checkout.items.map((item) => (
                <li key={item.lineId ?? item.productId}>
                  <LineItem
                    name={item.productName}
                    thumbnailUrl={item.thumbnailUrl}
                    optionName={item.optionName}
                    customInputs={item.customInputs}
                    quantity={item.quantity}
                    totalPrice={item.totalPrice}
                    currency={checkout.currency}
                  />
                </li>
              ))}
            </ul>
          </section>

          {!member ? (
            <section className="flex flex-col gap-4">
              <SectionTitle>{m.checkout_orderer()}</SectionTitle>
              <Field label={m.checkout_name()} error={guestErrors.name}>
                <Input
                  value={guest.name}
                  autoComplete="name"
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                />
              </Field>
              <Field label={m.checkout_phone()} error={guestErrors.phone}>
                <Input
                  value={guest.phone}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={m.address_phone_placeholder()}
                  onChange={(e) =>
                    setGuest({ ...guest, phone: e.target.value.replace(/[^\d+]/g, "") })
                  }
                />
              </Field>
              <Field
                label={m.checkout_email()}
                error={guestErrors.email}
                hint={m.checkout_email_hint()}
              >
                <Input
                  type="email"
                  value={guest.email}
                  autoComplete="email"
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                />
              </Field>
              <Field
                label={m.checkout_order_password()}
                error={guestErrors.orderPassword}
                hint={m.checkout_order_password_hint()}
              >
                <Input
                  type="password"
                  value={guest.orderPassword}
                  autoComplete="new-password"
                  onChange={(e) => setGuest({ ...guest, orderPassword: e.target.value })}
                />
              </Field>
            </section>
          ) : null}

          {checkout.requiresShipping ? (
            <section className="flex flex-col gap-4">
              <SectionTitle>{m.checkout_shipping()}</SectionTitle>
              {member ? (
                <SavedAddresses
                  onPick={(picked) => {
                    setAddress(picked);
                    void onZipCode(picked.zipCode);
                  }}
                />
              ) : null}
              <AddressForm
                value={address}
                onChange={setAddress}
                onZipCode={onZipCode}
                errors={addressErrors}
              />
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <SectionTitle>{m.checkout_payment()}</SectionTitle>
            {checkout.paymentOptions.length === 0 ? (
              <p className="text-meta text-sub">{m.checkout_no_payment()}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {checkout.paymentOptions.map((o: AvailablePaymentOption) => (
                  <Chip
                    key={paymentOptionKey(o)}
                    selected={paymentOptionKey(o) === optionKey}
                    onClick={() => setOptionKey(paymentOptionKey(o))}
                  >
                    {o.label}
                  </Chip>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <AmountSummary
            currency={checkout.currency}
            productAmount={amounts.productAmount}
            deliveryFee={amounts.deliveryFee}
            couponDiscountAmount={amounts.couponDiscountAmount}
            deliveryDiscountAmount={amounts.deliveryDiscountAmount}
            pointAmount={amounts.pointAmount}
            totalAmount={amounts.totalAmount}
            totalLabel={m.checkout_total()}
          />
          <label className="flex min-h-11 items-start gap-2 text-meta">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-point"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <span>{m.checkout_agree()}</span>
          </label>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Button disabled={pending || checkout.paymentOptions.length === 0} onClick={pay}>
            {m.checkout_pay()}
          </Button>
        </aside>
      </div>
    </Container>
  );
}

function SavedAddresses({ onPick }: { onPick: (address: AddressValue) => void }) {
  const addresses = useAddresses();
  if (addresses.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {addresses.map((a) => (
        <Chip
          key={a.addressId}
          onClick={() =>
            onPick({
              receiverName: a.receiverName,
              phone: a.phone,
              zipCode: a.zipCode ?? "",
              address1: a.address1,
              address2: a.address2 ?? "",
              deliveryMemo: "",
            })
          }
        >
          {a.alias}
          {a.isDefault ? ` · ${m.address_default()}` : ""}
        </Chip>
      ))}
    </div>
  );
}
