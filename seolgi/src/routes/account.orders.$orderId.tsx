import type { DeliveryTracking, MyOrderItem } from "@sayren/storefront-sdk";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ClaimDialog, type ClaimKind } from "../components/organisms/claim-dialog";
import { OrderDetailTemplate } from "../components/templates/order-detail-template";
import { createClaimFn, decidePurchaseFn, getDeliveryFn, previewClaimFn } from "../lib/account";
import { getMyOrderFn } from "../lib/orders";

export const Route = createFileRoute("/account/orders/$orderId")({
  loader: ({ params }) => getMyOrderFn({ data: { orderId: params.orderId } }),
  head: () => ({ meta: [{ title: "주문 상세 | 설기로운" }] }),
  component: OrderDetail,
});

function OrderDetail() {
  const order = Route.useLoaderData();
  const router = useRouter();
  const [tracking, setTracking] = useState<{
    item: MyOrderItem;
    data: DeliveryTracking | null;
  } | null>(null);
  const [claim, setClaim] = useState<{ item: MyOrderItem; kinds: ClaimKind[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <OrderDetailTemplate
        order={order}
        tracking={tracking}
        busy={busy}
        notice={notice}
        onAction={async (item, action) => {
          setNotice(null);
          if (action === "track") {
            setTracking({
              item,
              data: await getDeliveryFn({ data: { orderItemId: item.orderItemId } }),
            });
          } else if (action === "decide") {
            setBusy(true);
            const { error } = await decidePurchaseFn({ data: { orderItemId: item.orderItemId } });
            setBusy(false);
            setNotice(error ?? "구매확정했습니다. 리뷰를 남기면 적립금을 드립니다.");
            await router.invalidate();
          } else if (action === "cancel") setClaim({ item, kinds: ["CANCEL"] });
          else if (action === "return") setClaim({ item, kinds: ["RETURN", "EXCHANGE"] });
        }}
      />
      {claim ? (
        <ClaimDialog
          item={claim.item}
          kinds={claim.kinds}
          onPreview={(input) =>
            previewClaimFn({ data: { orderItemId: claim.item.orderItemId, ...input } })
          }
          onSubmit={async (input) => {
            const { error } = await createClaimFn({
              data: { orderItemId: claim.item.orderItemId, ...input },
            });
            if (error) return error;
            setNotice(
              input.type === "CANCEL"
                ? "취소했습니다. 환불은 결제수단으로 돌아갑니다."
                : "신청을 접수했습니다.",
            );
            await router.invalidate();
            return null;
          }}
          onClose={() => setClaim(null)}
        />
      ) : null}
    </>
  );
}
