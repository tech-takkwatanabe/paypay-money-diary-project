# Usecase層リファクタリング計画

Usecase層のDDD準拠分析で検出された深刻度🔴高・🟡中の問題を修正する。

## User Review Required

> [!IMPORTANT]
> このリファクタリングは既存の外部挙動（APIレスポンス）を一切変更しない純粋な内部リファクタリング。テスト修正を含む。

> [!WARNING]
> [ReorderCategoriesUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.ts#9-69)のリファクタリングでは、[ICategoryRepository](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/categoryRepository.ts#8-48)にメソッド追加が必要。インフラ実装の修正も伴う。

---

## Phase 1: 🔴 ReorderCategoriesUseCase — インフラ漏洩の解消

Drizzle ORM直接使用をRepository Interface経由に変更する。

---

### Domain Layer

#### [MODIFY] [categoryRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/categoryRepository.ts)

`reorder` メソッドを追加:
```typescript
reorder(userId: string, categoryIds: string[]): Promise<void>;
```

---

### Infrastructure Layer

#### [MODIFY] infrastructure/repository/categoryRepository.ts

`reorder` メソッドを実装。現在 [ReorderCategoriesUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.ts#9-69) にあるDrizzle ORMのトランザクション処理をここに移動。バリデーションロジック（重複チェック、「その他」除外等）はUsecase層に残す。

---

### Usecase Layer

#### [MODIFY] [reorderCategoriesUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.ts)

- `import { db }`, `import { categories }`, `import { eq, and }` を削除
- [ICategoryRepository](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/categoryRepository.ts#8-48) をDIで注入
- バリデーションロジック（重複、権限、完全性チェック）は [CategoryService](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/category/categoryService.ts#8-60) に移動
- DB操作は `categoryRepository.reorder()` に委譲

---

### Test Layer

#### [MODIFY] [reorderCategoriesUseCase.test.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.test.ts)

- `mock.module("@/db")` を削除
- 他のUsecaseテストと同じパターン（Repository Interface + CategoryService モック）に統一

---

## Phase 2: 🟡 Transaction Entityへのドメインルール集約

[deleteTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/deleteTransactionUseCase.ts) と [updateTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/updateTransactionUseCase.ts) に散在する手動取引の判定ルールをEntityに集約。

---

### Domain Layer

#### [MODIFY] [transaction.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/transaction.ts)

以下のドメインメソッドを追加:
```typescript
/** 手動入力の取引かどうか */
isManualEntry(): boolean {
  return this.paymentMethod === "手動";
}

/** 削除可能かどうか */
canDelete(): boolean {
  return this.isManualEntry();
}

/** 指定フィールドの更新可否を判定 */
canUpdateField(field: "amount" | "description" | "date"): boolean {
  if (field === "amount" || field === "description" || field === "date") {
    return this.isManualEntry();
  }
  return true;
}
```

---

### Usecase Layer

#### [MODIFY] [deleteTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/deleteTransactionUseCase.ts)

```diff
-    if (transaction.paymentMethod !== "手動") {
-      throw new Error("Forbidden: Only cash transactions can be deleted");
-    }
+    if (!transaction.canDelete()) {
+      throw new Error("Forbidden: Only cash transactions can be deleted");
+    }
```

#### [MODIFY] [updateTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/updateTransactionUseCase.ts)

```diff
-    if (input.amount !== undefined && transaction.paymentMethod !== "手動") {
+    if (input.amount !== undefined && !transaction.canUpdateField("amount")) {
...
-    if (input.description !== undefined && transaction.paymentMethod !== "手動") {
+    if (input.description !== undefined && !transaction.canUpdateField("description")) {
...
-    if (input.date !== undefined && transaction.paymentMethod !== "手動") {
+    if (input.date !== undefined && !transaction.canUpdateField("date")) {
```

---

## Phase 3: 🟡 CategoryService への責務集約

Usecase内に散在するカテゴリ関連のドメインルールを [CategoryService](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/category/categoryService.ts#8-60) に移動。

---

### Service Layer

#### [MODIFY] [categoryService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/category/categoryService.ts)

名前重複チェックメソッドを追加:
```typescript
async ensureNameIsUnique(userId: string, name: string, excludeId?: string): Promise<void> {
  const existing = await this.categoryRepository.findByName(userId, name);
  if (existing && existing.id !== excludeId) {
    throw new Error("Category with this name already exists");
  }
}
```

---

### Usecase Layer

#### [MODIFY] [updateCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/updateCategoryUseCase.ts)

名前重複チェックを `categoryService.ensureNameIsUnique()` に委譲。`categoryRepository` の直接依存を削除:
```diff
-    if (input.name !== undefined) {
-      const existing = await this.categoryRepository.findByName(userId, input.name);
-      if (existing && existing.id !== categoryId) {
-        throw new Error("Category with this name already exists");
-      }
-    }
+    if (input.name !== undefined) {
+      await this.categoryService.ensureNameIsUnique(userId, input.name, categoryId);
+    }
```

#### [MODIFY] [deleteCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/deleteCategoryUseCase.ts)

Entity の [canDelete()](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/category.ts#56-65) メソッドを活用し、ルール確認を CategoryService に委譲:
```diff
-    const rules = await this.ruleRepository.findByCategoryId(categoryId, userId);
-    if (rules.length > 0) {
-      throw new Error("Cannot delete category linked to rules...");
-    }
-    if (_category.hasTransactions) {
-      throw new Error("Cannot delete category with existing transactions...");
-    }
+    if (!category.canDelete()) {
+      if (category.hasRules) {
+        throw new Error("Cannot delete category linked to rules...");
+      }
+      if (category.hasTransactions) {
+        throw new Error("Cannot delete category with existing transactions...");
+      }
+    }
```
`IRuleRepository` の直接依存を削除。

---

## Phase 4: 🟡 SignupUseCase の整理

#### [MODIFY] [signupUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/signupUseCase.ts)

変更不要。`UserRepository.create` / [delete](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/categoryRepository.ts#43-47) の直接呼出しは、ユーザーエンティティの永続化という単純なCRUD操作であり、Service層を挟む意味がない。ロールバック処理もトランザクション管理としてUsecase層の正当な責務。

---

## 変更概要

| ファイル | 変更内容 |
|---|---|
| [domain/entity/transaction.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/transaction.ts) | `isManualEntry()`, [canDelete()](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/entity/category.ts#56-65), `canUpdateField()` 追加 |
| [domain/repository/categoryRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/domain/repository/categoryRepository.ts) | `reorder()` メソッド追加 |
| [infrastructure/repository/categoryRepository.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/infrastructure/repository/categoryRepository.ts) | `reorder()` 実装 |
| [service/category/categoryService.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/category/categoryService.ts) | `ensureNameIsUnique()` 追加 |
| [usecase/category/reorderCategoriesUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.ts) | Drizzle直接使用を撤廃、DI化 |
| [usecase/category/reorderCategoriesUseCase.test.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.test.ts) | テスト全面書き換え |
| [usecase/category/updateCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/updateCategoryUseCase.ts) | 名前重複チェックをService委譲 |
| [usecase/category/updateCategoryUseCase.test.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/updateCategoryUseCase.test.ts) | テスト調整 |
| [usecase/category/deleteCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/deleteCategoryUseCase.ts) | RuleRepository直接依存を削除、Entity活用 |
| [usecase/category/deleteCategoryUseCase.test.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/deleteCategoryUseCase.test.ts) | テスト調整 |
| [usecase/transaction/deleteTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/deleteTransactionUseCase.ts) | Entity メソッド使用に変更 |
| [usecase/transaction/updateTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/updateTransactionUseCase.ts) | Entity メソッド使用に変更 |

---

## Verification Plan

### Automated Tests

既存のテストスイートで全体の回帰を確認:

```bash
cd /Users/watanabetaku/htdocs/paypay-money-diary-project && pnpm test
```

個別確認:
```bash
# Phase 1
pnpm --filter api test -- src/usecase/category/reorderCategoriesUseCase.test.ts

# Phase 2
pnpm --filter api test -- src/usecase/transaction/deleteTransactionUseCase.test.ts
pnpm --filter api test -- src/usecase/transaction/updateTransactionUseCase.test.ts

# Phase 3
pnpm --filter api test -- src/usecase/category/deleteCategoryUseCase.test.ts
pnpm --filter api test -- src/usecase/category/updateCategoryUseCase.test.ts
```

### Lint Check
```bash
pnpm lint
```
