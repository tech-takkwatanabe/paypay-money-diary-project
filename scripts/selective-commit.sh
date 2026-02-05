#!/bin/bash

# ==============================================================================
# Selective Commit Script
# 変更のあるファイルを1件ずつ確認し、gitmoji と日本語メッセージでコミットします。
# ==============================================================================

# gitmoji テンプレートのパス
TEMPLATE_PATH="/Users/watanabetaku/htdocs/gitmoji-commit-template/.gitmoji_commit_template"

# 変更のあるファイルを取得 (Modified, Added, Deleted, Untracked)
files=$(git status --porcelain | sed 's/^...//')

if [ -z "$files" ]; then
  echo "✅ 変更のあるファイルはありません。"
  exit 0
fi

echo "🚀 Selective Commit を開始します。"
read -p "❓ Issue番号があれば入力してください (例: 24 / なければ Enter): " issue_num

if [ -n "$issue_num" ]; then
  issue_part=" #$issue_num"
else
  issue_part=""
fi

IFS=$'\n'
for file in $files; do
  echo ""
  echo "----------------------------------------------------"
  echo "📁 ファイル: $file"
  read -p "❓ このファイルをコミットしますか？ (y/n, qで終了): " confirm
  
  if [ "$confirm" == "q" ]; then
    echo "👋 終了します。"
    break
  fi
  
  if [ "$confirm" != "y" ]; then
    echo "⏭️  スキップしました。"
    continue
  fi

  echo "💡 利用可能な gitmoji (例):"
  echo " ✨ :sparkles: (新機能)  🐛 :bug: (修正)  ♻️ :recycle: (リファクタ)  📝 :memo: (ドキュメント)"
  echo " 🎨 :art: (構造/整理)  💄 :lipstick: (UI/スタイル)  ✅ :white_check_mark: (テスト)"
  echo " 🔧 :wrench: (設定)  🔥 :fire: (削除)  🚚 :truck: (移動/名前変更)  🔨 :hammer: (ツール/スクリプト)"
  
  read -p "📝 gitmoji を入力 (例: :sparkles:): " emoji
  read -p "📝 コミットメッセージ（日本語）: " message

  if [ -z "$emoji" ] || [ -z "$message" ]; then
    echo "⚠️  gitmoji または内容が空です。スキップします。"
    continue
  fi

  full_message="$emoji$issue_part $message"
  
  echo ""
  echo "📋 プレビュー: $full_message"
  read -p "✅ この内容でコミットしますか？ (y/n): " final_confirm
  
  if [ "$final_confirm" == "y" ]; then
    git add "$file"
    git commit -m "$full_message"
    echo "🎉 コミット完了!"
  else
    echo "⏭️  中止しました。"
  fi
done

echo ""
echo "✨ すべての処理が終了しました。"
