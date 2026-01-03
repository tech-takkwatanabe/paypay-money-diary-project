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

### 4. ValueObject、Entity、DTOの区別が不明確（重大）

#### 問題の詳細
現在、`packages/shared` には以下のものが定義されています：
- **ValueObject**: `Email`, `Password` - 不変の値オブジェクト
- **スキーマ型**: `User`, `UserResponse` - Zodスキーマから生成された型

しかし、以下の区別が不明確です：
- **Entity**: ドメイン層で定義されるべき識別子を持つオブジェクト。現在、`apps/api/src/domain/` にEntityが定義されていない
- **DTO**: API層で使用されるデータ転送オブジェクト。`UserResponse` はDTOとして使用できるが、Entityとの関係が不明確

現在の問題：
- `packages/shared` の `UserSchema` はValueObject（Email, Password）を含んでいるが、これはEntityなのかDTOなのか不明確
- Domain層の `IUserRepository` が `User` 型を返しているが、これはEntityとして適切ではない
- Usecase層が直接DTO（`UserResponse`）を返しているが、本来はEntityを返すべき

#### 影響
- ValueObjectの存在意義が不明確
- EntityとDTOの責務が混在している
- ドメイン層が外部パッケージ（packages/shared）に依存している
- ドメインロジックがDTOに漏れる可能性がある

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

### 2. ValueObject、Entity、DTOの関係

**ValueObject**（`packages/shared`）:
- `Email`, `Password` - 不変の値オブジェクト
- ドメイン層のEntityで使用される

**Entity**（`apps/api/src/domain/entity/`）:
- 識別子を持ち、ビジネスロジックを含む
- ValueObjectを使用する
- Domain層、Usecase層で使用される

**DTO**（`packages/shared` または `apps/api/src/interface/dto/`）:
- API層で使用されるデータ転送オブジェクト
- Entityから変換される
- フロントエンドとバックエンドで共有される

現在の問題：
- Entityが定義されていない
- `packages/shared` の `UserSchema` がEntityなのかDTOなのか不明確
- Usecase層がEntityではなくDTOを返している

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

#### 4. Domain層にEntityを定義し、DTOとの区別を明確化

**Entityの定義**:
```typescript
// apps/api/src/domain/entity/user.ts
import { Email, Password } from "@paypay-money-diary/shared";

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly password: Password,
  ) {}

  // ビジネスロジックの例
  canChangePassword(): boolean {
    // パスワード変更可能かどうかのロジック
    return true;
  }
}
```

**Repositoryの修正**:
```typescript
// apps/api/src/domain/repository/userRepository.ts
import { User } from "@/domain/entity/user";

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(input: CreateUserInput & { passwordHash: string; uuid: string }): Promise<User>;
}
```

**Usecaseの修正**:
```typescript
// apps/api/src/usecase/auth/getMeUseCase.ts
import { User } from "@/domain/entity/user";

export class GetMeUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User> {
    // Entityを返す（DTOではない）
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  }
}
```

**Interface層（Controller層）でEntityをDTOに変換**:
```typescript
// apps/api/src/interface/http/auth/me.ts
import { GetMeUseCase } from "@/usecase/auth/getMeUseCase";
import { UserResponseSchema } from "@paypay-money-diary/shared";
import { User } from "@/domain/entity/user";

export const meHandler = async (c: Context) => {
  const userPayload = c.get("user");
  const userRepository = new UserRepository();
  const getMeUseCase = new GetMeUseCase(userRepository);

  try {
    // UsecaseはEntityを返す
    const user: User = await getMeUseCase.execute(userPayload.userId);

    // EntityをDTOに変換
    const userDto = UserResponseSchema.parse({
      id: user.id,
      name: user.name,
      email: user.email.toString(), // ValueObjectを文字列に変換
    });

    return c.json(userDto, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
```

**Routes層でのDTO使用**:
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

#### 6. ValueObject、Entity、DTOの役割を明確化

**ValueObject**（`packages/shared/src/vo/`）:
- 不変の値オブジェクト（Email, Password）
- Entityで使用される

**Entity**（`apps/api/src/domain/entity/`）:
- 識別子を持ち、ビジネスロジックを含む
- ValueObjectを使用する
- Domain層、Usecase層で使用される

**DTO**（`packages/shared/src/schema/`）:
- API層で使用されるデータ転送オブジェクト
- フロントエンドとバックエンドで共有される
- Entityから変換される

**スキーマの使い分け**:
```typescript
// packages/shared/src/schema/user.ts

// フロントエンド用（生の文字列）- リクエストDTO
export const CreateUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

// バックエンド用（ValueObjectに変換）- リクエストDTO
// 注意: 実際には、Interface層でValueObjectに変換する
export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(), // 文字列のまま（EntityでValueObjectに変換）
  password: z.string().min(8), // 文字列のまま（EntityでValueObjectに変換）
});

// レスポンスDTO
export const UserResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
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

### 例2: バックエンドでのEntityとDTOの使用

```typescript
// apps/api/src/domain/entity/user.ts
import { Email, Password } from "@paypay-money-diary/shared";

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly password: Password,
  ) {}
}

// apps/api/src/usecase/auth/signupUseCase.ts
import { User } from "@/domain/entity/user";
import { IUserRepository } from "@/domain/repository/userRepository";
import { CreateUserInput } from "@paypay-money-diary/shared";
import { Email, Password } from "@paypay-money-diary/shared";

export class SignupUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    // ビジネスロジック
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // ValueObjectに変換
    const email = Email.create(input.email);
    const password = Password.create(input.password);

    // Entityを作成
    const user = await this.userRepository.create({
      ...input,
      passwordHash: password.value, // ハッシュ化は別途
      uuid: randomUUID(),
    });

    return user; // Entityを返す
  }
}

// apps/api/src/interface/http/auth/signup.ts
import { SignupUseCase } from "@/usecase/auth/signupUseCase";
import { UserRepository } from "@/infrastructure/repository/userRepository";
import { UserResponseSchema } from "@paypay-money-diary/shared";
import { User } from "@/domain/entity/user";

export const signupHandler = async (c: Context) => {
  const userRepository = new UserRepository();
  const signupUseCase = new SignupUseCase(userRepository);

  const input = c.req.valid("json" as never) as CreateUserInput;

  try {
    // UsecaseはEntityを返す
    const user: User = await signupUseCase.execute(input);

    // EntityをDTOに変換
    const userDto = UserResponseSchema.parse({
      id: user.id,
      name: user.name,
      email: user.email.toString(), // ValueObjectを文字列に変換
    });

    return c.json(userDto, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return c.json({ error: "User already exists" }, 409);
    }
    console.error(error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
};

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
          schema: CreateUserSchema, // リクエストDTO
        },
      },
    },
  },
  responses: {
    201: {
      description: "登録成功",
      content: {
        "application/json": {
          schema: SignupResponseSchema, // レスポンスDTO
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
5. **EntityとDTOの区別が不明確** - Domain層にEntityが定義されていない
6. **Usecase層がEntityではなくDTOを返している** - 本来はEntityを返し、Interface層でDTOに変換すべき

**推奨事項**: 
1. `packages/shared` に `zod` を依存関係として追加
2. フロントエンドで `@paypay-money-diary/shared` を使用し、Zodスキーマでバリデーションを実装
3. **Domain層にEntityを定義** - ValueObject（Email, Password）を使用するEntityを作成
4. **Usecase層はEntityを返す** - DTOではなくEntityを返すように修正
5. **Interface層（Controller層）でEntityをDTOに変換** - `packages/shared` のDTOスキーマを使用
6. バックエンドで `UserResponseSchema` を再利用（`.openapi()` で拡張）
7. リアルタイムバリデーションの実装を検討（React Hook Form等）

これらの修正により、以下のメリットが得られます：
- フロントエンドとバックエンドで型定義とバリデーションロジックが完全に共有される
- EntityとDTOの責務が明確になり、ドメインロジックがDTOに漏れることを防げる
- ドメイン層が外部パッケージに依存せず、独立性が保たれる
- 保守性と型安全性が大幅に向上する

