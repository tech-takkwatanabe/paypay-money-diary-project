# iOS / Android アプリ化 アーキテクチャ分析

> 作成日: 2026-03-17  
> 現在の Web アプリを iOS / Android ネイティブアプリとして実現するための方針メモ。

---

## 現在のアーキテクチャ

```
apps/
  web/    → Next.js + Tailwind CSS（フロントエンド）
  api/    → Hono + Bun + Drizzle ORM + PostgreSQL（バックエンド）
packages/
  shared/ → Zod スキーマ、型定義（両者で共有）
```

**現状の課題（モバイルアプリ化にあたって）**

- バックエンド API とデータベース（PostgreSQL）がサーバー上に存在するため、個人情報の外部預かりリスクがある
- セキュリティ管理（認証・認可・サーバー運用）が必要
- オフライン非対応

---

## 方針: React Native (Expo) + Drizzle ORM + SQLite ⭐（推奨）

### コンセプト

> **サーバーレス・データ完全ローカル**  
> すべてのデータをデバイス内の SQLite に保存し、外部 API / DB への依存をゼロにする。

```
┌─────────────────────────────────────┐
│         React Native App            │
│                                     │
│  ┌───────────┐   ┌───────────────┐  │
│  │  UI Layer │   │ Business Logic│  │
│  │(React NW) │   │  (TypeScript) │  │
│  └─────┬─────┘   └───────┬───────┘  │
│        │                 │          │
│  ┌─────▼─────────────────▼───────┐  │
│  │   Drizzle ORM (SQLite driver) │  │
│  └───────────────────────────────┘  │
│            ↓                        │
│      📱 SQLite on Device            │
└─────────────────────────────────────┘

packages/shared (Zod スキーマ・型定義)
→ そのまま再利用
```

---

## 既存資産の再利用マップ

| 既存 | モバイル版での扱い |
|------|------------------|
| `packages/shared` Zod スキーマ・型定義 | ✅ そのまま import して使用 |
| CSV パース処理（ロジック部） | ✅ 移植可（`papaparse` は RN でも動作） |
| カテゴリ自動分類ロジック | ✅ 移植可 |
| Drizzle ORM スキーマ定義 | 🔄 SQLite 用に軽微な調整が必要（`serial` → `integer` 等） |
| Hono API / PostgreSQL | ❌ 不要（削除） |
| Next.js / Tailwind の UI | 🔄 React Native コンポーネントで再構築（NativeWind を検討） |

---

## 主要な技術選定

| 役割 | 採用技術 | 理由 |
|------|---------|------|
| フレームワーク | **Expo (SDK 51+)** | OTA アップデート、EAS Build でストア配布が容易 |
| DB | **expo-sqlite** | ネイティブ SQLite、Expo 公式サポート |
| ORM | **Drizzle ORM** (SQLite driver) | 既存スキーマをほぼ流用可、型安全 |
| スタイリング | **NativeWind** | Tailwind 互換の記法、学習コスト最小 |
| チャート | **victory-native** または **react-native-gifted-charts** | 円グラフ・棒グラフ対応 |
| CSV ファイル選択 | **expo-document-picker** | iOS Files / Android ストレージへアクセス |
| ファイル読み取り | **expo-file-system** | CSV テキスト読み込み |
| CSV パース | **papaparse** | 既存と同じライブラリを使用可 |
| 状態管理 | **Zustand** または **React Context** | シンプルな構成に合わせて選択 |
| テスト | **Jest + React Native Testing Library** | |

---

## 実現ステップ（大まかなロードマップ）

### Step 1: プロジェクト作成・環境整備
```bash
# monorepo に apps/mobile として追加
cd apps
npx create-expo-app mobile --template blank-typescript

# pnpm-workspace.yaml に追記済みであれば自動認識
```
- `pnpm-workspace.yaml` に `apps/mobile` を追加
- `turbo.json` にモバイルのビルドタスクを追加

### Step 2: DB 層の構築
```
- expo-sqlite + drizzle-orm のセットアップ
- 既存の Drizzle スキーマを SQLite 用に調整
  - serial → integer (primary key autoincrement)
  - timestamp → text (ISO8601 文字列で保存)
  - postgres 固有型は SQLite 互換型に変換
- マイグレーション管理（drizzle-kit の expo-sqlite 対応）
```

### Step 3: ビジネスロジックの移植
```
- packages/shared の Zod スキーマをそのまま import
- CSV パース処理の移植（ほぼそのまま利用可）
- カテゴリ自動分類ロジックの移植
- apps/api のビジネスロジック部分を apps/mobile 内の
  usecase/ / service/ 等に再配置
```

### Step 4: 画面 UI の構築
```
- ダッシュボード（チャート表示）
- 支出一覧（フィルタ・ソート）
- CSV インポート画面
- カテゴリ管理画面
- NativeWind で Tailwind ライクなスタイリング
```

### Step 5: テスト・配布
```
- Jest + React Native Testing Library で単体テスト
- Expo Go でデバッグ（開発中）
- EAS Build で iOS / Android ビルド
- TestFlight (iOS) / Google Play 内部テスト で動作確認
- App Store / Google Play へ申請
```

---

## 代替案: Swift ネイティブ（参考）

| 評価軸 | React Native (Expo) | Swift ネイティブ |
|-------|:---:|:---:|
| 既存コード再利用 | ◎ shared + ロジック | ✗ ゼロから |
| ローカル SQLite | ◎ Drizzle 対応 | ◎ SwiftData / Core Data |
| UX 品質 | ○ ほぼネイティブ | ◎ 最高 |
| 学習コスト | ○ React 知識流用 | ✗ Swift 学習が必要 |
| Android 対応 | ◎ 同コードで対応 | ✗ 別途 Kotlin が必要 |
| 開発工数 | ○ 中程度 | ✗ 大きい |

→ **既存スキルと Android 対応の観点から React Native を推奨。**  
　Swift ネイティブは、将来的に iOS 専用で最高品質を追求する場合の選択肢。

---

## セキュリティ・プライバシー面のメリット

- **データは一切外部に出ない**: SQLite はデバイス内のみに保存
- **サーバー不要**: API サーバーの運用・セキュリティ管理が不要
- **認証不要**: ユーザーアカウント管理のリスクがゼロ
- **データ削除が明確**: アプリをアンインストールすればすべて消える

---

## 参考リンク

- [Expo 公式ドキュメント](https://docs.expo.dev/)
- [Drizzle ORM + Expo SQLite](https://orm.drizzle.team/docs/get-started/expo-existing)
- [NativeWind (Tailwind for RN)](https://www.nativewind.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [expo-document-picker](https://docs.expo.dev/versions/latest/sdk/document-picker/)
