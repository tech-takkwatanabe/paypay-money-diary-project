# TypeScript 7.0.2 移行計画

> 作成日: 2026-07-28
> ステータス: **保留**（Next.js の TS 7.0 対応待ち）

## 背景

TypeScript 7.0（2026年7月8日リリース）は、コンパイラを Go で完全に書き直した重大リリース。ビルド速度が約10倍向上するが、**JavaScript ベースの Compiler API が廃止**されたため、一部ツールに非互換がある。

## 互換性調査結果

| パッケージ | 互換性 | 備考 |
|---|---|---|
| Bun | ✅ | 問題なし |
| Hono | ✅ | 問題なし |
| Drizzle ORM / Kit | ✅ | 問題なし |
| Vitest / Vite | ✅ | 問題なし |
| oxlint | ✅ | TSC 非依存 |
| **Next.js 16** | ❌ | Compiler API に依存。TS 7.0 では動作しない |
| **typedoc** | ❌ | Compiler API に依存。TS 7.1 待ち |
| @hono/zod-openapi | ✅ | 型チェックのみ |

## 判断

Next.js 16 が TS 7.0 と非互換のため、エコシステム側の対応（TS 7.1 の Programmatic API 提供 or Next.js の対応）を待って全パッケージを一括移行する。

## 移行時の作業内容（対応可能になった際）

### 1. tsconfig.json の調整

TS 7.0 で削除されたオプションを除去する。

#### `apps/api/tsconfig.json`

- `esModuleInterop` を削除（TS 7.0 で常時有効化、明示設定不可）

#### `packages/shared/tsconfig.json`

- `esModuleInterop` を削除
- `forceConsistentCasingInFileNames` を削除（TS 7.0 で常時有効化）

#### `apps/web/tsconfig.json`

- `esModuleInterop` を削除
- `allowJs` → 要確認（TS 7.0 でも存続）
- `isolatedModules` → 要確認（TS 7.0 でも存続）

### 2. package.json の更新

| パッケージ | 変更 |
|---|---|
| `apps/api` | `"typescript": "6.0.3"` → `"typescript": "7.0.x"` |
| `apps/web` | `"typescript": "6.0.3"` → `"typescript": "7.0.x"` |
| `packages/shared` | `"typescript": "^6.0.3"` → `"typescript": "7.0.x"` |

### 3. 検証手順

```bash
# 型チェック（各パッケージ）
cd apps/api && pnpm type-check
cd packages/shared && pnpm type-check
cd apps/web && pnpm type-check

# テスト・Lint（全体）
pnpm lint
pnpm test
```

## 再検討タイミング

- TypeScript 7.1 リリース時（Programmatic API 提供予定）
- Next.js の TS 7.0 対応アナウンス時
