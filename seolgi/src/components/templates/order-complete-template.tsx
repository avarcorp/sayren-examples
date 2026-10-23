import { formatOrderNo, type MyOrder } from "@sayren/storefront-sdk";
import { Link } from "@tanstack/react-router";
import { formatMoney } from "../../lib/format";
import { paymentMethodText } from "../../lib/orders";
import { BrandMark } from "../atoms/brand-mark";
import { buttonClass } from "../atoms/button";
import { ProductThumb } from "../atoms/product-thumb";

/**
 * 주문 완료 (시안 DComplete) — 심볼, 제목, 주문번호, 상품 그림 3열, 결제 금액·수단·배송지, 주문 상세·쇼핑 계속하기.
 * 비회원은 주문 내용을 조회할 수 없어 번호와 비회원 주문 조회 버튼만 보인다.
 */
export function OrderCompleteTemplate({
  order,
  orderId,
  member,
}: {
  order: MyOrder | null;
  orderId: string | undefined;
  member: boolean;
}) {
  const number = order?.orderNo ? formatOrderNo(order.orderNo) : orderId;
  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center gap-12 px-2 pt-[88px] pb-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <BrandMark className="h-[72px] w-auto text-brand" />
        <h1 className="font-display text-h1">주문이 완료되었습니다</h1>
        {number ? <p className="text-body text-muted">주문번호 {number}</p> : null}
        {!member ? (
          <p className="text-body text-muted">
            주문 내용은 비회원 주문 조회에서 연락처와 비밀번호로 확인합니다.
          </p>
        ) : null}
      </div>
      {order ? (
        <>
          <div className="grid w-full grid-cols-3 gap-3 text-left">
            {order.items.slice(0, 3).map((item) => (
              <div
                key={item.orderItemId}
                className="flex flex-col gap-2 text-caption leading-normal"
              >
                <ProductThumb src={item.thumbnailUrl} name={item.productName} size="sm" />
                {item.productName}
              </div>
            ))}
          </div>
          <dl className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-y-3 border-ink border-t pt-5 text-left text-body">
            <dt className="text-muted">결제 금액</dt>
            <dd className="font-bold">{formatMoney(order.payment.totalAmount)}</dd>
            <dt className="text-muted">결제 수단</dt>
            <dd>{paymentMethodText(order.payment)}</dd>
            {order.requiresShipping ? (
              <>
                <dt className="text-muted">배송지</dt>
                <dd className="max-w-[300px] text-right">
                  {order.shippingAddress.address1} {order.shippingAddress.address2 ?? ""}
                </dd>
              </>
            ) : null}
          </dl>
        </>
      ) : null}
      <div className="flex w-full flex-wrap justify-center gap-2">
        {order ? (
          <Link
            to="/account/orders/$orderId"
            params={{ orderId: order.orderId }}
            className={`flex-[1_1_200px] ${buttonClass({ size: "lg" })}`}
          >
            주문 상세
          </Link>
        ) : !member && orderId ? (
          <Link to="/guest-order" className={`flex-[1_1_200px] ${buttonClass({ size: "lg" })}`}>
            비회원 주문 조회
          </Link>
        ) : null}
        <Link
          to="/"
          className={`flex-[1_1_200px] ${buttonClass({ variant: "outline", size: "lg" })}`}
        >
          쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}
