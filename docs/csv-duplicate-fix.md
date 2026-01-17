# CSVアップロード重複チェック修正

## 問題の概要

同じ年のCSVを再度インポートした際、データが重複して登録されてしまう問題が報告されました。

## 原因

CSVアップロード時に、`externalTransactionId`（PayPayの取引番号）をデータベースに保存していなかったため、重複チェックが機能していませんでした。

### 具体的な問題箇所

1. **`TransactionRepository.create`メソッド**
   - `externalTransactionId`パラメータが定義されていなかった
   - データベースへの挿入時に`externalTransactionId`を保存していなかった

2. **`UploadCsvUseCase`**
   - `create`メソッド呼び出し時に`externalTransactionId`を渡していなかった

3. **結果**
   - データベースの`expenses`テーブルの`external_transaction_id`カラムが常に`NULL`になっていた
   - `existsByExternalId`メソッドでの重複チェックが機能せず、同じデータが何度もインポートされていた

## 修正内容

### 1. インターフェースの更新

**ファイル**: `apps/api/src/domain/repository/transactionRepository.ts`

- `create`メソッドに`externalTransactionId?: string`パラメータを追加
- `createMany`メソッドにも同様に追加（一貫性のため）

### 2. リポジトリ実装の更新

**ファイル**: `apps/api/src/infrastructure/repository/transactionRepository.ts`

- `create`メソッドで`externalTransactionId`をデータベースに保存するように修正
- `createMany`メソッドでも同様に修正

```typescript
// 修正前
.values({
  userId: transaction.userId,
  transactionDate: transaction.date,
  merchant: transaction.description,
  amount: transaction.amount,
  categoryId: transaction.categoryId,
})

// 修正後
.values({
  userId: transaction.userId,
  transactionDate: transaction.date,
  merchant: transaction.description,
  amount: transaction.amount,
  categoryId: transaction.categoryId,
  externalTransactionId: transaction.externalTransactionId, // 追加
})
```

### 3. ユースケースの更新

**ファイル**: `apps/api/src/usecase/transaction/uploadCsvUseCase.ts`

- `create`メソッド呼び出し時に`externalTransactionId`を渡すように修正

```typescript
await this.transactionRepository.create({
  userId,
  date: expense.transactionDate,
  description: expense.merchant,
  amount: expense.amount,
  categoryId: categoryMap.get(expense.merchant) ?? "",
  categoryName: "",
  categoryColor: "",
  displayOrder: 100,
  externalTransactionId: expense.externalTransactionId, // 追加
});
```

### 4. テストの追加

**ファイル**: `apps/api/src/infrastructure/repository/transactionRepository.test.ts`

- `externalTransactionId`を含むトランザクション作成のテストケースを追加
- `existsByExternalId`メソッドのテストケースを追加（存在する場合/しない場合）

## 動作確認

### 重複チェックの仕組み

1. CSVファイルから取引データを読み込む際、PayPayの`transactionId`を`externalTransactionId`として抽出
2. 各取引をインポートする前に、`existsByExternalId`メソッドで重複をチェック
3. 既に同じ`externalTransactionId`が存在する場合はスキップ
4. 新規の取引のみをデータベースに保存

### データベース制約

`expenses`テーブルには以下のUNIQUE制約が設定されています：

```sql
UNIQUE (user_id, external_transaction_id)
```

これにより、同じユーザーが同じ`externalTransactionId`を持つ取引を重複して登録することを防ぎます。

## テスト結果

- ✅ 全166テストが成功
- ✅ 型チェックが成功
- ✅ 重複チェックのユニットテストが追加され、正常に動作

## 影響範囲

- CSVアップロード機能のみに影響
- 既存のトランザクション作成機能（手動作成など）には影響なし
- `externalTransactionId`はオプショナルパラメータのため、後方互換性あり

## 今後の対応

既存のユーザーで重複データが登録されている場合は、以下の対応が必要になる可能性があります：

1. 重複データの検出と削除スクリプトの作成
2. ユーザーへの通知と対応方法の案内
