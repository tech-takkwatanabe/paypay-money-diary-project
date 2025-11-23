# Phase 1 Walkthrough: Frontend Visuals

## 概要
プロジェクトの基盤構築（Monorepo）と、クライアント要望の「月次・年次レポート」の可視化プロトタイプを実装しました。

## 実施内容

### 1. Monorepo 環境構築
- **Turborepo** を導入し、`apps/web` (Frontend), `apps/api` (Backend), `packages/*` の構成を作成しました。
- `pnpm-workspace.yaml` を設定し、ワークスペース管理を有効化しました。

### 2. フロントエンド基盤 (apps/web)
- **Next.js (App Router)** プロジェクトを作成。
- **Tailwind CSS** と **Shadcn UI** をセットアップし、モダンな UI 基盤を整えました。
- **Recharts** をインストールし、チャート描画環境を構築しました。

### 3. チャート実装
以下のコンポーネントを実装し、モックデータで表示を確認しました。

- **MonthlyExpensePieChart**: カテゴリ別の支出割合を表示する円グラフ。
- **AnnualExpenseBarChart**: 月ごとのカテゴリ別支出を表示する積み上げ棒グラフ。

### 4. ダッシュボード画面
- `/` (ルートページ) にダッシュボードを作成。
- KPI カード（今月の支出、年間支出など）とチャートを配置。
- レスポンシブデザインに対応。

## 動作確認方法

以下のコマンドで開発サーバーを起動し、ブラウザで `http://localhost:3000` にアクセスしてください。

```bash
pnpm dev
```

## 次のステップ (Phase 2)
- Hono バックエンド (`apps/api`) の本格実装。
- PostgreSQL データベースの構築と接続。
- CSV アップロード機能の実装。
