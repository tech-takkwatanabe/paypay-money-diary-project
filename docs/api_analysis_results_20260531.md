# Usecase層のDDD準拠分析レポート

## 結論

**「UsecaseがRepositoryを直接呼ぶこと自体はDDD違反ではない。ただし、このコードベースにはそれとは別の実質的な設計上の問題がある。」**

---

## 1. UsecaseからRepository直接呼出しはDDD違反か？

### 短い回答: いいえ、それ自体は違反ではない

DDDにおけるApplication Layer（≒ Usecase層）は、Domain Serviceを「必ず経由しなければならない」という制約はない。Usecase層の責務は**ユースケースの実行フローを組み立てること**であり、以下のように使い分けるのが正しい：

| 呼び出し先 | 使うべき場面 |
|---|---|
| **Repository（直接）** | 単純なCRUD、データ取得のみ |
| **Domain Service** | 複数のEntityやAggregate間にまたがるビジネスロジック |
| **Entity自体** | Entity内部で完結するビジネスロジック |

つまり [ListCategoriesUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/listCategoriesUseCase.ts#8-19) → `categoryRepository.findByUserId()` のような単純な取得は、間にServiceを挟む意味がなく、**むしろ正しい設計**と言える。

---

## 2. 実際に問題がある箇所

### 深刻度: 🔴 高

#### [ReorderCategoriesUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.ts#9-69) — インフラ層の漏洩

```typescript
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
```

Repository Interfaceすら使わず、Drizzle ORM（`db`, `categories`, `eq`, `and`）を直接importしている。これは**明確なアーキテクチャ違反**。Usecase層がインフラの実装詳細に直結しており、以下の問題を引き起こす：

- テスト不可能（Repositoryのモックが効かない）
- ORMの変更がUsecase層に波及
- ドメイン層・Repository層の抽象化が完全にバイパスされている

---

### 深刻度: 🟡 中

#### ビジネスロジックがUsecase層にインライン化されているケース

| UseCase | 問題点 |
|---|---|
| [createCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/createCategoryUseCase.ts) | 一意制約のエラーハンドリング（DB例外の解釈）がUsecase内に存在。本来ServiceまたはRepositoryの責務 |
| [updateCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/updateCategoryUseCase.ts) | Service（権限チェック）+ Repository（名前重複チェック・更新）の混在。名前重複チェックはServiceに移すべき |
| [deleteCategoryUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/deleteCategoryUseCase.ts) | Service（権限チェック）+ RuleRepository直接呼出し + ドメインルール判定がUsecaseに混在 |
| [signupUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/signupUseCase.ts) | UserRepository直接呼出し（create/delete）+ 手動ロールバックロジックがUsecaseにインライン |
| [createTransactionUsecase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/createTransactionUsecase.ts) | CategoryRepositoryで検索→TransactionRepositoryでcreateという2リポジトリ横断をServiceを介さず実行 |
| [deleteTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/deleteTransactionUseCase.ts) | `paymentMethod !== "手動"` というドメインルールがUsecase内にハードコード |
| [updateTransactionUseCase.ts](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/updateTransactionUseCase.ts) | 同上。手動/PayPay取引の更新可否ルールがUsecaseにべた書き |

---

### 深刻度: 🟢 低（適切な設計）

以下は、Repository直接呼出しが**妥当**なケース：

| UseCase | 理由 |
|---|---|
| [GetMeUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/getMeUseCase.ts#8-22) | 単純な取得。Serviceを挟む理由がない |
| [LogoutUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/auth/logoutUseCase.ts#3-10) | トークン削除のみ。ドメインロジックなし |
| [ListCategoriesUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/listCategoriesUseCase.ts#8-19) | 単純な一覧取得 |
| [ListRulesUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/rule/listRulesUseCase.ts#8-15) | 単純な一覧取得 |
| [GetAvailableYearsUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/getAvailableYearsUseCase.ts#3-11) | 単純な取得 |
| [ListTransactionsUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/listTransactionsUseCase.ts#4-37) | ページネーション計算程度。Serviceは不要 |
| [CreateRuleUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/rule/createRuleUseCase.ts#9-16) | 単純な作成 |
| [ReCategorizeTransactionsUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/transaction/reCategorizeTransactionsUseCase.ts#9-23) | Repository経由で委譲 |

---

## 3. Service層の現状と役割の整理

現在のService層は主に3つの責務を持っている：

| 責務 | 例 |
|---|---|
| **権限チェック** | [ensureUserCanAccess](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/category/categoryService.ts#11-29), [ensureUserCanDelete](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/service/rule/ruleService.ts#40-54) 等 |
| **認証ロジック** | `AuthService.authenticateUser` |
| **集計ロジック** | `TransactionService.calculateSummary` |

これらは適切にServiceとして分離されているが、**ドメインルール**（「手動取引のみ削除可」「その他カテゴリは削除不可」等）が一部Service、一部Usecaseに分散している点が一貫性に欠ける。

---

## 4. 総合的な見解

> UsecaseからRepositoryを直接呼ぶこと自体はDDD違反ではない。
> 問題の本質は **「ドメインロジックの配置が一貫していない」** こと。

具体的には：
1. **インフラ漏洩** — [ReorderCategoriesUseCase](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/src/usecase/category/reorderCategoriesUseCase.ts#9-69) が最優先の修正対象
2. **ドメインロジックの散在** — 「何がService/Entityの責務で、何がUsecaseの責務か」のルールが曖昧
3. **Entityの活用不足** — `belongsToUser()` のようなEntityメソッドは良いパターンだが、他のドメインルール（取引の更新可否判定など）はEntityに集約されていない
