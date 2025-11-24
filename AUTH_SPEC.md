# 認証API 作成計画

## はじめに 
- 本アプリケーションの、ユーザー認証のための設計書です

## 設計

ディレクトリ構成

- apps/api/ （バックエンド）
- apps/api/docs/ （openapi.yamlを置く）
- apps/web/ （フロントエンド）

エンドポイントは、以下の通り。

- `POST /api/auth/signup` - ユーザー登録（ユーザー名、メールアドレス、パスワードを登録する）
    - リクエストボディ
        - name
        - email
        - password
    - レスポンスボディ
        - uuid
        - name
        - email
- `POST /api/auth/login` - ログイン（メールアドレス、パスワードでログインする）
    - リクエストボディ
        - email
        - password
    - レスポンスボディ
        - uuid
        - access_token
        - refresh_token
- `POST /api/auth/refresh` - トークン更新（リフレッシュトークンでアクセストークンを更新する）
    - リクエストボディ
        - refresh_token
    - レスポンスボディ
        - access_token
        - refresh_token
- `POST /api/auth/logout` - ログアウト（アクセストークンを無効化する）
- `GET /api/auth/me` - 現在のユーザー情報取得（アクセストークンからユーザー情報を取得する）
    - レスポンスボディ
        - uuid
        - name
        - email

Userテーブルのスキーマは以下の通り。

```sql
CREATE TABLE "users" (
    id bigserial NOT NULL,
    uuid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
他には、

- Docker
- PostgreSQL（永続化）
- Redis（リフレッシュトークン保持）
- Swagger, Openapi
- JWT（認証用トークン）

## アーキテクチャ
バックエンドAPIはDDD的なクリーンアーキテクチャを採用する。

## 進め方など

- パッケージのインストールコマンドなどの履歴はREADME.mdに残したい。
- DockerのコマンドなどはMakefileに記述し、`make init`でコンテナをbuildできるようにする。
