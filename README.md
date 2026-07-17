# horinouchi-workspace

TALON(Nashorn/JavaScript）による RPA スクリプトと、Intra-mart 資材を
まとめて管理するワークスペースリポジトリ。

## ディレクトリ構成

```
horinouchi-workspace/
├── talon/                        TALON (Nashorn) RPA スクリプト
│   └── SQLServer案件/
│       ├── RITA/                 RITA 各課題（SQL・処理JS・改修案）
│       ├── ささえあ/              ポータル・メール・クレーム・催促 など画面JS
│       ├── 互助会/                GOJO・預託金 など
│       └── 共通JS/                TCP_*・WFS_* 共通基盤、ささえあ共通JS
│           └── （マニュアル/ は約60MBの製品ZIPのため Git 管理外）
├── intra-mart/                   Intra-mart 資材
│   ├── forma/ニデック/            Forma 定義（.zip と 展開/ の XML/JSON）
│   ├── bis/                      im-BIS 定義
│   ├── workflow/                 IM-Workflow 定義
│   └── logic-designer/           IM-LogicDesigner 定義
├── 共通CSJS/                     クライアントサイド共通JS（date/format/rest/ui/validation）
├── docs/                         設計メモ・手順書・運用ルール
│   └── 03_技術ナレッジ/           WFS 概念資料・マスタ構成 など
├── .gitattributes                文字コード/改行/バイナリの扱い
└── .gitignore                    除外設定
```

> Intra-mart の Forma 定義は、復元用に元の `.zip` を残しつつ、差分が追えるよう
> 展開した XML/JSON を `展開/` に併置しています（`.gitattributes` で改行を
> 非変換にし、再エクスポート時の無意味な差分を防止）。

## 前提・規約

- **文字コード**: UTF-8（BOMなし） / **改行**: CRLF に統一
- **秘密情報はコミットしない**: DB接続・SMTP・APIキーは実行環境や
  マスタテーブル（例: `TLN_GENERAL` / `TLN_M_HANYO_CODE`）から取得する方針。
  ソースへのハードコード禁止。

## 運用（ソロ）

日常はシンプルに以下の流れ:

```bash
git add -A
git commit -m "変更内容の要約"
git push
```

- まとまった変更や実験は作業ブランチを切ると安全:
  `git switch -c feature/xxx` → 完了後 `main` へマージ
- 本番反映など区切りの時点には **タグ** を付けて記録:
  `git tag -a v2026.07.18 -m "ささえあ 送り状連携 リリース"` → `git push --tags`

詳細は [docs/運用ルール.md](docs/運用ルール.md) を参照。
