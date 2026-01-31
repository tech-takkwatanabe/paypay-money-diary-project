import { z } from "@hono/zod-openapi";

// レスポンスDTO
export const TransactionResponseSchema = z
  .object({
    id: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440005" }),
    userId: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    date: z.iso.datetime().openapi({ example: "2024-01-01T10:00:00Z" }),
    description: z.string().openapi({ example: "セブン-イレブン" }),
    amount: z.number().openapi({ example: 540 }),
    categoryId: z.uuid().nullable().openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
    categoryName: z.string().openapi({ example: "食費" }),
    categoryColor: z.string().openapi({ example: "#FF6B6B" }),
    displayOrder: z.number().openapi({ example: 1 }),
    paymentMethod: z.string().nullable().optional().openapi({ example: "PayPay" }),
    createdAt: z.iso.datetime().openapi({ example: "2024-01-01T10:00:00Z" }),
    updatedAt: z.iso.datetime().openapi({ example: "2024-01-01T10:00:00Z" }),
  })
  .openapi("TransactionResponse");

// リクエストDTO（更新）
export const UpdateTransactionInputSchema = z
  .object({
    categoryId: z
      .uuid({ message: "有効なカテゴリIDを指定してください。" })
      .optional()
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440004" }),
    amount: z.number().int({ message: "金額は整数で指定してください。" }).optional().openapi({ example: 1200 }),
    description: z
      .string()
      .min(1, { message: "店名・内容を入力してください。" })
      .optional()
      .openapi({ example: "更新後の店名" }),
    date: z.iso
      .datetime({ message: "有効な日付を指定してください。" })
      .optional()
      .openapi({ example: "2024-01-02T00:00:00Z" }),
  })
  .openapi("UpdateTransactionInput");

// リクエストDTO（作成）
export const CreateTransactionInputSchema = z
  .object({
    date: z.iso.datetime({ message: "有効な日付を指定してください。" }).openapi({ example: "2024-01-01T00:00:00Z" }),
    amount: z.number().int({ message: "金額は整数で指定してください。" }).openapi({ example: 1000 }),
    description: z.string().min(1, { message: "店名・内容を入力してください。" }).openapi({ example: "手動入力支出" }),
    categoryId: z
      .uuid({ message: "有効なカテゴリIDを指定してください。" })
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
  })
  .openapi("CreateTransactionInput");

// トランザクション一覧のクエリパラメータ
export const TransactionListQuerySchema = z
  .object({
    year: z.string().optional().openapi({ example: "2024" }),
    month: z.string().optional().openapi({ example: "1" }),
    categoryId: z.uuid().optional().openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
    search: z.string().optional().openapi({ example: "セブン" }),
    page: z.string().optional().openapi({ example: "1" }),
    limit: z.string().optional().openapi({ example: "50" }),
    sortBy: z.enum(["date", "amount"]).optional().openapi({ example: "date" }),
    sortOrder: z.enum(["asc", "desc"]).optional().openapi({ example: "desc" }),
  })
  .openapi("TransactionListQuery");

// トランザクション集計レスポンス
export const TransactionSummarySchema = z
  .object({
    summary: z.object({
      totalAmount: z.number().openapi({ example: 150000 }),
      transactionCount: z.number().openapi({ example: 45 }),
    }),
    categoryBreakdown: z.array(
      z.object({
        categoryId: z.uuid().nullable().openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
        categoryName: z.string().openapi({ example: "食費" }),
        categoryColor: z.string().openapi({ example: "#FF6B6B" }),
        displayOrder: z.number().openapi({ example: 1 }),
        totalAmount: z.number().openapi({ example: 45000 }),
        transactionCount: z.number().openapi({ example: 20 }),
      })
    ),
    monthlyBreakdown: z
      .array(
        z.object({
          month: z.number().openapi({ example: 1 }),
          totalAmount: z.number().openapi({ example: 150000 }),
          categories: z.array(
            z.object({
              categoryId: z.uuid().nullable().openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
              categoryName: z.string().openapi({ example: "食費" }),
              categoryColor: z.string().openapi({ example: "#FF6B6B" }),
              displayOrder: z.number().openapi({ example: 1 }),
              amount: z.number().openapi({ example: 45000 }),
            })
          ),
        })
      )
      .optional(),
  })
  .openapi("TransactionSummary");

// 利用可能年度レスポンス
export const AvailableYearsResponseSchema = z
  .object({
    years: z.array(z.number()).openapi({ example: [2024, 2023] }),
  })
  .openapi("AvailableYearsResponse");

// CSV アップロードレスポンス
export const UploadCsvResponseSchema = z
  .object({
    message: z.string().openapi({ example: "CSV uploaded successfully" }),
    processedCount: z.number().openapi({ example: 100 }),
    categorizedCount: z.number().openapi({ example: 95 }),
    uncategorizedCount: z.number().openapi({ example: 5 }),
  })
  .openapi("UploadCsvResponse");

// 再カテゴライズリクエスト
export const ReCategorizeInputSchema = z
  .object({
    year: z.number().int().min(2000).max(2100).optional().openapi({ example: 2024 }),
    month: z.number().int().min(1).max(12).optional().openapi({ example: 1 }),
  })
  .openapi("ReCategorizeInput");

// 再カテゴライズレスポンス
export const ReCategorizeResponseSchema = z
  .object({
    message: z.string().openapi({ example: "3件の取引を再分類しました。" }),
    updatedCount: z.number().openapi({ example: 3 }),
  })
  .openapi("ReCategorizeResponse");

// 型エクスポート
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInputSchema>;
export type TransactionListQuery = z.infer<typeof TransactionListQuerySchema>;
export type TransactionSummary = z.infer<typeof TransactionSummarySchema>;
export type AvailableYearsResponse = z.infer<typeof AvailableYearsResponseSchema>;
export type UploadCsvResponse = z.infer<typeof UploadCsvResponseSchema>;
export type ReCategorizeInput = z.infer<typeof ReCategorizeInputSchema>;
export type ReCategorizeResponse = z.infer<typeof ReCategorizeResponseSchema>;
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>;
