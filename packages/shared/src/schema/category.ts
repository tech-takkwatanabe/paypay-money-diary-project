import { z } from "zod";

// レスポンスDTO
export const CategoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  color: z.string(),
  icon: z.string().nullable(),
  displayOrder: z.number(),
  isDefault: z.boolean(),
  isOther: z.boolean(),
  userId: z.string(),
  hasRules: z.boolean(),
  hasTransactions: z.boolean(),
});

// リクエストDTO（作成）
export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1, { message: "カテゴリ名は必須です。" }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "カラーコードは#から始まる6桁の16進数である必要があります。",
  }),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
});

// リクエストDTO（更新）
export const UpdateCategoryInputSchema = z.object({
  name: z.string().min(1, { message: "カテゴリ名は必須です。" }).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "カラーコードは#から始まる6桁の16進数である必要があります。",
    })
    .optional(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
});

// 並び替えリクエストDTO
export const ReorderCategoriesInputSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1, { message: "カテゴリIDリストは必須です。" }),
});

// 型エクスポート
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;
export type ReorderCategoriesInput = z.infer<typeof ReorderCategoriesInputSchema>;
