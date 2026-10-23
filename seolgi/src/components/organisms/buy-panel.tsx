import { Link } from "@tanstack/react-router";
import { useId } from "react";
import type { Purchase } from "../../hooks/use-purchase";
import { formatMoney } from "../../lib/format";
import { MAX_LINE_QUANTITY } from "../../lib/line-request";
import { addonKey } from "../../lib/product-options";
import { colorSwatches } from "../../site/content";
import { Button } from "../atoms/button";
import { QuantityStepper } from "../atoms/quantity-stepper";
import { CustomInputField } from "../molecules/custom-input-field";
import { NameTagPreview } from "../molecules/name-tag-preview";
import { OptionGroup } from "../molecules/option-group";
import { WishButton } from "../molecules/wish-button";

/**
 * 구매 영역 (시안 PdpDesktop 오른쪽 아래·PdpSheet) — 이름표 미리보기, 옵션, 추가 선택, 직접 입력, 수량·합계,
 * 찜·장바구니·구매하기, 배송 안내. 합계는 미리보기이고 최종 금액은 서버가 정한다.
 */
export function BuyPanel({
  purchase,
  ordering,
  wish,
  delivery,
}: {
  purchase: Purchase;
  ordering: boolean;
  wish?: { wished: boolean; busy: boolean; toggle: () => void };
  delivery?: { label: string; value: string }[];
}) {
  const { product, picks, selection, problems } = purchase;
  // 데스크톱 영역과 모바일 시트가 함께 렌더되므로 칸 id를 인스턴스마다 다르게 둔다
  const uid = useId();
  const blockerId = `${uid}-blocker`;
  return (
    <div className="flex flex-col gap-6">
      <NameTagPreview product={product} picks={picks} inputs={selection.inputs} />

      {product.optionGroups.map((group) => (
        <OptionGroup
          key={group.groupId}
          group={group}
          variants={product.variants}
          picked={picks[group.groupId]}
          colors={colorSwatches}
          describedBy={problems.variant ? `${uid}-variant` : undefined}
          onPick={(valueId) => purchase.pick(group.groupId, valueId)}
        />
      ))}
      {problems.variant ? (
        <p id={`${uid}-variant`} className="-mt-3 text-primary text-small">
          {problems.variant}
        </p>
      ) : null}

      {product.addonGroups.map((group) => {
        const id = `${uid}-${addonKey(group.groupId)}`;
        const problem = problems[addonKey(group.groupId)];
        return (
          <div key={group.groupId} className="flex flex-col gap-2.5">
            <label htmlFor={id} className="font-medium text-small">
              추가 선택 · {group.name}
              {group.required ? null : <span className="ml-1.5 font-normal text-muted">선택</span>}
            </label>
            <select
              id={id}
              className="h-12 border-0 border-ink border-b bg-transparent text-body"
              value={selection.addons[group.groupId] ?? ""}
              onChange={(e) => purchase.setAddon(group.groupId, e.target.value)}
              aria-invalid={problem ? true : undefined}
              aria-describedby={problem ? `${id}-problem` : undefined}
            >
              <option value="">{group.required ? "선택하십시오" : "추가 안 함"}</option>
              {group.values.map((v) => (
                <option key={v.valueId} value={v.valueId}>
                  {v.name} 추가
                  {v.additionalPrice ? ` (+${formatMoney(v.additionalPrice)})` : ""}
                </option>
              ))}
            </select>
            {problem ? (
              <p id={`${id}-problem`} className="text-primary text-small">
                {problem}
              </p>
            ) : null}
          </div>
        );
      })}

      {product.customInputs.map((input) => (
        <CustomInputField
          key={input.inputId}
          id={`${uid}-input-${input.inputId}`}
          input={input}
          value={selection.inputs[input.inputId] ?? ""}
          onChange={(v) => purchase.setInput(input.inputId, v)}
          problem={problems[`input-${input.inputId}`]}
        />
      ))}

      <div className="flex items-center justify-between gap-4 border-line border-t pt-5">
        <QuantityStepper
          value={purchase.quantity}
          max={MAX_LINE_QUANTITY}
          onChange={purchase.setQuantity}
        />
        <p className="text-right">
          <span className="block text-caption text-muted">합계</span>
          <span className="font-bold text-title">
            {formatMoney(purchase.total, product.currency)}
          </span>
        </p>
      </div>

      {ordering ? (
        <div className="flex gap-2">
          {wish ? (
            <WishButton wished={wish.wished} busy={wish.busy} onToggle={wish.toggle} />
          ) : null}
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={purchase.busy || !purchase.ready}
            aria-describedby={purchase.blocker ? blockerId : undefined}
            onClick={() => void purchase.addToCart()}
          >
            장바구니
          </Button>
          <Button
            size="lg"
            className="flex-1"
            disabled={purchase.busy || !purchase.ready}
            aria-describedby={purchase.blocker ? blockerId : undefined}
            onClick={() => void purchase.buyNow()}
          >
            {product.soldOut ? "품절" : "구매하기"}
          </Button>
        </div>
      ) : (
        <p className="bg-tone-plain p-4 text-body">지금은 주문을 받지 않습니다.</p>
      )}
      {ordering && !product.soldOut && purchase.blocker ? (
        <p id={blockerId} className="-mt-3 text-muted text-small">
          {purchase.blocker}
        </p>
      ) : null}

      <div role="status" aria-live="polite" className="empty:hidden">
        {purchase.notice?.kind === "added" ? (
          <p className="flex items-center justify-between border border-ink px-4 py-3 text-body">
            장바구니에 담았습니다.
            <Link to="/cart" className="py-1 font-medium underline underline-offset-4">
              장바구니 보기
            </Link>
          </p>
        ) : purchase.notice?.kind === "error" ? (
          <p className="border border-primary px-4 py-3 text-body text-primary">
            {purchase.notice.message}
          </p>
        ) : null}
      </div>

      {delivery && delivery.length > 0 ? (
        <dl className="grid grid-cols-[72px_minmax(0,1fr)] gap-y-3 pt-2 text-small leading-relaxed">
          {delivery.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-muted">{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
