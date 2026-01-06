# PayPay Money Diary API

PayPay 家計簿アプリケーションのバックエンド API です。

## アーキテクチャ

本プロジェクトはクリーンアーキテクチャを採用しています。詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

## セットアップ

### 依存関係のインストール

```sh
bun install
```

### 開発サーバーの起動

```sh
bun run dev
```

サーバーは `https://localhost:8080` で起動します。

### API ドキュメント (Swagger UI)

開発サーバー起動中に `https://localhost:8080/api/docs` にアクセスすることで、API ドキュメントを確認できます。

## テスト

```sh
bun test
```
