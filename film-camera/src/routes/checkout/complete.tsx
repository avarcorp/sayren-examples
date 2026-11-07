import { formatOrderNo } from "@sayren/storefront-sdk";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CheckMark } from "../../components/marks";
import { ButtonLink } from "../../components/ui";
import { useSession } from "../../hooks/use-account";
import { m } from "../../i18n";

export const Route = createFileRoute("/checkout/complete")({
  // 주문번호는 숫자 14자리라 라우터가 숫자로 읽는다 — 문자열로 되돌린다
  validateSearch: z.object({
    orderId: z.string().optional(),
    orderNo: z.union([z.string(), z.number()]).transform(String).optional(),
  }),
  component: Complete,
});

function Complete() {
  const { orderId, orderNo } = Route.useSearch();
  const session = useSession();
  return (
    <main className="flex flex-col items-start gap-6 py-6 lg:max-w-[40rem]">
      <CheckMark size={20} />
      <h1 className="font-bold text-3xl tracking-tight">{m.complete_title()}</h1>
      {orderNo ? (
        <p className="tabular font-bold text-lg">
          {m.complete_order_no({ no: formatOrderNo(orderNo) })}
        </p>
      ) : null}
      <p className="max-w-[40em] text-body-lg text-sub">{m.complete_body()}</p>
      <div className="flex flex-wrap gap-3">
        {session && orderId ? (
          <ButtonLink to="/orders/$orderId" params={{ orderId }}>
            {m.complete_orders()}
          </ButtonLink>
        ) : (
          <ButtonLink to="/guest-order">{m.complete_guest_order()}</ButtonLink>
        )}
        <ButtonLink to="/products" variant="secondary">
          {m.complete_continue()}
        </ButtonLink>
      </div>
    </main>
  );
}
