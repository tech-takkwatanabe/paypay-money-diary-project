# Tasks

- [/] **Phase 2: 認証機能 & 共通スキーマ整備**
    - [x] 2.1 共通パッケージ整備 (packages/shared)
    - [x] 2.2 インフラ & 開発環境 (Docker)
    - [x] 2.3 バックエンド基盤 (apps/api - Hono + DDD)
        - [x] Drizzle ORM セットアップ
        - [x] マイグレーション設定 & `users` テーブル作成
        - [x] Redis 接続設定
        - [x] アーキテクチャ構成 (Clean Architecture)
    - [/] 2.4 認証 API 実装
        - [x] POST /api/auth/signup (登録)
        - [ ] JWT ユーティリティ実装
        - [ ] POST /api/auth/login (ログイン)
        - [ ] POST /api/auth/refresh (トークン更新)
        - [ ] POST /api/auth/logout (ログアウト)
        - [ ] GET /api/auth/me (ユーザー情報取得)
        - [ ] JWT 認証ミドルウェア
        - [ ] OpenAPI 定義
