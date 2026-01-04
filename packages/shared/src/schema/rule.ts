import { z } from "zod";

// レスポンスDTO
export const RuleResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  keyword: z.string(),
  categoryId: z.string().uuid(),
  priority: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// リクエストDTO（作成）
export const CreateRuleInputSchema = z.object({
  keyword: z.string().min(1, { message: "キーワードは必須です。" }),
  categoryId: z.string().uuid({ message: "有効なカテゴリIDを指定してください。" }),
  priority: z.number().int().min(0).optional(),
});

// リクエストDTO（更新）
export const UpdateRuleInputSchema = z.object({
  keyword: z.string().min(1, { message: "キーワードは必須です。" }).optional(),
  categoryId: z.string().uuid({ message: "有効なカテゴリIDを指定してください。" }).optional(),
  priority: z.number().int().min(0).optional(),
});

// 型エクスポート
export type RuleResponse = z.infer<typeof RuleResponseSchema>;
export type CreateRuleInput = z.infer<typeof CreateRuleInputSchema>;
export type UpdateRuleInput = z.infer<typeof UpdateRuleInputSchema>;
