import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  CategoryResponseSchema,
  CreateCategoryInputSchema,
  UpdateCategoryInputSchema,
  ReorderCategoriesInputSchema,
  SuccessMessageSchema,
  ErrorResponseSchema,
} from "@paypay-money-diary/shared";
import { CategoryController } from "./categoryController";
import { Env } from "@/types/hono";

// レスポンススキーマの定義
const CategoryListResponseSchema = z.object({
  data: z.array(CategoryResponseSchema),
});

/**
 * ルート定義
 */

export const getCategoriesRoute = createRoute({
  method: "get",
  path: "/categories",
  summary: "カテゴリ一覧取得",
  tags: ["Categories"],
  responses: {
    200: {
      description: "取得成功",
      content: {
        "application/json": { schema: CategoryListResponseSchema },
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
    500: {
      description: "サーバーエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
  security: [{ Cookie: [] }],
});

export const createCategoryRoute = createRoute({
  method: "post",
  path: "/categories",
  summary: "カテゴリ作成",
  tags: ["Categories"],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateCategoryInputSchema },
      },
    },
  },
  responses: {
    201: {
      description: "作成成功",
      content: {
        "application/json": { schema: CategoryResponseSchema },
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
  security: [{ Cookie: [] }],
});

export const updateCategoryRoute = createRoute({
  method: "put",
  path: "/categories/{id}",
  summary: "カテゴリ更新",
  tags: ["Categories"],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateCategoryInputSchema },
      },
    },
  },
  responses: {
    200: {
      description: "更新成功",
      content: {
        "application/json": { schema: CategoryResponseSchema },
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
  security: [{ Cookie: [] }],
});

export const reorderCategoriesRoute = createRoute({
  method: "patch",
  path: "/categories/reorder",
  summary: "カテゴリ並び替え",
  tags: ["Categories"],
  request: {
    body: {
      content: {
        "application/json": { schema: ReorderCategoriesInputSchema },
      },
    },
  },
  responses: {
    200: {
      description: "並び替え成功",
      content: {
        "application/json": { schema: SuccessMessageSchema },
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
    500: {
      description: "サーバーエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
  security: [{ Cookie: [] }],
});

export type ReorderCategoriesRoute = typeof reorderCategoriesRoute;

export const deleteCategoryRoute = createRoute({
  method: "delete",
  path: "/categories/{id}",
  summary: "カテゴリ削除",
  tags: ["Categories"],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "123" }),
    }),
  },
  responses: {
    200: {
      description: "削除成功",
      content: {
        "application/json": { schema: SuccessMessageSchema },
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
    500: {
      description: "サーバーエラー",
      content: {
        "application/json": { schema: ErrorResponseSchema },
      },
    },
  },
  security: [{ Cookie: [] }],
});

export type GetCategoriesRoute = typeof getCategoriesRoute;
export type CreateCategoryRoute = typeof createCategoryRoute;
export type UpdateCategoryRoute = typeof updateCategoryRoute;
export type DeleteCategoryRoute = typeof deleteCategoryRoute;

/**
 * カテゴリ関連のルートを登録
 */
export const registerCategoryRoutes = (app: OpenAPIHono<Env>) => {
  const controller = new CategoryController();

  // カテゴリ一覧取得
  app.openapi(getCategoriesRoute, (c) => controller.list(c));

  // カテゴリ作成
  app.openapi(createCategoryRoute, (c) => controller.create(c));

  // カテゴリ更新
  app.openapi(updateCategoryRoute, (c) => controller.update(c));

  // カテゴリ並び替え
  app.openapi(reorderCategoriesRoute, (c) => controller.reorder(c));

  // カテゴリ削除
  app.openapi(deleteCategoryRoute, (c) => controller.delete(c));
};
