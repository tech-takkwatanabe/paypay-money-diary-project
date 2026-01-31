import { z } from "@hono/zod-openapi";

// レスポンスDTO
export const CategoryResponseSchema = z
  .object({
    id: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440003" }),
    name: z.string().openapi({ example: "食費" }),
    color: z.string().openapi({ example: "#FF6B6B" }),
    icon: z.string().nullable().openapi({ example: "utensils" }),
    displayOrder: z.number().openapi({ example: 1 }),
    isDefault: z.boolean().openapi({ example: true }),
    isOther: z.boolean().openapi({ example: false }),
    userId: z.string().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    hasRules: z.boolean().openapi({ example: true }),
    hasTransactions: z.boolean().openapi({ example: true }),
  })
  .openapi("CategoryResponse");

// リクエストDTO（作成）
export const CreateCategoryInputSchema = z
  .object({
    name: z.string().min(1, { message: "カテゴリ名は必須です。" }).openapi({ example: "新しいカテゴリ" }),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, {
        message: "カラーコードは#から始まる6桁の16進数である必要があります。",
      })
      .openapi({ example: "#4ECDC4" }),
    icon: z.string().nullable().optional().openapi({ example: "tag" }),
    displayOrder: z.number().optional().openapi({ example: 10 }),
  })
  .openapi("CreateCategoryInput");

// 内部用スキーマ（サーバー側のみ使用）
// これはOpenAPIドキュメントには直接公開されないため通常のzod/openapi混在で維持
export const InternalCreateCategoryInputSchema = CreateCategoryInputSchema.extend({
  isDefault: z.boolean().default(false),
  isOther: z.boolean().default(false),
});

// リクエストDTO（更新）
export const UpdateCategoryInputSchema = z
  .object({
    name: z.string().min(1, { message: "カテゴリ名は必須です。" }).optional().openapi({ example: "更新後の名前" }),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, {
        message: "カラーコードは#から始まる6桁の16進数である必要があります。",
      })
      .optional()
      .openapi({ example: "#FF6B6B" }),
    icon: z.string().nullable().optional().openapi({ example: "shopping-cart" }),
    displayOrder: z.number().optional().openapi({ example: 5 }),
  })
  .openapi("UpdateCategoryInput");

// 並び替えリクエストDTO
export const ReorderCategoriesInputSchema = z
  .object({
    categoryIds: z
      .array(z.uuid())
      .min(1, { message: "カテゴリIDリストは必須です。" })
      .openapi({ example: ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"] }),
  })
  .openapi("ReorderCategoriesInput");

// 型エクスポート
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
export type InternalCreateCategoryInput = z.infer<typeof InternalCreateCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;
export type ReorderCategoriesInput = z.infer<typeof ReorderCategoriesInputSchema>;
