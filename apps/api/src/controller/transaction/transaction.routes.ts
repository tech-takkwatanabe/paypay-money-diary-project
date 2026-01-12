import { createRoute, z } from "@hono/zod-openapi";
import {
  TransactionResponseSchema,
  UpdateTransactionInputSchema,
  TransactionListQuerySchema,
  TransactionSummarySchema,
  AvailableYearsResponseSchema,
  UploadCsvResponseSchema,
  ReCategorizeInputSchema,
  ReCategorizeResponseSchema,
} from "@paypay-money-diary/shared";

export type ListTransactionsRoute = typeof listTransactionsRoute;
export const listTransactionsRoute = createRoute({
  method: "get",
  path: "/transactions",
  request: {
    query: TransactionListQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(TransactionResponseSchema),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              totalCount: z.number(),
              totalAmount: z.number(),
              totalPages: z.number(),
            }),
          }),
        },
      },
      description: "トランザクション一覧を取得",
    },
  },
  tags: ["Transactions"],
});

export type GetSummaryRoute = typeof getSummaryRoute;
export const getSummaryRoute = createRoute({
  method: "get",
  path: "/transactions/summary",
  request: {
    query: z.object({
      year: z.string().openapi({ example: "2024" }),
      month: z.string().optional().openapi({ example: "12" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionSummarySchema,
        },
      },
      description: "トランザクション集計を取得",
    },
  },
  tags: ["Transactions"],
});

export type UpdateTransactionRoute = typeof updateTransactionRoute;
export const updateTransactionRoute = createRoute({
  method: "put",
  path: "/transactions/{id}",
  request: {
    params: z.object({
      id: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateTransactionInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: TransactionResponseSchema,
        },
      },
      description: "トランザクションを更新",
    },
    404: {
      description: "トランザクションが見つかりません",
    },
    403: {
      description: "権限がありません",
    },
  },
  tags: ["Transactions"],
});

export type ReCategorizeRoute = typeof reCategorizeRoute;
export const reCategorizeRoute = createRoute({
  method: "post",
  path: "/transactions/re-categorize",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ReCategorizeInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ReCategorizeResponseSchema,
        },
      },
      description: "トランザクションを再分類",
    },
  },
  tags: ["Transactions"],
});

export type GetAvailableYearsRoute = typeof getAvailableYearsRoute;
export const getAvailableYearsRoute = createRoute({
  method: "get",
  path: "/transactions/available-years",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: AvailableYearsResponseSchema,
        },
      },
      description: "利用可能な年度を取得",
    },
  },
  tags: ["Transactions"],
});

export type UploadCsvRoute = typeof uploadCsvRoute;
export const uploadCsvRoute = createRoute({
  method: "post",
  path: "/transactions/upload",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            file: z.any().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: UploadCsvResponseSchema,
        },
      },
      description: "CSVをアップロード",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "バリデーションエラーまたはアップロード失敗",
    },
  },
  tags: ["Transactions"],
});

// 登録用関数
import { OpenAPIHono } from "@hono/zod-openapi";
import { TransactionController } from "./transactionController";
import { TransactionRepository } from "@/infrastructure/repository/transactionRepository";
import { CsvUploadRepository } from "@/infrastructure/repository/csvUploadRepository";
import { RuleRepository } from "@/infrastructure/repository/ruleRepository";
import { CategoryRepository } from "@/infrastructure/repository/categoryRepository";
import { Env } from "@/types/hono";

export const registerTransactionRoutes = (app: OpenAPIHono<Env>) => {
  const transactionRepository = new TransactionRepository();
  const csvUploadRepository = new CsvUploadRepository();
  const ruleRepository = new RuleRepository();
  const categoryRepository = new CategoryRepository();
  const controller = new TransactionController(
    transactionRepository,
    csvUploadRepository,
    ruleRepository,
    categoryRepository
  );

  app.openapi(listTransactionsRoute, controller.list);
  app.openapi(getSummaryRoute, controller.getSummary);
  app.openapi(updateTransactionRoute, controller.update);
  app.openapi(reCategorizeRoute, controller.reCategorize);
  app.openapi(getAvailableYearsRoute, controller.getAvailableYears);
  app.openapi(uploadCsvRoute, controller.uploadCsv);
};
