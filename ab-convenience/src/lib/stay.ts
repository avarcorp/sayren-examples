import type { CalendarDayView } from "@sayren/storefront-sdk";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";

/** 한국 날짜 `YYYY-MM-DD` — 달력·숙박 기간은 한국 날짜다 */
export function koreanDate(date: Date): string {
  return new Date(date.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** 오늘부터 119일 — 달력 API의 한 번 최대 기간(120일) */
export const getStayCalendar = createServerFn({ method: "GET" })
  .validator(z.object({ productId: z.string(), variantId: z.string().optional() }))
  .handler(async ({ data }): Promise<CalendarDayView[]> => {
    const from = koreanDate(new Date());
    return apiFor({}).catalog.getProductCalendar(data.productId, {
      from,
      to: addDays(from, 119),
      ...(data.variantId ? { variantId: data.variantId } : {}),
    });
  });

/** 고른 기간의 박(체크인 ~ 체크아웃 전날)과 합계 — 하루라도 예약할 수 없으면 null */
export function stayQuote(
  days: readonly CalendarDayView[],
  checkIn: string,
  checkOut: string,
): { nights: number; amount: number } | null {
  if (!checkIn || !checkOut || checkOut <= checkIn) return null;
  const byDate = new Map(days.map((day) => [day.date, day]));
  let amount = 0;
  let nights = 0;
  for (let day = checkIn; day < checkOut; day = addDays(day, 1)) {
    const found = byDate.get(day);
    if (!found?.available) return null;
    amount += found.price;
    nights += 1;
  }
  return { nights, amount };
}
