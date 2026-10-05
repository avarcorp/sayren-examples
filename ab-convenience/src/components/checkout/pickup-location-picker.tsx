import type { PickupLocationView } from "@sayren/storefront-sdk";
import { m } from "../../i18n";

/**
 * 픽업 장소 — 상점이 등록한 장소(`GET /pickup-locations`) 중 하나를 고른다. 고르면 주소의 `pickup`이 바뀌고 주문서를 다시 만든다.
 * 장소가 없는 상점은 가게에서 받는다는 안내만 보인다(서버가 장소 없이 받는다).
 */
export function PickupLocationPicker({
  locations,
  value,
  onChange,
}: {
  locations: PickupLocationView[];
  value: string | null;
  onChange: (locationId: string) => void;
}) {
  if (!locations.length) {
    return <p className="mt-3 text-meta text-sub">{m.checkout_pickup_at_store()}</p>;
  }
  return (
    <fieldset className="mt-3 flex flex-col gap-2">
      <legend className="mb-2 font-bold text-body">{m.checkout_pickup_location()}</legend>
      {locations.map((location) => {
        const on = location.locationId === value;
        return (
          <label
            key={location.locationId}
            className={`flex cursor-pointer items-start gap-3 rounded-control border-[1.5px] p-3.5 ${
              on ? "border-brand bg-brand-soft" : "border-line"
            }`}
          >
            <input
              type="radio"
              name="pickupLocation"
              value={location.locationId}
              checked={on}
              onChange={() => onChange(location.locationId)}
              className="mt-1 accent-[var(--color-brand)]"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-bold text-body">{location.name}</span>
              <span className="break-words text-meta text-sub">{location.address}</span>
              {location.hours ? (
                <span className="text-caption text-sub">
                  {m.checkout_pickup_hours({ hours: location.hours })}
                </span>
              ) : null}
              {location.phone ? (
                <span className="text-caption text-sub">{location.phone}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
