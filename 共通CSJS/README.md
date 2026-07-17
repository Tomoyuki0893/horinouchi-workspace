# 共通CSJS（TALON クライアントサイドJavaScript 共通部品）

TALON のどの機能（画面）からでも呼び出して使える、汎用ユーティリティ関数のライブラリです。
同じ処理を画面ごとにコピペせず、ここに集約して使い回すことを目的としています。

## ファイル構成

| ファイル | 名前空間 | 内容 |
|---|---|---|
| `validation.js` | `Common.Valid` | 入力チェック（必須・数値・日付・メール・桁数・バイト数など） |
| `format.js` | `Common.Fmt` | 文字列/数値の整形（カンマ・ゼロ埋め・全角半角・通貨・丸めなど） |
| `date.js` | `Common.DateUtil` | 日付ユーティリティ（フォーマット・加算・曜日・和暦・期間チェックなど） |
| `rest.js` | `Common.Rest` | TALON REST-API のJSON送受信ラッパー（共通エラーハンドリング付き） |
| `ui.js` | `Common.UI` | 画面制御/共通UI（二重送信防止・ローディング・確認・必須ハイライト・トースト） |

すべて `var Common = Common || {}` で同じ名前空間 `Common` にぶら下がる設計なので、
読み込み順は問いません。ES5 互換（`var`/`function`）で記述しているため古いブラウザでも動作します。

## TALONへの組み込み方

TALON の「共通CSJS」登録欄、または各機能のCSJSヘッダから、上記ファイルを読み込んでください。
（共通CSJSとして登録すれば全画面で自動的に利用可能になります。）

読み込んだあとは、各画面のイベント（ボタン押下時など）から直接呼び出せます。

## 使用例

### 入力チェック（validation.js）

```javascript
// 登録ボタン押下時の検証例
function onClickRegister() {
  var name = getValue("USER_NM");   // ※getValueはTALONの値取得処理に置き換え
  var mail = getValue("MAIL");
  var date = getValue("BIRTH");

  if (!Common.Valid.required(name)) { alert("氏名は必須です"); return false; }
  if (!Common.Valid.isMail(mail))   { alert("メール形式が不正です"); return false; }
  if (!Common.Valid.isDate(date))   { alert("日付が不正です"); return false; }
  if (!Common.Valid.maxByte(name, 42)) { alert("氏名が長すぎます"); return false; }
  return true;
}
```

### 整形（format.js）

```javascript
Common.Fmt.comma(1234567);     // "1,234,567"
Common.Fmt.yen(1200);          // "￥1,200"
Common.Fmt.zeroPad(7, 4);      // "0007"
Common.Fmt.toHankaku("ＡＢ１"); // "AB1"
Common.Fmt.unComma("1,234");   // "1234"  ← 計算前にカンマを外す
```

### 日付（date.js）

```javascript
Common.DateUtil.today();                     // "2026/06/27"
Common.DateUtil.format(new Date(), "YYYYMMDD"); // "20260627"
Common.DateUtil.addDays("2026/06/27", 7);    // "2026/07/04"
Common.DateUtil.addMonths("2026/01/31", 1);  // "2026/02/28"（月末補正あり）
Common.DateUtil.dayOfWeek("2026/06/27");     // "土"
Common.DateUtil.wareki("2026/06/27");        // "令和8年6月27日"
Common.DateUtil.isPeriodOk(from, to);        // 開始<=終了 なら true
```

### REST呼び出し（rest.js）

URL は `http(s)://host:port/Talon/rest/{機能ID}/{リソース名}` を自動生成します。

```javascript
// 任意：トークン認証(Ver6.2.3~)やbasePathを変える場合のみ
Common.Rest.config({ token: "xxxxx" });

// GET
Common.Rest.get("FNC0001", "users", { id: "001" },
  function (data) { console.log(data); },          // 成功
  function (err)  { alert(err.message); });        // 失敗（共通ハンドリング済み）

// POST（オブジェクトを渡すと自動でJSON化）
Common.Rest.post("FNC0001", "users", { name: "山田太郎" },
  function (data) { alert("登録しました"); },
  function (err)  { alert(err.message); });
```

### 画面制御 / 共通UI（ui.js）

jQuery等は不要（素のDOM操作）。必要なCSSは初回呼び出し時に自動注入されます。

```javascript
// 二重送信防止：処理をラップするだけ。done()で再有効化
function onClickRegister() {
  Common.UI.guardSubmit("btnRegister", function (done) {
    // 入力チェックNGなら false を返すと即解除
    var errs = [];
    if (!Common.Valid.required(getValue("USER_NM"))) { errs.push("USER_NM"); }
    if (!Common.Valid.isMail(getValue("MAIL")))       { errs.push("MAIL"); }
    if (errs.length) { Common.UI.markErrors(errs); Common.UI.toast("入力に誤りがあります"); return false; }

    Common.UI.showLoading();
    Common.Rest.post("FNC0001", "users", { name: getValue("USER_NM") },
      function () { Common.UI.hideLoading(); Common.UI.toast("登録しました"); done(); },
      function (e) { Common.UI.hideLoading(); alert(e.message); done(); });
  });
}

Common.UI.confirm("削除しますか？");   // OKでtrue
Common.UI.toast("保存しました");        // 画面下部に数秒表示
Common.UI.markErrors(["USER_NM"]);      // 必須項目を赤くして先頭にフォーカス
Common.UI.clearErrors(["USER_NM"]);     // エラー色を解除
```

## 設計メモ

- バリデーション関数は「OKなら `true` / NGなら `false`」を返します。
  必須以外の関数は**空文字を `true`（=エラーにしない）**として扱うので、
  必須チェックは `required()` と組み合わせてください。
- `format.js` で計算する前は `unComma()` でカンマを外してから数値化してください。
- `date.js` は `"YYYY/MM/DD"` / `"YYYY-MM-DD"` / `"YYYY年M月D日"` / `Date` を受け付けます。
- 共通CSJSは**全画面に影響する**ため、関数の挙動変更時は影響範囲に注意してください。
  新しい共通処理を足すときは、既存関数を壊さず追記する方針が安全です。

## 動作確認

`validation.js` / `format.js` / `date.js` の主要関数は Node.js で26ケースのテストを通しています
（カンマ編集、うるう年判定、月末補正、和暦、曜日など）。
`ui.js` は jsdom で14ケース（二重送信防止・ハイライト・ローディング・トースト等）を確認済みです。
`rest.js` はブラウザ（XMLHttpRequest）前提のためTALON実機での疎通確認を推奨します。
