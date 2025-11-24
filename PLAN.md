# 実装計画 (PLAN.md)

このドキュメントでは、**PayPay Money Diary** の開発ロードマップと具体的な実装手順を定義します。
ユーザーの要望に基づき、**フロントエンドの可視化（チャート表示）を最優先**で実装し、その後バックエンド連携へと進みます。

---

## Phase 1: プロジェクト基盤構築 & フロントエンド・プロトタイプ (Current Focus)

**目的**: クライアントに見せるための「月次レポート（円グラフ）」と「年次レポート（棒グラフ）」の見た目を最速で作成する。
**アプローチ**: バックエンドはまだ接続せず、モックデータを使用して UI を完成させる。

### 1.1 Monorepo 環境構築
- [x] Turborepo による Monorepo セットアップ
- [x] パッケージ構成の作成
    - `apps/web`: Next.js (Frontend)
    - `apps/api`: Hono (Backend - 枠だけ作成)
    - `packages/shared`: 共通型定義・設定
    - `packages/config`: Tailwind, ESLint などの共通設定

### 1.2 フロントエンド基盤 (apps/web)
- [x] Next.js + Tailwind CSS + Shadcn UI のセットアップ
- [x] テーマ設定 (フォント, カラーパレット)
- [x] レイアウト作成 (ヘッダー, サイドバー, メインエリア)

### 1.3 チャート実装 (Recharts 使用想定)
- [x] **月次レポート（円グラフ）**
    - [x] コンポーネント作成 (`MonthlyExpensePieChart`)
    - [x] モックデータ定義
    - [x] カテゴリごとの色分け実装
- [x] **年次レポート（棒グラフ）**
    - [x] コンポーネント作成 (`AnnualExpenseBarChart`)
    - [x] モックデータ定義
    - [x] 積み上げ棒グラフ (Stacked Bar) の実装
    - [x] 月平均ラインの表示

### 1.4 ダッシュボード画面構築
- [x] ダッシュボードページ (`/dashboard`) の作成
- [x] KPI カード（今月の支出、年間支出）の配置
- [x] チャートコンポーネントの配置
- [x] レスポンシブ対応確認

---

## Phase 2: 認証機能 & 共通スキーマ整備 (New Priority)

**目的**: ユーザー認証基盤を構築し、`userId` に紐づいたデータ管理を可能にする。また、DDD を意識したバックエンド構成と共通型定義を整備する。

### 2.1 共通パッケージ整備 (packages/shared)
- [x] ディレクトリ構成の整理 (`src/types`, `src/schema`, `src/vo`)
- [x] **ValueObject & Zod Schema 実装**
    - [x] `Email` VO & Schema
    - [x] `User` Entity & Schema
    - [x] `Password` VO (バリデーションルール)
    - [x] `UserResponse` 型 (API レスポンス用)

### 2.2 インフラ & 開発環境 (Docker)
- [x] `docker-compose.yml` 作成 (PostgreSQL, Redis)
- [x] `Makefile` 作成 (`make init`, `make up` 等)
- [x] 環境変数設定 (`.env`)
- [x] HTTPS 設定 (TLS 証明書)

### 2.3 バックエンド基盤 (apps/api - Hono + DDD)
- [x] アーキテクチャ構成 (Clean Architecture)
    - `src/domain`, `src/usecase`, `src/interface`, `src/infrastructure`
- [x] **Drizzle ORM** セットアップ (PostgreSQL 接続)
- [x] **Redis** 接続設定 (リフレッシュトークン用)
- [x] マイグレーション設定 & `users` テーブル作成
- [x] ESLint 共通化 (packages/eslint)
- [x] パスエイリアス設定 (`@/*`)

### 2.4 認証 API 実装
- [ ] **JWT** ユーティリティ実装 (Sign, Verify)
- [ ] **API エンドポイント実装**
    - [x] `POST /api/auth/signup` (登録) ✅
    - [ ] `POST /api/auth/login` (ログイン)
        - bcrypt でパスワード検証
        - JWT トークン生成 (access + refresh)
        - Redis にリフレッシュトークン保存
    - [ ] `POST /api/auth/refresh` (トークン更新)
        - リフレッシュトークン検証
        - 新しいアクセストークン発行
    - [ ] `POST /api/auth/logout` (ログアウト)
        - Redis からリフレッシュトークン削除
    - [ ] `GET /api/auth/me` (ユーザー情報取得)
        - JWT 認証ミドルウェア実装
        - 認証済みユーザー情報返却
- [ ] **OpenAPI (Swagger)** 定義 & 自動生成

---

## Phase 3: 家計簿機能実装 (Backend & Frontend Integration)

**目的**: 認証済みの状態で CSV アップロードとチャート表示を実現する。

### 3.1 取引データ API (Backend)
- [ ] `Transaction` Schema & VO 定義
- [ ] CSV 解析ロジック実装
- [ ] 取引履歴 API (`GET /transactions`, `POST /transactions/upload`)

### 3.2 フロントエンド認証連携 (apps/web)
- [ ] 認証ページ作成 (`/login`, `/signup`)
- [ ] 認証状態管理 (Jotai + Middleware)
- [ ] API クライアント生成 (Orval from OpenAPI)

### 3.3 ダッシュボード連携
- [ ] モックデータを API データに置き換え
- [ ] ユーザーごとのデータ表示

---

## Phase 4: 認証 & 公開準備

- [ ] 認証機能 (Auth.js or Firebase or Custom)
- [ ] デプロイ設定 (Vercel / Cloudflare Workers 等)
