import { z } from "zod";
import { EmailSchema } from "../vo/email";
import { PasswordSchema } from "../vo/password";

export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: "名前は必須です。" }),
  email: EmailSchema,
  password: PasswordSchema, // For creation/updates
});

export type User = z.infer<typeof UserSchema>;

// Schema for User Registration (Signup)
export const CreateUserSchema = z.object({
  name: z.string().min(1, { message: "名前は必須です。" }),
  email: z.email({ message: "無効なメールアドレス形式です。" }), // Raw string for input
  password: z.string().min(8, { message: "パスワードは8文字以上である必要があります。" }), // Raw string for input
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Schema for Login
export const LoginSchema = z.object({
  email: z.email({ message: "無効なメールアドレス形式です。" }),
  password: z.string().min(1, { message: "パスワードを入力してください。" }),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Response type for API (without password)
export const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
