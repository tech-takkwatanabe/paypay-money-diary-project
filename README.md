# 📱 PayPay Money Diary

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/tech-takkwatanabe/paypay-money-diary-project)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black.svg)](https://nextjs.org/)
[![Hono](https://img.shields.io/badge/Hono-4.11-orange.svg)](https://hono.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**PayPay の取引履歴 CSV をスマートに可視化。**  
複雑な家計管理を、CSV アップロードひとつでシンプルに解決するパーソナルファイナンスツールです。

## 🚀 Getting Started

```bash
git clone https://github.com/tech-takkwatanabe/paypay-money-diary-project.git
cd paypay-money-diary-project
pnpm install
```

---

## ✨ Key Features

- **🚀 Instant CSV Import**: PayPay アプリから書き出した CSV をドラッグ＆ドロップするだけで取り込み完了。
- **📊 Interactive Dashboard**: 月次・年次の支出推移を、美しくインタラクティブなグラフで可視化。
- **🧠 Smart Categorization**: 取引先名からカテゴリを自動推定。使えば使うほど、あなたの支出パターンを学習します。
- **⚙️ Custom Rules**: 特定の取引先に対するカテゴリ割り当てを自由自在にコントロール。
- **🔒 Privacy First**: データはあなたの管理下に。セキュアな認証基盤（JWT + HttpOnly Cookie）を採用。

## 🛠 Tech Stack

### Monorepo Infrastructure

- **[Turborepo](https://turbo.build/)**: 高速なビルドパイプラインとキャッシュ管理。
- **[pnpm](https://pnpm.io/)**: 効率的なパッケージ管理とディスクスペースの節約。

### Frontend (`apps/web`)

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS (Modern & Responsive)
- **Charts**: ApexCharts (Interactive Data Visualization)
- **API Client**: Orval (OpenAPI スキーマからの自動生成)

### Backend (`apps/api`)

- **Runtime**: Bun (High Performance)
- **Framework**: Hono (Ultra-fast & Type-safe)
- **Database**: PostgreSQL + Drizzle ORM
- **Cache**: Redis (Session & Token Management)
- **Architecture**: Clean Architecture (Maintainable & Testable)

### Shared Package (`packages/shared`)

- **Validation**: Zod (フロント・バックエンド間でのバリデーションスキーマ共有)
- **Domain**: Value Objects によるドメイン知識の集約

## 📂 Project Structure

```text
.
├── apps/
│   ├── web/        # Next.js Frontend (Modern UI/UX)
│   └── api/        # Hono Backend (Clean Architecture Implementation)
├── packages/
│   ├── shared/     # Shared Schemas, Types & Value Objects
│   └── eslint/     # Unified Linting Configurations
└── ...
```

## 🛠 Development Setup

### Prerequisites

- Node.js (v22+)
- [Bun](https://bun.sh/) (Backend Runtime)
- [pnpm](https://pnpm.io/)
- [mkcert](https://github.com/FiloSottile/mkcert) (ローカル開発用 SSL 証明書)

### Installation & Development

```bash
# SSL 証明書の生成 (初回のみ)
mkdir -p .certificate
mkcert -install
mkcert -key-file .certificate/localhost-key.pem -cert-file .certificate/localhost-cert.pem localhost

# データベースの起動 (Docker が必要)
cd apps/api
make init

# マイグレーションとシードの実行 (初回のみ)
bun run db:migrate
bun run db:seed
cd ../..

# 開発サーバーの同時起動 (Frontend & Backend)
pnpm dev
```

### Database Management

`apps/api` ディレクトリの `Makefile` を使用して、開発用データベース（PostgreSQL & Redis）を操作できます。

- `make up`: コンテナの起動
- `make down`: コンテナの停止
- `make init`: コンテナのビルドと起動
- `make clean`: コンテナとボリュームの削除

### Documentation

詳細な情報は各ディレクトリのドキュメントを参照してください：

- [📖 Backend Architecture](./apps/api/ARCHITECTURE.md)
- [🔌 API Documentation (Swagger UI)](https://localhost:8080/api/docs) ※開発サーバー起動中のみ

### Git Blame Configuration

本プロジェクトは Biome での一括フォーマットが導入されています。
フォーマットによる `git blame` のノイズを避けるため、開発作業を開始する前に以下のコマンドを実行してフォーマット変更を無視するようにしてください：

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

---

Developed with ❤️ by [tech-takkwatanabe](https://github.com/tech-takkwatanabe)
