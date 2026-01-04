import { z } from "zod";

// レスポンスDTO
export const TransactionResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string().datetime(),
  description: z.string(),
  amount: z.number(),
  categoryId: z.string().uuid(),
  categoryName: z.string(),
  categoryColor: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// リクエストDTO（更新）
export const UpdateTransactionInputSchema = z.object({
  categoryId: z.string().uuid({ message: "有効なカテゴリIDを指定してください。" }),
});

// トランザクション一覧のクエリパラメータ
export const TransactionListQuerySchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

// トランザクション集計レスポンス
export const TransactionSummarySchema = z.object({
  year: z.number(),
  month: z.number().optional(),
  totalAmount: z.number(),
  categoryBreakdown: z.array(
    z.object({
      categoryId: z.string().uuid(),
      categoryName: z.string(),
      categoryColor: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })
  ),
});

// 利用可能年度レスポンス
export const AvailableYearsResponseSchema = z.object({
  years: z.array(z.number()),
});

// CSV アップロードレスポンス
export const UploadCsvResponseSchema = z.object({
  message: z.string(),
  processedCount: z.number(),
  categorizedCount: z.number(),
  uncategorizedCount: z.number(),
});

// 再カテゴライズリクエスト
export const ReCategorizeInputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12).optional(),
});

// 再カテゴライズレスポンス
export const ReCategorizeResponseSchema = z.object({
  message: z.string(),
  updatedCount: z.number(),
});

// 型エクスポート
export type TransactionResponse = z.infer<typeof TransactionResponseSchema>;
export type UpdateTransactionInput = z.infer<typeof UpdateTransactionInputSchema>;
export type TransactionListQuery = z.infer<typeof TransactionListQuerySchema>;
export type TransactionSummary = z.infer<typeof TransactionSummarySchema>;
export type AvailableYearsResponse = z.infer<typeof AvailableYearsResponseSchema>;
export type UploadCsvResponse = z.infer<typeof UploadCsvResponseSchema>;
export type ReCategorizeInput = z.infer<typeof ReCategorizeInputSchema>;
export type ReCategorizeResponse = z.infer<typeof ReCategorizeResponseSchema>;
