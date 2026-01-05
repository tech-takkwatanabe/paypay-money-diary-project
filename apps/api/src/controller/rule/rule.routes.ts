import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  RuleResponseSchema,
  CreateRuleInputSchema,
  UpdateRuleInputSchema,
  SuccessMessageSchema,
  ErrorResponseSchema,
} from "@paypay-money-diary/shared";
import { RuleController } from "./ruleController";
import { Env } from "@/types/hono";

// レスポンススキーマの定義
const RuleListResponseSchema = z.object({
  data: z.array(RuleResponseSchema),
});

/**
 * ルート定義
 */

export const getRulesRoute = createRoute({
  method: "get",
  path: "/rules",
  summary: "ルール一覧取得",
  tags: ["Rules"],
  responses: {
    200: {
      description: "取得成功",
      content: {
        "application/json": { schema: RuleListResponseSchema },
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

export const createRuleRoute = createRoute({
  method: "post",
  path: "/rules",
  summary: "ルール作成",
  tags: ["Rules"],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateRuleInputSchema },
      },
    },
  },
  responses: {
    201: {
      description: "作成成功",
      content: {
        "application/json": { schema: RuleResponseSchema },
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
});

export const updateRuleRoute = createRoute({
  method: "put",
  path: "/rules/{id}",
  summary: "ルール更新",
  tags: ["Rules"],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateRuleInputSchema },
      },
    },
  },
  responses: {
    200: {
      description: "更新成功",
      content: {
        "application/json": { schema: RuleResponseSchema },
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
      description: "ルールが見つからない",
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

export const deleteRuleRoute = createRoute({
  method: "delete",
  path: "/rules/{id}",
  summary: "ルール削除",
  tags: ["Rules"],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    }),
  },
  responses: {
    200: {
      description: "削除成功",
      content: {
        "application/json": { schema: SuccessMessageSchema },
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
      description: "ルールが見つからない",
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

export type GetRulesRoute = typeof getRulesRoute;
export type CreateRuleRoute = typeof createRuleRoute;
export type UpdateRuleRoute = typeof updateRuleRoute;
export type DeleteRuleRoute = typeof deleteRuleRoute;

/**
 * ルール関連のルートを登録
 */
export const registerRuleRoutes = <E extends Env>(app: OpenAPIHono<E>) => {
  const controller = new RuleController();

  // ルール一覧取得
  app.openapi(getRulesRoute, (c) => controller.list(c));

  // ルール作成
  app.openapi(createRuleRoute, (c) => controller.create(c));

  // ルール更新
  app.openapi(updateRuleRoute, (c) => controller.update(c));

  // ルール削除
  app.openapi(deleteRuleRoute, (c) => controller.delete(c));
};
