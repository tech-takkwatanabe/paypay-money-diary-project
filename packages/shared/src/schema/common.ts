import { z } from "@hono/zod-openapi";

/**
 * エラーレスポンスのスキーマ
 */
export const ErrorResponseSchema = z.object({
  error: z.string().openapi({ example: "Internal Server Error" }),
});

/**
 * 成功メッセージのスキーマ
 */
export const SuccessMessageSchema = z.object({
  message: z.string().openapi({ example: "Operation successful" }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessMessage = z.infer<typeof SuccessMessageSchema>;
