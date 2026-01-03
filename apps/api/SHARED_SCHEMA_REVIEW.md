# packages/shared スキーマ共通化レビューレポート

## 調査日
2026年（調査実施日）

## 概要
`packages/shared` に定義されているZodスキーマとValueObjectが、フロントエンド（apps/web）とバックエンド（apps/api）で適切に活用されていない問題を調査しました。共通化の試みは行われていますが、いくつかの技術的な障壁と設計上の問題により、完全には活用できていない状況です。

## 現在の構造

### packages/shared の構成

```
packages/shared/src/
├── index.ts                    # エクスポート
├── schema/
│   └── user.ts                # UserSchema, CreateUserSchema, LoginSchema, UserResponseSchema
└── vo/
    ├── email.ts               # Email ValueObject + EmailSchema
    └── password.ts            # Password ValueObject + PasswordSchema
```

### 定義されているスキーマ

#### packages/shared/src/schema/user.ts
- `UserSchema`: ドメインモデル（Email, Passwordを含む）
- `CreateUserSchema`: ユーザー登録用（生の文字列）
- `LoginSchema`: ログイン用（生の文字列）
- `UserResponseSchema`: APIレスポンス用（パスワードなし）

#### packages/shared/src/vo/email.ts
- `Email` クラス: ValueObject
- `EmailSchema`: Zodスキーマ（Email ValueObjectに変換）

#### packages/shared/src/vo/password.ts
- `Password` クラス: ValueObject
- `PasswordSchema`: Zodスキーマ（Password ValueObjectに変換）

## 発見された問題点

### 1. packages/shared に zod が依存関係として含まれていない（重大）

#### 問題の詳細
`packages/shared/package.json` を確認したところ、`zod` が依存関係として含まれていません。しかし、実際には以下のファイルで `zod` をインポートしています：

- `packages/shared/src/schema/user.ts`
- `packages/shared/src/vo/email.ts`
- `packages/shared/src/vo/password.ts`

#### 影響
- 型定義のみが共有され、実行時のバリデーションロジックが共有されない可能性がある
- フロントエンドとバックエンドで異なるバージョンのzodが使用される可能性がある
- パッケージとして独立してビルド・配布できない

#### 現在の状況
実際には、monorepoのworkspace依存により、各アプリケーション（apps/api, apps/web）が直接 `packages/shared/src` を参照しているため、実行時には各アプリケーションの `node_modules` にある `zod` が使用されています。これは動作しますが、パッケージの独立性が損なわれています。

### 2. バックエンドでスキーマが再定義されている（重大）

#### 問題の詳細
`apps/api/src/routes/auth.routes.ts` では、`CreateUserSchema` と `LoginSchema` は `@paypay-money-diary/shared` からインポートしていますが、`UserSchema` は再定義されています：

```typescript
// apps/api/src/routes/auth.routes.ts
import { CreateUserSchema, LoginSchema } from "@paypay-money-diary/shared";

// 再定義されている
const UserSchema = z
  .object({
    id: z.uuid().openapi({ description: "ユーザーID" }),
    name: z.string().openapi({ description: "ユーザー名" }),
    email: z.email().openapi({ description: "メールアドレス" }),
  })
  .openapi("User");
```

一方、`packages/shared/src/schema/user.ts` には `UserResponseSchema` が既に定義されています：

```typescript
export const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
});
```

#### 影響
- スキーマの重複定義により、メンテナンスコストが増加
- バックエンドとフロントエンドで異なるスキーマ定義が存在する可能性
- OpenAPI仕様との整合性が保証されない

#### 原因
`@hono/zod-openapi` の `createRoute` では、`.openapi()` メソッドでOpenAPIメタデータを付与する必要があります。`packages/shared` のスキーマには `.openapi()` が付与されていないため、そのまま使用できないという判断がされた可能性があります。

### 3. フロントエンドでZodスキーマを使ったバリデーションが行われていない（重大）

#### 問題の詳細
フロントエンド（`apps/web/src/app/signup/page.tsx`）では、Zodスキーマを使わず、手動でバリデーションを行っています：

```typescript
// apps/web/src/app/signup/page.tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  // 手動バリデーション
  if (password !== confirmPassword) {
    setError("パスワードが一致しません");
    return;
  }

  if (password.length < 8) {
    setError("パスワードは8文字以上で入力してください");
    return;
  }

  // API呼び出し
  const response = await postAuthSignup({ name, email, password });
  // ...
};
```

同様に、`apps/web/src/app/login/page.tsx` でもバリデーションが行われていません（HTML5の `required` 属性のみ）。

#### 影響
- フロントエンドとバックエンドでバリデーションロジックが重複
- バリデーションルールの変更時に、複数箇所を修正する必要がある
- エラーメッセージが統一されていない
- リアルタイムバリデーション（入力中の検証）が実装されていない

### 4. ValueObjectの変換がバックエンドでのみ使用されている（中程度）

#### 問題の詳細
`EmailSchema` と `PasswordSchema` は `.transform()` を使用してValueObjectに変換していますが、この変換は主にバックエンド（usecase層、repository層）で使用されています。

フロントエンドでは、ValueObjectではなく生の文字列として扱われています（これは正しい設計ですが、スキーマの使い分けが不明確）。

#### 影響
- ValueObjectの存在意義が不明確
- フロントエンドとバックエンドで異なるデータ型が使用される
- 型安全性が損なわれる可能性

### 5. OpenAPI生成時のスキーマ拡張の問題（中程度）

#### 問題の詳細
`@hono/zod-openapi` では、OpenAPI仕様を生成するために `.openapi()` メソッドでメタデータを付与する必要があります。しかし、`packages/shared` のスキーマには `.openapi()` が付与されていません。

#### 現在の対応
- `apps/api/src/routes/auth.routes.ts` では、`CreateUserSchema` と `LoginSchema` はそのまま使用（`.openapi()` なしでも動作）
- `UserSchema` は再定義して `.openapi()` を付与

#### 影響
- スキーマの再利用性が低下
- OpenAPI仕様と実際のスキーマ定義が乖離する可能性

### 6. フロントエンドで @paypay-money-diary/shared が使用されていない（重大）

#### 問題の詳細
`apps/web/src` を検索した結果、`@paypay-money-diary/shared` からのインポートが一切見つかりませんでした。

#### 影響
- フロントエンドとバックエンドで型定義が共有されていない
- バリデーションロジックが重複
- 型安全性が損なわれる

### 7. 他のスキーマ（category, rule, transaction）が共通化されていない（中程度）

#### 問題の詳細
現在、共通化されているのは `user` 関連のスキーマのみです。`category`、`rule`、`transaction` のスキーマは `apps/api/src/routes/` で個別に定義されており、フロントエンドでは型定義が生成されたAPIクライアント（orval）に依存しています。

#### 影響
- スキーマの共通化が不完全
- フロントエンドとバックエンドで型定義が異なる可能性

## 技術的な障壁

### 1. @hono/zod-openapi の .openapi() メソッドの要件

`@hono/zod-openapi` では、OpenAPI仕様を生成するために `.openapi()` メソッドでメタデータを付与する必要があります。しかし、`packages/shared` のスキーマに `.openapi()` を付与すると、フロントエンドで使用する際に不要なメタデータが含まれることになります。

### 2. ValueObjectの変換タイミング

`EmailSchema` と `PasswordSchema` は `.transform()` を使用してValueObjectに変換していますが、フロントエンドでは生の文字列として扱う必要があります。このため、フロントエンド用とバックエンド用で異なるスキーマが必要になる可能性があります。

### 3. フロントエンドでのZod使用

フロントエンド（Next.js）でZodを使用する場合、追加の依存関係が必要です。現在、`apps/web/package.json` には `zod` が含まれていません。

## 推奨される修正方針

### 優先度: 高

#### 1. packages/shared に zod を依存関係として追加

```json
// packages/shared/package.json
{
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

これにより、パッケージとしての独立性が保たれ、バージョン管理が明確になります。

#### 2. フロントエンドで @paypay-money-diary/shared を使用

```json
// apps/web/package.json
{
  "dependencies": {
    "@paypay-money-diary/shared": "workspace:*",
    "zod": "^3.23.8"
  }
}
```

#### 3. フロントエンドでZodスキーマを使ったバリデーションを実装

**Before:**
```typescript
// apps/web/src/app/signup/page.tsx
if (password.length < 8) {
  setError("パスワードは8文字以上で入力してください");
  return;
}
```

**After:**
```typescript
// apps/web/src/app/signup/page.tsx
import { CreateUserSchema } from "@paypay-money-diary/shared";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  // Zodスキーマでバリデーション
  const result = CreateUserSchema.safeParse({
    name,
    email,
    password,
  });

  if (!result.success) {
    const firstError = result.error.errors[0];
    setError(firstError.message);
    return;
  }

  // パスワード確認の追加バリデーション
  if (password !== confirmPassword) {
    setError("パスワードが一致しません");
    return;
  }

  // API呼び出し
  const response = await postAuthSignup(result.data);
  // ...
};
```

#### 4. バックエンドで UserResponseSchema を使用

`apps/api/src/routes/auth.routes.ts` で再定義されている `UserSchema` を、`packages/shared` の `UserResponseSchema` に置き換えます。

ただし、`.openapi()` メソッドが必要な場合は、拡張する方法を検討します：

```typescript
// apps/api/src/routes/auth.routes.ts
import { UserResponseSchema } from "@paypay-money-diary/shared";
import { z } from "@hono/zod-openapi";

// .openapi() で拡張
const UserSchema = UserResponseSchema.openapi("User");
```

### 優先度: 中

#### 5. OpenAPIメタデータの分離

OpenAPIメタデータを分離するため、以下のような構造を検討します：

```typescript
// packages/shared/src/schema/user.ts
export const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
});

// apps/api/src/routes/auth.routes.ts
import { UserResponseSchema } from "@paypay-money-diary/shared";
const UserSchema = UserResponseSchema.openapi("User");
```

#### 6. フロントエンド用とバックエンド用のスキーマを分離

ValueObjectへの変換が必要な場合は、バックエンド用のスキーマを別途定義します：

```typescript
// packages/shared/src/schema/user.ts
// フロントエンド用（生の文字列）
export const CreateUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

// バックエンド用（ValueObjectに変換）
export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: EmailSchema, // ValueObjectに変換
  password: PasswordSchema, // ValueObjectに変換
});
```

#### 7. リアルタイムバリデーションの実装

React Hook Form や Formik などのライブラリと組み合わせて、リアルタイムバリデーションを実装します：

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateUserSchema } from "@paypay-money-diary/shared";

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(CreateUserSchema),
});
```

#### 8. 他のスキーマ（category, rule, transaction）の共通化

`packages/shared/src/schema/` に以下のスキーマを追加：

- `category.ts`: CategorySchema, CreateCategorySchema, UpdateCategorySchema
- `rule.ts`: RuleSchema, CreateRuleSchema, UpdateRuleSchema
- `transaction.ts`: TransactionSchema, TransactionListSchema, TransactionSummarySchema

## 修正例

### 例1: フロントエンドでのZodバリデーション実装

```typescript
// apps/web/src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { postAuthSignup } from "@/api/generated/auth/auth";
import { CreateUserSchema } from "@paypay-money-diary/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/components/ui/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // パスワード確認の追加バリデーション
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "パスワードが一致しません" });
      return;
    }

    // Zodスキーマでバリデーション
    const result = CreateUserSchema.safeParse({ name, email, password });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0].toString()] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await postAuthSignup(result.data);

      if (response.status === 201) {
        router.push("/login?registered=true");
      } else if ("data" in response && "error" in response.data) {
        setErrors({ general: response.data.error });
      }
    } catch (_err) {
      setErrors({ general: "登録に失敗しました。もう一度お試しください。" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // ... JSX
    <Input
      id="email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="you@example.com"
      required
    />
    {errors.email && (
      <p className="text-sm text-red-600 dark:text-red-400">{errors.email}</p>
    )}
    // ...
  );
}
```

### 例2: バックエンドでのスキーマ再利用

```typescript
// apps/api/src/routes/auth.routes.ts
import { createRoute, z } from "@hono/zod-openapi";
import { 
  CreateUserSchema, 
  LoginSchema, 
  UserResponseSchema 
} from "@paypay-money-diary/shared";

// UserResponseSchemaを拡張してOpenAPIメタデータを付与
const UserSchema = UserResponseSchema.openapi("User");

const SignupResponseSchema = UserSchema.openapi("SignupResponse");

export const signupRoute = createRoute({
  method: "post",
  path: "/auth/signup",
  // ...
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema, // そのまま使用可能
        },
      },
    },
  },
  responses: {
    201: {
      description: "登録成功",
      content: {
        "application/json": {
          schema: SignupResponseSchema,
        },
      },
    },
    // ...
  },
});
```

## まとめ

現在の実装では、`packages/shared` にZodスキーマとValueObjectが定義されているものの、以下の問題により完全には活用されていません：

1. **packages/shared に zod が依存関係として含まれていない**
2. **バックエンドでスキーマが再定義されている**（UserSchema）
3. **フロントエンドでZodスキーマを使ったバリデーションが行われていない**
4. **フロントエンドで @paypay-money-diary/shared が使用されていない**

**推奨事項**: 
1. `packages/shared` に `zod` を依存関係として追加
2. フロントエンドで `@paypay-money-diary/shared` を使用し、Zodスキーマでバリデーションを実装
3. バックエンドで `UserResponseSchema` を再利用（`.openapi()` で拡張）
4. リアルタイムバリデーションの実装を検討（React Hook Form等）

これらの修正により、フロントエンドとバックエンドで型定義とバリデーションロジックが完全に共有され、保守性と型安全性が大幅に向上します。

