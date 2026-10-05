import { zodResolver } from "@hookform/resolvers/zod";
import {
  ApiError,
  type CheckoutDelivery,
  cashReceiptAvailable,
  cashReceiptRequestSchema,
  type DeliveryQuoteResult,
  type MemberAddress,
  memberAddressRequestSchema,
  type PickupLocationView,
  paymentOptionKey,
  paymentOptionSchema,
  paymentStartSchema,
  type StorefrontCoupon,
} from "@sayren/storefront-sdk";
import type { PaymentResult } from "@sayren/storefront-sdk/payments";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AddressBookSheet, AddressCard } from "../components/checkout/address-book-sheet";
import { AddressSearchButton } from "../components/checkout/address-search";
import { AmountSummary } from "../components/checkout/amount-summary";
import { CheckoutSteps } from "../components/checkout/checkout-steps";
import { CouponSheet } from "../components/checkout/coupon-sheet";
import { DeliveryMemoField } from "../components/checkout/delivery-memo-field";
import { FormRow } from "../components/checkout/form-row";
import { PaymentMethodPicker } from "../components/checkout/payment-method-picker";
import { PickupLocationPicker } from "../components/checkout/pickup-location-picker";
import { CouponDownloadList } from "../components/coupon-download-list";
import { LineOptions } from "../components/line-options";
import { ProductThumb } from "../components/product-thumb";
import { ReceiveMethodToggle } from "../components/receive-method-toggle";
import { SubmitButton } from "../components/submit-button";
import { TextField } from "../components/text-field";
import { buttonClass, choiceClass, inputClass } from "../components/ui/button";
import { PageTitle, SectionCard } from "../components/ui/section";
import { m } from "../i18n";
import { apiFor } from "../lib/api.server";
import { readCartToken } from "../lib/cart-session.server";
import { checkoutIntentFrom, checkoutSearch, withReceiveMethod } from "../lib/checkout-intent";
import type { PublicConfig } from "../lib/config";
import { API_BASE_URL, resolveStoreCode } from "../lib/config.server";
import {
  type AppliedCoupon,
  COUPON_CODE_PATTERN,
  couponApplicationsOf,
  couponErrorMessage,
  couponRefOf,
  couponRejectMessage,
} from "../lib/coupon-code";
import { getDownloadableCoupons } from "../lib/coupon-download";
import { readDirectLine } from "../lib/direct-checkout.server";
import { type CheckoutForm, type CheckoutFormInput, checkoutFormSchema } from "../lib/form-schemas";
import { formatPrice } from "../lib/format";
import { pageTitle } from "../lib/page-title";
import { forgetPaymentOptions, rememberPaymentOptions } from "../lib/payment-options";
import { PAYMENT_RETURN_PATH, paymentsFor } from "../lib/payments";
import {
  type AppliedPoints,
  appliedPointsOf,
  POINT_START_ERRORS,
  parsePointInput,
  pointErrorMessage,
} from "../lib/points";
import { readToken } from "../lib/session.server";

const createCheckout = createServerFn({ method: "POST" })
  .validator(z.object({ search: checkoutSearch, back: z.string() }))
  .handler(async ({ data }) => {
    // 추가 선택·직접 입력이 있는 바로구매는 조건을 URL이 아니라 HttpOnly 쿠키에서 읽는다
    const intent = checkoutIntentFrom(data.search, data.search.direct ? readDirectLine() : null);
    if (!intent) {
      // 쿠키가 없거나(만료·주문 완료) 다른 상품의 것이면 상품 화면에서 다시 고른다 — 만료 안내를 띄운다
      if (data.search.direct && data.search.productId) {
        throw redirect({
          to: "/products/$productId",
          params: { productId: data.search.productId },
          search: { directExpired: 1 },
        });
      }
      throw redirect({ to: "/cart" });
    }

    const accessToken = readToken();
    const api = apiFor({ accessToken, cartToken: readCartToken() });
    // 포장이면 픽업 장소를 고른다 — 장소가 있는 상점은 필수라 고르지 않았으면 첫 장소로 연다
    const pickupLocations: PickupLocationView[] =
      data.search.method === "PICKUP" ? await api.pickupLocations.list().catch(() => []) : [];
    const search =
      data.search.method === "PICKUP" &&
      !pickupLocations.some((location) => location.locationId === data.search.pickup)
        ? { ...data.search, pickup: pickupLocations[0]?.locationId }
        : data.search;
    // 받는 방법을 상품이 받지 않으면(400 `FULFILLMENT_METHOD_NOT_ALLOWED`) 상품 기본 방식으로 다시 연다
    let methodRejected = false;
    const create = () =>
      api.checkout.create(withReceiveMethod(intent, search)).catch((error: unknown) => {
        if (
          error instanceof ApiError &&
          error.code === "FULFILLMENT_METHOD_NOT_ALLOWED" &&
          search.method
        ) {
          methodRejected = true;
          return api.checkout.create(intent);
        }
        throw error;
      });
    // 주문서 세션은 진입할 때마다 새로 만든다 — 조회 API가 없고, 가격·재고를 매번 다시 계산한다
    const [checkout, member] = await Promise.all([
      create().catch((error: unknown) => {
        // 회원만 주문받는 상점 — 로그인 뒤 돌아온다. 장바구니 주문은 로그인하며 장바구니가 합쳐져 항목 id가
        // 바뀔 수 있으니 장바구니로, 바로구매는 같은 주문서로 돌아온다
        if (error instanceof ApiError && error.code === "GUEST_CHECKOUT_DISABLED") {
          throw redirect({
            to: "/login",
            search: { redirectTo: intent.cartItemIds ? "/cart" : data.back },
          });
        }
        throw error;
      }),
      accessToken ? api.member.me().catch(() => null) : null,
    ]);
    // 내 쿠폰 중 이 주문서에 쓸 수 있는 것 — 예상 할인액은 서버 값이다(회원 전용, 실패하면 목록을 숨긴다)
    // 저장한 배송지 — 기본 배송지를 미리 채운다(회원 전용, 실패하면 새로 입력한다)
    const [applicableCoupons, addresses] = accessToken
      ? await Promise.all([
          api.checkout.applicableCoupons(checkout.checkoutId).catch(() => []),
          member ? api.member.listAddresses().catch(() => []) : [],
        ])
      : [[], []];
    const config: PublicConfig = { apiBaseUrl: API_BASE_URL, storeCode: resolveStoreCode() };
    return {
      checkout,
      member,
      config,
      applicableCoupons,
      addresses,
      pickupLocations,
      method: methodRejected ? null : (search.method ?? null),
      pickup: methodRejected ? null : (search.pickup ?? null),
      methodRejected,
    };
  });

/** 보유 쿠폰 다시 받기 — 주문서 쿠폰 시트에서 쿠폰을 받은 뒤(#110) 이 주문서에 쓸 수 있는지 서버가 다시 판정한다 */
const refreshApplicableCoupons = createServerFn({ method: "POST" })
  .validator(z.object({ checkoutId: z.string() }))
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return [];
    return apiFor({ accessToken, cartToken: readCartToken() })
      .checkout.applicableCoupons(data.checkoutId)
      .catch(() => []);
  });

/**
 * 배송비 미리보기 — 주문서를 만들 때는 배송지를 몰라 제주·도서산간 추가 배송비가 빠져 있다.
 * 우편번호를 받으면 다시 계산해 보여 준다(주문서를 바꾸지 않는 읽기 계산이다).
 * 결제 시작과 마찬가지로 서버 함수로 부른다 — 구매자 토큰이 브라우저 JS에 나가지 않는다.
 */
const quoteDelivery = createServerFn({ method: "POST" })
  .validator(z.object({ checkoutId: z.string(), zipCode: z.string() }))
  .handler(async ({ data }) => {
    const api = apiFor({ accessToken: readToken(), cartToken: readCartToken() });
    try {
      const quote = await api.checkout.quoteDelivery(data.checkoutId, { zipCode: data.zipCode });
      return { quote, error: null };
    } catch {
      return {
        quote: null,
        error: m.checkout_delivery_quote_failed(),
      };
    }
  });

/**
 * 새로 입력한 배송지를 기본 배송지로 저장한다 — 결제 시작 전에 부르고, 실패해도 결제는 그대로 진행한다.
 * 구매자 토큰을 브라우저에 두지 않으려고 서버 함수로 부른다.
 */
const saveAddress = createServerFn({ method: "POST" })
  .validator(memberAddressRequestSchema)
  .handler(async ({ data }) => {
    const accessToken = readToken();
    if (!accessToken) return { saved: false };
    try {
      await apiFor({ accessToken }).member.createAddress(data);
      return { saved: true };
    } catch {
      return { saved: false };
    }
  });

/**
 * 쿠폰 코드 적용 — 금액 미리보기(`checkout.pricing`)로 적용 여부와 할인액을 확인한다. 주문서를 바꾸지 않고 쿠폰을 예약하지 않는다.
 * 확정은 결제 시작이 같은 코드를 `coupons`로 보낼 때다. 구매자 토큰을 브라우저에 두지 않으려고 서버 함수로 부른다.
 */
const previewCoupon = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        checkoutId: z.string(),
        code: z.string().regex(COUPON_CODE_PATTERN).optional(),
        /** 내 쿠폰(셀러 지급) — `checkout.applicableCoupons`의 `issueId` */
        issueId: z.string().min(1).optional(),
        zipCode: z.string(),
      })
      .refine((value) => Boolean(value.code) !== Boolean(value.issueId)),
  )
  .handler(async ({ data }) => {
    const api = apiFor({ accessToken: readToken(), cartToken: readCartToken() });
    try {
      const pricing = await api.checkout.pricing(data.checkoutId, {
        coupons: couponApplicationsOf({ couponCode: data.code, couponIssueId: data.issueId }),
        zipCode: /^[0-9]{5}$/.test(data.zipCode) ? data.zipCode : undefined,
      });
      const result = pricing.coupons[0];
      if (!result?.applied) {
        return {
          coupon: null,
          pricing: null,
          error: couponRejectMessage(result?.rejectReason ?? null),
        };
      }
      if (!pricing.payable)
        return { coupon: null, pricing: null, error: couponErrorMessage("PAYMENT_AMOUNT_TOO_LOW") };
      const coupon: AppliedCoupon = {
        code: result.code ?? data.code ?? null,
        issueId: result.issueId ?? data.issueId ?? null,
        name: result.name,
        discountAmount: result.discountAmount,
      };
      // 금액은 서버 미리보기 값 그대로 쓴다 — 화면이 할인·총액을 계산하지 않는다
      return {
        coupon,
        pricing: { amounts: pricing.amounts, paymentRequired: pricing.paymentRequired },
        error: null,
      };
    } catch (error) {
      return {
        coupon: null,
        pricing: null,
        error: couponErrorMessage(error instanceof ApiError ? error.code : null),
      };
    }
  });

/**
 * 적립금 적용 — 금액 미리보기(`checkout.pricing`)에 쿠폰과 함께 `pointAmount`를 보내 실제 사용액을 확인한다. 적립금을 예약하지 않는다.
 * 확정은 결제 시작이 같은 금액을 `pointAmount`로 보낼 때다. 서버가 사용 단위·최대 비율·결제 금액 100원 규칙에 맞춰 줄인 값이 온다.
 */
const previewPoints = createServerFn({ method: "POST" })
  .validator(
    z.object({
      checkoutId: z.string(),
      pointAmount: z.number().int().min(0),
      couponCode: z.string().regex(COUPON_CODE_PATTERN).optional(),
      couponIssueId: z.string().min(1).optional(),
      zipCode: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const api = apiFor({ accessToken: readToken(), cartToken: readCartToken() });
    try {
      const pricing = await api.checkout.pricing(data.checkoutId, {
        coupons: couponApplicationsOf(data),
        pointAmount: data.pointAmount,
        zipCode: /^[0-9]{5}$/.test(data.zipCode) ? data.zipCode : undefined,
      });
      return {
        pricing: {
          amounts: pricing.amounts,
          points: pricing.points,
          paymentRequired: pricing.paymentRequired,
        },
        errorCode: null,
        errorReason: null,
      };
    } catch (error) {
      return {
        pricing: null,
        errorCode: error instanceof ApiError ? error.code : null,
        errorReason:
          error instanceof ApiError
            ? ((error.details?.reason as string | undefined) ?? null)
            : null,
      };
    }
  });

const paymentForm = z.object({
  checkoutId: z.string(),
  /** 결제 옵션 — 서버가 결제가 필요 없다고 판단한 주문(적립금 전액)은 보내지 않는다 */
  option: paymentOptionSchema.optional(),
  /** 결제에 실패하면 돌아올 주문서 주소 */
  back: z.string(),
  /** 배송지를 보내는가 — 주문서의 `requiresShipping`. false면(배송 없는 상품만 담은 주문) 배송지를 싣지 않는다 */
  requiresShipping: z.boolean(),
  receiverName: z.string(),
  phone: z.string(),
  zipCode: z.string(),
  address1: z.string(),
  address2: z.string(),
  deliveryMemo: z.string(),
  guestName: z.string(),
  email: z.string(),
  orderPassword: z.string(),
  /** 현금영수증 신청 — 계좌이체·가상계좌에서 구매자가 켰을 때만 */
  cashReceipt: cashReceiptRequestSchema.optional(),
  /** 적용한 쿠폰 코드 — 미리보기로 확인한 값 */
  couponCode: z.string().regex(COUPON_CODE_PATTERN).optional(),
  /** 적용한 내 쿠폰(셀러 지급) — 미리보기로 확인한 값. 코드와 함께 보내지 않는다 */
  couponIssueId: z.string().min(1).optional(),
  /** 사용할 적립금 — 미리보기로 확인한 값 */
  pointAmount: z.number().int().min(0).optional(),
});

/** 결제 시작은 서버에서 한다 — 토큰이 브라우저 JS에 노출되지 않는다. 결제창 호출 값(공개 값)만 내려준다 */
const startPayment = createServerFn({ method: "POST" })
  .validator(paymentForm)
  .handler(async ({ data }) => {
    const accessToken = readToken();
    const api = apiFor({ accessToken, cartToken: readCartToken() });
    // 복귀 주소 — 결제 도메인을 등록한 상점은 이 도메인이 목록 안이어야 한다(테스트 결제는 localhost 허용)
    const returnUrl = new URL(PAYMENT_RETURN_PATH, new URL(getRequestUrl()).origin);
    returnUrl.searchParams.set("back", data.back);
    try {
      const start = await api.checkout.startPayment(data.checkoutId, {
        ...(data.option ? { option: data.option } : {}),
        returnUrl: returnUrl.toString(),
        shippingAddress: data.requiresShipping
          ? {
              receiverName: data.receiverName,
              phone: data.phone,
              zipCode: data.zipCode,
              address1: data.address1,
              address2: data.address2 || undefined,
              deliveryMemo: data.deliveryMemo || undefined,
            }
          : undefined,
        guest: accessToken
          ? undefined
          : {
              name: data.guestName,
              phone: data.phone,
              email: data.email,
              orderPassword: data.orderPassword,
            },
        cashReceipt: data.cashReceipt,
        ...(data.couponCode || data.couponIssueId ? { coupons: couponApplicationsOf(data) } : {}),
        ...(data.pointAmount ? { pointAmount: data.pointAmount } : {}),
      });
      // 결제 시작 값은 JSON으로 넘기고 브라우저에서 SDK 스키마로 다시 읽는다 — 서버 함수 직렬화 타입에 맞춘다
      return {
        start: JSON.stringify(start),
        error: null,
        couponFailed: false,
        pointFailed: null,
      };
    } catch (error) {
      // 쿠폰 때문에 시작하지 못했으면 화면이 쿠폰을 풀고 쿠폰 칸에 안내한다 — 같은 쿠폰으로 다시 눌러도 같은 오류다
      const couponFailed =
        error instanceof ApiError &&
        (COUPON_START_ERRORS as readonly string[]).includes(error.code);
      // 적립금 때문이면 화면이 적립금을 풀고 적립금 칸에 안내한다(문구는 주문서의 사용 규칙으로 화면이 만든다)
      const pointFailed =
        error instanceof ApiError && (POINT_START_ERRORS as readonly string[]).includes(error.code)
          ? {
              code: error.code,
              reason: (error.details?.reason as string | undefined) ?? null,
            }
          : null;
      return { start: null, error: startErrorMessage(error), couponFailed, pointFailed };
    }
  });

/** 결제 시작이 쿠폰 때문에 거절된 오류 코드 */
const COUPON_START_ERRORS = [
  "COUPON_NOT_FOUND",
  "COUPON_NOT_APPLICABLE",
  "COUPON_CHANGED",
  "COUPON_IN_USE",
  "COUPON_LIMIT_REACHED",
  "COUPON_EXHAUSTED",
  "COUPONS_UNAVAILABLE",
  "PAYMENT_AMOUNT_TOO_LOW",
] as const;

function startErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return m.checkout_start_failed();
  switch (error.code) {
    case "PAYMENT_OPTION_UNAVAILABLE":
      return m.checkout_option_unavailable();
    case "PAYMENT_PROVIDER_UNAVAILABLE":
      return m.checkout_provider_unavailable();
    case "PAYMENT_NOT_CONFIGURED":
      return m.checkout_payment_not_configured();
    case "CASH_RECEIPT_NOT_AVAILABLE":
      return m.checkout_cash_receipt_not_available();
    case "COUPON_NOT_APPLICABLE": {
      // 적용하지 못한 이유가 오류에 실려 온다(`details.coupons[].reason`)
      const rejected = (error.details?.coupons as Array<{ reason?: string }> | undefined)?.[0];
      return couponRejectMessage(rejected?.reason ?? null);
    }
    case "TOO_MANY_REQUESTS":
    case "COUPON_NOT_FOUND":
    case "COUPON_CHANGED":
    case "COUPON_IN_USE":
    case "COUPON_LIMIT_REACHED":
    case "COUPON_EXHAUSTED":
    case "COUPONS_UNAVAILABLE":
    case "PAYMENT_AMOUNT_TOO_LOW":
      return couponErrorMessage(error.code);
    case "RETURN_URL_NOT_ALLOWED":
      return m.checkout_return_url_not_allowed();
    default:
      return m.checkout_start_invalid();
  }
}

export const Route = createFileRoute("/checkout/")({
  validateSearch: checkoutSearch,
  loaderDeps: ({ search }) => search,
  // loader가 주문서 세션을 만든다 — 링크에 마우스를 올린 것만으로 만들지 않는다
  preload: false,
  loader: ({ deps, location }) => createCheckout({ data: { search: deps, back: location.href } }),
  head: ({ matches }) => ({ meta: [{ title: pageTitle(matches, m.checkout_title()) }] }),
  component: Checkout,
});

function Checkout() {
  const loaded = Route.useLoaderData();
  const { checkout, member, config, addresses } = loaded;
  const [applicableCoupons, setApplicableCoupons] = useState(loaded.applicableCoupons);
  const [downloadableCoupons, setDownloadableCoupons] = useState<StorefrontCoupon[]>([]);

  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const options = checkout.paymentOptions;
  /** 배송이 필요한 주문인가 — false면(배송 없는 상품만 담은 주문) 배송지·배송비를 보이지 않는다 */
  const shipping = checkout.requiresShipping;
  const defaultOptionKey = options[0] ? paymentOptionKey(options[0]) : "";
  /** 처음 채울 배송지 — 저장한 배송지 중 기본 배송지, 없으면 첫 번째 */
  const initialAddress: MemberAddress | null =
    addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
  /**
   * 폼 스키마는 주문서마다 한 번 만든다 — 비회원 여부와 현금영수증을 받을 수 있는 결제 옵션이 주문서에서 정해진다.
   * 결제 시작 직전의 동기 검사와 `zodResolver`가 같은 스키마를 쓴다.
   */
  const schema = useMemo(
    () =>
      checkoutFormSchema({
        guest: !member,
        shipping,
        cashReceiptOptionKeys: new Set(
          options.filter((option) => cashReceiptAvailable(option.method)).map(paymentOptionKey),
        ),
      }),
    [member, options, shipping],
  );
  const form = useForm<CheckoutFormInput, unknown, CheckoutForm>({
    resolver: zodResolver(schema),
    // 입력 칸의 기본값은 비워 둔다 — 하이드레이션 전에 입력한 값을 그대로 읽는다
    defaultValues: {
      paymentOption: defaultOptionKey,
      cashReceiptOn: false,
      cashReceiptType: "INCOME_DEDUCTION",
    },
  });
  // 결제 옵션은 피커가 `setValue`로 바꾼다 — 라디오 묶음이 둘(결제수단·세부 옵션)이라 입력 하나에 묶지 않는다
  form.register("paymentOption");
  const { errors } = form.formState;
  const selected = form.watch("paymentOption");
  const cashReceiptOn = form.watch("cashReceiptOn");
  const cashReceiptType = form.watch("cashReceiptType");
  /**
   * 배송지를 반영한 금액. 배송비 미리보기와 결제 시작 응답이 덮어쓴다 — 최종 금액은 결제 시작 응답의 `amounts`다
   * (서버가 보낸 배송지로 배송비를 다시 계산한다).
   */
  const [quote, setQuote] = useState<DeliveryQuoteResult | null>(null);
  /** 결제 시작 응답이 준 확정 금액인가 — 이미 쿠폰 할인이 들어 있어 화면에서 다시 빼지 않는다 */
  const [quoteConfirmed, setQuoteConfirmed] = useState(false);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  /** 쿠폰 미리보기의 서버 금액 — 쿠폰만 적용했을 때 총액·결제 필요 여부는 이 값이다 */
  const [couponPricing, setCouponPricing] = useState<{
    amounts: { totalAmount: number };
    paymentRequired: boolean;
  } | null>(null);
  /** 비회원 쿠폰 칸은 비제어 입력이다 — 하이드레이션 전에 입력한 값도 남는다. 쿠폰을 풀면 이 값으로 칸을 다시 채운다 */
  const couponInputRef = useRef<HTMLInputElement>(null);
  const [couponDraft, setCouponDraft] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponSheetOpen, setCouponSheetOpen] = useState(false);
  // 쿠폰 시트를 열 때 받을 수 있는 쿠폰(#110)을 받아 온다 — 회원만, 아직 받지 않은 것만 보인다
  useEffect(() => {
    if (!couponSheetOpen || !member) return;
    let alive = true;
    void getDownloadableCoupons().then((result) => {
      if (alive) setDownloadableCoupons(result.coupons.filter((item) => item.downloaded !== true));
    });
    return () => {
      alive = false;
    };
  }, [couponSheetOpen, member]);
  /** 적립금 — 회원이고 상점이 사용을 켰을 때만 주문서에 안내가 온다 */
  const pointInfo = checkout.points ?? null;
  const [points, setPoints] = useState<AppliedPoints | null>(null);
  const pointInputRef = useRef<HTMLInputElement>(null);
  const [pointDraft, setPointDraft] = useState("");
  const [pointError, setPointError] = useState<string | null>(null);
  const [pointBusy, setPointBusy] = useState(false);
  /**
   * 배송지 입력 방식 — `saved`는 저장한 배송지 카드(칸은 숨긴 채 값만 채운다), `new`는 칸에 직접 입력한다.
   * 저장한 배송지가 없으면 늘 `new`다.
   */
  const [addressMode, setAddressMode] = useState<"saved" | "new">(initialAddress ? "saved" : "new");
  const [selectedAddress, setSelectedAddress] = useState<MemberAddress | null>(initialAddress);
  const [addressBookOpen, setAddressBookOpen] = useState(false);
  /** 「기본 배송지로 저장」 — 새로 입력한 배송지를 결제 시작 전에 저장한다(한 번만) */
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [addressSaved, setAddressSaved] = useState(false);
  /** 주소 검색(카카오 우편번호)을 쓸 수 없으면 우편번호·주소를 손으로 입력한다 */
  const [postcodeManual, setPostcodeManual] = useState(false);
  const address2Ref = useRef<HTMLInputElement | null>(null);
  const [itemsOpen, setItemsOpen] = useState(false);
  /**
   * 팝업에서 취소·실패한 결제. 입력이 그대로면 새 결제를 만들지 않고 이 결제를 다른 옵션으로 다시 시도한다(`payments.retry`) —
   * 새 결제를 만들면 앞 결제가 결제 시간(10분) 동안 쿠폰을 잡고 있어 쿠폰 한도에 걸린다.
   */
  const [pending, setPending] = useState<{ paymentId: string; signature: string } | null>(null);
  /**
   * 이 화면에서 구매자가 고칠 수 없는 실패(상점의 PG 설정 문제, `optionUnavailable`)로 끝난 결제 옵션 — 다시 골라도 같은
   * 실패라 고르지 못하게 한다. 주문서를 새로 열면 다시 보인다(셀러가 설정을 고쳤을 수 있다)
   */
  const [unavailableKeys, setUnavailableKeys] = useState<ReadonlySet<string>>(new Set());
  /** 같은 우편번호로 blur가 반복돼도 다시 부르지 않는다 */
  const [quotedZip, setQuotedZip] = useState<string | null>(null);
  const baseAmounts = quote?.amounts ?? checkout.amounts;
  const delivery = quote?.delivery ?? checkout.delivery;
  // 총액은 할인 전 금액에서 매번 계산한다. 결제 시작 응답(확정)이면 그 할인을, 아니면 미리보기 할인을 뺀다 —
  // 쿠폰 할인은 배송지와 무관하다(배송비 쿠폰 없음)
  const couponDiscount = coupon
    ? quoteConfirmed
      ? baseAmounts.couponDiscountAmount
      : coupon.discountAmount
    : 0;
  // 적립금은 쿠폰 뒤 금액에 쓴다 — 결제 시작 응답(확정)이면 그 사용액, 아니면 미리보기 사용액이다
  const pointDiscount = points
    ? quoteConfirmed
      ? (baseAmounts.pointAmount ?? 0)
      : points.amount
    : 0;
  // 결제 금액은 서버 값만 보인다 — 결제 시작 응답(확정) → 적립금 미리보기 → 쿠폰 미리보기 → 주문서·배송비 견적 순서다
  const totalAmount = quoteConfirmed
    ? baseAmounts.totalAmount
    : points
      ? points.totalAmount
      : coupon && couponPricing
        ? couponPricing.amounts.totalAmount
        : baseAmounts.totalAmount;
  /** 결제수단으로 낼 금액이 남는가 — 서버의 판단(`paymentRequired`)이다. 미리보기 전이면 결제가 필요하다 */
  const paymentRequired = points
    ? points.paymentRequired
    : coupon && couponPricing
      ? couponPricing.paymentRequired
      : true;

  /** 적립금을 푼다 — 금액은 칸에 되돌린다. 쿠폰이 바뀌면 쓸 수 있는 금액이 달라져 다시 적용한다 */
  const releasePoints = (amount: number | null) => {
    setPointDraft(amount ? String(amount) : "");
    setPoints(null);
    setQuoteConfirmed(false);
  };

  /** 쿠폰을 푼다 — 코드는 칸에 되돌린다 */
  const releaseCoupon = (code: string | null) => {
    setCouponDraft(code ?? "");
    setCoupon(null);
    setCouponPricing(null);
    if (points) releasePoints(points.amount);
    setQuoteConfirmed(false);
  };

  /** 쿠폰 적용 — 쿠폰 코드, 또는 보유 쿠폰의 `issueId`다. 적용했으면 true(쿠폰 시트가 닫힌다) */
  const applyCoupon = (target: { code: string } | { issueId: string }): Promise<boolean> => {
    if (couponBusy) return Promise.resolve(false);
    const issueId = "issueId" in target ? target.issueId : undefined;
    const code = "code" in target ? target.code.trim() : undefined;
    if (!issueId && !COUPON_CODE_PATTERN.test(code ?? "")) {
      setCouponError(m.checkout_coupon_code_invalid());
      return Promise.resolve(false);
    }
    setCouponBusy(true);
    setCouponError(null);
    return previewCoupon({
      data: {
        checkoutId: checkout.checkoutId,
        code,
        issueId,
        zipCode: form.getValues("zipCode") ?? "",
      },
    })
      .then(({ coupon: next, pricing, error }) => {
        setCouponDraft(code ?? "");
        setCoupon(next);
        setCouponPricing(pricing);
        if (next && points) releasePoints(points.amount);
        setQuoteConfirmed(false);
        setCouponError(error);
        return Boolean(next);
      })
      .catch(() => {
        setCouponError(couponErrorMessage(null));
        return false;
      })
      .finally(() => setCouponBusy(false));
  };

  /** 적립금 적용 — `requested`가 없으면 칸의 값이다(「전액 사용」은 최대 사용액을 넘긴다) */
  const applyPoints = (requested?: number) => {
    if (pointBusy || !pointInfo) return;
    const amount = requested ?? parsePointInput(pointInputRef.current?.value ?? "");
    if (amount === null) {
      setPointError(m.checkout_points_invalid());
      return;
    }
    if (amount === 0) {
      releasePoints(null);
      setPointError(null);
      return;
    }
    setPointBusy(true);
    setPointError(null);
    void previewPoints({
      data: {
        checkoutId: checkout.checkoutId,
        pointAmount: amount,
        ...couponRefOf(coupon),
        zipCode: form.getValues("zipCode") ?? "",
      },
    })
      .then(({ pricing, errorCode, errorReason }) => {
        setQuoteConfirmed(false);
        if (!pricing) {
          setPoints(null);
          setPointDraft(String(amount));
          setPointError(pointErrorMessage(errorCode, errorReason, pointInfo));
          return;
        }
        const { applied, error } = appliedPointsOf(pricing, pointInfo);
        setPoints(applied);
        setPointDraft(String(applied?.amount ?? amount));
        setPointError(error);
      })
      .catch(() => setPointError(pointErrorMessage(null, null, pointInfo)))
      .finally(() => setPointBusy(false));
  };

  /**
   * 배송비 미리보기 — 우편번호 칸 blur(손 입력), 주소 검색 결과, 저장한 배송지 선택이 모두 이 경로로 부른다.
   * 디바운스 타이머 대신 값이 정해지는 순간에 부른다 — 우편번호는 5자리를 한 번에 채우는 값이다
   */
  const handleZipBlur = (zipCode: string) => {
    if (!/^[0-9]{5}$/.test(zipCode) || zipCode === quotedZip) return;
    setQuotedZip(zipCode);
    void quoteDelivery({ data: { checkoutId: checkout.checkoutId, zipCode } })
      .then(({ quote: next, error }) => {
        if (next) {
          setQuote(next);
          setQuoteConfirmed(false);
          // 배송비가 바뀌면 적립금 사용액·결제 필요 여부도 바뀐다 — 다시 적용한다
          if (points) releasePoints(points.amount);
          // 쿠폰 미리보기 금액도 배송지 기준으로 서버에서 다시 받는다
          else if (coupon) {
            void previewCoupon({
              data: {
                checkoutId: checkout.checkoutId,
                code: coupon.issueId ? undefined : (coupon.code ?? undefined),
                issueId: coupon.issueId ?? undefined,
                zipCode,
              },
            }).then(({ coupon: next, pricing }) => {
              setCoupon(next);
              setCouponPricing(pricing);
            });
          }
        } else {
          setQuotedZip(null);
          setNotice(error);
        }
      })
      .catch(() => setQuotedZip(null));
  };

  // 저장한 배송지를 미리 채웠으면 그 우편번호로 배송비(지역 추가 배송비)를 바로 확인한다
  // biome-ignore lint/correctness/useExhaustiveDependencies: 처음 채운 배송지에 한 번만 부른다
  useEffect(() => {
    if (shipping && initialAddress) handleZipBlur(initialAddress.zipCode);
  }, []);

  /** 저장한 배송지 고르기 — 칸 값을 채우고 배송비를 다시 확인한다 */
  const fillAddress = (address: MemberAddress) => {
    setSelectedAddress(address);
    setAddressMode("saved");
    form.setValue("receiverName", address.receiverName);
    form.setValue("phone", address.phone);
    form.setValue("zipCode", address.zipCode);
    form.setValue("address1", address.address1);
    form.setValue("address2", address.address2 ?? "");
    form.clearErrors(["receiverName", "phone", "zipCode", "address1", "address2"]);
    handleZipBlur(address.zipCode);
  };

  /** 새 배송지 입력 — 칸을 비우고, 앞 배송지로 받은 배송비 견적을 버린다 */
  const startNewAddress = () => {
    setSelectedAddress(null);
    setAddressMode("new");
    form.setValue("receiverName", member?.name ?? "");
    form.setValue("phone", "");
    form.setValue("zipCode", "");
    form.setValue("address1", "");
    form.setValue("address2", "");
    setQuote(null);
    setQuotedZip(null);
    setQuoteConfirmed(false);
  };

  /** 주소 검색 결과 — 우편번호·기본 주소를 채우고 상세 주소 칸으로 초점을 옮긴다 */
  const pickPostcode = ({ zipCode, address1 }: { zipCode: string; address1: string }) => {
    form.setValue("zipCode", zipCode);
    form.setValue("address1", address1);
    form.clearErrors(["zipCode", "address1"]);
    address2Ref.current?.focus();
    handleZipBlur(zipCode);
  };

  const selectedOption = options.find((item) => paymentOptionKey(item) === selected);
  // 현금영수증은 계좌이체·가상계좌에서만 받는다
  const cashReceiptShown = !!selectedOption && cashReceiptAvailable(selectedOption.method);

  const settle = (result: PaymentResult, back: string, signature: string, optionKey: string) => {
    if (result.status === "COMPLETED") {
      forgetPaymentOptions(result.paymentId);
      void navigate({
        to: "/checkout/complete",
        search: { orderId: result.orderId },
        replace: true,
      });
      return;
    }
    if (result.status === "PROCESSING") {
      // 결과 확인 중 — 복귀 화면이 결제 상태를 확정할 때까지 조회한다
      void navigate({
        to: "/checkout/return",
        search: { back, sayrenPaymentId: result.paymentId },
        replace: true,
      });
      return;
    }
    // 같은 입력으로 다시 누르면 이 결제를 다른 옵션으로 이어 간다
    if (result.status !== "INVALID") setPending({ paymentId: result.paymentId, signature });
    if (result.status === "FAILED" && result.optionUnavailable) {
      // 이 옵션은 다시 시도해도 실패한다 — 고르지 못하게 하고 남은 옵션 중 첫 번째를 고른다
      const unavailable = new Set(unavailableKeys).add(optionKey);
      setUnavailableKeys(unavailable);
      const next = options.find((item) => !unavailable.has(paymentOptionKey(item)));
      form.setValue("paymentOption", next ? paymentOptionKey(next) : "");
    }
    setNotice(
      result.status === "CANCELED"
        ? m.checkout_payment_canceled()
        : result.status === "FAILED"
          ? result.message
          : m.checkout_payment_unknown(),
    );
  };

  /**
   * 결제창은 클릭에서 동기로 열어야 팝업 차단에 걸리지 않는다. `form.handleSubmit`은 검증을 기다린 뒤 부르므로
   * 여기서는 같은 스키마로 먼저 동기 검사하고, 통과하면 바로 빈 창을 연다. 실패하면 `handleSubmit`으로 칸마다
   * 오류를 보이고 첫 오류 칸으로 옮긴다.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = schema.safeParse(form.getValues());
    if (!parsed.success) {
      // 저장한 배송지 값이 지금 규칙에 맞지 않으면 숨긴 칸을 펼쳐 고칠 수 있게 한다
      if (
        addressMode === "saved" &&
        parsed.error.issues.some((issue) => ADDRESS_FIELDS.includes(String(issue.path[0])))
      ) {
        setAddressMode("new");
      }
      void form.handleSubmit(() => undefined)();
      return;
    }
    const values = parsed.data;
    // 결제가 필요 없는 주문(서버 판단, 적립금 전액)은 결제수단을 보내지 않고 결제창도 열지 않는다
    const option = paymentRequired
      ? options.find((item) => paymentOptionKey(item) === values.paymentOption)
      : undefined;
    if (paymentRequired && (!option || unavailableKeys.has(values.paymentOption))) {
      setNotice(m.checkout_option_required());
      return;
    }
    const cashReceipt =
      option && cashReceiptAvailable(option.method) && values.cashReceiptOn
        ? { type: values.cashReceiptType, identityNumber: values.cashReceiptNumber ?? "" }
        : undefined;
    const back = window.location.pathname + window.location.search;
    const payments = paymentsFor(config);
    // 결제창은 클릭 시점에 열어야 팝업 차단에 걸리지 않는다 — 서버 함수를 기다리기 전에 빈 창을 먼저 연다
    const paymentWindow = paymentRequired ? payments.prepareWindow() : null;
    setSubmitting(true);
    setNotice(null);
    // 결제 금액을 정하는 입력 — 앞 결제와 같으면 그 결제를 이어 간다
    const signature = JSON.stringify([
      values.receiverName ?? "",
      values.phone ?? "",
      values.zipCode ?? "",
      values.address1 ?? "",
      values.address2 ?? "",
      values.deliveryMemo ?? "",
      values.guestName ?? "",
      values.email ?? "",
      values.orderPassword ?? "",
      coupon?.code ?? null,
      coupon?.issueId ?? null,
      points?.amount ?? 0,
    ]);
    if (option && paymentWindow && pending && pending.signature === signature) {
      void payments
        .retry(pending.paymentId, { option, cashReceipt, window: paymentWindow })
        .then((result) => settle(result, back, signature, paymentOptionKey(option)))
        .catch((error: unknown) => {
          paymentWindow.close();
          // 이어 갈 수 없는 결제다(시간 지남 등) — 다음 클릭은 새 결제를 만든다
          setPending(null);
          setNotice(
            error instanceof ApiError && error.code === "PAYMENT_EXPIRED"
              ? m.checkout_payment_expired()
              : m.checkout_retry_failed(),
          );
        })
        .finally(() => setSubmitting(false));
      return;
    }
    setPending(null);
    // 「기본 배송지로 저장」 — 결제 시작 전에 한 번 저장한다. 실패해도 결제는 그대로 진행한다
    const saving =
      shipping && member && addressMode === "new" && saveAsDefault && !addressSaved
        ? saveAddress({
            data: {
              alias: (values.receiverName ?? "").slice(0, 20),
              receiverName: values.receiverName ?? "",
              phone: values.phone ?? "",
              zipCode: values.zipCode ?? "",
              address1: values.address1 ?? "",
              address2: values.address2 || undefined,
              isDefault: true,
            },
          })
            .then(({ saved }) => setAddressSaved(saved))
            .catch(() => undefined)
        : Promise.resolve();
    void saving
      .then(() =>
        startPayment({
          data: {
            checkoutId: checkout.checkoutId,
            option,
            back,
            requiresShipping: shipping,
            receiverName: values.receiverName ?? "",
            phone: values.phone ?? "",
            zipCode: values.zipCode ?? "",
            address1: values.address1 ?? "",
            address2: values.address2 ?? "",
            deliveryMemo: values.deliveryMemo ?? "",
            guestName: values.guestName ?? "",
            email: values.email ?? "",
            orderPassword: values.orderPassword ?? "",
            cashReceipt,
            ...couponRefOf(coupon),
            pointAmount: points?.amount,
          },
        }),
      )
      .then(async ({ start, error, couponFailed, pointFailed }) => {
        if (!start) {
          paymentWindow?.close();
          if (couponFailed && coupon) {
            releaseCoupon(coupon.code);
            setCouponError(error);
          } else if (pointFailed && points) {
            releasePoints(points.amount);
            setPointError(pointErrorMessage(pointFailed.code, pointFailed.reason, pointInfo));
          } else {
            setNotice(error);
          }
          return;
        }
        const paymentStart = paymentStartSchema.parse(JSON.parse(start));
        // 확정 금액 — 서버가 보낸 배송지로 배송비를 다시 계산했다. 화면에 보여 준 금액과 다를 수 있다
        setQuote({ amounts: paymentStart.amounts, delivery: paymentStart.delivery });
        setQuoteConfirmed(true);
        // 리다이렉트 결제가 실패해 복귀 화면으로 오면 같은 결제를 다른 옵션으로 다시 시도한다 — 그때 쓸 목록
        rememberPaymentOptions(paymentStart.paymentId, options);
        // 결제 서비스가 결제창을 그린다. 팝업이면 결과를 여기서 받고, 리다이렉트면 이 탭이 떠난다
        // 결제가 필요 없던 주문은 응답이 곧 완료다 — SDK가 창 없이 COMPLETED를 돌려준다
        settle(
          await payments.open(paymentStart, paymentWindow ? { window: paymentWindow } : undefined),
          back,
          signature,
          option ? paymentOptionKey(option) : "",
        );
      })
      .catch(() => {
        paymentWindow?.close();
        setNotice(m.checkout_start_failed());
      })
      .finally(() => setSubmitting(false));
  };

  const payDisabled = submitting || couponBusy || pointBusy || options.length === 0;
  const payLabel = paymentRequired
    ? m.checkout_pay({ amount: formatPrice(totalAmount) })
    : m.checkout_pay_with_points();
  const usableCoupons = applicableCoupons.filter((item) => item.applicable).length;
  const zipRegistration = form.register("zipCode", {
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => handleZipBlur(event.target.value.trim()),
  });
  const address2Registration = form.register("address2");
  const firstItem = checkout.items[0];

  return (
    <>
      {/* 주문서 바탕은 옅은 회색 면이고 섹션마다 흰 카드다. 바탕은 본문 폭을 넘어 화면 끝까지 칠한다(가로 스크롤 없이) */}
      <div className="-mx-4 -mt-8 -mb-16 bg-chip md:-mb-24 pb-28 shadow-[0_0_0_100vmax_var(--color-chip)] [clip-path:inset(0_-100vmax)] md:mx-0 md:pb-20">
        <div className="flex flex-col gap-2 px-4 pt-5 pb-4 md:flex-row md:items-end md:justify-between md:px-0 md:pt-10 md:pb-6">
          <PageTitle>{m.checkout_title()}</PageTitle>
          <CheckoutSteps current="checkout" />
        </div>
        <SectionCard title={m.receive_method_label()} titleId="checkout-receive" className="mb-2">
          <ReceiveMethodToggle
            value={loaded.method ?? "DIRECT"}
            onChange={(method) =>
              navigate({
                to: "/checkout",
                search: (prev) => ({ ...prev, method, pickup: undefined }),
                replace: true,
              })
            }
          />
          {loaded.methodRejected ? (
            <p role="alert" className="mt-2 text-meta text-point">
              {m.checkout_method_rejected()}
            </p>
          ) : null}
          {loaded.method === "PICKUP" ? (
            <PickupLocationPicker
              locations={loaded.pickupLocations}
              value={loaded.pickup}
              onChange={(pickup) =>
                navigate({
                  to: "/checkout",
                  search: (prev) => ({ ...prev, pickup }),
                  replace: true,
                })
              }
            />
          ) : null}
        </SectionCard>

        <form
          id={FORM_ID}
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_380px] md:items-start md:gap-6"
        >
          <div className="flex min-w-0 flex-col gap-2 md:gap-3">
            <SectionCard
              title={
                <>
                  {m.checkout_items()}
                  <span className="ml-1.5 font-normal text-muted">{checkout.items.length}</span>
                </>
              }
              titleId="checkout-items"
              action={
                <button
                  type="button"
                  aria-expanded={itemsOpen}
                  aria-controls="checkout-items-list"
                  aria-label={itemsOpen ? m.checkout_items_collapse() : m.checkout_items_expand()}
                  onClick={() => setItemsOpen((open) => !open)}
                  className="-mr-2 flex size-10 items-center justify-center md:hidden"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={`size-5 transition-transform ${itemsOpen ? "rotate-180" : ""}`}
                    strokeWidth={1.6}
                  />
                </button>
              }
            >
              {!itemsOpen && firstItem ? (
                <p className="-mt-1 break-words text-meta text-sub md:hidden">
                  {checkout.items.length > 1
                    ? m.checkout_items_more({
                        name: firstItem.productName,
                        count: checkout.items.length - 1,
                      })
                    : firstItem.productName}
                </p>
              ) : null}
              <ul
                id="checkout-items-list"
                className={`flex-col md:flex md:border-ink md:border-t ${itemsOpen ? "flex" : "hidden"}`}
              >
                {checkout.items.map((item) => (
                  <li
                    // 같은 조합이어도 추가 선택·직접 입력이 다르면 줄이 나뉜다 — 줄 id로 가른다
                    key={item.lineId ?? `${item.productId}-${item.optionId}`}
                    className="flex min-w-0 items-start justify-between gap-4 border-line border-b py-3.5 first:pt-0 last:border-b-0 md:py-4 md:first:pt-4 md:last:border-b"
                  >
                    <ProductThumb
                      src={item.thumbnailUrl ?? null}
                      className="h-20 w-16 shrink-0 bg-chip object-cover md:h-[90px] md:w-[72px]"
                      loading="lazy"
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="break-words text-body">{item.productName}</span>
                      <LineOptions item={item} />
                      <span className="text-caption text-muted md:text-meta">
                        {m.checkout_item_quantity({ quantity: item.quantity })}
                      </span>
                    </span>
                    <b className="tabular shrink-0 text-body md:text-body-lg">
                      {formatPrice(item.totalPrice)}
                    </b>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {member ? null : (
              <SectionCard
                title={m.checkout_orderer()}
                titleId="checkout-orderer"
                action={<span className="text-meta text-muted">{m.checkout_guest()}</span>}
              >
                <TextField
                  row
                  label={m.checkout_guest_name()}
                  registration={form.register("guestName")}
                  error={errors.guestName?.message}
                  autoComplete="name"
                  required
                />
                {/* 배송지가 없는 주문은 주문자 연락처를 여기서 받는다(배송지 칸의 연락처가 없다) */}
                {shipping ? null : (
                  <TextField
                    row
                    label={m.checkout_phone()}
                    registration={form.register("phone")}
                    error={errors.phone?.message}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="01012345678"
                    required
                  />
                )}
                <TextField
                  row
                  label={m.checkout_email()}
                  registration={form.register("email")}
                  error={errors.email?.message}
                  type="email"
                  autoComplete="email"
                  required
                />
                <TextField
                  row
                  label={m.checkout_order_password()}
                  registration={form.register("orderPassword")}
                  error={errors.orderPassword?.message}
                  type="password"
                  autoComplete="new-password"
                  required
                  hint={m.checkout_order_password_hint()}
                />
              </SectionCard>
            )}

            {/* 배송이 필요 없는 주문(배송 없는 상품만 담은 주문)은 배송지를 받지 않는다 */}
            {shipping ? (
              <SectionCard
                title={m.checkout_shipping()}
                titleId="checkout-shipping"
                action={
                  addresses.length ? (
                    <button
                      type="button"
                      onClick={() => setAddressBookOpen(true)}
                      className={buttonClass({ variant: "subtle", size: "xs" })}
                    >
                      {addressMode === "saved"
                        ? m.checkout_address_change()
                        : m.checkout_address_book()}
                    </button>
                  ) : null
                }
              >
                {addressMode === "saved" && selectedAddress ? (
                  <div className="border border-ink p-4">
                    <AddressCard address={selectedAddress} />
                  </div>
                ) : null}
                {/* 저장한 배송지를 쓰는 동안 칸은 숨긴 채 값만 들고 있다 — 결제 시작이 같은 칸 값을 보낸다 */}
                <div
                  hidden={addressMode === "saved" && Boolean(selectedAddress)}
                  className="flex min-w-0 flex-col gap-4 md:gap-5"
                >
                  <TextField
                    row
                    label={m.checkout_receiver_name()}
                    registration={form.register("receiverName")}
                    error={errors.receiverName?.message}
                    defaultValue={initialAddress?.receiverName ?? member?.name ?? ""}
                    autoComplete="name"
                    required
                  />
                  <TextField
                    row
                    label={m.checkout_phone()}
                    registration={form.register("phone")}
                    error={errors.phone?.message}
                    defaultValue={initialAddress?.phone ?? ""}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="01012345678"
                    required
                  />
                  <FormRow label={m.checkout_address1()} required>
                    <div className="flex min-w-0 gap-2">
                      <input
                        {...zipRegistration}
                        defaultValue={initialAddress?.zipCode ?? ""}
                        readOnly={!postcodeManual}
                        required
                        inputMode="numeric"
                        maxLength={5}
                        autoComplete="postal-code"
                        aria-label={m.checkout_zip_code()}
                        aria-invalid={errors.zipCode ? true : undefined}
                        placeholder={m.checkout_zip_code()}
                        className={inputClass({
                          invalid: Boolean(errors.zipCode),
                          readOnly: !postcodeManual,
                          className: "md:max-w-40",
                        })}
                      />
                      {postcodeManual ? null : (
                        <AddressSearchButton
                          onSelect={pickPostcode}
                          onUnavailable={() => {
                            setPostcodeManual(true);
                            setNotice(m.checkout_address_search_unavailable());
                          }}
                        />
                      )}
                    </div>
                    <input
                      {...form.register("address1")}
                      defaultValue={initialAddress?.address1 ?? ""}
                      readOnly={!postcodeManual}
                      required
                      autoComplete="address-line1"
                      aria-label={m.checkout_address1()}
                      aria-invalid={errors.address1 ? true : undefined}
                      placeholder={postcodeManual ? undefined : m.checkout_address1_placeholder()}
                      className={inputClass({
                        invalid: Boolean(errors.address1),
                        readOnly: !postcodeManual,
                      })}
                    />
                    <input
                      {...address2Registration}
                      ref={(element) => {
                        address2Registration.ref(element);
                        address2Ref.current = element;
                      }}
                      defaultValue={initialAddress?.address2 ?? ""}
                      autoComplete="address-line2"
                      aria-label={m.checkout_address2()}
                      placeholder={m.checkout_address2_placeholder()}
                      className={inputClass({ invalid: Boolean(errors.address2) })}
                    />
                    {[errors.zipCode, errors.address1, errors.address2].map((error) =>
                      error?.message ? (
                        <span key={error.message} className="text-caption text-point">
                          {error.message}
                        </span>
                      ) : null,
                    )}
                    {postcodeManual ? (
                      <span className="text-caption text-muted">{m.checkout_zip_code_hint()}</span>
                    ) : null}
                    {member ? (
                      <label className="flex items-center gap-2 text-meta text-sub">
                        <input
                          type="checkbox"
                          checked={saveAsDefault}
                          onChange={(event) => setSaveAsDefault(event.target.checked)}
                          className="size-[1.125rem] shrink-0 accent-ink"
                        />
                        {m.checkout_address_save_default()}
                      </label>
                    ) : null}
                  </FormRow>
                </div>
              </SectionCard>
            ) : null}

            {shipping ? (
              <SectionCard
                title={m.checkout_delivery_request()}
                titleId="checkout-delivery-request"
              >
                <DeliveryMemoField
                  registration={form.register("deliveryMemo")}
                  setValue={(value) => form.setValue("deliveryMemo", value)}
                  error={errors.deliveryMemo?.message}
                />
              </SectionCard>
            ) : null}

            <SectionCard title={m.checkout_benefits()} titleId="checkout-benefits">
              <FormRow label={m.checkout_coupon()}>
                {member ? (
                  <>
                    <div className="flex min-w-0 gap-2">
                      <div
                        className={inputClass({
                          className: "flex items-center justify-between gap-3",
                        })}
                      >
                        <span
                          className={`min-w-0 truncate ${coupon ? "" : "text-muted"}`}
                          title={coupon?.name}
                        >
                          {coupon ? coupon.name : m.checkout_coupon_select()}
                        </span>
                        {coupon ? (
                          <b className="tabular shrink-0 text-point">
                            −{formatPrice(coupon.discountAmount)}
                          </b>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        disabled={couponBusy}
                        onClick={() => setCouponSheetOpen(true)}
                        className={buttonClass({
                          variant: "outline",
                          size: "md",
                          className: "font-medium",
                        })}
                      >
                        {coupon ? m.checkout_coupon_change() : m.checkout_coupon_select()}
                      </button>
                    </div>
                    <span className="flex flex-wrap items-center gap-x-3 text-caption text-muted">
                      {m.checkout_coupon_summary({
                        total: applicableCoupons.length,
                        usable: usableCoupons,
                      })}
                      {coupon ? (
                        <button
                          type="button"
                          className={buttonClass({ variant: "ghost", className: "text-caption" })}
                          onClick={() => releaseCoupon(coupon.code)}
                        >
                          {m.checkout_coupon_remove()}
                        </button>
                      ) : null}
                    </span>
                  </>
                ) : coupon ? (
                  <div className="flex min-w-0 items-center justify-between gap-3 border border-ink px-3.5 py-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="break-words font-medium text-body">{coupon.name}</span>
                      <span className="break-words text-caption text-muted">
                        {m.checkout_coupon_applied({
                          code: coupon.code ?? coupon.name,
                          amount: formatPrice(coupon.discountAmount),
                        })}
                      </span>
                    </span>
                    <button
                      type="button"
                      className={buttonClass({ variant: "ghost", className: "text-meta" })}
                      onClick={() => releaseCoupon(coupon.code)}
                    >
                      {m.checkout_coupon_remove()}
                    </button>
                  </div>
                ) : (
                  <div className="flex min-w-0 gap-2">
                    {/* 결제 폼 안이라 Enter가 결제를 시작하지 않게 막고 쿠폰만 적용한다 */}
                    <input
                      ref={couponInputRef}
                      defaultValue={couponDraft}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        void applyCoupon({ code: couponInputRef.current?.value ?? "" });
                      }}
                      aria-label={m.checkout_coupon_code()}
                      placeholder={m.checkout_coupon_code()}
                      autoComplete="off"
                      className={inputClass({ className: "uppercase placeholder:normal-case" })}
                    />
                    <button
                      type="button"
                      disabled={couponBusy}
                      onClick={() =>
                        void applyCoupon({ code: couponInputRef.current?.value ?? "" })
                      }
                      className={buttonClass({
                        variant: "outline",
                        size: "md",
                        className: "font-medium",
                      })}
                    >
                      {m.checkout_coupon_apply()}
                    </button>
                  </div>
                )}
                {couponError && !couponSheetOpen ? (
                  <p role="alert" className="text-caption text-point">
                    {couponError}
                  </p>
                ) : null}
              </FormRow>

              {pointInfo ? (
                <FormRow label={m.checkout_points()}>
                  {points ? (
                    <div className="flex min-w-0 items-center justify-between gap-3 border border-ink px-3.5 py-3">
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-body">
                          {m.checkout_points_applied({ amount: formatPrice(points.amount) })}
                        </span>
                        {points.adjusted ? (
                          <span className="text-caption text-muted">
                            {m.checkout_points_min_payment()}
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        className={buttonClass({ variant: "ghost", className: "text-meta" })}
                        onClick={() => releasePoints(points.amount)}
                      >
                        {m.checkout_points_remove()}
                      </button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 gap-2">
                      {/* 결제 폼 안이라 Enter가 결제를 시작하지 않게 막고 적립금만 적용한다 */}
                      <input
                        ref={pointInputRef}
                        defaultValue={pointDraft}
                        key={pointDraft}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          applyPoints();
                        }}
                        aria-label={m.checkout_points_amount()}
                        placeholder="0"
                        inputMode="numeric"
                        autoComplete="off"
                        className={inputClass({ className: "text-right" })}
                      />
                      <button
                        type="button"
                        disabled={pointBusy}
                        onClick={() => applyPoints()}
                        className={buttonClass({
                          variant: "outline",
                          size: "md",
                          className: "font-medium",
                        })}
                      >
                        {m.checkout_points_apply()}
                      </button>
                      <button
                        type="button"
                        disabled={pointBusy || pointInfo.balance <= 0}
                        onClick={() => applyPoints(pointInfo.balance)}
                        className={buttonClass({
                          variant: "subtle",
                          size: "md",
                          className: "font-medium",
                        })}
                      >
                        {m.checkout_points_use_all()}
                      </button>
                    </div>
                  )}
                  <span className="text-caption text-muted">
                    {m.checkout_points_available({
                      balance: formatPrice(pointInfo.balance),
                      max: formatPrice(pointInfo.maxUsable),
                    })}
                    {pointInfo.unit > 1
                      ? ` · ${m.checkout_points_unit({ unit: pointInfo.unit })}`
                      : ""}
                  </span>
                  {pointError ? (
                    <p role="alert" className="text-caption text-point">
                      {pointError}
                    </p>
                  ) : null}
                </FormRow>
              ) : null}
            </SectionCard>

            {/* 결제가 필요 없는 주문(서버 판단 `paymentRequired: false`)은 결제수단을 고르지 않는다 */}
            <div hidden={!paymentRequired}>
              <SectionCard title={m.checkout_payment_method()} titleId="checkout-payment-method">
                <fieldset className="min-w-0">
                  <legend className="sr-only">{m.checkout_payment_method()}</legend>
                  {options.length === 0 ? (
                    <p className="text-body text-muted">{m.checkout_no_payment_options()}</p>
                  ) : (
                    <PaymentMethodPicker
                      options={options}
                      selected={selected}
                      unavailableKeys={unavailableKeys}
                      onSelect={(key) =>
                        form.setValue("paymentOption", key, {
                          shouldValidate: Boolean(errors.paymentOption),
                        })
                      }
                    />
                  )}
                  {errors.paymentOption ? (
                    <p className="mt-2 text-caption text-point">{errors.paymentOption.message}</p>
                  ) : null}
                </fieldset>

                {cashReceiptShown && paymentRequired ? (
                  <fieldset className="flex min-w-0 flex-col gap-3 bg-chip p-4">
                    <legend className="sr-only">{m.checkout_cash_receipt()}</legend>
                    <b aria-hidden="true" className="text-meta">
                      {m.checkout_cash_receipt()}
                    </b>
                    <label className="flex items-center gap-2 text-body">
                      <input
                        type="checkbox"
                        {...form.register("cashReceiptOn")}
                        className="size-[1.125rem] shrink-0 accent-ink"
                      />
                      {m.checkout_cash_receipt_request()}
                    </label>
                    {cashReceiptOn ? (
                      <>
                        <label className="flex min-w-0 flex-col gap-2">
                          <span className="font-medium text-meta">
                            {m.checkout_cash_receipt_type()}
                          </span>
                          <select
                            {...form.register("cashReceiptType")}
                            className={inputClass({ className: "bg-page" })}
                          >
                            <option value="INCOME_DEDUCTION">
                              {m.checkout_cash_receipt_income_deduction()}
                            </option>
                            <option value="EXPENSE_PROOF">
                              {m.checkout_cash_receipt_expense_proof()}
                            </option>
                          </select>
                        </label>
                        <TextField
                          label={
                            cashReceiptType === "EXPENSE_PROOF"
                              ? m.checkout_cash_receipt_business_number()
                              : m.checkout_cash_receipt_personal_number()
                          }
                          registration={form.register("cashReceiptNumber")}
                          error={errors.cashReceiptNumber?.message}
                          inputMode="numeric"
                          required
                        />
                      </>
                    ) : null}
                  </fieldset>
                ) : null}
              </SectionCard>
            </div>
          </div>

          <aside
            aria-labelledby="checkout-amounts"
            className="flex min-w-0 flex-col gap-2 md:sticky md:top-[9.5rem] md:gap-3"
          >
            <SectionCard
              title={m.checkout_amounts()}
              titleId="checkout-amounts"
              className="md:px-7 md:py-7"
            >
              <AmountSummary
                productAmount={baseAmounts.productAmount}
                delivery={shipping ? delivery : null}
                couponDiscount={couponDiscount}
                pointDiscount={pointInfo ? pointDiscount : null}
                totalAmount={totalAmount}
              />
              {(shipping ? deliveryNotes(delivery) : []).map((note) => (
                <p key={note} className="text-caption text-muted">
                  {note}
                </p>
              ))}
              {checkout.testPayment ? (
                <p className="bg-chip px-3 py-2 text-caption">{m.checkout_test_payment()}</p>
              ) : null}
            </SectionCard>
            <div className="flex flex-col gap-3 bg-page px-4 py-5 md:px-7">
              <label className="flex cursor-pointer items-start gap-2 font-bold text-meta md:items-center md:text-body">
                {/* 결제 동의 — 브라우저 필수 검사로 막는다(결제창을 여는 동기 검사보다 먼저 돈다) */}
                <input type="checkbox" required className={choiceClass} />
                {m.checkout_agree()}
              </label>
            </div>
            {notice ? (
              <p role="status" className="bg-page px-4 py-3 text-body md:px-7">
                {notice}
              </p>
            ) : null}
            {/* 모바일은 아래 고정 버튼만 쓴다. 버튼 원자에 inline-flex가 있어 버튼 자체에 hidden을 걸면 덮이므로 감싸서 숨긴다 */}
            <div className="hidden md:block">
              <SubmitButton
                disabled={payDisabled}
                className={buttonClass({
                  variant: "point",
                  size: "lg",
                  block: true,
                  className: "h-[3.75rem] text-[1.0625rem]",
                })}
              >
                {payLabel}
              </SubmitButton>
            </div>
          </aside>
        </form>
      </div>

      {/* 모바일 결제 버튼은 화면 아래에 고정한다 — 바탕 칠(clip-path) 밖에 두고 form 속성으로 주문서 폼에 잇는다 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-line border-t bg-page px-4 pt-2.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:hidden">
        <SubmitButton
          form={FORM_ID}
          disabled={payDisabled}
          className={buttonClass({
            variant: "point",
            size: "lg",
            block: true,
            className: "text-[1.0625rem]",
          })}
        >
          {payLabel}
        </SubmitButton>
      </div>

      {member ? (
        <CouponSheet
          open={couponSheetOpen}
          onClose={() => setCouponSheetOpen(false)}
          coupons={applicableCoupons}
          applied={coupon}
          busy={couponBusy}
          error={couponSheetOpen ? couponError : null}
          onApplyIssue={(issueId) => applyCoupon({ issueId })}
          onApplyCode={(code) => applyCoupon({ code })}
          onRemove={() => {
            if (coupon) releaseCoupon(coupon.code);
            setCouponError(null);
          }}
          downloadable={
            downloadableCoupons.length ? (
              <CouponDownloadList
                coupons={downloadableCoupons}
                loggedIn
                onDownloaded={() => {
                  void refreshApplicableCoupons({ data: { checkoutId: checkout.checkoutId } }).then(
                    setApplicableCoupons,
                  );
                }}
              />
            ) : null
          }
        />
      ) : null}
      {addresses.length ? (
        <AddressBookSheet
          open={addressBookOpen}
          onClose={() => setAddressBookOpen(false)}
          addresses={addresses}
          selectedId={addressMode === "saved" ? (selectedAddress?.addressId ?? null) : null}
          onSelect={fillAddress}
          onNew={startNewAddress}
        />
      ) : null}
    </>
  );
}

const FORM_ID = "checkout-form";

/** 배송지 칸 — 저장한 배송지 값이 검사에 걸리면 숨긴 칸을 펼친다 */
const ADDRESS_FIELDS = ["receiverName", "phone", "zipCode", "address1", "address2"];

/** 배송비를 몇 번, 왜 부과했는지 알려 주는 안내 문구 */
function deliveryNotes(delivery: CheckoutDelivery): string[] {
  const notes: string[] = [];
  if (delivery.bundleCount >= 2) {
    notes.push(m.checkout_note_bundles({ count: delivery.bundleCount }));
  }
  if (delivery.freeByThreshold) notes.push(m.checkout_note_free_by_threshold());
  if (delivery.zipCode === null) notes.push(m.checkout_note_zip_code_required());
  return notes;
}
