# apps/api アーキテクチャリファクタリング実装計画

## 概要

`apps/api`のクリーンアーキテクチャを適切に実装し、`packages/shared`のZodスキーマを完全に共通化するための大規模リファクタリング計画です。

**設計ドキュメント**: 詳細なアーキテクチャ設計は [apps/api/ARCHITECTURE_DESIGN.md](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/ARCHITECTURE_DESIGN.md) を参照してください。

**タスクリスト**: 詳細なタスクチェックリストは [REFACTORING_TASK.md](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/REFACTORING_TASK.md) を参照してください。

## 背景

現在の問題点：

1. **アーキテクチャの不整合**: `auth`機能のみが適切にレイヤー分離されており、`category`、`rule`、`transaction`機能は直接`db`をインポート
2. **Domain層の不足**: Entityが定義されておらず、Repository interfaceも不足
3. **Service層の不在**: ビジネスロジックがUsecaseに混在
4. **EntityとDTOの区別がない**: 責務が混在している
5. **packages/sharedにzodが依存関係として含まれていない**: パッケージの独立性が損なわれている
6. **フロントエンドでZodバリデーションが行われていない**: 手動バリデーションを実装

## 目標

### 最終的なアーキテクチャ

```
apps/api/src/
├── controller/          # HTTPリクエスト/レスポンス処理、Entity→DTO変換
│   ├── auth/
│   ├── category/
│   ├── rule/
│   └── transaction/
├── usecase/            # ユースケースのオーケストレーション
│   ├── auth/
│   ├── category/
│   ├── rule/
│   └── transaction/
├── service/            # ビジネスロジック（NEW!）
│   ├── auth/
│   ├── category/
│   ├── rule/
│   └── transaction/
├── domain/
│   ├── entity/         # Entityクラス（NEW!）
│   │   ├── user.ts
│   │   ├── category.ts
│   │   ├── rule.ts
│   │   └── transaction.ts
│   └── repository/     # Repository interface
│       ├── userRepository.ts
│       ├── tokenRepository.ts
│       ├── categoryRepository.ts      # NEW
│       ├── ruleRepository.ts          # NEW
│       └── transactionRepository.ts   # NEW
├── infrastructure/
│   └── repository/     # Repository実装
│       ├── userRepository.ts
│       ├── tokenRepository.ts
│       ├── categoryRepository.ts      # NEW
│       ├── ruleRepository.ts          # NEW
│       └── transactionRepository.ts   # NEW
└── (その他既存ディレクトリ)
```

```
packages/shared/src/
├── schema/             # DTOスキーマ
│   ├── user.ts
│   ├── category.ts     # NEW
│   ├── rule.ts         # NEW
│   └── transaction.ts  # NEW
└── vo/                 # ValueObject
    ├── email.ts
    └── password.ts
```

## ユーザーレビュー必須事項

> [!IMPORTANT]
> **破壊的変更**: 以下の大規模な変更が含まれます：
> 
> 1. **ディレクトリ構造の大幅な変更**
>    - `interface/http/` → `controller/` への移行
>    - `routes/` を `controller/` 配下に統合
>    - 新規 `service/` ディレクトリの追加
> 
> 2. **既存コードの大幅な書き換え**
>    - 全43個のハンドラーファイルをリファクタリング
>    - 全12個のUsecaseファイルをリファクタリング
>    - 新規に約30個のファイルを追加
> 
> 3. **テストファイルの修正**
>    - 全テストファイル（約20個）のインポートパスとモック構造を修正
> 
> 4. **段階的な実装が必要**
>    - 一度にすべてを変更するとリスクが高いため、機能ごとに段階的に実装
>    - 各段階でテストを実行して動作確認

> [!WARNING]
> **実装期間**: この計画は大規模なリファクタリングであり、完了までに相当な時間がかかります。
> 
> - フェーズ1（基盤整備）: 2-3時間
> - フェーズ2（auth機能）: 3-4時間
> - フェーズ3（category機能）: 2-3時間
> - フェーズ4（rule機能）: 2-3時間
> - フェーズ5（transaction機能）: 3-4時間
> - フェーズ6（検証・最終調整）: 2-3時間
> 
> **合計: 14-20時間の作業時間を想定**

> [!CAUTION]
> **リスク**: 既存の動作しているコードを大幅に変更するため、以下のリスクがあります：
> 
> - 既存機能の一時的な破壊
> - テストの失敗
> - フロントエンドとの互換性の問題
> 
> **推奨**: 
> - 新しいブランチで作業を開始
> - 各フェーズ完了後にコミット
> - フェーズごとにテストを実行して動作確認

---

## 提案される変更

### フェーズ1: 基盤整備

#### 1.1 packages/shared の拡充

##### [MODIFY] [package.json](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/packages/shared/package.json)

**変更内容**: `zod`を依存関係として追加

```json
{
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

##### [NEW] [schema/category.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/packages/shared/src/schema/category.ts)

**変更内容**: カテゴリ関連のDTOスキーマを定義

```typescript
import { z } from "zod";

// レスポンスDTO
export const CategoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  icon: z.string().nullable(),
  displayOrder: z.number(),
  isDefault: z.boolean(),
  isSystem: z.boolean(),
  userId: z.string().uuid().nullable(),
});

// リクエストDTO（作成）
export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1),
  color: z.string(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
});

// リクエストDTO（更新）
export const UpdateCategoryInputSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  icon: z.string().nullable().optional(),
  displayOrder: z.number().optional(),
});

// 型エクスポート
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;
```

##### [NEW] [schema/rule.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/packages/shared/src/schema/rule.ts)

**変更内容**: ルール関連のDTOスキーマを定義

##### [NEW] [schema/transaction.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/packages/shared/src/schema/transaction.ts)

**変更内容**: トランザクション関連のDTOスキーマを定義

##### [MODIFY] [index.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/packages/shared/src/index.ts)

**変更内容**: 新しいスキーマをエクスポート

---

#### 1.2 apps/api の Domain層拡充

##### [NEW] [domain/entity/user.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/user.ts)

**変更内容**: User Entityクラスを定義

```typescript
import { Email, Password } from "@paypay-money-diary/shared";

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: Email,
    public readonly password: Password,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {}

  /**
   * パスワード変更可能かどうか
   */
  canChangePassword(): boolean {
    return true;
  }

  /**
   * DTOに変換（パスワードなし）
   */
  toResponse() {
    return {
      id: this.id,
      name: this.name,
      email: this.email.toString(),
    };
  }
}
```

##### [NEW] [domain/entity/category.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/category.ts)

**変更内容**: Category Entityクラスを定義

##### [NEW] [domain/entity/rule.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/rule.ts)

**変更内容**: Rule Entityクラスを定義

##### [NEW] [domain/entity/transaction.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/transaction.ts)

**変更内容**: Transaction Entityクラスを定義

##### [NEW] [domain/repository/categoryRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/categoryRepository.ts)

**変更内容**: ICategoryRepository interfaceを定義

##### [NEW] [domain/repository/ruleRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/ruleRepository.ts)

**変更内容**: IRuleRepository interfaceを定義

##### [NEW] [domain/repository/transactionRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/transactionRepository.ts)

**変更内容**: ITransactionRepository interfaceを定義

---

#### 1.3 apps/api の Infrastructure層拡充

##### [NEW] [infrastructure/repository/categoryRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/infrastructure/repository/categoryRepository.ts)

**変更内容**: CategoryRepository実装を追加

##### [NEW] [infrastructure/repository/ruleRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/infrastructure/repository/ruleRepository.ts)

**変更内容**: RuleRepository実装を追加

##### [NEW] [infrastructure/repository/transactionRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/infrastructure/repository/transactionRepository.ts)

**変更内容**: TransactionRepository実装を追加

---

### フェーズ2: auth機能のリファクタリング

#### 2.1 Service層の追加

##### [NEW] [service/auth/passwordService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/auth/passwordService.ts)

**変更内容**: パスワード関連のビジネスロジックを実装

##### [NEW] [service/auth/tokenService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/auth/tokenService.ts)

**変更内容**: トークン生成のビジネスロジックを実装

##### [NEW] [service/auth/authService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/auth/authService.ts)

**変更内容**: 認証関連のビジネスロジックを実装

---

#### 2.2 Usecase層のリファクタリング

##### [MODIFY] [usecase/auth/loginUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/loginUseCase.ts)

**変更内容**: Service層を使用するようにリファクタリング、Entityを返すように変更

##### [MODIFY] [usecase/auth/signupUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/signupUseCase.ts)

**変更内容**: Service層を使用するようにリファクタリング、Entityを返すように変更

##### [MODIFY] [usecase/auth/getMeUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/getMeUseCase.ts)

**変更内容**: Entityを返すように変更

##### [MODIFY] [usecase/auth/refreshUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/refreshUseCase.ts)

**変更内容**: Service層を使用するようにリファクタリング

##### [MODIFY] [usecase/auth/logoutUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/logoutUseCase.ts)

**変更内容**: 必要に応じてリファクタリング

---

#### 2.3 Controller層の作成

##### [NEW] [controller/auth/authController.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/auth/authController.ts)

**変更内容**: `interface/http/auth/`の全ハンドラーを統合し、Entity→DTO変換を実装

##### [NEW] [controller/auth/auth.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/auth/auth.routes.ts)

**変更内容**: `routes/auth.routes.ts`を移動し、`packages/shared`のスキーマを使用

##### [DELETE] [interface/http/auth/login.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/auth/login.ts)

**変更内容**: `controller/auth/authController.ts`に統合されるため削除

##### [DELETE] [interface/http/auth/signup.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/auth/signup.ts)

**変更内容**: `controller/auth/authController.ts`に統合されるため削除

##### [DELETE] [interface/http/auth/me.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/auth/me.ts)

**変更内容**: `controller/auth/authController.ts`に統合されるため削除

##### [DELETE] [interface/http/auth/refresh.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/auth/refresh.ts)

**変更内容**: `controller/auth/authController.ts`に統合されるため削除

##### [DELETE] [interface/http/auth/logout.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/auth/logout.ts)

**変更内容**: `controller/auth/authController.ts`に統合されるため削除

##### [DELETE] [routes/auth.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/routes/auth.routes.ts)

**変更内容**: `controller/auth/auth.routes.ts`に移動されるため削除

---

#### 2.4 テストファイルの修正

##### [MODIFY] [usecase/auth/loginUseCase.test.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/loginUseCase.test.ts)

**変更内容**: Service層のモックを追加、Entityを返すことを検証

##### [MODIFY] [usecase/auth/signupUseCase.test.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/signupUseCase.test.ts)

**変更内容**: Service層のモックを追加、Entityを返すことを検証

##### [MODIFY] [controller/auth/authController.test.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/auth/authController.test.ts)

**変更内容**: `interface/http/auth/*.test.ts`を統合・移動

---

### フェーズ3: category機能のリファクタリング

#### 3.1 Service層の追加

##### [NEW] [service/category/categoryService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/category/categoryService.ts)

**変更内容**: カテゴリ関連のビジネスロジックを実装

---

#### 3.2 Usecase層の追加

##### [NEW] [usecase/category/listCategoriesUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/listCategoriesUseCase.ts)

**変更内容**: カテゴリ一覧取得のユースケースを実装

##### [NEW] [usecase/category/createCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/createCategoryUseCase.ts)

**変更内容**: カテゴリ作成のユースケースを実装

##### [NEW] [usecase/category/updateCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/updateCategoryUseCase.ts)

**変更内容**: カテゴリ更新のユースケースを実装

##### [NEW] [usecase/category/deleteCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/deleteCategoryUseCase.ts)

**変更内容**: カテゴリ削除のユースケースを実装

---

#### 3.3 Controller層の作成

##### [NEW] [controller/category/categoryController.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/category/categoryController.ts)

**変更内容**: `interface/http/category/`の全ハンドラーを統合し、Entity→DTO変換を実装

##### [NEW] [controller/category/category.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/category/category.routes.ts)

**変更内容**: `routes/category.routes.ts`を移動し、`packages/shared`のスキーマを使用

##### [DELETE] [interface/http/category/list.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/category/list.ts)

##### [DELETE] [interface/http/category/create.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/category/create.ts)

##### [DELETE] [interface/http/category/update.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/category/update.ts)

##### [DELETE] [interface/http/category/delete.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/category/delete.ts)

##### [DELETE] [routes/category.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/routes/category.routes.ts)

---

### フェーズ4: rule機能のリファクタリング

（category機能と同様の構成）

#### 4.1 Service層の追加

##### [NEW] [service/rule/ruleService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/rule/ruleService.ts)

---

#### 4.2 Usecase層の追加

##### [NEW] [usecase/rule/listRulesUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/rule/listRulesUseCase.ts)

##### [NEW] [usecase/rule/createRuleUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/rule/createRuleUseCase.ts)

##### [NEW] [usecase/rule/updateRuleUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/rule/updateRuleUseCase.ts)

##### [NEW] [usecase/rule/deleteRuleUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/rule/deleteRuleUseCase.ts)

---

#### 4.3 Controller層の作成

##### [NEW] [controller/rule/ruleController.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/rule/ruleController.ts)

##### [NEW] [controller/rule/rule.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/rule/rule.routes.ts)

##### [DELETE] [interface/http/rule/list.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/rule/list.ts)

##### [DELETE] [interface/http/rule/create.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/rule/create.ts)

##### [DELETE] [interface/http/rule/update.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/rule/update.ts)

##### [DELETE] [interface/http/rule/delete.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/rule/delete.ts)

##### [DELETE] [routes/rule.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/routes/rule.routes.ts)

---

### フェーズ5: transaction機能のリファクタリング

#### 5.1 Service層の追加

##### [NEW] [service/transaction/transactionService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/transaction/transactionService.ts)

##### [NEW] [service/transaction/csvService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/transaction/csvService.ts)

---

#### 5.2 Usecase層の追加・修正

##### [NEW] [usecase/transaction/listTransactionsUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/listTransactionsUseCase.ts)

##### [NEW] [usecase/transaction/getTransactionSummaryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/getTransactionSummaryUseCase.ts)

##### [NEW] [usecase/transaction/updateTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/updateTransactionUseCase.ts)

##### [NEW] [usecase/transaction/reCategorizeTransactionsUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/reCategorizeTransactionsUseCase.ts)

##### [NEW] [usecase/transaction/getAvailableYearsUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/getAvailableYearsUseCase.ts)

##### [MODIFY] [usecase/transaction/uploadCsvUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/uploadCsvUseCase.ts)

**変更内容**: Service層を使用するようにリファクタリング

---

#### 5.3 Controller層の作成

##### [NEW] [controller/transaction/transactionController.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/transaction/transactionController.ts)

##### [NEW] [controller/transaction/transaction.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/controller/transaction/transaction.routes.ts)

##### [DELETE] [interface/http/transaction/list.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/transaction/list.ts)

##### [DELETE] [interface/http/transaction/summary.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/transaction/summary.ts)

##### [DELETE] [interface/http/transaction/update.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/transaction/update.ts)

##### [DELETE] [interface/http/transaction/reCategorize.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/transaction/reCategorize.ts)

##### [DELETE] [interface/http/transaction/availableYears.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/transaction/availableYears.ts)

##### [DELETE] [interface/http/transaction/upload.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/transaction/upload.ts)

##### [DELETE] [routes/transaction.routes.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/routes/transaction.routes.ts)

---

### フェーズ6: フロントエンドの対応

#### 6.1 apps/web の依存関係追加

##### [MODIFY] [package.json](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/web/package.json)

**変更内容**: `@paypay-money-diary/shared`と`zod`を依存関係に追加

```json
{
  "dependencies": {
    "@paypay-money-diary/shared": "workspace:*",
    "zod": "^3.23.8"
  }
}
```

---

#### 6.2 フロントエンドでのZodバリデーション実装

##### [MODIFY] [app/signup/page.tsx](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/web/src/app/signup/page.tsx)

**変更内容**: `CreateUserSchema`を使用したバリデーションを実装

##### [MODIFY] [app/login/page.tsx](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/web/src/app/login/page.tsx)

**変更内容**: `LoginSchema`を使用したバリデーションを実装

---

### フェーズ7: クリーンアップと最終調整

#### 7.1 不要なディレクトリの削除

##### [DELETE] [interface/http/](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/interface/http/)

**変更内容**: すべてのファイルが`controller/`に移行されたため、ディレクトリごと削除

##### [DELETE] [routes/](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/routes/)

**変更内容**: すべてのファイルが`controller/*/routes.ts`に移行されたため、ディレクトリごと削除

---

#### 7.2 エントリーポイントの修正

##### [MODIFY] [index.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/index.ts)

**変更内容**: インポートパスを`controller/`に変更

---

#### 7.3 ドキュメントの更新

##### [NEW] [ARCHITECTURE.md](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/ARCHITECTURE.md)

**変更内容**: 新しいアーキテクチャの説明ドキュメントを作成

##### [MODIFY] [README.md](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/README.md)

**変更内容**: アーキテクチャの説明を更新

---

## 検証計画

### 自動テスト

各フェーズ完了後に以下のテストを実行：

```bash
# apps/api のテスト
cd apps/api
pnpm test

# apps/web のテスト
cd apps/web
pnpm test

# ビルド確認
pnpm build
```

### 手動検証

1. **auth機能の検証**
   - ユーザー登録
   - ログイン
   - ログアウト
   - トークン更新
   - ユーザー情報取得

2. **category機能の検証**
   - カテゴリ一覧取得
   - カテゴリ作成
   - カテゴリ更新
   - カテゴリ削除

3. **rule機能の検証**
   - ルール一覧取得
   - ルール作成
   - ルール更新
   - ルール削除

4. **transaction機能の検証**
   - トランザクション一覧取得
   - トランザクション集計
   - トランザクション更新
   - CSV アップロード
   - 再カテゴライズ
   - 利用可能年度取得

### OpenAPI仕様の確認

```bash
# OpenAPI仕様の生成確認
curl http://localhost:3000/doc
```

---

## リスク管理

### 高リスク項目

1. **既存テストの破壊**: すべてのテストファイルを修正する必要がある
2. **フロントエンドとの互換性**: API仕様の変更がフロントエンドに影響する可能性
3. **データベーススキーマの変更**: 必要に応じてマイグレーションが必要

### 軽減策

1. **段階的な実装**: 機能ごとに段階的に実装し、各段階でテストを実行
2. **ブランチ戦略**: 新しいブランチで作業を開始し、各フェーズ完了後にコミット
3. **ロールバック計画**: 問題が発生した場合は、前のフェーズに戻れるようにする

---

## 実装順序

1. **フェーズ1: 基盤整備** （優先度: 最高）
   - packages/shared の拡充
   - Domain層の拡充
   - Infrastructure層の拡充

2. **フェーズ2: auth機能のリファクタリング** （優先度: 高）
   - 既存の動作している機能を参考にできる
   - 他の機能のテンプレートになる

3. **フェーズ3: category機能のリファクタリング** （優先度: 中）
   - auth機能のパターンを適用

4. **フェーズ4: rule機能のリファクタリング** （優先度: 中）
   - category機能のパターンを適用

5. **フェーズ5: transaction機能のリファクタリング** （優先度: 中）
   - 最も複雑な機能のため、最後に実装

6. **フェーズ6: フロントエンドの対応** （優先度: 低）
   - バックエンドが安定してから実装

7. **フェーズ7: クリーンアップと最終調整** （優先度: 低）
   - すべての機能が動作してから実施

---

## まとめ

この計画は、`apps/api`のクリーンアーキテクチャを適切に実装し、`packages/shared`のZodスキーマを完全に共通化するための包括的なリファクタリング計画です。

**主な変更点:**
- Service層の導入によるビジネスロジックの分離
- Entity/DTO/ValueObjectの明確な区別
- Controller層への統合によるコードの整理
- packages/sharedの完全な共通化

**期待される効果:**
- テスタビリティの向上
- 再利用性の向上
- 可読性の向上
- 保守性の向上
- 型安全性の向上
