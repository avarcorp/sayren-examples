import type { FlowAction, MyOrderItem, OrderStep } from "@sayren/storefront-sdk";
import { useId, useState } from "react";
import { m } from "../i18n";
import {
  type FlowInputField,
  type FlowInputValue,
  flowInputFromForm,
  flowInputText,
} from "../lib/flow-input";
import { formatDateTime } from "../lib/format";
import { checkInputImage, createInputImageUpload } from "../lib/input-image-upload";
import { SubmitButton } from "./submit-button";
import { buttonClass, inputClass } from "./ui/button";

/**
 * 주문상품의 지금 단계(#115) — 서버가 정리한 `step`을 그린다. 구매자 확인이 필요하면 「확인 필요」를 붙이고, 판매자 안내문·기한·자료,
 * 앞 행동의 입력값, 배송 중이면 발송 정보를 보인다. 흐름이 없는 주문상품(옛 응답)은 그리지 않는다
 */
/** 지금 신청할 수 있는 취소·반품·교환 — 흐름 노드의 권한 표가 정하고 서버가 `step.claimable`로 준다 */
const CLAIMABLE_TEXT: Record<OrderStep["claimable"][number]["action"], () => string> = {
  CANCEL: () => m.order_step_claimable_cancel(),
  CANCEL_REQUEST: () => m.order_step_claimable_cancel_request(),
  RETURN_REQUEST: () => m.order_step_claimable_return(),
  EXCHANGE_REQUEST: () => m.order_step_claimable_exchange(),
};

export function OrderStepInfo({ item }: { item: MyOrderItem }) {
  const step = item.step;
  if (!step) return null;
  const delivery = step.data?.delivery;
  const hasBody =
    step.type === "BUYER_ACTION" ||
    (item.flowBranches?.length ?? 0) > 1 ||
    step.message ||
    step.deadlineAt ||
    step.attachments?.length ||
    step.earlierAttachments?.length ||
    step.inputs?.values.length ||
    step.claimable?.length ||
    delivery;
  if (!hasBody) return null;
  return (
    <div className="flex flex-col gap-1 bg-chip p-3 text-meta">
      {step.type === "BUYER_ACTION" ? (
        <p className="font-bold text-point">{m.order_step_buyer_action()}</p>
      ) : null}
      {(item.flowBranches?.length ?? 0) > 1 ? (
        <p>
          {m.order_flow_branches({
            labels: (item.flowBranches ?? []).map((branch) => branch.label).join(" · "),
          })}
        </p>
      ) : null}
      {step.message ? <p className="whitespace-pre-line">{step.message}</p> : null}
      {step.deadlineAt ? (
        <p className="text-muted">
          {m.order_flow_deadline({ at: formatDateTime(step.deadlineAt) })}
        </p>
      ) : null}
      {step.attachments?.length ? (
        <p className="flex flex-wrap gap-2">
          {step.attachments.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="underline">
              {m.order_flow_attachment({ n: index + 1 })}
            </a>
          ))}
        </p>
      ) : null}
      {step.earlierAttachments?.length ? (
        <p className="flex flex-wrap gap-2">
          <span className="text-muted">{m.order_step_earlier_attachments()}</span>
          {step.earlierAttachments.map((url, index) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="underline">
              {m.order_flow_attachment({ n: index + 1 })}
            </a>
          ))}
        </p>
      ) : null}
      <StepInputs inputs={step.inputs} />
      {(step.claimable ?? []).map((claim) => (
        <p key={claim.action} className="text-meta text-muted">
          {CLAIMABLE_TEXT[claim.action]()}
          {claim.until
            ? ` ${m.order_step_claimable_until({ at: formatDateTime(claim.until) })}`
            : ""}
        </p>
      ))}
      {delivery ? (
        <p>
          {m.order_step_delivery({
            carrier: delivery.carrierName ?? m.order_step_delivery_direct(),
            tracking: delivery.trackingNumber ?? "-",
          })}{" "}
          {delivery.trackingUrl ? (
            <a href={delivery.trackingUrl} target="_blank" rel="noreferrer" className="underline">
              {m.order_step_delivery_track()}
            </a>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

/** 앞 행동의 입력값 — 「내가 보낸 내용」 또는 「판매자 입력」 */
function StepInputs({ inputs }: { inputs: OrderStep["inputs"] }) {
  if (!inputs?.values.length) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-muted">
        {inputs.by === "buyer" ? m.order_step_inputs_buyer() : m.order_step_inputs_seller()}
      </p>
      {inputs.values.map((input) => (
        <p key={input.key} className="break-all">
          <span className="text-muted">{input.label}: </span>
          {input.type === "image" && Array.isArray(input.value)
            ? input.value.map((url, index) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className="mr-2 underline">
                  {m.order_flow_attachment({ n: index + 1 })}
                </a>
              ))
            : flowInputText(input)}
        </p>
      ))}
    </div>
  );
}

/** 흐름 행동 입력 한 칸 — 서버가 준 형식대로 그린다 */
function FlowInputControl({ field }: { field: FlowInputField }) {
  const id = useId();
  // 선택지는 값만 오거나 값·이름 쌍이다(보낼 때는 값)
  const options = (field.options ?? []).map((option) =>
    typeof option === "object" ? option : { value: String(option), label: String(option) },
  );
  const control = inputClass();
  if (field.type === "boolean") {
    return (
      <label htmlFor={id} className="flex items-center gap-2 text-body">
        <input id={id} name={field.key} type="checkbox" required={field.required} />
        {field.label}
      </label>
    );
  }
  if (field.type === "radio" || field.type === "checkbox") {
    return (
      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="mb-1 font-bold text-meta">{field.label}</legend>
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-body">
            <input
              name={field.key}
              value={option.value}
              type={field.type}
              required={field.type === "radio" && field.required}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="font-bold text-meta">
        {field.label}
      </label>
      {field.type === "select" ? (
        <select id={id} name={field.key} required={field.required} className={control}>
          <option value="">{m.order_flow_input_choose()}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.key}
          rows={3}
          required={field.required}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          className={`${inputClass()} h-auto py-2`}
        />
      ) : field.type === "image" ? (
        <input
          id={id}
          name={field.key}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple={(field.maxFiles ?? 5) > 1}
          required={field.required}
          className="text-body"
        />
      ) : (
        <input
          id={id}
          name={field.key}
          required={field.required}
          type={
            field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "datetime"
                  ? "datetime-local"
                  : "text"
          }
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          className={control}
        />
      )}
    </div>
  );
}

/** 사진 칸의 파일을 올려 주소로 바꾼다 — 실패하면 null(문구는 호출부가 보인다) */
async function uploadImages(files: File[]): Promise<string[] | null> {
  const urls: string[] = [];
  for (const file of files) {
    if (checkInputImage(file) !== "OK") return null;
    const ticket = await createInputImageUpload({
      data: { filename: file.name, size: file.size },
    }).catch(() => null);
    if (!ticket || "failure" in ticket) return null;
    const put = await fetch(ticket.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    }).catch(() => null);
    if (!put?.ok) return null;
    urls.push(ticket.url);
  }
  return urls;
}

/** 입력이 있는 흐름 행동(수정 요청 내용 등) — 서버가 준 입력 폼(`action.input`)대로 그린다 */
export function FlowActionForm({
  action,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  action: FlowAction;
  pending: boolean;
  error: string | null;
  onSubmit: (input: Record<string, FlowInputValue>) => void;
  onCancel: () => void;
}) {
  const fields = action.input ?? [];
  const [uploadError, setUploadError] = useState<string | null>(null);
  return (
    <form
      className="flex min-w-0 flex-col gap-4 bg-chip p-4 md:p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setUploadError(null);
        const form = new FormData(event.currentTarget);
        const images: Record<string, string[]> = {};
        for (const field of fields.filter((f) => f.type === "image")) {
          const files = form
            .getAll(field.key)
            .filter((v): v is File => v instanceof File && v.size > 0)
            .slice(0, field.maxFiles ?? 5);
          if (!files.length) continue;
          const urls = await uploadImages(files);
          if (!urls) {
            setUploadError(m.order_flow_input_image_failed());
            return;
          }
          images[field.key] = urls;
        }
        onSubmit(flowInputFromForm(fields, form, images));
      }}
    >
      <p className="font-bold">{action.label}</p>
      {fields.map((field) => (
        <FlowInputControl key={field.key} field={field} />
      ))}
      {uploadError || error ? (
        <p role="alert" className="text-meta text-point">
          {uploadError ?? error}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <SubmitButton disabled={pending} className={buttonClass({ size: "sm" })}>
          {m.order_flow_action_submit()}
        </SubmitButton>
        <button type="button" onClick={onCancel} className="text-meta text-muted underline">
          {m.order_claim_close()}
        </button>
      </div>
    </form>
  );
}
