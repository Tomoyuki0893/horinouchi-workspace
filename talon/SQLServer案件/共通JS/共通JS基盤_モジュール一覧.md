# TALON 共通JS基盤 モジュール一覧

> 関連: [アーキテクチャ標準](共通JS基盤_アーキテクチャ標準.md) ／ [既存棚卸し](共通JS基盤_既存棚卸しマッピング.md)
> 本ドキュメントは標準に紐づく **モジュール管理台帳** です。新規追加・状態更新はここで管理します。

- 対象環境: TALON JavaScriptエンジン（Nashorn / ES5準拠）、SQLServer
- 命名規約: ルート名前空間 **`TCP`**（自社接頭辞）配下に集約。`TCP.Conv` / `TCP.Log` …
  ファイル名は `TCP_モジュール名.js`。既存の `TCP_MAIL`（アンダースコア＝ささえあ用）とは非衝突。
- 最終更新: 2026-06-27

---

## 凡例

**状態**: 🔲 未着手 ／ 🔨 作成中 ／ ✅ 完成 ／ ⏸ 保留 ／ ♻ 既存流用
**優先**: ★★★ 最優先 ／ ★★ 高 ／ ★ 中

---

## モジュール一覧（マスタ）

| ID | 層 | クラス | ファイル | 優先 | 状態 | 依存先 | 担当 |
|---|---|---|---|---|---|---|---|
| CORE-01 | ④ | `TCP.Conv` | `TCP_Conv.js` | ★★★ | ✅ 完成 | なし | - |
| CORE-02 | ④ | `TCP.Fmt` | `TCP_Fmt.js` | ★★ | ✅ 完成 | java.* | - |
| CORE-03 | ④ | `TCP.Json` | `TCP_Json.js` | ★★ | ✅ 完成 | TCP.Conv | - |
| BASE-01 | ③ | `TCP.Log` | `TCP_Log.js` | ★★★ | ✅ 完成 | TALON | - |
| BASE-02 | ③ | `TCP.Error` | `TCP_Error.js` | ★★★ | ✅ 完成 | TCP.Log | - |
| BASE-03 | ③ | `TCP.Msg` | `TCP_Msg.js` | ★★ | ✅ 完成 | なし | - |
| BASE-04 | ③ | `TCP.Config` | `TCP_Config.js` | ★ | ✅ 完成 | TCP.Conv | - |
| BIZ-01 | ② | `TCP.Rest` | `TCP_Rest.js` | ★★★ | ✅ 完成 | TCP.Json, TCP.Error, TCP.Log | - |
| BIZ-02 | ② | `TCP.Db` | `TCP_Db.js` | ★★ | ✅ 完成 | TCP.Conv, TCP.Error, TCP.Log, TCP.Fmt | - |
| BIZ-03 | ② | `TCP.Valid` | `TCP_Valid.js` | ★★ | ✅ 完成 | TCP.Fmt | - |
| BIZ-04 | ② | `TCP.Mail` | `TCP_Mailer.js` ※1 | ★ | ✅ 完成 | TCP.Config, TCP.Log, TCP.Conv | - |

**進捗**: 全11モジュール完成 🎉（CORE 3 / BASE 4 / BIZ 4）。

> ※1 ファイル名は `TCP_Mailer.js`。Windowsは大文字小文字を区別しないため、既存 `TCP_MAIL.js`（ささえあ用）との衝突回避でクラス名 `TCP.Mail` ／ ファイル名 `TCP_Mailer.js` とした。

---

## モジュール詳細

### ✅ CORE-01 `TCP.Conv` — JS↔Java変換

判定（isJavaList/isJavaArray/isArrayLike/isJavaMap）、配列（size/at/`each`/`mapTo`/toJsArray/toJavaArray）、マップ（`getVal`/`setVal`/keys/isEmptyMap/toJsObject）。`.forEach`/`.map` 代替の土台。既存 `WFS_COMMON`(getMapVal等)・`DbUtil`(getMapKeys等) の散在処理を集約。

### ✅ CORE-02 `TCP.Fmt` — 日付・文字列・数値

日付（now/toDate/formatDate/toWareki）、文字列（trim/isBlank/nvl/zeroPad/lpad/rpad/escapeSql）、数値（toNumber/formatNumber/round）。`SimpleDateFormat` 利用。既存 `tln_com_escape/nowdate/todate` を整理・拡張。

### ✅ CORE-03 `TCP.Json` — JSONヘルパー

parse/stringify（安全版）、`getPath`（null安全パスアクセス・Java Map対応）、isJson。TCP.Rest のレスポンス処理の土台。

### ✅ BASE-01 `TCP.Log` — ログ共通

`TALON.getLogger()` ラッパー。`[機能ID/ユーザID]` 自動付与、debug/info/warn/error、start/end、resetContext。非ログイン時もtry/catchで安全。

### ✅ BASE-02 `TCP.Error` — エラーハンドリング

create（業務エラー生成）、wrap、`fail`（メッセージ提示＋失敗確定）、`handle`（catch一括）、toResponse/ok。エラーコード体系 `E+区分2桁+連番3桁`（10入力/20業務/30DB/40連携/90システム）。

### ✅ BIZ-01 `TCP.Rest` — REST共通基盤

HttpURLConnectionベース汎用クライアント。get/post/put/del、configure（共通設定）、共通ヘッダ・タイムアウト・リトライ、**プラグイン式認証**（Bearer/カスタムヘッダ/401時トークン自動再取得）。レスポンスは TCP.Json でパース、エラーは TCP.Error 形式。

> ★要確定: 認証方式の現物（トークンヘッダ名・取得エンドポイント、またはFORM認証）。確定次第 `configure({auth:{...}})` を埋める。

### ✅ BASE-03 `TCP.Msg` — 定数・メッセージ

register/msg（{0}置換）/has/registerConst/constant、直接参照用 `C`。未登録IDはID自体を返し実行を止めない。`WFS_CONST`（WF専用）とは別の汎用機構。

### ✅ BASE-04 `TCP.Config` — 設定読込

メモリ設定（set/get/setAll）と汎用マスタ参照（getMaster/getMasterVal・キャッシュ付き）。`TCP_UTIL.getHanyoMstMap` に準拠し、VIEW `TLN_M_HANYO_CODE` / キー `SIKIBETU_CODE`・`KEY_CODE` / 値 `DSP1〜DSP5` を参照。`configureMaster` で物理仕様を上書き可。

### ✅ BIZ-02 `TCP.Db` — DB・SQL補助

`DbUtil.js` を参考に新規。selectOne/selectList/getCount・insert/update/remove・監査列・**ページング（SQLServer OFFSET/FETCH、ORDER BY必須）**・buildInClause・getColumns。エラーは TCP.Error 形式。

### ✅ BIZ-03 `TCP.Valid` — バリデーション

個別判定（required/maxLen/isNumber/isInt/isMail/isZip/isTel/isDate/isHankaku/isZenkaku）と一括検証（validate/check＝エラーメッセージ収集）。

### ✅ BIZ-04 `TCP.Mail` — メール送信（ファイル: `TCP_Mailer.js`）

`TCP_MAIL.js`（エンジン）＋`WFS_UTIL.sendMail`（送信制御）を統合。Jakarta/javax自動対応、SMTP設定は TCP.Config 経由、送信抑止（MAIL_SEND_FLG=0）・テスト中継（MAIL_TEST_TO）を内蔵。

---

## 既存資産（参考元・ささえあ用／本基盤では変更しない）

| 既存ファイル | 役割 | 新基盤での扱い |
|---|---|---|
| `DbUtil.js` | 汎用DB CRUD | BIZ-02 `TCP.Db` の参考元 |
| `TCP_MAIL.js` | メール送信エンジン | BIZ-04 `TCP.Mail` の参考元 |
| `WFS_COMMON.js` | WFエンジン＋共通部品 | CORE-01/02 へ部品を参考抽出済 |
| `TCP_UTIL.js` | 汎用マスタ参照（getHanyoMstMap → `TLN_M_HANYO_CODE`） | BASE-04 `TCP.Config` の参考元（仕様確定済） |

---

## 追加申請（新規モジュールを足す場合）

ID（層プレフィックス-連番）/ 層 / クラス名（`TCP.Xxx`）/ ファイル名 / 優先 / 依存先 / 責務 / 公開関数 を埋めてマスタ表に追記する。既存モジュールに収まらないか、依存3原則を満たすかを必ず確認すること。
