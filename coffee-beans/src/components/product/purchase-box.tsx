import {
  type CustomInputEntry,
  type CustomInputView,
  optionChoicesOf,
  type ProductDetail,
  parseCustomInputValue,
} from "@sayren/storefront-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { m } from "../../i18n";
import { formatMoney } from "../../lib/format";
import { addToCart, buyNow, setWishlist } from "../../lib/shop-actions";
import { Button, Chip, ErrorText, Input } from "../ui";

const MAX_QUANTITY = 99;

/** 구매 선택 상태 — 조합 옵션(용량), 직접 입력(분쇄도), 수량, 담기·바로 구매 */
export function usePurchase(product: ProductDetail, signedIn: boolean) {
  const [chosen, setChosen] = useState<(string | null)[]>(() =>
    product.optionGroups.map(() => null),
  );
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [pending, setPending] = useState(false);
  const [wished, setWished] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const choices = optionChoicesOf(product, chosen);

  const choose = (groupIndex: number, valueId: string) => {
    setChosen((prev) =>
      prev.map((v, i) => (i === groupIndex ? (v === valueId ? null : valueId) : v)),
    );
    setError(null);
    setAdded(false);
  };

  const setInput = (inputId: string, value: string) => {
    setInputs((prev) => ({ ...prev, [inputId]: value }));
    setError(null);
    setAdded(false);
  };

  /** 담기 전 확인 — 고르지 않은 옵션·필수 입력을 칸 이름으로 알린다(최종 판정은 서버다) */
  const validate = (): { optionId?: string; customInputs: CustomInputEntry[] } | null => {
    const missingGroup = product.optionGroups.find((_, i) => chosen[i] === null);
    if (missingGroup) {
      setError(m.purchase_choose({ name: missingGroup.name }));
      return null;
    }
    if (!choices.variant || choices.variant.soldOut) {
      setError(m.purchase_sold_out());
      return null;
    }
    const entries: CustomInputEntry[] = [];
    for (const input of product.customInputs) {
      const raw = inputs[input.inputId] ?? "";
      if (!raw.trim()) {
        if (input.required) {
          setError(m.purchase_choose({ name: input.label }));
          return null;
        }
        continue;
      }
      const value = parseCustomInputValue(input.type, input.options, raw);
      if (value === null) {
        setError(m.purchase_choose({ name: input.label }));
        return null;
      }
      entries.push({ inputId: input.inputId, value });
    }
    return { optionId: choices.variant.variantId, customInputs: entries };
  };

  const line = (picked: { optionId?: string; customInputs: CustomInputEntry[] }) => ({
    productId: product.productId,
    optionId: picked.optionId,
    quantity,
    customInputs: picked.customInputs.length > 0 ? picked.customInputs : undefined,
  });

  const onAdd = async () => {
    const picked = validate();
    if (!picked) return;
    setPending(true);
    const result = await addToCart({ data: line(picked) });
    setPending(false);
    if (!result.ok) return setError(result.message);
    setAdded(true);
    await queryClient.invalidateQueries({ queryKey: ["cart"] });
  };

  const onBuy = async () => {
    const picked = validate();
    if (!picked) return;
    setPending(true);
    const result = await buyNow({ data: line(picked) });
    setPending(false);
    if (!result.ok) return setError(result.message);
    await navigate({ to: "/checkout", search: { id: result.data.checkoutId } });
  };

  const onWish = async () => {
    if (!signedIn) {
      await navigate({ to: "/login", search: { redirect: window.location.pathname } });
      return;
    }
    const result = await setWishlist({ data: { productId: product.productId, on: !wished } });
    if (!result.ok) return setError(result.message);
    setWished(result.data.on);
    await queryClient.invalidateQueries({ queryKey: ["me", "wishlist"] });
  };

  return {
    choices,
    inputs,
    quantity,
    setQuantity: (n: number) => setQuantity(Math.min(MAX_QUANTITY, Math.max(1, n))),
    choose,
    setInput,
    error,
    added,
    pending,
    wished,
    onAdd,
    onBuy,
    onWish,
  };
}

export type Purchase = ReturnType<typeof usePurchase>;

/** 옵션 고르기 — 용량 칩(품절 비활성·추가금), 분쇄도 칩, 수량 */
export function OptionPicker({
  product,
  purchase,
}: {
  product: ProductDetail;
  purchase: Purchase;
}) {
  return (
    <div className="flex flex-col gap-5">
      {purchase.choices.groups.map((group, groupIndex) => (
        <fieldset key={group.groupId} className="flex flex-col gap-2">
          <legend className="pb-2 font-semibold text-meta">{group.name}</legend>
          <div className="grid grid-cols-3 gap-2">
            {group.values.map((value) => (
              <Chip
                key={value.valueId}
                selected={value.selected}
                disabled={value.state !== "AVAILABLE"}
                onClick={() => purchase.choose(groupIndex, value.valueId)}
                className="flex-col gap-0 py-1.5"
              >
                <span>{value.name}</span>
                {value.state === "SOLD_OUT" ? (
                  <span className="text-caption text-sale no-underline">{m.badge_sold_out()}</span>
                ) : value.additionalPrice ? (
                  <span className="text-caption text-muted tabular">
                    {m.option_extra({
                      price: formatMoney(value.additionalPrice, product.currency),
                    })}
                  </span>
                ) : null}
              </Chip>
            ))}
          </div>
        </fieldset>
      ))}
      {product.customInputs.map((input) => (
        <CustomInputField
          key={input.inputId}
          input={input}
          value={purchase.inputs[input.inputId] ?? ""}
          onChange={(value) => purchase.setInput(input.inputId, value)}
        />
      ))}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-meta">{m.purchase_quantity()}</span>
        <div className="flex items-center rounded-control border border-line-strong">
          <button
            type="button"
            aria-label={m.quantity_decrease()}
            className="grid size-11 place-items-center"
            onClick={() => purchase.setQuantity(purchase.quantity - 1)}
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center tabular">{purchase.quantity}</span>
          <button
            type="button"
            aria-label={m.quantity_increase()}
            className="grid size-11 place-items-center"
            onClick={() => purchase.setQuantity(purchase.quantity + 1)}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomInputField({
  input,
  value,
  onChange,
}: {
  input: CustomInputView;
  value: string;
  onChange: (value: string) => void;
}) {
  const label = (
    <legend className="pb-2 font-semibold text-meta">
      {input.label}
      {input.required ? <span className="pl-1 text-sale">{m.required_mark()}</span> : null}
    </legend>
  );
  if (input.type === "select" && input.options) {
    return (
      <fieldset className="flex flex-col gap-2">
        {label}
        <div className="grid grid-cols-2 gap-2">
          {input.options.map((option) => (
            <Chip
              key={option}
              selected={value === option}
              onClick={() => onChange(value === option ? "" : option)}
            >
              {option}
            </Chip>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <fieldset className="flex flex-col gap-2">
      {label}
      <Input
        value={value}
        maxLength={input.maxLength}
        placeholder={input.placeholder ?? undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    </fieldset>
  );
}

/** 담기·바로 구매·찜 버튼과 결과 문구 */
export function PurchaseActions({
  purchase,
  orderable,
}: {
  purchase: Purchase;
  orderable: boolean;
}) {
  if (!orderable) return <p className="text-meta text-sub">{m.checkout_unavailable()}</p>;
  return (
    <div className="flex flex-col gap-3">
      {purchase.error ? <ErrorText>{purchase.error}</ErrorText> : null}
      {purchase.added ? (
        <p role="status" className="flex flex-wrap items-center gap-x-2 text-meta text-point">
          {m.purchase_added()}
          <Link to="/cart" className="font-semibold underline">
            {m.purchase_go_cart()}
          </Link>
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          aria-label={purchase.wished ? m.wish_remove() : m.wish_add()}
          className="w-12 shrink-0 px-0"
          onClick={purchase.onWish}
        >
          <Heart className={purchase.wished ? "size-5 fill-point text-point" : "size-5"} />
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          disabled={purchase.pending}
          onClick={purchase.onAdd}
        >
          {m.purchase_add_cart()}
        </Button>
        <Button className="flex-1" disabled={purchase.pending} onClick={purchase.onBuy}>
          {m.purchase_buy_now()}
        </Button>
      </div>
    </div>
  );
}
