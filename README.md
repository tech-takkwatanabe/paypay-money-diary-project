# PayPay Money Diary (🚧 Under Construction 🚧)

PayPay の取引履歴 CSV を活用し、支出を可視化して家計管理をサポートするアプリケーションです。

## 概要

PayPay アプリからダウンロードできる取引履歴 CSV をアップロードするだけで、自動的にカテゴリ分けを行い、月別・年別の支出レポートを生成します。

### 主な機能

- **CSV インポート**: PayPay 取引履歴の取り込み
- **ダッシュボード**:
  - 月次レポート（カテゴリ別円グラフ）
  - 年次レポート（月別・カテゴリ別積み上げ棒グラフ）
- **カテゴリ管理**: 取引先ごとのカテゴリ自動推定と学習

## 技術スタック

### Frontend

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Charts**: ApexCharts

### Backend

- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM

### Infrastructure / Tooling

- **Monorepo**: Turborepo
- **Package Manager**: pnpm

## セットアップ (開発中)

### 前提条件

- Node.js (v22以上推奨)
- Bun (Backend Runtime)
- pnpm

### インストール & 起動

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

## ディレクトリ構成

```
.
├── apps/
│   ├── web/        # Next.js Frontend
│   └── api/        # Hono Backend
├── packages/
│   ├── eslint/     # ESLint configuration
│   └── shared/     # Shared types & utilities
└── ...
```
