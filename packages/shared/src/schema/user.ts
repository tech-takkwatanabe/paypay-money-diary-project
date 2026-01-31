import { z } from "@hono/zod-openapi";
import { EmailSchema } from "../vo/email";
import { PasswordSchema } from "../vo/password";

export const UserSchema = z
  .object({
    id: z.string().optional().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    name: z.string().min(1, { message: "名前は必須です。" }).openapi({ example: "田中 太郎" }),
    email: EmailSchema.openapi({ example: "test@example.com" }),
    password: PasswordSchema.openapi({ example: "password123" }), // For creation/updates
  })
  .openapi("User");

export type User = z.infer<typeof UserSchema>;

// Schema for User Registration (Signup)
export const CreateUserSchema = z
  .object({
    name: z.string().min(1, { message: "名前は必須です。" }).openapi({ example: "田中 太郎" }),
    email: z.email({ message: "無効なメールアドレス形式です。" }).openapi({ example: "test@example.com" }), // Raw string for input
    password: z
      .string()
      .min(8, { message: "パスワードは8文字以上である必要があります。" })
      .openapi({ example: "password123" }), // Raw string for input
  })
  .openapi("CreateUserInput");

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Schema for Login
export const LoginSchema = z
  .object({
    email: z.email({ message: "無効なメールアドレス形式です。" }).openapi({ example: "test@example.com" }),
    password: z.string().min(1, { message: "パスワードを入力してください。" }).openapi({ example: "password123" }),
  })
  .openapi("LoginInput");

export type LoginInput = z.infer<typeof LoginSchema>;

// Response type for API (without password)
export const UserResponseSchema = z
  .object({
    id: z.uuid().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    name: z.string().openapi({ example: "田中 太郎" }),
    email: z.email().openapi({ example: "test@example.com" }),
  })
  .openapi("UserResponse");

export type UserResponse = z.infer<typeof UserResponseSchema>;
