import {
  type CheckoutSession,
  type DeliveryQuoteResult,
  guestInfoSchema,
  paymentOptionKey,
  paymentStartSchema,
  shippingAddressInputSchema,
} from "@sayren/storefront-sdk";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { z } from "zod";
import { AddressForm, type AddressValue } from "../../components/address-form";
import { AmountSummary } from "../../components/amount-summary";
import { GuestFields, type GuestValue } from "../../components/checkout/guest-fields";
import { PaymentOptions } from "../../components/checkout/payment-options";
import { SavedAddresses } from "../../components/checkout/saved-addresses";
import { LineItem } from "../../components/line-item";
import {
  Button,
  ButtonLink,
  Checkbox,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionTitle,
} from "../../components/ui";
import { useSession } from "../../hooks/use-account";
import { useAction } from "../../hooks/use-action";
import { m } from "../../i18n";
import { addressesQuery, checkoutQuery, sessionQuery } from "../../lib/account-queries";
import { formatMoney } from "../../lib/format";
import { paymentsFor, rememberPaymentOptions } from "../../lib/payments";
import { getPaymentConfig, quoteDelivery, startPayment } from "../../lib/shop-actions";

export const Route = createFileRoute("/checkout/")({
  validateSearch: z.object({ id: z.string().min(1) }),
  loaderDeps: ({ search }) => ({ id: search.id }),
  loader: async ({ context, deps }) => {
    const [, session] = await Promise.all([
      context.queryClient.ensureQueryData(checkoutQuery(deps.id)),
      context.queryClient.ensureQueryData(sessionQuery()),
    ]);
    if (session) await context.queryClient.ensureQueryData(addressesQuery());
    return { paymentConfig: await getPaymentConfig() };
  },
  component: CheckoutPage,
});

function CheckoutPage() {
  const { id } = Route.useSearch();
  const checkout = useSuspenseQuery(checkoutQuery(id)).data;
  if (!checkout) {
    return (
      <main className="flex flex-col gap-6">
        <PageHeader title={m.checkout_title()} />
        <EmptyState
          message={m.checkout_expired()}
          action={
            <ButtonLink to="/cart" variant="secondary">
              {m.checkout_go_cart()}
            </ButtonLink>
          }
        />
      </main>
    );
  }
  return <CheckoutForm checkout={checkout} />;
}

const EMPTY_ADDRESS: AddressValue = {
  receiverName: "",
  phone: "",
  zipCode: "",
  address1: "",
  address2: "",
  deliveryMemo: "",
};
const EMPTY_GUEST: GuestValue = { name: "", phone: "", email: "", orderPassword: "" };

type Amounts = Pick<DeliveryQuoteResult, "amounts" | "delivery">;

function CheckoutForm({ checkout }: { checkout: CheckoutSession }) {
  const { paymentConfig } = Route.useLoaderData();
  const session = useSession();
  const navigate = useNavigate();
  const [address, setAddress] = useState<AddressValue>(EMPTY_ADDRESS);
  const [guest, setGuest] = useState<GuestValue>(EMPTY_GUEST);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [option, setOption] = useState(() =>
    checkout.paymentOptions[0] ? paymentOptionKey(checkout.paymentOptions[0]) : "",
  );
  const [agreed, setAgreed] = useState(false);
  // 화면 금액 — 처음은 주문서, 우편번호를 받으면 배송비 재계산 결과, 결제 시작 뒤에는 확정 금액이다(모두 서버 값)
  const [shown, setShown] = useState<Amounts>({
    amounts: checkout.amounts,
    delivery: checkout.delivery,
  });
  const { pending, error, setError, run } = useAction();
  const total = formatMoney(shown.amounts.totalAmount, checkout.currency);

  const onZipCode = async (zipCode: string) => {
    const result = await run(() =>
      quoteDelivery({ data: { checkoutId: checkout.checkoutId, zipCode } }),
    );
    if (result.ok) setShown({ amounts: result.data.amounts, delivery: result.data.delivery });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    // 클릭 직후 동기로 결제창 자리를 준비한다(팝업 차단 방지). 실패하면 닫는다
    const payments = paymentsFor(paymentConfig);
    const prepared = payments.prepareWindow();
    const errors: Record<string, string> = {};
    const guestParsed = session ? null : guestInfoSchema.safeParse(guest);
    if (guestParsed && !guestParsed.success) {
      for (const issue of guestParsed.error.issues)
        errors[`guest.${String(issue.path[0])}`] = m.field_invalid();
    }
    const shipping = checkout.requiresShipping
      ? shippingAddressInputSchema.safeParse({
          ...address,
          phone: address.phone.replace(/\D/g, ""),
          address2: address.address2 || undefined,
          deliveryMemo: address.deliveryMemo || undefined,
        })
      : null;
    if (shipping && !shipping.success) {
      for (const issue of shipping.error.issues)
        errors[`ship.${String(issue.path[0])}`] = issue.message;
    }
    const selected = checkout.paymentOptions.find((o) => paymentOptionKey(o) === option);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !selected) {
      prepared.close();
      return;
    }
    const started = await run(() =>
      startPayment({
        data: {
          checkoutId: checkout.checkoutId,
          option: selected,
          shippingAddress: shipping?.success ? shipping.data : undefined,
          guest: guestParsed?.success ? guestParsed.data : undefined,
        },
      }),
    );
    if (!started.ok) {
      prepared.close();
      return;
    }
    const start = paymentStartSchema.parse(JSON.parse(started.data));
    // 확정 금액 — 결제창에 넘기기 전에 화면 금액을 결제 시작 응답으로 바꾼다
    setShown({ amounts: start.amounts, delivery: start.delivery });
    rememberPaymentOptions(start.paymentId, checkout.paymentOptions);
    const result = await payments.open(start, { window: prepared });
    if (result.status === "COMPLETED") {
      await navigate({
        to: "/checkout/complete",
        search: { orderId: result.orderId, orderNo: result.orderNo ?? undefined },
      });
    } else if (result.status === "CANCELED" || result.status === "FAILED") {
      setError(result.message);
    }
  };

  return (
    <main className="flex flex-col gap-6 pb-24 lg:pb-0">
      <PageHeader title={m.checkout_title()} />
      {checkout.testPayment ? (
        <p className="border-point border-l-2 pl-3 text-body text-sub">
          {m.checkout_test_payment()}
        </p>
      ) : null}
      <form className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]" onSubmit={submit} noValidate>
        <div className="flex min-w-0 flex-col gap-10">
          <section aria-labelledby="co-items" className="flex flex-col gap-2">
            <SectionTitle id="co-items">{m.checkout_items()}</SectionTitle>
            <ul className="divide-y divide-line border-line border-y">
              {checkout.items.map((item) => (
                <li key={item.lineId ?? item.productId}>
                  <LineItem
                    name={item.productName}
                    thumbnailUrl={item.thumbnailUrl ?? null}
                    quantity={item.quantity}
                    totalPrice={item.totalPrice}
                    currency={checkout.currency}
                  />
                </li>
              ))}
            </ul>
          </section>

          {session ? null : (
            <section aria-labelledby="co-orderer" className="flex flex-col gap-4">
              <SectionTitle id="co-orderer">{m.checkout_orderer()}</SectionTitle>
              <p className="text-body text-sub">
                {m.checkout_login_hint()}{" "}
                <Link
                  to="/login"
                  search={{ redirect: `/checkout?id=${checkout.checkoutId}` }}
                  className="text-point-strong underline"
                >
                  {m.checkout_login()}
                </Link>
              </p>
              <GuestFields value={guest} onChange={setGuest} errors={fieldErrors} />
            </section>
          )}

          {checkout.requiresShipping ? (
            <section aria-labelledby="co-shipping" className="flex flex-col gap-4">
              <SectionTitle id="co-shipping">{m.checkout_shipping()}</SectionTitle>
              {session ? (
                <SavedAddresses
                  onPick={(value) => {
                    setAddress(value);
                    onZipCode(value.zipCode);
                  }}
                />
              ) : null}
              <AddressForm
                idPrefix="co-ship"
                value={address}
                onChange={setAddress}
                onZipCode={onZipCode}
                errors={fieldErrors}
              />
            </section>
          ) : null}

          <PaymentOptions options={checkout.paymentOptions} value={option} onChange={setOption} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
          <SectionTitle>{m.amount_title()}</SectionTitle>
          <AmountSummary
            amounts={shown.amounts}
            currency={checkout.currency}
            remote={
              shown.delivery.remoteAreaLabel
                ? { label: shown.delivery.remoteAreaLabel, amount: shown.delivery.remoteSurcharge }
                : null
            }
          />
          <Checkbox
            label={m.checkout_agree()}
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          {error ? <ErrorState message={error} /> : null}
          <div className="hidden lg:block">
            <Button type="submit" className="w-full" disabled={!agreed || pending}>
              {pending ? m.checkout_paying() : m.checkout_pay({ amount: total })}
            </Button>
          </div>
        </aside>
        <div className="fixed inset-x-0 bottom-0 z-20 border-line border-t bg-page px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <Button type="submit" className="w-full" disabled={!agreed || pending}>
            {pending ? m.checkout_paying() : m.checkout_pay({ amount: total })}
          </Button>
        </div>
      </form>
    </main>
  );
}
