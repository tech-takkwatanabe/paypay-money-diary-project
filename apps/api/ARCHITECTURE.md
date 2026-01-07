# apps/api アーキテクチャ設計書

## 最終更新日
2026-01-07

## 概要

`apps/api`は、クリーンアーキテクチャの原則に基づいて設計されたNode.js/TypeScript製のRESTful APIサーバーです。Honoフレームワークを使用し、OpenAPI仕様に準拠したAPIを提供します。

## アーキテクチャ原則

### 1. クリーンアーキテクチャ

依存関係は外側から内側に向かう単方向のみ：

```
┌─────────────────────────────────────────────────────────┐
│  Controller層 (HTTP I/O、Entity→DTO変換)                │
│  - HTTPリクエスト/レスポンス処理                         │
│  - ルーティング定義                                      │
│  - Entity → DTO 変換                                     │
└────────────────────┬────────────────────────────────────┘
                     │ 依存
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Usecase層 (ユースケースのオーケストレーション)          │
│  - ビジネスフローの制御                                  │
│  - 複数Serviceの組み合わせ                               │
│  - Entityを返す                                          │
└────────────────────┬────────────────────────────────────┘
                     │ 依存
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Service層 (ビジネスロジック)                            │
│  - 純粋なビジネスロジック                                │
│  - 単一責任の原則                                        │
│  - 再利用可能なロジック                                  │
└────────────────────┬────────────────────────────────────┘
                     │ 依存
                     ↓
┌─────────────────────────────────────────────────────────┐
│  Domain層 (ドメインモデル)                               │
│  - Entity: ドメインの中核概念                            │
│  - Repository Interface: データアクセスの抽象化          │
│  - ValueObject: 不変の値オブジェクト                     │
└─────────────────────────────────────────────────────────┘
                     ↑ 実装
┌─────────────────────────────────────────────────────────┐
│  Infrastructure層 (外部システムとの連携)                 │
│  - Repository実装: データベースアクセス                  │
│  - 外部API連携                                           │
│  - ファイルシステムアクセス                              │
└─────────────────────────────────────────────────────────┘
```

### 2. Entity、DTO、ValueObjectの区別

#### Entity（Domain層）
- **定義場所**: `apps/api/src/domain/entity/`
- **責務**: ドメインの中核概念を表現、ビジネスロジックを含む
- **特徴**: 
  - 識別子（ID）を持つ
  - ValueObjectを使用する
  - ビジネスルールを実装するメソッドを持つ
  - 永続化の詳細を知らない

```typescript
// domain/entity/user.ts
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

  // ビジネスロジック
  canChangePassword(): boolean {
    return true;
  }

  // DTOへの変換（パスワードなし）
  toResponse() {
    return {
      id: this.id,
      name: this.name,
      email: this.email.toString(),
    };
  }
}
```

#### ValueObject（packages/shared）
- **定義場所**: `packages/shared/src/vo/`
- **責務**: 不変の値を表現、バリデーションを含む
- **特徴**:
  - 識別子を持たない
  - 不変（immutable）
  - 等価性は値で判断
  - バリデーションロジックを含む

```typescript
// packages/shared/src/vo/email.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email.includes("@")) {
      throw new Error("Invalid email format");
    }
    return new Email(email);
  }

  toString(): string {
    return this.value;
  }
}
```

#### DTO（packages/shared）
- **定義場所**: `packages/shared/src/schema/`
- **責務**: API層でのデータ転送、フロントエンドとバックエンドで共有
- **特徴**:
  - Zodスキーマで定義
  - バリデーションルールを含む
  - フロントエンドとバックエンドで共有
  - プリミティブ型のみ（クラスインスタンスを含まない）

```typescript
// packages/shared/src/schema/user.ts
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
```

### 3. データフローの例

#### リクエスト → レスポンスのフロー

```
1. HTTPリクエスト
   ↓
2. Controller層
   - リクエストをバリデーション（Zodスキーマ）
   - DTOを受け取る
   ↓
3. Usecase層
   - Serviceを呼び出してビジネスロジックを実行
   - Repositoryを呼び出してデータを取得/保存
   - Entityを返す
   ↓
4. Controller層
   - EntityをDTOに変換
   - HTTPレスポンスを返す
```

#### 具体例: ユーザー登録

```typescript
// 1. Controller層: HTTPリクエストを受け取る
// controller/auth/authController.ts
async signup(c: Context) {
  // DTOを受け取る（Zodでバリデーション済み）
  const input: CreateUserInput = c.req.valid("json");

  // Usecaseを実行
  const user: User = await signupUseCase.execute(input);

  // EntityをDTOに変換
  const userDto: UserResponse = user.toResponse();

  return c.json(userDto, 201);
}

// 2. Usecase層: ビジネスフローを制御
// usecase/auth/signupUseCase.ts
async execute(input: CreateUserInput): Promise<User> {
  // Serviceでビジネスロジックを実行
  const userExists = await authService.checkUserExists(input.email);
  if (userExists) {
    throw new Error("User already exists");
  }

  // Serviceでパスワードをハッシュ化
  const passwordHash = await passwordService.hash(input.password);

  // Repositoryでユーザーを作成（Entityを返す）
  const user = await userRepository.create({
    ...input,
    passwordHash,
    uuid: randomUUID(),
  });

  return user; // Entityを返す
}

// 3. Service層: ビジネスロジックを実装
// service/auth/authService.ts
async checkUserExists(email: string): Promise<boolean> {
  const user = await userRepository.findByEmail(email);
  return user !== null;
}

// 4. Repository層: データアクセス
// infrastructure/repository/userRepository.ts
async create(input: CreateUserInput & { passwordHash: string; uuid: string }): Promise<User> {
  const result = await db.insert(users).values({...}).returning();
  
  // DBレコードをEntityに変換
  return new User(
    result[0].uuid,
    result[0].name,
    Email.create(result[0].email),
    Password.create(result[0].passwordHash)
  );
}
```

## ディレクトリ構造

```
apps/api/src/
├── controller/              # Controller層
│   ├── auth/
│   │   ├── authController.ts      # HTTPハンドラー
│   │   └── auth.routes.ts         # OpenAPIルート定義
│   ├── category/
│   │   ├── categoryController.ts
│   │   └── category.routes.ts
│   ├── rule/
│   │   ├── ruleController.ts
│   │   └── rule.routes.ts
│   └── transaction/
│       ├── transactionController.ts
│       └── transaction.routes.ts
│
├── usecase/                 # Usecase層
│   ├── auth/
│   │   ├── loginUseCase.ts
│   │   ├── signupUseCase.ts
│   │   ├── getMeUseCase.ts
│   │   ├── refreshUseCase.ts
│   │   └── logoutUseCase.ts
│   ├── category/
│   │   ├── listCategoriesUseCase.ts
│   │   ├── createCategoryUseCase.ts
│   │   ├── updateCategoryUseCase.ts
│   │   └── deleteCategoryUseCase.ts
│   ├── rule/
│   │   ├── listRulesUseCase.ts
│   │   ├── createRuleUseCase.ts
│   │   ├── updateRuleUseCase.ts
│   │   └── deleteRuleUseCase.ts
│   └── transaction/
│       ├── listTransactionsUseCase.ts
│       ├── getTransactionSummaryUseCase.ts
│       ├── updateTransactionUseCase.ts
│       ├── reCategorizeTransactionsUseCase.ts
│       ├── getAvailableYearsUseCase.ts
│       └── uploadCsvUseCase.ts
│
├── service/                 # Service層
│   ├── auth/
│   │   ├── authService.ts         # 認証ビジネスロジック
│   │   ├── passwordService.ts     # パスワード処理
│   │   └── tokenService.ts        # トークン生成
│   ├── category/
│   │   └── categoryService.ts
│   ├── rule/
│   │   └── ruleService.ts
│   └── transaction/
│       ├── transactionService.ts
│       └── csvService.ts
│
├── domain/                  # Domain層
│   ├── entity/
│   │   ├── user.ts
│   │   ├── category.ts
│   │   ├── rule.ts
│   │   └── transaction.ts
│   └── repository/
│       ├── userRepository.ts           # IUserRepository
│       ├── tokenRepository.ts          # ITokenRepository
│       ├── categoryRepository.ts       # ICategoryRepository
│       ├── ruleRepository.ts           # IRuleRepository
│       └── transactionRepository.ts    # ITransactionRepository
│
├── infrastructure/          # Infrastructure層
│   ├── auth/
│   │   ├── jwt.ts                 # JWT生成・検証
│   │   └── cookie.ts              # Cookie操作
│   ├── csv/
│   │   └── categoryClassifier.ts  # CSV分類
│   ├── redis/
│   │   └── client.ts              # Redisクライアント
│   └── repository/
│       ├── userRepository.ts           # UserRepository
│       ├── tokenRepository.ts          # RedisTokenRepository
│       ├── categoryRepository.ts       # CategoryRepository
│       ├── ruleRepository.ts           # RuleRepository
│       └── transactionRepository.ts    # TransactionRepository
│
├── middleware/              # Hono ミドルウェア
│   └── auth.ts                # 認証ミドルウェア
│
├── db/                      # データベース
│   ├── index.ts
│   └── schema.ts
│
├── lib/                     # ユーティリティ
│   └── env.ts
│
├── types/                   # 型定義
│   └── hono.ts                # Hono 共通型
│
└── index.ts                 # エントリーポイント
```

## 各層の責務

### Controller層

**責務**:
- HTTPリクエストの受信とレスポンスの返却
- リクエストのバリデーション（Zodスキーマ）
- Usecaseの呼び出し
- **EntityをDTOに変換**
- HTTPステータスコードの決定
- エラーハンドリング（HTTP層）

**依存関係**:
- Usecase層に依存
- packages/sharedのDTOスキーマに依存

**ファイル構成**:
- `*Controller.ts`: HTTPハンドラーの実装
- `*.routes.ts`: OpenAPIルート定義

### Usecase層

**責務**:
- ユースケースのフロー制御
- 複数Serviceの組み合わせ
- トランザクション管理
- **Entityを返す**（DTOではない）
- ビジネス例外のスロー

**依存関係**:
- Service層に依存
- Domain層（Repository interface、Entity）に依存
- Infrastructure層のRepository実装に依存（DI）

**命名規則**:
- `*UseCase.ts`: 単一のユースケースを実装

### Service層

**責務**:
- 純粋なビジネスロジック
- 単一責任の原則に従う
- 再利用可能なロジック
- ドメインルールの実装

**依存関係**:
- Domain層（Repository interface、Entity）に依存
- 他のServiceに依存可能

**命名規則**:
- `*Service.ts`: 特定のドメインに関するビジネスロジック

**例**:
- `PasswordService`: パスワードのハッシュ化・検証
- `TokenService`: トークンの生成
- `AuthService`: 認証ロジック

### Domain層

**責務**:
- ドメインモデルの定義
- ビジネスルールの実装（Entity内）
- データアクセスの抽象化（Repository interface）

**依存関係**:
- packages/sharedのValueObjectに依存
- 他の層に依存しない（最も内側の層）

**構成**:
- `entity/`: Entityクラス
- `repository/`: Repository interface

### Infrastructure層

**責務**:
- 外部システムとの連携
- Repository interfaceの実装
- データベースアクセス
- 外部APIアクセス
- ファイルシステムアクセス

**依存関係**:
- Domain層（Repository interface、Entity）に依存
- 外部ライブラリに依存

**構成**:
- `repository/`: Repository実装
- `auth/`: 認証関連のインフラストラクチャ
- `csv/`: CSV処理
- `redis/`: Redisクライアント

## packages/shared の設計

### 構成

```
packages/shared/src/
├── schema/              # DTOスキーマ（Zod）
│   ├── user.ts
│   ├── category.ts
│   ├── rule.ts
│   └── transaction.ts
├── vo/                  # ValueObject
│   ├── email.ts
│   └── password.ts
└── index.ts             # エクスポート
```

### 役割

1. **DTOスキーマ**: フロントエンドとバックエンドで共有
2. **ValueObject**: ドメイン層で使用される不変の値オブジェクト
3. **バリデーション**: Zodスキーマによる型安全なバリデーション

### 依存関係

```json
{
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

## テスト戦略

### 単体テスト

各層ごとに独立してテスト：

1. **Service層**: ビジネスロジックのテスト（Repositoryをモック）
2. **Usecase層**: フロー制御のテスト（ServiceとRepositoryをモック）
3. **Repository層**: データアクセスのテスト（DBをモック）
4. **Controller層**: HTTPハンドラーのテスト（Usecaseをモック）

### 統合テスト

複数の層を組み合わせてテスト：

1. **API統合テスト**: Controller → Usecase → Service → Repository
2. **E2Eテスト**: フロントエンドとバックエンドの統合

## 依存性注入（DI）

現在は手動でDIを実装：

```typescript
// controller/auth/authController.ts
async login(c: Context) {
  // 手動DI
  const userRepository = new UserRepository();
  const tokenRepository = new RedisTokenRepository();
  const passwordService = new PasswordService();
  const authService = new AuthService(userRepository, passwordService);
  const tokenService = new TokenService();
  const loginUseCase = new LoginUseCase(
    authService,
    tokenService,
    tokenRepository
  );

  const result = await loginUseCase.execute(input);
  // ...
}
```

**将来の改善**: DIコンテナの導入を検討（例: tsyringe, InversifyJS）

## エラーハンドリング

### エラーの種類

1. **ビジネス例外**: Usecase/Service層でスロー
   - 例: `UserAlreadyExistsError`, `InvalidCredentialsError`

2. **HTTP例外**: Controller層で処理
   - ビジネス例外をHTTPステータスコードに変換

### エラーハンドリングのフロー

```typescript
// Usecase層: ビジネス例外をスロー
if (userExists) {
  throw new Error("User already exists");
}

// Controller層: HTTP例外に変換
try {
  const user = await signupUseCase.execute(input);
  return c.json(user.toResponse(), 201);
} catch (error) {
  if (error instanceof Error && error.message === "User already exists") {
    return c.json({ error: "User already exists" }, 409);
  }
  return c.json({ error: "Internal Server Error" }, 500);
}
```

## OpenAPI仕様

### ルート定義

各機能のルート定義は`controller/*/routes.ts`に配置：

```typescript
// controller/auth/auth.routes.ts
import { createRoute } from "@hono/zod-openapi";
import { CreateUserSchema, UserResponseSchema } from "@paypay-money-diary/shared";

export const signupRoute = createRoute({
  method: "post",
  path: "/auth/signup",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema, // packages/sharedのスキーマを使用
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: UserResponseSchema.openapi("SignupResponse"),
        },
      },
    },
  },
});
```

### スキーマの拡張

packages/sharedのスキーマに`.openapi()`でメタデータを付与：

```typescript
const UserSchema = UserResponseSchema.openapi("User");
```

## セキュリティ

### 認証

- **方式**: JWT + HttpOnly Cookie
- **トークン**: Access Token（短命）+ Refresh Token（長命）
- **保存**: Refresh TokenはRedisに保存

### パスワード

- **ハッシュ化**: bcryptjs（コスト: 10）
- **保存**: ハッシュ化されたパスワードのみDBに保存
- **レスポンス**: パスワードは絶対にAPIレスポンスに含めない

## パフォーマンス

### データベース

- **ORM**: Drizzle ORM
- **コネクションプール**: 環境変数で設定
- **インデックス**: 頻繁に検索されるカラムにインデックスを作成

### キャッシュ

- **Redis**: Refresh Tokenの保存
- **将来の改善**: クエリ結果のキャッシュ

## まとめ

このアーキテクチャ設計により、以下のメリットが得られます：

1. **テスタビリティ**: 各層を独立してテスト可能
2. **保守性**: 責務が明確で、変更の影響範囲が限定的
3. **再利用性**: Service層のビジネスロジックを複数のUsecaseで共有
4. **型安全性**: TypeScript + Zodによる完全な型安全性
5. **スケーラビリティ**: 各層を独立して拡張可能
6. **可読性**: 一貫したパターンで理解しやすい

このアーキテクチャは、クリーンアーキテクチャの原則に従いつつ、実用的で保守しやすい設計を目指しています。
