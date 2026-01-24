# CategoryInitializationService リファクタリング

## 概要

`CategoryInitializationService` を依存性注入パターンに対応させ、テスト可能でメンテナンス性の高い設計に改善しました。

## 主な変更点

### 1. サービスの依存性注入化

**変更前:**

```typescript
export class CategoryInitializationService {
  async initializeForUser(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // db を直接使用
    });
  }
}
```

**変更後:**

```typescript
export class CategoryInitializationService {
  constructor(
    private readonly categoryRepository: ICategoryRepository,
    private readonly ruleRepository: IRuleRepository,
    private readonly defaultCategoryRepository: IDefaultCategoryRepository,
    private readonly defaultCategoryRuleRepository: IDefaultCategoryRuleRepository
  ) {}

  async initializeForUser(userId: string): Promise<void> {
    // リポジトリを通じた操作
  }
}
```

**利点:**

- 依存関係が明示的
- テストでのモック化が容易
- 疎結合な設計

### 2. リポジトリの追加

#### DefaultCategoryRepository

- `DefaultCategoryRepository` インターフェース作成
- デフォルトカテゴリのデータアクセスを抽象化
- `findAll()`: すべてのデフォルトカテゴリを取得
- `findById()`: IDでカテゴリを検索

#### DefaultCategoryRuleRepository

- `DefaultCategoryRuleRepository` インターフェース作成
- デフォルトカテゴリルールのデータアクセスを抽象化
- `findAll()`: すべてのデフォルトルールを取得
- `findById()`: IDでルールを検索
- `findByCategoryId()`: カテゴリIDで関連ルールを検索

### 3. ドメイン層の整備

以下のインターフェースをドメイン層に追加:

```
apps/api/src/domain/repository/
  ├── defaultCategoryRepository.ts
  └── defaultCategoryRuleRepository.ts
```

### 4. インフラストラクチャ層の実装

以下の実装をインフラストラクチャ層に追加:

```
apps/api/src/infrastructure/repository/
  ├── defaultCategoryRepository.ts
  └── defaultCategoryRuleRepository.ts
```

### 5. コントローラーの更新

`AuthController.signup()` メソッドを修正し、すべてのリポジトリの依存性を注入:

```typescript
const categoryRepository = new CategoryRepository();
const ruleRepository = new RuleRepository();
const defaultCategoryRepository = new DefaultCategoryRepository();
const defaultCategoryRuleRepository = new DefaultCategoryRuleRepository();
const categoryInitializationService = new CategoryInitializationService(
  categoryRepository,
  ruleRepository,
  defaultCategoryRepository,
  defaultCategoryRuleRepository
);
```

## 包括的なテスト

`categoryInitializationService.test.ts` に11個のテストケースを作成:

1. **新規ユーザーの初期化** - 正常系の完全な初期化処理
2. **既に初期化済みユーザーのスキップ** - 重複初期化の防止
3. **空のデフォルトカテゴリの処理** - エッジケース対応
4. **カテゴリIDのマッピング** - デフォルトから新規ユーザーカテゴリへの正確な対応
5. **存在しないカテゴリへのルール除外** - 孤立したルールの適切な処理
6. **デフォルト値の保持** - displayOrder や icon の保全
7. **ユーザーIDの設定（カテゴリ）** - 全カテゴリに正しいuserIdが付与される
8. **ユーザーIDの設定（ルール）** - 全ルールに正しいuserIdが付与される
9. **特殊文字の処理** - 日本語や特殊文字を含む名前やキーワード
10. **処理順序の検証** - カテゴリがルール前に作成される
11. **リポジトリエラーの処理** - エラーが適切に伝搬される

### テスト実行結果

```
✓ 11 pass
✓ 0 fail
✓ 40 expect() calls
```

## アーキテクチャ改善

```
コントローラー層
     ↓
ユースケース層 (SignupUseCase)
     ↓
サービス層 (CategoryInitializationService)
     ↓
リポジトリ層 (インターフェース)
     ↓
インフラストラクチャ層 (実装)
```

## メリット

1. **テスト可能性** - すべての依存関係をモック化できる
2. **疎結合** - リポジトリ実装の変更がサービスに影響しない
3. **再利用性** - CategoryInitializationService を他のコンテキストで再利用可能
4. **保守性** - 依存関係が明示的で理解しやすい
5. **SOLID 原則** - 依存性逆転原則に準拠

## 今後の拡張

この構造により、以下の拡張が容易になります:

- キャッシング層の追加
- 複数のリポジトリ実装の切り替え
- トランザクション管理の一元化
- ロギング/監視機能の追加
