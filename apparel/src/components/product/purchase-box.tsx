import { optionChoicesOf, type ProductDetail } from "@sayren/storefront-sdk";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { m } from "../../i18n";
import { addToCart, buyNow, toggleWishlist } from "../../lib/shop-actions";
import { Button } from "../ui/button";
import { QuantityStepper } from "../ui/quantity-stepper";
import { Sheet } from "../ui/sheet";
import { OptionPicker } from "./option-picker";

type Status = { tone: "ok" | "error"; text: string; toCart?: boolean } | null;

/**
 * 구매 상자 — 옵션 선택·수량·장바구니·바로 구매·찜. 데스크톱은 상세 오른쪽에 붙어 있고,
 * 모바일은 하단 고정 구매 바의 [구매하기]가 같은 내용을 시트로 연다.
 * 금액 합계는 그리지 않는다(장바구니·주문서 응답이 원천이다)
 */
export function PurchaseBox({
  product,
  checkoutAvailable,
}: {
  product: ProductDetail;
  checkoutAvailable: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const form = usePurchaseForm(product);

  if (!checkoutAvailable) {
    return <p className="border border-line p-4 text-body text-sub">{m.checkout_unavailable()}</p>;
  }
  if (product.soldOut) {
    return (
      <Button className="w-full" disabled>
        {m.badge_sold_out()}
      </Button>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <PurchaseForm product={product} form={form} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-line border-t bg-page p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <WishButton product={product} form={form} />
        <Button className="flex-1" onClick={() => setSheetOpen(true)}>
          {m.product_buy_open()}
        </Button>
      </div>
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={m.product_choose_options()}
      >
        <PurchaseForm product={product} form={form} />
      </Sheet>
    </>
  );
}

function usePurchaseForm(product: ProductDetail) {
  const [chosen, setChosen] = useState<(string | null)[]>(() =>
    product.optionGroups.map(() => null),
  );
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const choices = optionChoicesOf(product, chosen);
  return {
    chosen,
    setChosen,
    quantity,
    setQuantity,
    pending,
    setPending,
    status,
    setStatus,
    choices,
  };
}

type Form = ReturnType<typeof usePurchaseForm>;

function PurchaseForm({ product, form }: { product: ProductDetail; form: Form }) {
  const navigate = useNavigate();
  const { choices, quantity, pending, status } = form;
  const variant = choices.variant;
  const ready = variant !== null && !variant.soldOut;

  const line = () => ({
    productId: product.productId,
    optionId: variant?.variantId,
    quantity,
  });

  const run = async (kind: "cart" | "buy") => {
    if (!ready) {
      form.setStatus({ tone: "error", text: m.product_choose_first() });
      return;
    }
    form.setPending(true);
    form.setStatus(null);
    try {
      if (kind === "cart") {
        const result = await addToCart({ data: line() });
        form.setStatus(
          result.ok
            ? { tone: "ok", text: m.product_added_to_cart(), toCart: true }
            : { tone: "error", text: result.message },
        );
      } else {
        const result = await buyNow({ data: line() });
        if (result.ok) {
          await navigate({ to: "/checkout", search: { id: result.checkoutId } });
          return;
        }
        form.setStatus({ tone: "error", text: result.message });
      }
    } catch {
      form.setStatus({ tone: "error", text: m.common_error_retry() });
    } finally {
      form.setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {product.optionGroups.length > 0 ? (
        <OptionPicker
          groups={choices.groups}
          currency={product.currency}
          onChoose={(g, valueId) =>
            form.setChosen((prev) => prev.map((v, i) => (i === g ? valueId : v)))
          }
        />
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 break-words text-meta text-sub">
          {variant ? variant.name : m.product_choose_first()}
        </p>
        <QuantityStepper value={quantity} onChange={form.setQuantity} disabled={!ready} />
      </div>
      {status ? (
        <p
          role="status"
          className={`text-meta ${status.tone === "error" ? "text-sale" : "text-ink"}`}
        >
          {status.text}{" "}
          {status.toCart ? (
            <Link to="/cart" className="font-semibold text-point underline underline-offset-4">
              {m.product_go_cart()}
            </Link>
          ) : null}
        </p>
      ) : null}
      <div className="flex gap-2">
        <div className="hidden md:block">
          <WishButton product={product} form={form} />
        </div>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={pending}
          onClick={() => run("cart")}
        >
          {m.product_add_to_cart()}
        </Button>
        <Button className="flex-1" disabled={pending} onClick={() => run("buy")}>
          {m.product_buy_now()}
        </Button>
      </div>
    </div>
  );
}

function WishButton({ product, form }: { product: ProductDetail; form: Form }) {
  const [wished, setWished] = useState(false);
  const toggle = async () => {
    const result = await toggleWishlist({ data: { productId: product.productId, add: !wished } });
    if (result.ok) setWished(!wished);
    else form.setStatus({ tone: "error", text: result.message });
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={wished}
      aria-label={wished ? m.product_wish_remove() : m.product_wish_add()}
      className="grid size-12 shrink-0 place-items-center border border-line-strong"
    >
      <Heart className={`size-5 ${wished ? "fill-point text-point" : ""}`} aria-hidden />
    </button>
  );
}
