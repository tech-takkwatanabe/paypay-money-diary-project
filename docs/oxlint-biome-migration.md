# ESLint+Prettier から Oxlint+Biome への移行完了報告

本ドキュメントは、プロジェクトのリンター・フォーマッターを ESLint+Prettier から Oxlint+Biome へ移行した際の実装完了報告書です。

## 実施した変更内容

1. **ルールの移行と新しい設定の導入**
   - 新たに `biome.json` を作成し、Prettier の設定（lineWidth: 120, trailingCommas: es5 等）を移植しました。また、TailwindCSS 向けのパーサー有効化、および `vcs` 連携による無視リストの統合を行いました。
   - `apps/api` および `apps/web` に `.oxlintrc.json` を作成し、不要な変数のオフ（no-unused-vars）や、TS 側の Any 警告など、既存の実装ルールを反映させました。
2. **パッケージの置換とクリーンアップ**
   - 各アプリの `package.json` から `eslint`, `prettier`, `@paypay-money-diary/eslint-config`, `eslint-config-next` 等の設定をすべて削除し、`oxlint`, `@biomejs/biome` へ置き換えました。
   - 不要となった `packages/eslint` ワークスペースおよび不要なオーバーライド設定を削除しました。
3. **IDE設定の更新**
   - `.vscode/settings.json` のデフォルトフォーマッターを `"biomejs.biome"` へ変更しました。
   - チーム内で使用推奨となる拡張機能リストとして `.vscode/extensions.json` を作成しました。
4. **一括フォーマットの実行と Blame 保護の準備**
   - `biome format --write .` を実行し、全ファイルに対する統一フォーマットが完了しました。
   - 大枠の再フォーマットによる `git blame` 影響を避けるため、`.git-blame-ignore-revs` のひな形を作成しました。

## 検証結果

以下の通り、動作検証はすべて正常にパスしています。

1. **リンター (`pnpm lint`)**
   - `oxlint` コマンドおよび `pnpm type-check` の並行実行がエラーなし (`Exit code: 0`) で完了しました。
2. **フォーマッター (`pnpm fmt`)**
   - `biome format --write .` にて全 294 ファイルのフォーマットが 28ms で完了し、解析エラーや未対応の構文が存在しないことを確認しました（Exit code: 0）。
3. **ユニットテスト (`pnpm test`)**
   - 既存のコンポーネント用・UI用テストスイート 190 件すべてが正常に動作・パス（`Passed`）することを確認しました。
