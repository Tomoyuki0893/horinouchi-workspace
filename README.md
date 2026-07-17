# horinouchi-workspace

TALON(Nashorn/JavaScript）による RPA スクリプトと、Intra-mart 資材を
まとめて管理するワークスペースリポジトリ。

## ディレクトリ構成

```
horinouchi-workspace/
├── talon/                    TALON (Nashorn) RPA スクリプト
│   └── ささえあ/             ささえあ案件（ポータル・メール・共通JS）
│       └── 共通JS/           DbUtil / JDE取引先 / 送り状取得 など
├── intra-mart/               Intra-mart 資材
│   ├── bis/                  im-BIS 定義
│   ├── workflow/             IM-Workflow 定義
│   └── logic-designer/       IM-LogicDesigner 定義
├── docs/                     設計メモ・手順書・運用ルール
├── .gitattributes            文字コード/改行/バイナリの扱い
└── .gitignore                除外設定
```

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
