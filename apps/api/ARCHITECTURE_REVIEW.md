# apps/api アーキテクチャレビューレポート

## 調査日
2026年（調査実施日）

## 概要
`apps/api` のアーキテクチャを調査し、クリーンアーキテクチャの観点から問題点を特定しました。現在の構成では、一部の機能（auth）は適切にレイヤー分離されていますが、多くの機能（category, rule, transaction の大部分）でアーキテクチャが一貫していません。

## 現在のアーキテクチャ構成

### レイヤー構造
```
apps/api/src/
├── domain/          # ドメイン層（インターフェース定義）
│   └── repository/
│       ├── userRepository.ts      (IUserRepository)
│       └── tokenRepository.ts    (ITokenRepository)
├── infrastructure/  # インフラストラクチャ層（実装）
│   ├── auth/
│   ├── csv/
│   ├── redis/
│   └── repository/
│       ├── userRepository.ts      (UserRepository)
│       └── tokenRepository.ts     (RedisTokenRepository)
├── interface/       # インターフェース層（HTTPハンドラー）
│   └── http/
│       ├── auth/
│       ├── category/
│       ├── rule/
│       └── transaction/
├── routes/          # ルーティング層
│   ├── auth.routes.ts
│   ├── category.routes.ts
│   ├── rule.routes.ts
│   └── transaction.routes.ts
└── usecase/        # ユースケース層（ビジネスロジック）
    ├── auth/
    │   ├── getMeUseCase.ts
    │   ├── loginUseCase.ts
    │   ├── logoutUseCase.ts
    │   ├── refreshUseCase.ts
    │   └── signupUseCase.ts
    └── transaction/
        └── uploadCsvUseCase.ts
```

## 発見された問題点

### 1. アーキテクチャの不整合（重大）

#### 問題の詳細
- **auth 機能**: 適切にレイヤー分離されている
  - Domain層: `IUserRepository`, `ITokenRepository` が定義されている
  - Infrastructure層: `UserRepository`, `RedisTokenRepository` が実装されている
  - Usecase層: すべてのauth機能にusecaseが存在
  - Interface層: usecaseを呼び出す構造

- **category 機能**: アーキテクチャを無視している
  - Domain層: リポジトリインターフェースが存在しない
  - Infrastructure層: リポジトリ実装が存在しない
  - Usecase層: usecaseが存在しない
  - Interface層: **直接 `db` をインポートして使用**（レイヤー違反）

- **rule 機能**: アーキテクチャを無視している
  - Domain層: リポジトリインターフェースが存在しない
  - Infrastructure層: リポジトリ実装が存在しない
  - Usecase層: usecaseが存在しない
  - Interface層: **直接 `db` をインポートして使用**（レイヤー違反）

- **transaction 機能**: 部分的にしかアーキテクチャに従っていない
  - Domain層: リポジトリインターフェースが存在しない
  - Infrastructure層: リポジトリ実装が存在しない
  - Usecase層: `uploadCsvUseCase` のみ存在
  - Interface層: `list`, `summary`, `update`, `reCategorize`, `availableYears` が **直接 `db` をインポートして使用**（レイヤー違反）

#### 影響
- 機能追加時に一貫性のない実装パターンが発生する
- テストが困難（DBへの直接依存）
- ビジネスロジックがinterface層に散在し、再利用が困難
- 依存関係の方向が逆転している（interface層がinfrastructure層に依存すべきなのに、直接dbに依存）

### 2. Domain層の不足（重大）

#### 問題の詳細
現在、Domain層には以下のリポジトリインターフェースのみが存在します：
- `IUserRepository`
- `ITokenRepository`

しかし、以下のリポジトリインターフェースが欠如しています：
- `ICategoryRepository` - カテゴリのCRUD操作
- `IRuleRepository` - ルールのCRUD操作
- `ITransactionRepository` - 取引のCRUD操作、集計、検索
- `IUploadRepository` - CSVアップロード履歴の管理（必要に応じて）

#### 影響
- ドメインロジックが明確に定義されていない
- リポジトリの責務が不明確
- テスト時にモックが作成できない

### 3. Infrastructure層の不足（重大）

#### 問題の詳細
現在、Infrastructure層には以下のリポジトリ実装のみが存在します：
- `UserRepository` (implements `IUserRepository`)
- `RedisTokenRepository` (implements `ITokenRepository`)

しかし、以下のリポジトリ実装が欠如しています：
- `CategoryRepository` (implements `ICategoryRepository`)
- `RuleRepository` (implements `IRuleRepository`)
- `TransactionRepository` (implements `ITransactionRepository`)

#### 影響
- データアクセスロジックがinterface層に散在
- DBスキーマ変更時の影響範囲が広い
- データアクセスロジックの再利用が困難

### 4. Usecase層の不足（重大）

#### 問題の詳細
現在、Usecase層には以下のusecaseのみが存在します：
- `auth/` 配下のすべてのusecase（5つ）
- `transaction/uploadCsvUseCase.ts`

しかし、以下のusecaseが欠如しています：

**Category関連:**
- `category/listCategoriesUseCase.ts`
- `category/createCategoryUseCase.ts`
- `category/updateCategoryUseCase.ts`
- `category/deleteCategoryUseCase.ts`

**Rule関連:**
- `rule/listRulesUseCase.ts`
- `rule/createRuleUseCase.ts`
- `rule/updateRuleUseCase.ts`
- `rule/deleteRuleUseCase.ts`

**Transaction関連:**
- `transaction/listTransactionsUseCase.ts`
- `transaction/getTransactionSummaryUseCase.ts`
- `transaction/updateTransactionUseCase.ts`
- `transaction/reCategorizeTransactionsUseCase.ts`
- `transaction/getAvailableYearsUseCase.ts`

#### 影響
- ビジネスロジックがinterface層に散在
- ビジネスロジックの再利用が困難
- テストが困難（HTTPコンテキストに依存）
- ビジネスルールの変更時に影響範囲が広い

### 5. 依存関係の方向違反（重大）

#### 問題の詳細
クリーンアーキテクチャでは、依存関係は外側から内側に向かうべきです：
```
routes → interface → usecase → domain ← infrastructure
```

しかし、現在の実装では：
- `interface/http/category/*.ts` が直接 `@/db` をインポート
- `interface/http/rule/*.ts` が直接 `@/db` をインポート
- `interface/http/transaction/*.ts` の多くが直接 `@/db` をインポート

これにより、interface層がinfrastructure層（db）に直接依存しており、依存関係の方向が逆転しています。

#### 影響
- レイヤーの責務が不明確
- テスト時にDBが必要になる
- データソースの変更（例: DBからAPIに変更）が困難

### 6. 一貫性の欠如（中程度）

#### 問題の詳細
同じプロジェクト内で、異なる実装パターンが混在しています：

**パターンA（適切）:**
```typescript
// interface/http/auth/login.ts
const userRepository = new UserRepository();
const tokenRepository = new RedisTokenRepository();
const loginUseCase = new LoginUseCase(userRepository, tokenRepository);
const result = await loginUseCase.execute(input);
```

**パターンB（不適切）:**
```typescript
// interface/http/category/list.ts
const result = await db
  .select()
  .from(categories)
  .where(...);
```

#### 影響
- 新規開発者が混乱する
- コードレビュー時に一貫性を保つことが困難
- リファクタリング時に判断が難しい

### 7. テスト容易性の低下（中程度）

#### 問題の詳細
- interface層が直接dbに依存しているため、テスト時に実際のDBが必要
- usecase層が存在しないため、ビジネスロジックの単体テストが困難
- リポジトリインターフェースがないため、モックの作成が困難

#### 影響
- テストの実行速度が遅い
- テストの安定性が低い（DBの状態に依存）
- CI/CDパイプラインでのテスト実行が複雑

## 推奨される修正方針

### 優先度: 高

#### 1. Domain層の拡充
以下のリポジトリインターフェースを追加：
- `domain/repository/categoryRepository.ts` - `ICategoryRepository`
- `domain/repository/ruleRepository.ts` - `IRuleRepository`
- `domain/repository/transactionRepository.ts` - `ITransactionRepository`

#### 2. Infrastructure層の拡充
以下のリポジトリ実装を追加：
- `infrastructure/repository/categoryRepository.ts` - `CategoryRepository`
- `infrastructure/repository/ruleRepository.ts` - `RuleRepository`
- `infrastructure/repository/transactionRepository.ts` - `TransactionRepository`

#### 3. Usecase層の拡充
以下のusecaseを追加：
- `usecase/category/` 配下に4つのusecase
- `usecase/rule/` 配下に4つのusecase
- `usecase/transaction/` 配下に5つのusecase

#### 4. Interface層のリファクタリング
すべてのinterface層のハンドラーを、usecaseを呼び出す構造に変更：
- `db` への直接インポートを削除
- usecaseをインスタンス化して呼び出す
- エラーハンドリングはinterface層で行う（HTTPステータスコードの決定）

### 優先度: 中

#### 5. 依存性注入（DI）の導入検討
現在、各ハンドラー内でリポジトリとusecaseを手動でインスタンス化しています。DIコンテナの導入を検討することで、テスト容易性と保守性が向上します。

#### 6. エラーハンドリングの統一
現在、エラーハンドリングが各ハンドラーで個別に実装されています。共通のエラーハンドリングミドルウェアの導入を検討してください。

## 修正後の理想的な構造

```
apps/api/src/
├── domain/
│   └── repository/
│       ├── userRepository.ts
│       ├── tokenRepository.ts
│       ├── categoryRepository.ts      ← 追加
│       ├── ruleRepository.ts          ← 追加
│       └── transactionRepository.ts   ← 追加
├── infrastructure/
│   └── repository/
│       ├── userRepository.ts
│       ├── tokenRepository.ts
│       ├── categoryRepository.ts      ← 追加
│       ├── ruleRepository.ts          ← 追加
│       └── transactionRepository.ts   ← 追加
├── interface/
│   └── http/
│       ├── auth/          (usecaseを使用)
│       ├── category/      (usecaseを使用) ← 修正
│       ├── rule/          (usecaseを使用) ← 修正
│       └── transaction/   (usecaseを使用) ← 修正
├── routes/
└── usecase/
    ├── auth/
    ├── category/          ← 追加
    ├── rule/              ← 追加
    └── transaction/       ← 拡充
```

## 修正例

### Before (現在の実装)
```typescript
// interface/http/category/list.ts
import { db } from "@/db";
import { categories } from "@/db/schema";

export const getCategoriesHandler = async (c: Context) => {
  const result = await db
    .select()
    .from(categories)
    .where(...);
  return c.json({ data: result });
};
```

### After (推奨される実装)
```typescript
// domain/repository/categoryRepository.ts
export interface ICategoryRepository {
  findByUserId(userId: string): Promise<Category[]>;
  // ...
}

// infrastructure/repository/categoryRepository.ts
export class CategoryRepository implements ICategoryRepository {
  async findByUserId(userId: string): Promise<Category[]> {
    // DBアクセス実装
  }
}

// usecase/category/listCategoriesUseCase.ts
export class ListCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}
  
  async execute(userId: string): Promise<Category[]> {
    return await this.categoryRepository.findByUserId(userId);
  }
}

// interface/http/category/list.ts
import { ListCategoriesUseCase } from "@/usecase/category/listCategoriesUseCase";
import { CategoryRepository } from "@/infrastructure/repository/categoryRepository";

export const getCategoriesHandler = async (c: Context) => {
  const userPayload = c.get("user");
  const categoryRepository = new CategoryRepository();
  const listCategoriesUseCase = new ListCategoriesUseCase(categoryRepository);
  
  const categories = await listCategoriesUseCase.execute(userPayload.userId);
  return c.json({ data: categories });
};
```

## まとめ

現在のアーキテクチャは、**auth機能では適切にレイヤー分離されていますが、category、rule、transaction機能ではアーキテクチャが一貫していません**。これにより、以下の問題が発生しています：

1. 機能追加時に一貫性のない実装パターンが発生
2. テストが困難
3. ビジネスロジックの再利用が困難
4. 依存関係の方向が逆転

**推奨事項**: すべての機能でauth機能と同様のアーキテクチャパターンを適用し、クリーンアーキテクチャの原則に従った実装に統一することを強く推奨します。

