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

- [x] **JWT** ユーティリティ実装 (Sign, Verify)
- [x] **API エンドポイント実装**
  - [x] `POST /api/auth/signup` (登録) ✅
  - [x] `POST /api/auth/login` (ログイン)
    - [x] bcrypt でパスワード検証
    - [x] JWT トークン生成 (access + refresh)
    - [x] Redis にリフレッシュトークン保存
  - [x] `POST /api/auth/refresh` (トークン更新)
    - [x] リフレッシュトークン検証
    - [x] 新しいアクセストークン発行
    - [x] リフレッシュトークンのローテーション (セキュリティ対策)
  - [x] `POST /api/auth/logout` (ログアウト)
    - [x] Redis からリフレッシュトークン削除
  - [x] `GET /api/auth/me` (ユーザー情報取得)
    - [x] JWT 認証ミドルウェア実装
    - [x] 認証済みユーザー情報返却
- [x] **OpenAPI (Swagger)** 定義 & 自動生成

### 2.5 単体テスト再構築 (Bun Test)

- [x] **テスト環境整備**
  - [x] `bun:test` のセットアップ
  - [x] Mock ライブラリの選定 (Bun 標準 or その他)
- [x] **UseCase テスト実装**
  - [x] `SignupUseCase` (Mock Repository)
  - [x] `LoginUseCase` (Mock Repository, Mock JWT)
  - [x] `GetMeUseCase` (Mock Repository)
  - [x] `RefreshUseCase` (Mock Repository, Mock JWT)
  - [x] `LogoutUseCase` (Mock Repository)
- [x] **Handler テスト実装**
  - [x] `signupHandler` (Mock UseCase)
  - [x] `loginHandler` (Mock UseCase)
  - [x] `meHandler` (Mock UseCase)
  - [x] `refreshHandler` (Mock UseCase)
  - [x] `logoutHandler` (Mock UseCase)

---

## Phase 3: 家計簿機能実装 (Backend & Frontend Integration)

**目的**: 認証済みの状態で CSV アップロードとチャート表示を実現する。

### 3.1 取引データ DB 設計

- [x] **テーブル設計**
  - [x] `csv_uploads` - アップロード履歴 (raw_data を JSONB で保持)
  - [x] `categories` - カテゴリマスタ (ユーザー編集可能)
  - [x] `category_rules` - 自動分類ルール
  - [x] `expenses` - 正規化された支出データ
- [x] **マイグレーション作成 & 実行**
- [x] **インデックス追加** (user_id + transaction_date, category_id, merchant)
- [x] **デフォルトカテゴリのシード** (8カテゴリ)

### 3.2 CSV 解析ロジック実装

- [x] CSV パーサー実装 (PayPay フォーマット対応)
- [x] カテゴリ自動分類ロジック (keyword マッチング)
- [x] 重複排除処理 (external_transaction_id)

### 3.3 取引データ API (Backend)

- [x] `POST /api/transactions/upload` - CSV アップロード
- [x] `GET /api/transactions` - 取引履歴取得 (ページネーション)
- [x] `GET /api/transactions/summary` - 月別・カテゴリ別集計

### 3.4 カテゴリ管理 API

- [x] `GET /api/categories` - カテゴリ一覧
- [x] `POST /api/categories` - カテゴリ作成
- [x] `PUT /api/categories/:id` - カテゴリ更新
- [x] `DELETE /api/categories/:id` - カテゴリ削除

### 3.2 フロントエンド認証連携 (apps/web)

- [x] 認証ページ作成 (`/login`, `/signup`)
- [x] 認証状態管理 (Middleware)
- [x] API クライアント生成 (Orval from OpenAPI)

### 3.3 ダッシュボード連携

- [x] モックデータを API データに置き換え
- [x] ユーザーごとのデータ表示

---

## Phase 7: 支出一覧機能の実装 (New)

**目的**: 取引データを詳細に確認・編集できる一覧画面を提供し、家計簿の正確性を向上させる。

### 7.1 バックエンド API 拡張

- [x] `GET /api/transactions` の拡張
  - [x] 検索パラメータ (`merchant`) 対応
  - [x] 年別フィルタ (`year`) 対応
  - [x] ソートパラメータ (`sortBy`, `sortOrder`) 対応
- [x] `PATCH /api/transactions/:id` の新設
  - [x] カテゴリ更新機能の実装
- [x] OpenAPI スキーマ更新 & クライアント生成

### 7.2 支出一覧ページ作成 (apps/web)

- [x] **ページレイアウト実装**
  - [x] `/expenses` ページの作成
  - [x] テーブル形式での取引一覧表示
- [x] **フィルタ・検索機能**
  - [x] 年別セレクターの実装（ダッシュボードと共通化）
  - [x] 取引先名での検索バー実装
- [x] **ソート機能**
  - [x] 取引日、金額のヘッダーによるソート切り替え
- [x] **カテゴリ編集機能**
  - [x] インラインまたはモーダルによるカテゴリ変更UIの実装
- [x] **ナビゲーション**
  - [x] ヘッダーに「支出一覧」リンクを追加
