/**
 * カテゴリルール API ルート定義 (OpenAPI 対応)
 */

import { createRoute, z } from "@hono/zod-openapi";

// ===== 共通スキーマ =====

const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({ description: "エラーメッセージ" }),
  })
  .openapi("RuleErrorResponse");

const RuleSchema = z
  .object({
    id: z.string().openapi({ description: "ルールID" }),
    keyword: z.string().openapi({ description: "キーワード" }),
    categoryId: z.string().openapi({ description: "カテゴリID" }),
    categoryName: z.string().openapi({ description: "カテゴリ名" }),
    priority: z.number().openapi({ description: "優先度" }),
    isSystem: z.boolean().openapi({ description: "システムルールか" }),
  })
  .openapi("Rule");

// ===== ルール一覧 =====

const RuleListResponseSchema = z
  .object({
    data: z.array(RuleSchema).openapi({ description: "ルール一覧" }),
  })
  .openapi("RuleListResponse");

export const getRulesRoute = createRoute({
  method: "get",
  path: "/rules",
  tags: ["Rule"],
  summary: "ルール一覧取得",
  description: "ユーザーのカテゴリルール一覧を取得します",
  security: [{ Cookie: [] }],
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

// ===== ルール作成 =====

const CreateRuleRequestSchema = z
  .object({
    keyword: z.string().min(1).max(100).openapi({ description: "キーワード" }),
    categoryId: z.string().openapi({ description: "カテゴリID" }),
    priority: z
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ description: "優先度" }),
  })
  .openapi("CreateRuleRequest");

export const createRuleRoute = createRoute({
  method: "post",
  path: "/rules",
  tags: ["Rule"],
  summary: "ルール作成",
  description: "新しいカテゴリルールを作成します",
  security: [{ Cookie: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateRuleRequestSchema },
      },
    },
  },
  responses: {
    201: {
      description: "作成成功",
      content: {
        "application/json": { schema: RuleSchema },
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

// ===== ルール更新 =====

const UpdateRuleRequestSchema = z
  .object({
    keyword: z
      .string()
      .min(1)
      .max(100)
      .optional()
      .openapi({ description: "キーワード" }),
    categoryId: z.string().optional().openapi({ description: "カテゴリID" }),
    priority: z
      .number()
      .int()
      .min(0)
      .optional()
      .openapi({ description: "優先度" }),
  })
  .openapi("UpdateRuleRequest");

export const updateRuleRoute = createRoute({
  method: "put",
  path: "/rules/{id}",
  tags: ["Rule"],
  summary: "ルール更新",
  description: "カテゴリルールを更新します（システムルールは更新不可）",
  security: [{ Cookie: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ルールID" }),
    }),
    body: {
      content: {
        "application/json": { schema: UpdateRuleRequestSchema },
      },
    },
  },
  responses: {
    200: {
      description: "更新成功",
      content: {
        "application/json": { schema: RuleSchema },
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

// ===== ルール削除 =====

const DeleteRuleResponseSchema = z
  .object({
    message: z.string().openapi({ description: "メッセージ" }),
  })
  .openapi("DeleteRuleResponse");

export const deleteRuleRoute = createRoute({
  method: "delete",
  path: "/rules/{id}",
  tags: ["Rule"],
  summary: "ルール削除",
  description: "カテゴリルールを削除します（システムルールは削除不可）",
  security: [{ Cookie: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ description: "ルールID" }),
    }),
  },
  responses: {
    200: {
      description: "削除成功",
      content: {
        "application/json": { schema: DeleteRuleResponseSchema },
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

// 型エクスポート
export type GetRulesRoute = typeof getRulesRoute;
export type CreateRuleRoute = typeof createRuleRoute;
export type UpdateRuleRoute = typeof updateRuleRoute;
export type DeleteRuleRoute = typeof deleteRuleRoute;
