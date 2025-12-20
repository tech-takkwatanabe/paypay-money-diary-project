/**
 * カテゴリ API ルート定義 (OpenAPI 対応)
 */

import { createRoute, z } from "@hono/zod-openapi";

// ===== 共通スキーマ =====

const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ description: "エラーメッセージ" }),
  })
  .openapi("CategoryErrorResponse");

const CategorySchema = z
  .object({
    id: z.string().openapi({ description: "カテゴリID" }),
    name: z.string().openapi({ description: "カテゴリ名" }),
    color: z.string().openapi({ description: "色コード" }),
    icon: z.string().nullable().openapi({ description: "アイコン" }),
    displayOrder: z.number().openapi({ description: "表示順" }),
    isDefault: z.boolean().openapi({ description: "デフォルトカテゴリか" }),
  })
  .openapi("Category");

const CategoryWithSystemSchema = CategorySchema.extend({
  isSystem: z.boolean().openapi({ description: "システムカテゴリか" }),
}).openapi("CategoryWithSystem");

// ===== カテゴリ一覧 =====

const CategoryListResponseSchema = z
  .object({
    data: z.array(CategoryWithSystemSchema).openapi({ description: "カテゴリ一覧" }),
  })
  .openapi("CategoryListResponse");

export const getCategoriesRoute = createRoute({
  method: "get",
  path: "/categories",
  tags: ["Category"],
  summary: "カテゴリ一覧取得",
  description: "ユーザーが利用可能なカテゴリ一覧を取得します",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: "取得成功",
      content: {
        "application/json": { schema: CategoryListResponseSchema },
      },
    },
    401: {
      description: "認証エラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    500: {
      description: "サーバーエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

// ===== カテゴリ作成 =====

const CreateCategoryRequestSchema = z
  .object({
    name: z.string().min(1).max(50).openapi({ description: "カテゴリ名" }),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .openapi({ description: "色コード (#RRGGBB)" }),
    icon: z.string().max(50).optional().openapi({ description: "アイコン" }),
    displayOrder: z.number().int().min(0).optional().openapi({ description: "表示順" }),
  })
  .openapi("CreateCategoryRequest");

export const createCategoryRoute = createRoute({
  method: "post",
  path: "/categories",
  tags: ["Category"],
  summary: "カテゴリ作成",
  description: "新しいカテゴリを作成します",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateCategoryRequestSchema },
      },
    },
  },
  responses: {
    201: {
      description: "作成成功",
      content: {
        "application/json": { schema: CategorySchema },
      },
    },
    400: {
      description: "バリデーションエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: "認証エラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    409: {
      description: "カテゴリ名重複",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    500: {
      description: "サーバーエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

// ===== カテゴリ更新 =====

const UpdateCategoryRequestSchema = z
  .object({
    name: z.string().min(1).max(50).optional().openapi({ description: "カテゴリ名" }),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .openapi({ description: "色コード" }),
    icon: z.string().max(50).nullable().optional().openapi({ description: "アイコン" }),
    displayOrder: z.number().int().min(0).optional().openapi({ description: "表示順" }),
  })
  .openapi("UpdateCategoryRequest");

export const updateCategoryRoute = createRoute({
  method: "put",
  path: "/categories/{id}",
  tags: ["Category"],
  summary: "カテゴリ更新",
  description: "カテゴリを更新します（システムカテゴリは更新不可）",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "カテゴリID" }),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateCategoryRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "更新成功",
      content: {
        "application/json": { schema: CategorySchema },
      },
    },
    400: {
      description: "バリデーションエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    401: {
      description: "認証エラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    403: {
      description: "権限エラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    404: {
      description: "カテゴリが見つからない",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    409: {
      description: "カテゴリ名重複",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    500: {
      description: "サーバーエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

// ===== カテゴリ削除 =====

const DeleteCategoryResponseSchema = z
  .object({
    message: z.string().openapi({ description: "メッセージ" }),
  })
  .openapi("DeleteCategoryResponse");

export const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/categories/{id}",
  tags: ["Category"],
  summary: "カテゴリ削除",
  description: "カテゴリを削除します（システムカテゴリは削除不可）",
  security: [{ Bearer: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "カテゴリID" }),
    }),
  },
  responses: {
    200: {
      description: "削除成功",
      content: {
        "application/json": { schema: DeleteCategoryResponseSchema },
      },
    },
    401: {
      description: "認証エラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    403: {
      description: "権限エラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    404: {
      description: "カテゴリが見つからない",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
    500: {
      description: "サーバーエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
});

// 型エクスポート
export type GetCategoriesRoute = typeof getCategoriesRoute;
export type CreateCategoryRoute = typeof createCategoryRoute;
export type UpdateCategoryRoute = typeof updateCategoryRoute;
export type DeleteCategoryRoute = typeof deleteCategoryRoute;
