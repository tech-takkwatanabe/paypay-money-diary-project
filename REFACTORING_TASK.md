# apps/api アーキテクチャリファクタリング タスクリスト

> **設計ドキュメント**: 詳細なアーキテクチャ設計は [apps/api/ARCHITECTURE_DESIGN.md](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/apps/api/ARCHITECTURE_DESIGN.md) を参照してください。
> 
> **実装計画**: 詳細な実装計画は [REFACTORING_PLAN.md](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/REFACTORING_PLAN.md) を参照してください。


## フェーズ1: 基盤整備 (2-3時間)

### packages/shared の拡充
- [x] `packages/shared/package.json` に `zod` を依存関係として追加
- [x] `packages/shared/src/schema/category.ts` を作成
- [x] `packages/shared/src/schema/rule.ts` を作成
- [x] `packages/shared/src/schema/transaction.ts` を作成
- [x] `packages/shared/src/index.ts` を更新（新しいスキーマをエクスポート）
- [x] `pnpm install` を実行して依存関係をインストール

### apps/api の Domain層拡充
- [x] `apps/api/src/domain/entity/user.ts` を作成
- [x] `apps/api/src/domain/entity/category.ts` を作成
- [x] `apps/api/src/domain/entity/rule.ts` を作成
- [x] `apps/api/src/domain/entity/transaction.ts` を作成
- [x] `apps/api/src/domain/repository/categoryRepository.ts` を作成
- [x] `apps/api/src/domain/repository/ruleRepository.ts` を作成
- [x] `apps/api/src/domain/repository/transactionRepository.ts` を作成

### apps/api の Infrastructure層拡充
- [x] `apps/api/src/infrastructure/repository/categoryRepository.ts` を作成
- [x] `apps/api/src/infrastructure/repository/ruleRepository.ts` を作成
- [x] `apps/api/src/infrastructure/repository/transactionRepository.ts` を作成

### 検証
- [x] TypeScriptのビルドエラーがないことを確認
- [x] 既存のテストが通ることを確認

---

## フェーズ2: auth機能のリファクタリング (3-4時間)

### Service層の追加
- [x] `apps/api/src/service/auth/passwordService.ts` を作成
- [x] `apps/api/src/service/auth/tokenService.ts` を作成
- [x] `apps/api/src/service/auth/authService.ts` を作成

### Usecase層のリファクタリング
- [x] `apps/api/src/usecase/auth/loginUseCase.ts` をリファクタリング
- [x] `apps/api/src/usecase/auth/signupUseCase.ts` をリファクタリング
- [x] `apps/api/src/usecase/auth/getMeUseCase.ts` をリファクタリング
- [x] `apps/api/src/usecase/auth/refreshUseCase.ts` をリファクタリング
- [x] `apps/api/src/usecase/auth/logoutUseCase.ts` をリファクタリング

### Controller層の作成
- [x] `apps/api/src/controller/auth/` ディレクトリを作成
- [x] `apps/api/src/controller/auth/authController.ts` を作成
- [x] `apps/api/src/controller/auth/auth.routes.ts` を作成（`routes/auth.routes.ts`から移動）
- [x] `apps/api/src/interface/http/auth/login.ts` を削除
- [x] `apps/api/src/interface/http/auth/signup.ts` を削除
- [x] `apps/api/src/interface/http/auth/me.ts` を削除
- [x] `apps/api/src/interface/http/auth/refresh.ts` を削除
- [x] `apps/api/src/interface/http/auth/logout.ts` を削除
- [x] `apps/api/src/routes/auth.routes.ts` を削除

### テストファイルの修正
- [x] `apps/api/src/usecase/auth/loginUseCase.test.ts` を修正
- [x] `apps/api/src/usecase/auth/signupUseCase.test.ts` を修正
- [x] `apps/api/src/usecase/auth/getMeUseCase.test.ts` を修正
- [x] `apps/api/src/usecase/auth/refreshUseCase.test.ts` を修正
- [x] `apps/api/src/usecase/auth/logoutUseCase.test.ts` を修正
- [x] `apps/api/src/controller/auth/authController.test.ts` を作成（既存のテストを統合）
- [x] `apps/api/src/interface/http/auth/*.test.ts` を削除

### 検証
- [x] すべてのauth関連テストが通ることを確認
- [x] 手動でauth機能をテスト（登録、ログイン、ログアウト、トークン更新、ユーザー情報取得）
- [x] OpenAPI仕様が正しく生成されることを確認

---

## フェーズ3: category機能のリファクタリング (2-3時間)

### Service層の追加
- [x] `apps/api/src/service/category/categoryService.ts` を作成

### Usecase層の追加
- [x] `apps/api/src/usecase/category/listCategoriesUseCase.ts` を作成
- [x] `apps/api/src/usecase/category/createCategoryUseCase.ts` を作成
- [x] `apps/api/src/usecase/category/updateCategoryUseCase.ts` を作成
- [x] `apps/api/src/usecase/category/deleteCategoryUseCase.ts` を作成

### Controller層の作成
- [x] `apps/api/src/controller/category/` ディレクトリを作成
- [x] `apps/api/src/controller/category/categoryController.ts` を作成
- [x] `apps/api/src/controller/category/category.routes.ts` を作成
- [x] `apps/api/src/interface/http/category/list.ts` を削除
- [x] `apps/api/src/interface/http/category/create.ts` を削除
- [x] `apps/api/src/interface/http/category/update.ts` を削除
- [x] `apps/api/src/interface/http/category/delete.ts` を削除
- [x] `apps/api/src/routes/category.routes.ts` を削除

### テストファイルの作成・修正
- [x] `apps/api/src/usecase/category/listCategoriesUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/category/createCategoryUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/category/updateCategoryUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/category/deleteCategoryUseCase.test.ts` を作成
- [x] `apps/api/src/controller/category/categoryController.test.ts` を作成
- [x] `apps/api/src/interface/http/category/*.test.ts` を削除

### 検証
- [x] すべてのcategory関連テストが通ることを確認
- [x] 手動でcategory機能をテスト（一覧、作成、更新、削除）
- [x] OpenAPI仕様が正しく生成されることを確認

---

## フェーズ4: rule機能のリファクタリング (2-3時間)

### Service層の追加
- [x] `apps/api/src/service/rule/ruleService.ts` を作成

### Usecase層の追加
- [x] `apps/api/src/usecase/rule/listRulesUseCase.ts` を作成
- [x] `apps/api/src/usecase/rule/createRuleUseCase.ts` を作成
- [x] `apps/api/src/usecase/rule/updateRuleUseCase.ts` を作成
- [x] `apps/api/src/usecase/rule/deleteRuleUseCase.ts` を作成

### Controller層の作成
- [x] `apps/api/src/controller/rule/` ディレクトリを作成
- [x] `apps/api/src/controller/rule/ruleController.ts` を作成
- [x] `apps/api/src/controller/rule/rule.routes.ts` を作成
- [x] `apps/api/src/interface/http/rule/list.ts` を削除
- [x] `apps/api/src/interface/http/rule/create.ts` を削除
- [x] `apps/api/src/interface/http/rule/update.ts` を削除
- [x] `apps/api/src/interface/http/rule/delete.ts` を削除
- [x] `apps/api/src/routes/rule.routes.ts` を削除

### テストファイルの作成・修正
- [x] `apps/api/src/usecase/rule/listRulesUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/rule/createRuleUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/rule/updateRuleUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/rule/deleteRuleUseCase.test.ts` を作成
- [x] `apps/api/src/controller/rule/ruleController.test.ts` を作成
- [x] `apps/api/src/interface/http/rule/*.test.ts` を削除

### 検証
- [x] すべてのrule関連テストが通ることを確認
- [x] 手動でrule機能をテスト（一覧、作成、更新、削除）
- [x] OpenAPI仕様が正しく生成されることを確認

---

## フェーズ5: transaction機能のリファクタリング (3-4時間)

### Service層の追加
- [x] `apps/api/src/service/transaction/transactionService.ts` を作成
- [x] `apps/api/src/service/transaction/csvService.ts` を作成

### Usecase層の追加・修正
- [x] `apps/api/src/usecase/transaction/listTransactionsUseCase.ts` を作成
- [x] `apps/api/src/usecase/transaction/getTransactionSummaryUseCase.ts` を作成
- [x] `apps/api/src/usecase/transaction/updateTransactionUseCase.ts` を作成
- [x] `apps/api/src/usecase/transaction/reCategorizeTransactionsUseCase.ts` を作成
- [x] `apps/api/src/usecase/transaction/getAvailableYearsUseCase.ts` を作成
- [x] `apps/api/src/usecase/transaction/uploadCsvUseCase.ts` をリファクタリング

### Controller層の作成
- [x] `apps/api/src/controller/transaction/` ディレクトリを作成
- [x] `apps/api/src/controller/transaction/transactionController.ts` を作成
- [x] `apps/api/src/controller/transaction/transaction.routes.ts` を作成
- [x] `apps/api/src/interface/http/transaction/list.ts` を削除
- [x] `apps/api/src/interface/http/transaction/summary.ts` を削除
- [x] `apps/api/src/interface/http/transaction/update.ts` を削除
- [x] `apps/api/src/interface/http/transaction/reCategorize.ts` を削除
- [x] `apps/api/src/interface/http/transaction/availableYears.ts` を削除
- [x] `apps/api/src/interface/http/transaction/upload.ts` を削除
- [x] `apps/api/src/routes/transaction.routes.ts` を削除

### テストファイルの作成・修正
- [x] `apps/api/src/usecase/transaction/listTransactionsUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/transaction/getTransactionSummaryUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/transaction/updateTransactionUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/transaction/reCategorizeTransactionsUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/transaction/getAvailableYearsUseCase.test.ts` を作成
- [x] `apps/api/src/usecase/transaction/uploadCsvUseCase.test.ts` を修正
- [x] `apps/api/src/controller/transaction/transactionController.test.ts` を作成
- [x] `apps/api/src/interface/http/transaction/*.test.ts` を削除

### 検証
- [x] すべてのtransaction関連テストが通ることを確認
- [x] 手動でtransaction機能をテスト（一覧、集計、更新、CSV アップロード、再カテゴライズ、利用可能年度取得）
- [x] OpenAPI仕様が正しく生成されることを確認

---

## フェーズ6: フロントエンドの対応 (2-3時間)

### apps/web の依存関係追加
- [x] `apps/web/package.json` に `@paypay-money-diary/shared` と `zod` を追加
- [x] `pnpm install` を実行

### フロントエンドでのZodバリデーション実装
- [x] `apps/web/src/app/signup/page.tsx` を修正（Zodバリデーションを実装）
- [x] `apps/web/src/app/login/page.tsx` を修正（Zodバリデーションを実装）

### 検証
- [x] フロントエンドのビルドエラーがないことを確認
- [x] 手動でフロントエンドの動作をテスト（登録、ログイン）
- [x] バリデーションエラーメッセージが正しく表示されることを確認

---

## フェーズ7: クリーンアップと最終調整 (1-2時間)

### 不要なディレクトリの削除
- [x] `apps/api/src/interface/http/` ディレクトリを削除
- [x] `apps/api/src/routes/` ディレクトリを削除

### エントリーポイントの修正
- [x] `apps/api/src/index.ts` を修正（インポートパスを `controller/` に変更）

### ドキュメントの更新
- [x] `apps/api/ARCHITECTURE.md` を作成（新しいアーキテクチャの説明）
- [x] `apps/api/README.md` を更新（アーキテクチャの説明を更新）

### 最終検証
- [x] すべてのテストが通ることを確認（`pnpm test`）
- [x] ビルドが成功することを確認（`pnpm build`）
- [x] OpenAPI仕様が正しく生成されることを確認
- [x] 手動ですべての機能をテスト
- [x] フロントエンドとバックエンドの統合テスト

---

## 完了条件

- [x] すべてのテストが通る
- [x] ビルドが成功する
- [x] OpenAPI仕様が正しく生成される
- [x] すべての機能が正常に動作する
- [x] フロントエンドとバックエンドが正しく連携する
- [x] ドキュメントが更新されている
- [x] コードレビューが完了している

---

## 備考

- 各フェーズ完了後にコミットすることを推奨
- 問題が発生した場合は、前のフェーズに戻れるようにブランチを作成
- 各フェーズで手動テストを実施し、動作確認を行う
