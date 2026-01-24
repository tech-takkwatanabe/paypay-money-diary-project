# カスタムルールの適用について

## 質問

カスタムルールやカスタムカテゴリーを多数作った場合、新しく次の年のCSVをアップロードした時に、そのルールはちゃんと適用されますか？

## 回答

**はい、適用されます。**

カスタムルールは、CSVアップロード時に毎回適用されます。年度に関係なく、ユーザーが作成したすべてのカスタムルールが新しいCSVデータに対して適用されます。

## 仕組み

### CSVアップロードのフロー

1. **CSVファイルをパース**
   - PayPayのCSVファイルを読み込み、取引データを抽出

2. **カテゴリを割り当て** ← ここでカスタムルールが適用される
   - `CsvService.assignCategories()` メソッドが呼び出される
   - ユーザーのカスタムルールとシステムルールを取得
   - 各取引の店舗名（merchant）に対してルールをマッチング

3. **重複チェック**
   - `externalTransactionId`（PayPayの取引番号）で重複を確認
   - 既存データはスキップ

4. **新規データのみをインポート**
   - カテゴリが割り当てられた状態でデータベースに保存

### カテゴリ割り当てのロジック

```typescript
// apps/api/src/service/transaction/csvService.ts

async assignCategories(expenses: ParsedExpense[], userId: string): Promise<Map<string, string | null>> {
  // 1. ユーザーのカスタムルールとシステムルールを取得
  const rules = await this.ruleRepository.findByUserId(userId);
  const categories = await this.categoryRepository.findByUserId(userId);
  const defaultCategory = categories.find((c) => c.name === "その他");
  const defaultCategoryId = defaultCategory?.id ?? null;

  const result = new Map<string, string | null>();

  // 2. 各取引に対してルールをマッチング
  for (const expense of expenses) {
    if (result.has(expense.merchant)) continue; // 同じ店舗は1回だけ処理

    // 3. 店舗名にマッチするルールを検索
    const matchedRule = rules.find((rule) =>
      expense.merchant.toLowerCase().includes(rule.keyword.toLowerCase())
    );

    // 4. マッチしたルールのカテゴリ、または「その他」カテゴリを割り当て
    result.set(expense.merchant, matchedRule?.categoryId ?? defaultCategoryId);
  }

  return result;
}
```

### ルールの取得

`RuleRepository.findByUserId()` は以下のルールを取得します：

- **ユーザーのカスタムルール** (`userId` が一致するもの)
- **システム共通ルール** (`userId` が `NULL` のもの)

```typescript
// apps/api/src/infrastructure/repository/ruleRepository.ts

async findByUserId(userId: string): Promise<Rule[]> {
  const results = await db
    .select({ /* ... */ })
    .from(categoryRules)
    .leftJoin(categories, eq(categoryRules.categoryId, categories.id))
    .where(or(eq(categoryRules.userId, userId), isNull(categoryRules.userId)))
    .orderBy(categoryRules.priority, categoryRules.keyword);
  // ...
}
```

## 重要なポイント

### ✅ 年度に依存しない

カスタムルールは**年度に依存せず**、すべてのCSVアップロードに適用されます。

- 2024年のCSVをアップロード → カスタムルールが適用される
- 2025年のCSVをアップロード → **同じカスタムルールが適用される**
- 2026年のCSVをアップロード → **同じカスタムルールが適用される**

### ✅ ルールの優先順位

複数のルールが同じ店舗名にマッチする場合、**最初に見つかったルール**が適用されます。

現在の実装では、`priority`フィールドと`keyword`フィールドで昇順ソートされています。

```typescript
.orderBy(categoryRules.priority, categoryRules.keyword);
```

これは、`priority`の値が**小さいほど優先度が高い**ことを意味します（1位、2位、3位...という考え方）。

### ✅ システムルールとカスタムルール

- **システムルール**: すべてのユーザーに適用される共通ルール（`userId` が `NULL`）
- **カスタムルール**: 特定のユーザーのみに適用されるルール（`userId` が設定されている）

両方のルールが同時に取得され、`priority`順に適用されます。

### ✅ 大文字・小文字を区別しない

ルールのマッチングは**大文字・小文字を区別しません**。

```typescript
expense.merchant.toLowerCase().includes(rule.keyword.toLowerCase());
```

例：

- ルール: `"amazon"` → 店舗名: `"Amazon.co.jp"` ✅ マッチ
- ルール: `"STARBUCKS"` → 店舗名: `"Starbucks Coffee"` ✅ マッチ

## 実際の使用例

### シナリオ

1. **2024年1月**: ユーザーがカスタムルールを作成
   - `"セブン"` → `"コンビニ"`カテゴリ
   - `"Amazon"` → `"ショッピング"`カテゴリ

2. **2024年12月**: 2024年のCSVをアップロード
   - セブンイレブンの取引 → `"コンビニ"`カテゴリに自動分類 ✅
   - Amazonの取引 → `"ショッピング"`カテゴリに自動分類 ✅

3. **2025年1月**: 2025年のCSVをアップロード
   - セブンイレブンの取引 → `"コンビニ"`カテゴリに自動分類 ✅
   - Amazonの取引 → `"ショッピング"`カテゴリに自動分類 ✅
   - **カスタムルールは引き続き適用される**

## まとめ

- ✅ カスタムルールは年度に関係なく適用される
- ✅ 新しい年のCSVをアップロードしても、既存のカスタムルールが自動的に適用される
- ✅ ルールは一度作成すれば、すべての新規CSVアップロードに適用される
- ✅ ルールの追加・変更は、次回のCSVアップロードから反映される

**結論**: カスタムルールを作成しておけば、次の年のCSVをアップロードした時も自動的にカテゴリが割り当てられます。毎年ルールを再設定する必要はありません。
