import { ChevronDown } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { m } from "../../i18n";
import { inputClass } from "../ui/button";

const CUSTOM = "custom";

/** 배송 요청사항 선택지 — 고르면 문장 그대로 배송 메모(`deliveryMemo`)가 된다 */
const PRESETS = [
  () => m.checkout_delivery_request_door(),
  () => m.checkout_delivery_request_security(),
  () => m.checkout_delivery_request_call(),
  () => m.checkout_delivery_request_locker(),
];

/**
 * 배송 요청사항 — 선택지 select + 「직접 입력」이면 100자 입력 칸. 폼 값은 입력 칸(`deliveryMemo`) 하나다.
 * 선택지를 고르면 그 문장을 칸에 넣고 칸은 숨긴다. 직접 입력이면 칸을 비우고 보인다.
 */
export function DeliveryMemoField({
  registration,
  setValue,
  error,
}: {
  registration: UseFormRegisterReturn;
  setValue: (value: string) => void;
  error?: string;
}) {
  const [choice, setChoice] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const errorId = useId();
  const custom = choice === CUSTOM;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="relative flex min-w-0">
        <select
          aria-label={m.checkout_delivery_request()}
          value={choice}
          onChange={(event) => {
            const next = event.target.value;
            setChoice(next);
            if (next === CUSTOM) {
              setValue("");
              window.setTimeout(() => inputRef.current?.focus(), 0);
            } else {
              setValue(next);
            }
          }}
          className={inputClass({
            className: `appearance-none pr-10 ${choice ? "" : "text-muted"}`,
          })}
        >
          <option value="">{m.checkout_delivery_request_placeholder()}</option>
          {PRESETS.map((preset) => (
            <option key={preset()} value={preset()}>
              {preset()}
            </option>
          ))}
          <option value={CUSTOM}>{m.checkout_delivery_request_custom()}</option>
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3.5 size-[1.125rem] -translate-y-1/2"
          strokeWidth={1.6}
        />
      </span>
      <input
        {...registration}
        ref={(element) => {
          registration.ref(element);
          inputRef.current = element;
        }}
        hidden={!custom}
        maxLength={100}
        aria-label={m.checkout_delivery_memo()}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        placeholder={m.checkout_delivery_request_custom_placeholder()}
        className={inputClass({ invalid: Boolean(error) })}
      />
      {error ? (
        <span id={errorId} className="text-caption text-point">
          {error}
        </span>
      ) : null}
    </div>
  );
}
