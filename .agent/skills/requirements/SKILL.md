---
name: Project Requirements
description: Functional and non-functional requirements for the PayPay Money Diary application. Consult this when planning features or understanding the product scope.
---

# Project Requirements

Source of truth: [`REQUIREMENTS.md`](file:///Users/watanabetaku/htdocs/paypay-money-diary-project/REQUIREMENTS.md)

## Goal

PayPay の取引履歴 CSV を取り込み、支出をカテゴリー別・月別・年別に可視化し、家計管理をサポートする。

## Features

### CSV Import
- PayPay 取引履歴 CSV のアップロード・バリデーション
- 「取引内容」が「支払い」の行のみを抽出
- 金額フィールドの `"` と `,` の除去・数値化
- Shift-JIS / UTF-8 の自動判定

### Dashboard
- 月別カテゴリ円グラフ
- 年間カテゴリ別棒グラフ（12ヶ月スタック表示 + 月平均値）
- 今月・年間の支出合計
- 直近の取引リスト

### Expense List
- 一覧表示（取引日、金額、取引先、カテゴリ）
- 取引先での検索・フィルタ
- ソート機能（デフォルト: 取引日降順）
- カテゴリの個別編集

### Category Management
- カテゴリの追加・編集・削除
- 取引先ベースの自動カテゴリ推定
- パターン学習による精度向上

## Non-Functional Requirements

- **Performance**: チャート描画は 1 秒以内、CSV 最大 10,000 行対応
- **Security**: 個人情報は保持しない。適切な認証・認可
- **Usability**: PC/スマホ対応のレスポンシブ UI
- **Browsers**: Chrome, Safari, Edge（最新版）
