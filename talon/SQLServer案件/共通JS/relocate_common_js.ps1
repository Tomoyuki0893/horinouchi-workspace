# ============================================================================
#  共通JS 整理スクリプト（PowerShell 用）
#  新基盤(TCP.*) + ドキュメント → base/ ／ 既存ささえあ一式 → sasaeah/
#
#  使い方:
#    1. このスクリプトを「共通JS」フォルダ直下に置く（既に配置済み）
#    2. PowerShell で:  ./relocate_common_js.ps1
#       （実行ポリシーで止まる場合）:  powershell -ExecutionPolicy Bypass -File .\relocate_common_js.ps1
#    3. git status で確認 → 問題なければ commit
#    4. 本スクリプトは不要になったら削除可
#
#  ※ git 管理下なら git mv（履歴維持）、そうでなければ Move-Item にフォールバック
# ============================================================================
Set-Location $PSScriptRoot
New-Item -ItemType Directory -Force -Path base, sasaeah | Out-Null

function Move-One($file, $dest) {
    if (-not (Test-Path $file)) { Write-Host "  [skip] $file が見つかりません"; return }
    git mv $file "$dest/" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [git mv] $file -> $dest/"
    } else {
        Move-Item -Force $file "$dest/"
        Write-Host "  [move]   $file -> $dest/"
    }
}

$base = @(
    'TCP_Conv.js','TCP_Log.js','TCP_Error.js','TCP_Fmt.js','TCP_Json.js',
    'TCP_Rest.js','TCP_Db.js','TCP_Valid.js','TCP_Config.js','TCP_Mailer.js','TCP_Msg.js',
    '共通JS基盤_アーキテクチャ標準.md','共通JS基盤_モジュール一覧.md','共通JS基盤_既存棚卸しマッピング.md'
)
$sasaeah = @(
    'DbUtil.js','TCP_MAIL.js','TCP_UTIL.js','TCP_REMINDER.js','TCP_WFS_COMMON.js',
    'TCP_SUPPLIER_WF.js','TCP_MST_TORIHIKISAKI_CHANGE.js',
    'WFS_COMMON.js','WFS_CONST.js','WFS_CUSTOM.js','WFS_BIZ.js','WFS_RESOLVE.js','WFS_UTIL.js',
    'JDE_TORIHIKISAKI.js','RINGI_SAIBAN.js','CLM_WFS_LOGIC.js','REST_API_COMMON.js'
)

Write-Host "=== 新共通基盤(TCP.*) + ドキュメント -> base/ ==="
foreach ($f in $base) { Move-One $f 'base' }

Write-Host "=== 既存ささえあ一式 -> sasaeah/ ==="
foreach ($f in $sasaeah) { Move-One $f 'sasaeah' }

Write-Host ""
Write-Host "完了。git status で確認し、問題なければ commit してください。"
