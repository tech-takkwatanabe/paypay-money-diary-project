# Project Rules & Guidelines

This document outlines the standards, workflows, and conventions for the
**PayPay Money Diary Project**.

---

## 1. Project Overview

- **Goal**: Visualize PayPay transaction history and manage expenses.
- **Scope**: Full-stack monorepo (Frontend + Backend + Shared
  packages).

---

## 2. Technology Stack

### Frontend

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: jotai
- **Generate API from openapi.yml**: Orval
- **Language**: TypeScript

### Backend

- **Framework**: Hono
- **ORM**: Drizzle
- **Database**: PostgreSQL

### Monorepo & Tooling

- **Package Manager**: pnpm
- **Monorepo**: Turborepo
- **Testing**: Vitest / Testing Library
- **Validation/ValueObject**: Zod

---

## 3. Coding Standards

### Naming Conventions

- **Variables / Functions**: `camelCase`
- **React Components**: `PascalCase`
- **Files**:
  - Components → PascalCase (`TransactionList.tsx`)
  - Hooks / Utils → camelCase (`useUser.ts`, `formatDate.ts`)
  - Zod schemas → camelCase + `.schema.ts` (`transaction.schema.ts`)
- **Constants**: `UPPER_SNAKE_CASE`
- **Database tables**: snake_case

### Code Style

- Prefer functional components with Hooks
- Keep components small & focused (SRP)
- Avoid magic numbers; define constants
- Use **Zod** for:
  - API response validation
  - form schema validation
  - shared domain model validation
- Tailwind CSS のユーティリティクラスは 必ず JSX の className 内に記述する（IntelliSense が効かなくなる書き方は禁止）
  - 条件分岐の結果（condition ? "text-red-500" : "text-blue-500"）も className 内で完結させる
  - clsx / cva / cn などは使用禁止
- **`any` 型の使用禁止**
  - TypeScript で `any` 型を使用しないこと
  - エラーハンドリングでは型注釈を省略し、適切な型ガード (`instanceof Error` など) を実装する
  - ESLint で `@typescript-eslint/no-explicit-any: error` を設定する

---

## 4. Directory Structure (Monorepo)

### Root

    .
    ├── apps/
    │   ├── api/        # Hono Backend
    │   └── web/        # Next.js Frontend
    ├── packages/
    │   ├── shared/     # Shared utilities, types, Zod schemas
    │   ├── config/     # Shared configuration
    │   └── eslint/     # Shared ESLint config
    └── turbo.json

---

## 5. Detailed Folder Structure

### **apps/api (Hono backend)**

    /src
      /config         # Config values & env management
      /controllers    # API controllers
      /domain         # Domain logic
        /dto
        /entity
      /usecase        # Application use cases
      /service        # Business logic
      /models         # Entity models
      /infrastructure # DB, external API integrations
      /middlewares
      /utils
      /docs           # Generated API documentation
      /docker         # Docker for DB

### **apps/web (Next.js frontend)**

    /src
      /api          # Generated API client (orval)
      /components   # Reusable UI components
      /providers    # Context providers
      /atoms        # jotai atoms
      /stories      # Storybook stories
      /utils        # Helper utilities
      /app          # App Router

### **packages/shared**

    /shared
      /types        # Shared TypeScript types, Zod schemas
        ├── src/
        │   ├── vo/
        │   │   └── email.ts // Email Value Objectの定義
        │   ├── user.ts      // Zodスキーマと共通の型定義 (Email VOを参照)
        │   └── index.ts     // エクスポートを集約
        └── package.json
      /utils        # Utility functions usable across apps

---

## 6. Component Structure Rules

(Tailwind + Shadcn UI)

### General Rules

- Tailwind for layout & spacing
- Shadcn UI for forms, buttons, inputs, dialogs
- Prefer server components unless client-side state is needed
- Use Zod for form schema validation

---

## 7. Zod Usage Rules

### Shared schemas

- Place reusable validation logic in `packages/shared/schemas`
- Use Zod for:
  - API response validation
  - request DTO validation
  - form validation
  - domain model validation

### Example

```ts
export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  date: z.string(),
});
```

#### packages/types/src/user.ts

```
import { z } from 'zod';
import { EmailSchema, EmailType } from './vo/email'; // Email関連をインポート

export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, { message: "名前は3文字以上である必要があります。" }),
  email: EmailSchema, // Email Value Objectのスキーマを使用
  age: z.number().int().positive({ message: "年齢は正の整数である必要があります。" }).optional(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({ id: true });
export type CreateUser = z.infer<typeof CreateUserSchema>;
```

#### packages/types/src/vo/email.ts

```
import { z } from 'zod';

// Email Value Objectのクラス定義
export class Email {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  // ファクトリメソッド (Zodのtransformで利用)
  public static create(email: string): Email {
    // ここで追加のビジネスルールバリデーションも可能（例: 特定のドメイン以外は許可しない）
    // 例: if (!email.endsWith('@example.com')) { throw new Error('Invalid email domain'); }
    return new Email(email);
  }

  // 値による同一性チェック (equalsメソッド)
  public equals(other: Email): boolean {
    return this.value === other.value;
  }

  // 文字列としての表現
  public toString(): string {
    return this.value;
  }
}

// Zodスキーマの定義とValue Objectへの変換
export const EmailSchema = z.string().email({ message: "無効なメールアドレス形式です。" }).transform((email) => {
  return Email.create(email); // バリデーション済みの文字列からEmail Value Objectを生成
});

// Emailスキーマから推論される型は、Emailクラスのインスタンスになる
export type EmailType = z.infer<typeof EmailSchema>; // これは Email クラスのインスタンスになる

```

#### packages/types/package.json

```
{
  "name": "@my-monorepo/types",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.x.x",
    "zod": "^3.x.x"
  }
}
```

---

## 8. Documentation Rules

- Update `README.md` for:
  - setup
  - environment variables
  - how to run apps
- Keep `PROJECT_RULES.md` as the **source of truth** for:
  - architecture
  - coding conventions
  - directory structure
- Record decisions in `/docs/decision-log` (optional ADRs)

---

## 9. Testing Rules

- Use Zod schemas for validating mock data
- Vitest for unit testing & integration testing
- Testing Library for React components
- Frontend tests under `apps/web/src/__tests__`
