import type { MemberAddress } from "@sayren/storefront-sdk";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button, buttonClass } from "../components/atoms/button";
import { Checkbox } from "../components/atoms/checkbox";
import { inputClass } from "../components/atoms/text-input";
import { AddressSearchButton } from "../components/molecules/address-search-button";
import { AccountTitle } from "../components/templates/account-template";
import { deleteAddressFn, getAddressesFn, saveAddressFn } from "../lib/account";
import { formatPhone } from "../lib/format";

export const Route = createFileRoute("/account/addresses")({
  loader: () => getAddressesFn(),
  head: () => ({ meta: [{ title: "배송지 관리 | 설기로운" }] }),
  component: Addresses,
});

/** 배송지 관리 — 목록(기본 배송지 표시), 추가·고치기·지우기. 주문서가 기본 배송지를 미리 채운다 */
function Addresses() {
  const list = Route.useLoaderData();
  const router = useRouter();
  const [editing, setEditing] = useState<MemberAddress | "new" | null>(
    list.length === 0 ? "new" : null,
  );
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <AccountTitle title="배송지 관리" aside={`${list.length}곳`} />
      <ul className="flex flex-col border-ink border-t">
        {list.map((a) => (
          <li
            key={a.addressId}
            className="flex flex-wrap items-start justify-between gap-4 border-line border-b py-5 text-body"
          >
            <span className="flex flex-col gap-0.5 leading-[1.7]">
              <span className="font-medium">
                {a.alias}
                {a.isDefault ? (
                  <span className="ml-1.5 font-normal text-caption text-primary">기본 배송지</span>
                ) : null}
              </span>
              <span>
                {a.receiverName} · {formatPhone(a.phone)}
              </span>
              <span className="text-muted">
                ({a.zipCode}) {a.address1} {a.address2 ?? ""}
              </span>
            </span>
            <span className="flex gap-1.5">
              <button
                type="button"
                className={buttonClass({ variant: "subtle", size: "sm" })}
                onClick={() => setEditing(a)}
              >
                고치기
              </button>
              <button
                type="button"
                className={buttonClass({ variant: "subtle", size: "sm" })}
                onClick={async () => {
                  const r = await deleteAddressFn({ data: { addressId: a.addressId } });
                  setError(r.error);
                  await router.invalidate();
                }}
              >
                지우기
              </button>
            </span>
          </li>
        ))}
      </ul>
      {editing ? (
        <AddressForm
          key={editing === "new" ? "new" : editing.addressId}
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={async (body) => {
            const r = await saveAddressFn({
              data: { addressId: editing === "new" ? undefined : editing.addressId, body },
            });
            if (r.error) return r.error;
            setEditing(null);
            await router.invalidate();
            return null;
          }}
        />
      ) : (
        <Button variant="outline" className="self-start" onClick={() => setEditing("new")}>
          새 배송지 추가
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-primary text-small">
          {error}
        </p>
      ) : null}
    </>
  );
}

type Body = Parameters<typeof saveAddressFn>[0]["data"]["body"];

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: MemberAddress | null;
  onSave: (body: Body) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [zip, setZip] = useState(initial?.zipCode ?? "");
  const [address1, setAddress1] = useState(initial?.address1 ?? "");
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="flex max-w-[560px] flex-col gap-4 border-ink border-t pt-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const phone = String(fd.get("phone") ?? "").replace(/[^0-9]/g, "");
        if (!/^01[0-9]{8,9}$/.test(phone)) return setError("휴대폰 번호를 다시 확인하십시오.");
        if (!/^[0-9]{5}$/.test(zip) || !address1)
          return setError("주소 검색으로 주소를 입력하십시오.");
        setError(
          await onSave({
            alias: String(fd.get("alias") ?? "").trim() || "배송지",
            receiverName: String(fd.get("receiverName") ?? "").trim(),
            phone,
            zipCode: zip,
            address1,
            address2: String(fd.get("address2") ?? "").trim() || undefined,
            isDefault: fd.get("isDefault") === "on",
          }),
        );
      }}
    >
      <h2 className="font-medium text-section">{initial ? "배송지 고치기" : "새 배송지"}</h2>
      <input
        name="alias"
        aria-label="배송지 이름"
        placeholder="배송지 이름 (집·회사)"
        defaultValue={initial?.alias}
        maxLength={20}
        className={inputClass}
      />
      <input
        name="receiverName"
        aria-label="받는 분"
        placeholder="받는 분"
        required
        defaultValue={initial?.receiverName}
        maxLength={50}
        className={inputClass}
      />
      <input
        name="phone"
        type="tel"
        aria-label="연락처"
        placeholder="연락처"
        required
        defaultValue={initial?.phone}
        className={inputClass}
      />
      <div className="flex items-end gap-3">
        <input
          aria-label="우편번호"
          value={zip}
          readOnly={!manual}
          onChange={(e) => setZip(e.target.value)}
          placeholder="우편번호"
          className={`${inputClass} max-w-[140px]`}
        />
        <AddressSearchButton
          onSelect={(v) => {
            setZip(v.zipCode);
            setAddress1(v.address1);
          }}
          onUnavailable={() => setManual(true)}
        />
      </div>
      <input
        aria-label="기본 주소"
        value={address1}
        readOnly={!manual}
        onChange={(e) => setAddress1(e.target.value)}
        placeholder={manual ? "기본 주소" : "주소 검색으로 입력합니다"}
        className={inputClass}
      />
      <input
        name="address2"
        aria-label="상세 주소"
        placeholder="상세 주소"
        defaultValue={initial?.address2 ?? ""}
        className={inputClass}
      />
      <Checkbox name="isDefault" defaultChecked={initial?.isDefault ?? false} className="text-body">
        기본 배송지로 설정
      </Checkbox>
      {error ? (
        <p role="alert" className="text-primary text-small">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit">저장</Button>
        <Button variant="subtle" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
