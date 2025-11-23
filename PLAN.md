# 実装計画 (PLAN.md)

このドキュメントでは、**PayPay Money Diary** の開発ロードマップと具体的な実装手順を定義します。
ユーザーの要望に基づき、**フロントエンドの可視化（チャート表示）を最優先**で実装し、その後バックエンド連携へと進みます。

---

## Phase 1: プロジェクト基盤構築 & フロントエンド・プロトタイプ (Current Focus)

**目的**: クライアントに見せるための「月次レポート（円グラフ）」と「年次レポート（棒グラフ）」の見た目を最速で作成する。
**アプローチ**: バックエンドはまだ接続せず、モックデータを使用して UI を完成させる。

### 1.1 Monorepo 環境構築
- [ ] Turborepo による Monorepo セットアップ
- [ ] パッケージ構成の作成
    - `apps/web`: Next.js (Frontend)
    - `apps/api`: Hono (Backend - 枠だけ作成)
    - `packages/shared`: 共通型定義・設定
    - `packages/config`: Tailwind, ESLint などの共通設定

### 1.2 フロントエンド基盤 (apps/web)
- [ ] Next.js + Tailwind CSS + Shadcn UI のセットアップ
- [ ] テーマ設定 (フォント, カラーパレット)
- [ ] レイアウト作成 (ヘッダー, サイドバー, メインエリア)

### 1.3 チャート実装 (Recharts 使用想定)
- [ ] **月次レポート（円グラフ）**
    - [ ] コンポーネント作成 (`MonthlyExpensePieChart`)
    - [ ] モックデータ定義
    - [ ] カテゴリごとの色分け実装
- [ ] **年次レポート（棒グラフ）**
    - [ ] コンポーネント作成 (`AnnualExpenseBarChart`)
    - [ ] モックデータ定義
    - [ ] 積み上げ棒グラフ (Stacked Bar) の実装
    - [ ] 月平均ラインの表示

### 1.4 ダッシュボード画面構築
- [ ] ダッシュボードページ (`/dashboard`) の作成
- [ ] KPI カード（今月の支出、年間支出）の配置
- [ ] チャートコンポーネントの配置
- [ ] レスポンシブ対応確認

---

## Phase 2: バックエンド基盤 & データベース構築

**目的**: データを永続化するための基盤を整える。

### 2.1 Hono & Drizzle セットアップ (apps/api)
- [ ] Hono サーバー構築
- [ ] PostgreSQL (Docker) の用意
- [ ] Drizzle ORM のセットアップ

### 2.2 データベース設計 & マイグレーション
- [ ] スキーマ定義 (`users`, `transactions`, `categories`)
- [ ] マイグレーション実行

### 2.3 API 実装
- [ ] 取引履歴取得 API (`GET /transactions`)
- [ ] 集計データ取得 API (`GET /reports/monthly`, `GET /reports/annual`)

---

## Phase 3: 機能実装 & 統合

**目的**: 実際の CSV データを取り込み、アプリとして機能させる。

### 3.1 CSV アップロード機能
- [ ] ファイルアップロード UI 実装
- [ ] CSV 解析ロジック (Backend or Shared)
- [ ] バリデーション & DB 保存処理

### 3.2 フロントエンド連携
- [ ] モックデータを API 呼び出しに置き換え
- [ ] ローディング状態・エラーハンドリングの実装

### 3.3 カテゴリ管理機能
- [ ] カテゴリ編集画面
- [ ] 自動カテゴリ推定ロジック

---

## Phase 4: 認証 & 公開準備

- [ ] 認証機能 (Auth.js or Firebase or Custom)
- [ ] デプロイ設定 (Vercel / Cloudflare Workers 等)
