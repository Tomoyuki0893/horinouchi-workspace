#!/usr/bin/env bash
# ============================================================================
#  共通JS 整理スクリプト（Git Bash 用）
#  新基盤(TCP.*) + ドキュメント → base/ ／ 既存ささえあ一式 → sasaeah/
#
#  使い方:
#    1. このスクリプトを「共通JS」フォルダ直下に置く（既に配置済み）
#    2. Git Bash で:  bash relocate_common_js.sh
#    3. git status で確認 → 問題なければ commit
#    4. 本スクリプトは不要になったら削除可
#
#  ※ git 管理下なら git mv（履歴維持）、そうでなければ通常の mv にフォールバック
# ============================================================================
set -e
cd "$(dirname "$0")"

mkdir -p base sasaeah

move() {
  # $1=ファイル, $2=移動先
  if [ ! -e "$1" ]; then echo "  [skip] $1 が見つかりません"; return; fi
  if git mv "$1" "$2/" 2>/dev/null; then
    echo "  [git mv] $1 -> $2/"
  else
    mv "$1" "$2/"
    echo "  [mv]     $1 -> $2/"
  fi
}

echo "=== 新共通基盤(TCP.*) + ドキュメント -> base/ ==="
for f in \
  TCP_Conv.js TCP_Log.js TCP_Error.js TCP_Fmt.js TCP_Json.js \
  TCP_Rest.js TCP_Db.js TCP_Valid.js TCP_Config.js TCP_Mailer.js TCP_Msg.js \
  共通JS基盤_アーキテクチャ標準.md 共通JS基盤_モジュール一覧.md 共通JS基盤_既存棚卸しマッピング.md
do
  move "$f" base
done

echo "=== 既存ささえあ一式 -> sasaeah/ ==="
for f in \
  DbUtil.js TCP_MAIL.js TCP_UTIL.js TCP_REMINDER.js TCP_WFS_COMMON.js \
  TCP_SUPPLIER_WF.js TCP_MST_TORIHIKISAKI_CHANGE.js \
  WFS_COMMON.js WFS_CONST.js WFS_CUSTOM.js WFS_BIZ.js WFS_RESOLVE.js WFS_UTIL.js \
  JDE_TORIHIKISAKI.js RINGI_SAIBAN.js CLM_WFS_LOGIC.js REST_API_COMMON.js
do
  move "$f" sasaeah
done

echo ""
echo "完了。git status で確認し、問題なければ commit してください。"
