---
name: Project Guidelines
description: Essential rules, requirements, and conventions for the PayPay Money Diary Project. Always consult this when writing code or planning architecture.
---

# Project Guidelines & Rules

This skill consolidates key information from `PROJECT_RULES.md` and `REQUIREMENTS.md`. Use this to ensure compliance with project standards.

## 1. Core Architecture (Source of Truth: `PROJECT_RULES.md`)

- **Monorepo**: Turborepo + pnpm
- **Frontend**: `apps/web` (Next.js App Router, Tailwind CSS, Orval)
- **Backend**: `apps/api` (Hono, Drizzle ORM, PostgreSQL)
- **Shared**: `packages/shared` (Types, Zod Schemas, Utils)

## 2. Coding Standards

### Naming
- **Variables/Functions**: `camelCase`
- **Component Files**: `PascalCase` (e.g., `TransactionList.tsx`)
- **Hooks/Utils**: `camelCase` (e.g., `useUser.ts`)
- **Constants**: `UPPER_SNAKE_CASE`
- **DB Tables**: `snake_case`

### Style & Safety
- **No `any`**: Explicitly forbid `any`. Use `instanceof Error` for catches.
- **Tailwind**: 
  - Utilities MUST be inside JSX `className`.
  - **PROHIBITED**: `clsx`, `cva`, `cn` and similar libraries.
  - Conditionals must be resolved within the template literal or simple logic inside `className` (e.g. `condition ? "text-red-500" : "text-blue-500"`).
- **Zod**: Use Zod for API responses, Forms, and Shared Domain Models.
- **Components**: Functional + Hooks. Small & Focused.

## 3. Key Requirements (Source: `REQUIREMENTS.md`)

### Goal
Visualize PayPay transaction history via CSV upload.

### Features
- **CSV Import**: Parse PayPay CSV (Shift-JIS/UTF-8), validate, extract "payment" lines only.
- **Dashboard**: Monthly/Yearly graphs (Pie/Bar).
- **Expense List**: Sortable, filterable (merchant), category editing.
- **Category Management**: Auto-categorization based on rules/merchant names.

## 4. Directory Structure
- `apps/api/src`: `controllers`, `usecase`, `service`, `models`, `infrastructure`.
- `apps/web/src`: `api` (generated), `components`, `providers`.
- `packages/shared`: `types` (Zod schemas), `utils`.

## 5. Critical Instructions for the Agent
- **Adhere to `PROJECT_RULES.md`**: It is the authoritative source for architecture and conventions.
- **Validation**: Meaningful Zod schemas are required.
- **Strict Tailwind**: Follow the specific restriction on class name construction tools (no `clsx`/`cn` etc.).
- **Workflow Integrity**: After completing any code fixes or modifications (excluding documentation-only changes), always run `pnpm lint` and `pnpm test`.
- **Committing Changes**: Use the `/commit` slash command to commit changed files one by one with Japanese messages and gitmojis.
