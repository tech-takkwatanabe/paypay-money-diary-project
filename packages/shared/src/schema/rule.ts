import { z } from "@hono/zod-openapi";

// レスポンスDTO
export const RuleResponseSchema = z
  .object({
    id: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    userId: z.string().uuid().nullable().openapi({ example: "550e8400-e29b-41d4-a716-446655440001" }),
    keyword: z.string().openapi({ example: "コンビニ" }),
    categoryId: z.string().uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440002" }),
    categoryName: z.string().nullable().openapi({ example: "食費" }),
    priority: z.number().openapi({ example: 10 }),
    isSystem: z.boolean().openapi({ example: false }),
    createdAt: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2024-01-01T00:00:00Z" }),
  })
  .openapi("RuleResponse");

// リクエストDTO（作成）
export const CreateRuleInputSchema = z
  .object({
    keyword: z.string().min(1, { message: "キーワードは必須です。" }).openapi({ example: "コンビニ" }),
    categoryId: z
      .string()
      .uuid({ message: "有効なカテゴリIDを指定してください。" })
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440002" }),
    priority: z.number().int().min(0).optional().openapi({ example: 10 }),
  })
  .openapi("CreateRuleInput");

// リクエストDTO（更新）
export const UpdateRuleInputSchema = z
  .object({
    keyword: z.string().min(1, { message: "キーワードは必須です。" }).optional().openapi({ example: "スーパー" }),
    categoryId: z
      .string()
      .uuid({ message: "有効なカテゴリIDを指定してください。" })
      .optional()
      .openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
    priority: z.number().int().min(0).optional().openapi({ example: 20 }),
  })
  .openapi("UpdateRuleInput");

// 型エクスポート
export type RuleResponse = z.infer<typeof RuleResponseSchema>;
export type CreateRuleInput = z.infer<typeof CreateRuleInputSchema>;
export type UpdateRuleInput = z.infer<typeof UpdateRuleInputSchema>;
