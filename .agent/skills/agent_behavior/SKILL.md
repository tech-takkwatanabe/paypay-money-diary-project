---
name: Agent Behavior Rules
description: Rules and constraints that the AI agent must follow when working on this project. Always consult this before making changes.
---

# Agent Behavior Rules

このプロジェクトで作業する際、エージェントは以下のルールに**必ず**従うこと。

## 1. コミット制限

- **コードの変更を自動コミットしない**
- コミット前に必ずユーザーの明示的な許可を得ること
- コミットは `/commit` ワークフロー経由で行うこと

## 2. 品質チェック

コード変更後（ドキュメントのみの変更を除く）は、以下を実行すること：

```bash
pnpm lint
pnpm test
```

## 3. ソースオブトゥルース

- アーキテクチャ・規約 → [`PROJECT_RULES.md`](../../../PROJECT_RULES.md)
- 要件・仕様 → [`REQUIREMENTS.md`](../../../REQUIREMENTS.md)

これらのドキュメントが最も権威あるソースである。矛盾がある場合はこれらを優先すること。

## 4. バリデーション

- Zod スキーマは意味のあるバリデーションを含むこと（形だけのスキーマは不可）
- API 入出力には必ず Zod バリデーションを適用すること

## 5. Tailwind CSS の厳格ルール

- `clsx` / `cva` / `cn` 等のクラス名構築ユーティリティは**使用禁止**
- クラス名は必ず `className` 属性内に直接記述すること
