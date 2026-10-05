import { type AvailablePaymentOption, paymentOptionKey } from "@sayren/storefront-sdk";
import { m } from "../../i18n";
import { choiceClass } from "../ui/button";

type Method = AvailablePaymentOption["method"];
type Provider = Extract<AvailablePaymentOption, { method: "EASY_PAY" }>["provider"];

/** 결제수단 행 순서 — 국내 쇼핑몰 주문서의 관례(카드 → 간편결제 → 무통장 → 계좌이체 → 휴대폰) */
const METHOD_ORDER: Method[] = ["CARD", "EASY_PAY", "VIRTUAL_ACCOUNT", "BANK_TRANSFER", "MOBILE"];

const METHOD_LABEL: Record<Method, () => string> = {
  CARD: () => m.checkout_method_card(),
  EASY_PAY: () => m.checkout_method_easy_pay(),
  VIRTUAL_ACCOUNT: () => m.checkout_method_virtual_account(),
  BANK_TRANSFER: () => m.checkout_method_bank_transfer(),
  MOBILE: () => m.checkout_method_mobile(),
};

interface Group {
  method: Method;
  options: AvailablePaymentOption[];
}

/** 결제 옵션을 결제수단(method)으로 묶는다. 서버가 준 옵션 순서는 묶음 안에서 그대로 둔다 */
export function groupPaymentOptions(options: AvailablePaymentOption[]): Group[] {
  return METHOD_ORDER.map((method) => ({
    method,
    options: options.filter((option) => option.method === method),
  })).filter((group) => group.options.length > 0);
}

/** 간편결제 옵션을 결제사(provider)로 묶는다 — 결제사 하나가 PG 여럿으로 올 수 있다. 처음 나온 순서를 지킨다 */
export function groupEasyPayProviders(
  options: AvailablePaymentOption[],
): { provider: Provider; options: AvailablePaymentOption[] }[] {
  const groups: { provider: Provider; options: AvailablePaymentOption[] }[] = [];
  for (const option of options) {
    if (option.method !== "EASY_PAY") continue;
    const group = groups.find((item) => item.provider === option.provider);
    if (group) group.options.push(option);
    else groups.push({ provider: option.provider, options: [option] });
  }
  return groups;
}

/**
 * 결제수단 피커 — 결제수단마다 라디오 행 하나. 옵션이 여럿인 결제수단(간편결제 결제사, 같은 결제수단의 PG 여럿)은
 * 그 행을 고르면 아래에 세부 선택이 열린다. 간편결제는 결제사마다 2열 타일 하나이고, 고른 결제사에 PG가 여럿이면
 * 타일 아래에 PG 라디오가 열린다(기본은 첫 번째 쓸 수 있는 PG).
 *
 * 폼 값은 결제 옵션 키(`paymentOptionKey`) 하나다. 결제수단 행은 묶음 안 첫 번째 쓸 수 있는 옵션을 고르는 바로가기다.
 * 결제에 실패해 이 화면에서 다시 고를 수 없는 옵션(`unavailableKeys`)은 비활성 + 「사용 불가」다.
 */
export function PaymentMethodPicker({
  options,
  selected,
  unavailableKeys,
  onSelect,
}: {
  options: AvailablePaymentOption[];
  selected: string;
  unavailableKeys: ReadonlySet<string>;
  onSelect: (key: string) => void;
}) {
  const groups = groupPaymentOptions(options);
  const selectedOption = options.find((option) => paymentOptionKey(option) === selected);
  return (
    <div className="flex flex-col border-ink border-t">
      {groups.map((group) => {
        const available = group.options.filter(
          (option) => !unavailableKeys.has(paymentOptionKey(option)),
        );
        const active = selectedOption?.method === group.method;
        const single = group.options.length === 1 ? group.options[0] : null;
        const label = single?.method === "EASY_PAY" ? single.label : METHOD_LABEL[group.method]();
        return (
          <div
            key={group.method}
            className="flex flex-col gap-3 border-line border-b py-4 last:border-b-0 md:gap-3.5 md:py-[1.125rem]"
          >
            <label
              className={`flex min-w-0 items-center gap-2.5 text-body-lg ${
                available.length ? "cursor-pointer" : "cursor-not-allowed text-muted"
              } ${active ? "font-bold" : ""}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={group.method}
                checked={active}
                disabled={!available.length}
                onChange={() => {
                  const first = available[0];
                  if (first) onSelect(paymentOptionKey(first));
                }}
                className={choiceClass}
              />
              <span className="min-w-0 break-words">{label}</span>
              {!available.length ? (
                <span className="font-normal text-caption">
                  {m.checkout_option_unavailable_badge()}
                </span>
              ) : null}
            </label>
            {active && !single ? (
              group.method === "EASY_PAY" ? (
                <EasyPayDetail
                  options={group.options}
                  selected={selected}
                  unavailableKeys={unavailableKeys}
                  onSelect={onSelect}
                />
              ) : (
                <PgRadios
                  options={group.options}
                  selected={selected}
                  unavailableKeys={unavailableKeys}
                  onSelect={onSelect}
                />
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** 간편결제 세부 선택 — 결제사 타일(결제사마다 하나) + 고른 결제사의 PG가 여럿이면 PG 라디오 */
function EasyPayDetail({
  options,
  selected,
  unavailableKeys,
  onSelect,
}: {
  options: AvailablePaymentOption[];
  selected: string;
  unavailableKeys: ReadonlySet<string>;
  onSelect: (key: string) => void;
}) {
  const providers = groupEasyPayProviders(options);
  const current = providers.find((group) =>
    group.options.some((option) => paymentOptionKey(option) === selected),
  );
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <fieldset className="min-w-0">
        <legend className="sr-only">{m.checkout_easy_pay_providers()}</legend>
        <div className="grid grid-cols-2 gap-1.5 md:gap-2">
          {providers.map((group) => {
            const first = group.options.find(
              (option) => !unavailableKeys.has(paymentOptionKey(option)),
            );
            return (
              <ProviderTile
                key={group.provider}
                provider={group.provider}
                label={group.options[0]?.label ?? group.provider}
                checked={current?.provider === group.provider}
                unavailable={!first}
                onSelect={() => {
                  if (first) onSelect(paymentOptionKey(first));
                }}
              />
            );
          })}
        </div>
      </fieldset>
      {current && current.options.length > 1 ? (
        <PgRadios
          options={current.options}
          selected={selected}
          unavailableKeys={unavailableKeys}
          onSelect={onSelect}
        />
      ) : null}
    </div>
  );
}

/** 같은 결제수단(또는 같은 간편결제사)의 PG 선택 — 작은 라디오. 폼 값(결제 옵션 키)은 여기서 정해진다 */
function PgRadios({
  options,
  selected,
  unavailableKeys,
  onSelect,
}: {
  options: AvailablePaymentOption[];
  selected: string;
  unavailableKeys: ReadonlySet<string>;
  onSelect: (key: string) => void;
}) {
  return (
    <fieldset className="min-w-0 pl-[1.875rem]">
      <legend className="sr-only">{m.checkout_pg_select()}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {options.map((option) => {
          const key = paymentOptionKey(option);
          const unavailable = unavailableKeys.has(key);
          return (
            <label
              key={key}
              className={`flex items-center gap-2 text-body ${
                unavailable ? "cursor-not-allowed text-muted" : "cursor-pointer"
              }`}
            >
              <input
                type="radio"
                name="paymentOption"
                value={key}
                checked={key === selected}
                disabled={unavailable}
                onChange={() => onSelect(key)}
                className="size-4 shrink-0 accent-ink"
              />
              {option.pgName}
              {unavailable ? (
                <span className="text-caption">{m.checkout_option_unavailable_badge()}</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** 간편결제 타일 — 실제 라디오는 눈에서만 숨기고(키보드·스크린 리더 그대로) 타일 전체가 라벨이다 */
function ProviderTile({
  provider,
  label,
  checked,
  unavailable,
  onSelect,
}: {
  provider: Provider;
  label: string;
  checked: boolean;
  unavailable: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`relative flex h-[3.25rem] min-w-0 items-center justify-center gap-1.5 bg-page px-2 text-meta md:h-14 md:text-body has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-ink has-[input:focus-visible]:outline-offset-2 ${
        unavailable
          ? "cursor-not-allowed border border-line text-muted"
          : checked
            ? "cursor-pointer border-[1.5px] border-ink font-bold"
            : "cursor-pointer border border-line hover:border-line-strong"
      }`}
    >
      <input
        type="radio"
        name="paymentProvider"
        value={provider}
        checked={checked}
        disabled={unavailable}
        onChange={onSelect}
        className="sr-only"
      />
      <ProviderMark provider={provider} />
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span className="truncate">{label}</span>
        {unavailable ? (
          <span className="truncate font-normal text-[0.6875rem]">
            {m.checkout_option_unavailable_badge()}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/**
 * 결제사 표식 — 공식 로고 대신 결제사 색의 작은 표식이다. 공식 마크를 받으면 이 자리에 넣는다.
 * 색은 결제사 브랜드 색이라 테마 토큰이 아니다.
 */
function ProviderMark({ provider }: { provider: Provider }) {
  switch (provider) {
    case "NAVERPAY":
      return (
        <span
          aria-hidden="true"
          className="flex size-4 shrink-0 items-center justify-center bg-[#03c75a] font-extrabold text-[0.625rem] text-white md:size-[1.125rem] md:text-[0.6875rem]"
        >
          N
        </span>
      );
    case "TOSSPAY":
      return (
        <span
          aria-hidden="true"
          className="size-4 shrink-0 rounded-full bg-[#0064ff] md:size-[1.125rem]"
        />
      );
    case "KAKAOPAY":
      return (
        <span
          aria-hidden="true"
          className="flex h-4 shrink-0 items-center rounded-full bg-[#ffeb00] px-1.5 font-extrabold text-[0.5625rem] text-ink md:h-[1.125rem] md:text-[0.625rem]"
        >
          pay
        </span>
      );
    case "PAYCO":
      return (
        <span
          aria-hidden="true"
          className="shrink-0 font-extrabold text-[#e1251b] text-[0.6875rem] md:text-caption"
        >
          PAYCO
        </span>
      );
    default:
      return null;
  }
}
