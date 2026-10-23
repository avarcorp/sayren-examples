import {
  ApiError,
  type CollectionProductPage,
  type StorefrontCollection,
  type StorefrontCollectionDetail,
} from "@sayren/storefront-sdk";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { apiFor } from "./api.server";

/** 진행 중인 기획전 목록 */
export const getCollectionsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StorefrontCollection[]> =>
    (await apiFor().catalog.listCollections({ size: 50 })).contents,
);

/** 기획전 하나와 그 상품 — 없는 기획전은 404 화면 */
export const getCollectionFn = createServerFn({ method: "GET" })
  .validator(
    z.object({
      slug: z.string().min(1).max(100),
      sort: z
        .enum([
          "manual",
          "recommend",
          "latest",
          "priceAsc",
          "priceDesc",
          "reviewCount",
          "ratingDesc",
        ])
        .optional(),
      page: z.number().int().min(1).optional(),
    }),
  )
  .handler(
    async ({
      data,
    }): Promise<{ collection: StorefrontCollectionDetail; products: CollectionProductPage }> => {
      const api = apiFor();
      try {
        const [collection, products] = await Promise.all([
          api.catalog.getCollection(data.slug),
          api.catalog.listCollectionProducts(data.slug, {
            sort: data.sort,
            page: data.page,
            size: 24,
          }),
        ]);
        return { collection, products };
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) throw notFound();
        throw error;
      }
    },
  );
