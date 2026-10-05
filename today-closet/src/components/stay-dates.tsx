import { useId } from "react";
import { m } from "../i18n";
import { formatPrice } from "../lib/format";
import { addDays, koreanDate, stayQuote } from "../lib/stay";
import { usePurchase } from "./purchase-context";
import { inputClass } from "./ui/button";

/**
 * 숙박 기간(날짜별 재고 상품, #118) — 체크인·체크아웃을 고르면 박마다 달력의 예약 가능 여부·가격으로 합계를 보인다. 금액은 서버가 같은
 * 달력으로 다시 계산한다(화면 합계는 안내다). 담기·바로구매에 기간이 함께 간다
 */
export function StayDates() {
  const { stay, setStay, state, calendarOf } = usePurchase();
  const checkInId = useId();
  const checkOutId = useId();
  // 안내 합계는 첫 행(객실) 기준이다. 행마다의 금액은 아래 선택 행에 보인다
  const days = state.lines[0] ? calendarOf(state.lines[0].variantId) : null;
  const today = koreanDate(new Date());
  const quote = days ? stayQuote(days, stay.checkIn, stay.checkOut) : null;
  const chosen = stay.checkIn && stay.checkOut;
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 font-bold text-body">{m.pd_stay_title()}</legend>
      <div className="grid grid-cols-2 gap-2">
        <label htmlFor={checkInId} className="flex min-w-0 flex-col gap-1 text-meta">
          {m.pd_stay_check_in()}
          <input
            id={checkInId}
            type="date"
            min={today}
            value={stay.checkIn}
            onChange={(event) => setStay({ ...stay, checkIn: event.target.value })}
            className={inputClass()}
          />
        </label>
        <label htmlFor={checkOutId} className="flex min-w-0 flex-col gap-1 text-meta">
          {m.pd_stay_check_out()}
          <input
            id={checkOutId}
            type="date"
            min={stay.checkIn ? addDays(stay.checkIn, 1) : addDays(today, 1)}
            value={stay.checkOut}
            onChange={(event) => setStay({ ...stay, checkOut: event.target.value })}
            className={inputClass()}
          />
        </label>
      </div>
      {chosen && days ? (
        quote ? (
          <p className="text-body">
            {m.pd_stay_quote({ nights: quote.nights, amount: formatPrice(quote.amount) })}
          </p>
        ) : (
          <p role="alert" className="text-body text-point">
            {m.pd_stay_unavailable()}
          </p>
        )
      ) : null}
    </fieldset>
  );
}
