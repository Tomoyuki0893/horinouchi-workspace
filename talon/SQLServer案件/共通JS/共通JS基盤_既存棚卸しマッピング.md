# TALON 共通JS基盤 既存棚卸し・マッピング

> 関連: [アーキテクチャ標準](共通JS基盤_アーキテクチャ標準.md) ／ [モジュール一覧](共通JS基盤_モジュール一覧.md)
> 現状フォルダにある既存JSを標準5層に当てはめ、「流用できるもの／作り直すもの／不足しているもの」を整理する。

- 対象フォルダ: `SQLServer案件/共通JS`
- 棚卸し日: 2026-06-27
- 既存ファイル数: 16（うちMarkdown 3を除くJS 14 + 本資料関連）

---

## 1. 既存ファイル分類（一覧）

| ファイル | 中身 | 分類 | 該当層/モジュール | 判定 |
|---|---|---|---|---|
| `DbUtil.js` | 汎用DB CRUD（select/insert/update/remove・監査列補完・SQL組立） | 汎用共通 | ② BIZ-02 DB・SQL補助 | ✅ **流用**（標準の基準にできる完成度） |
| `TCP_MAIL.js` | メール送信エンジン（SMTP, Jakarta/javax両対応, 添付） | 汎用共通 | ② BIZ-04 メール | ✅ **流用** |
| `REST_API_COMMON.js` | **空（プレースホルダ）** | 汎用共通 | ② BIZ-01 REST共通基盤 | ❌ **新規**（中身なし＝最優先で着手） |
| `WFS_CONST.js` | WF定数（処理区分・FUNC_MAP・メールEVENT） | WF基盤 | ③ BASE-03 定数（ただしWF専用） | △ 流用（WF用に限定） |
| `WFS_COMMON.js` | WFエンジン本体（1380行）＋冒頭に共通部品（escape/date/map変換） | WF基盤＋汎用混在 | WF基盤／一部 ④ CORE | ⚠ **要分割**（汎用部品を④へ抽出） |
| `WFS_CUSTOM.js` | WFディスパッチャ（本処理・絞込・通知へ委譲） | WF基盤 | WF基盤 | WF専用 |
| `WFS_BIZ.js` | work_id別 本処理（取引先・稟議） | WF基盤 | WF基盤 | WF専用 |
| `WFS_RESOLVE.js` | 承認者絞り込み（相対ロール解決） | WF基盤 | WF基盤 | WF専用 |
| `WFS_UTIL.js` | WF補助（直リンク生成・宛先取得・送信ゲートウェイ） | WF基盤 | WF基盤／一部 ② | WF専用（sendMailはTCP_MAILの前段） |
| `TCP_WFS_COMMON.js` | 申請実行ラッパー（`WfsCommon.apply`等） | WF基盤 | WF基盤 | WF専用 |
| `TCP_REMINDER.js` | 催促メールバッチ | 業務寄り | ① 業務機能（バッチ） | 業務固有 |
| `TCP_SUPPLIER_WF.js` | 取引先マスタ反映（決裁時） | 業務固有 | ① 業務機能 | 業務固有 |
| `TCP_MST_TORIHIKISAKI_CHANGE.js` | 取引先変更申請ロジック | 業務固有 | ① 業務機能 | 業務固有 |
| `JDE_TORIHIKISAKI.js` | JDE連携（F0101Z2等へINSERT） | 業務固有 | ① 業務機能 | 業務固有 |
| `RINGI_SAIBAN.js` | 稟議番号採番（`setRing`） | 業務固有 | ① 業務機能 | 業務固有 |
| `CLM_WFS_LOGIC.js` | クレーム管理WFロジック | 業務固有 | ① 業務機能 | 業務固有 |

**整理の要点**: 真に汎用なのは `DbUtil` と `TCP_MAIL` の2本。残りは「ワークフロー基盤（WFS_*／TCP_WFS／TCP_REMINDER）」と「個別業務ロジック（取引先・稟議・CLM・JDE）」で、これらは①業務機能層に属し、共通基盤の対象外。

---

## 2. 標準モジュールとのギャップ（充足状況）

| ID | モジュール | 現状 | 対応方針 |
|---|---|---|---|
| CORE-01 | JS↔Java変換 | `WFS_COMMON`(getMapVal/setMapVal/chkLowercase) ・ `DbUtil`(getMapKeys/isEmptyMap) に**散在** | 抽出・統合して新設 |
| CORE-02 | 日付・文字列・数値 | `WFS_COMMON`(tln_com_escape/nowdate/todate) に**断片** | 抽出・統合して新設 |
| CORE-03 | JSONヘルパー | なし | 新規 |
| BASE-01 | ログ共通 | 専用ラッパーなし（`TALON.getLogger()` 直叩き） | **新規**（横断で必要） |
| BASE-02 | エラーハンドリング | 専用なし（`TALON.addErrorMsg`/`setIsSuccess` を各所で直叩き） | **新規**（コード体系含む） |
| BASE-03 | 定数・メッセージ | `WFS_CONST` はWF専用。汎用メッセージ機構なし | 汎用版を新設（WF_CONSTは併存） |
| BASE-04 | 設定読込 | `TCP_UTIL.getHanyoMstMap`（汎用マスタTLN_GENERAL参照）が実質これ ※下記★ | 現物確認のうえ標準化 |
| BIZ-01 | REST共通基盤 | `REST_API_COMMON.js` が**空** | **新規・最優先** |
| BIZ-02 | DB・SQL補助 | `DbUtil.js` で充足 | 流用＋ページング追加 |
| BIZ-03 | バリデーション | なし | 新規 |
| BIZ-04 | 帳票・CSV・メール | メールは `TCP_MAIL` で充足。**帳票・CSVはなし** | メール流用、帳票/CSVは別途 |

---

## 3. フォルダに無いが参照されている依存（★要確認）

コード中で呼ばれているが本フォルダに見当たらないモジュール。別フォルダ管理か、未配置か要確認。

- **`TCP_UTIL`**（`getHanyoMstMap`）… `TCP_MAIL` / `WFS_UTIL` が依存。実質「設定読込(BASE-04)」の中核。所在確認必須。
- **`WFS_MAIL`**（`sendApproval`等）… `WFS_CUSTOM` / `WFS_RESOLVE` のコメントが参照。WF通知の本体。
- **`setClmShinseiStatus`**（CLM）… `WFS_CUSTOM` から呼出（`CLM_WFS_LOGIC` 内に定義あり）。
- **`setRing`**（稟議採番）… `WFS_BIZ` から呼出（`RINGI_SAIBAN.js` に定義あり）。

---

## 4. 標準化にあたっての論点（リファクタ観点）

1. **SQL組立が2流儀**: `DbUtil`（カラム動的取得＋escape）と `WFS_COMMON`系（インライン文字列＋`tln_com_escape`）が混在。標準を `DbUtil` 系に一本化するか方針決めが必要。
2. **ES5方針と実コードの乖離**: `WFS_UTIL` / `TCP_MAIL` が `.map()` / `.filter()` / `Array.isArray` を使用。純JS配列には動くが、標準で「Java型配列に `.map` 不可」と明記した点と整合させ、CORE-01の `each/mapTo` 利用へ寄せるか線引きが必要。
3. **命名の不統一**: `DbUtil` / `TCP_*` / `WFS_*` が混在。標準の `core_/base_/biz_` 命名・名前空間（`COM.*`）へ寄せるかは、既存の呼び出し影響範囲を見て段階移行。
4. **ログ・エラーが各所直叩き**: BASE-01/02 を新設し、既存も順次そこへ寄せると保守性が上がる。

---

## 5. 棚卸しの結論と次アクション

- **流用確定**: `DbUtil`（→BIZ-02）、`TCP_MAIL`（→BIZ-04メール部）。この2本は標準の「お手本」にできる。
- **最優先で新規**: `BIZ-01 REST共通基盤`（空のため）。土台として `BASE-01 ログ` `BASE-02 エラー` `CORE-01 JS↔Java変換` を先に整える。
- **散在の集約**: `WFS_COMMON` 冒頭の汎用部品を `CORE-01/02` へ抽出。
- **WF基盤・個別業務は対象外**: 共通基盤の整備対象は①業務機能に分類し、今回は触らない。
- **要確認**: `TCP_UTIL` の所在（BASE-04の現物）。

> 次の一手の候補: ①モジュール一覧の状態を本棚卸しに合わせて更新（DbUtil/TCP_MAILを「流用」表記に）、②`TCP_UTIL` 所在の確認、③`CORE-01 JS↔Java変換` または `BIZ-01 REST` の雛形着手。
