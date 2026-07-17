/**
 * ============================================================
 *  共通CSJS : format.js  文字列 / 数値の整形（フォーマット）
 * ------------------------------------------------------------
 *  TALON クライアントサイドJavaScript 共通部品
 *  名前空間 : Common.Fmt
 *
 *  使い方:
 *    Common.Fmt.comma(1234567)      => "1,234,567"
 *    Common.Fmt.zeroPad(7, 4)       => "0007"
 *    Common.Fmt.toHankaku("１２３")  => "123"
 *
 *  ※ TALON環境を考慮し ES5 互換（var / function）で記述。
 * ============================================================
 */
var Common = Common || {};
Common.Fmt = (function () {
  "use strict";

  return {
    /**
     * 3桁カンマ編集。小数部はそのまま保持。
     * comma(1234567)    => "1,234,567"
     * comma(1234.5)     => "1,234.5"
     * comma("")         => ""
     */
    comma: function (v) {
      if (v === null || v === undefined || v === "") { return ""; }
      var s = String(v);
      var sign = "";
      if (s.charAt(0) === "-") { sign = "-"; s = s.substring(1); }
      var parts = s.split(".");
      parts[0] = parts[0].replace(/(\d)(?=(\d{3})+$)/g, "$1,");
      return sign + parts.join(".");
    },

    /**
     * カンマ・通貨記号を除去して数値文字列に戻す。
     * unComma("1,234,567") => "1234567"
     */
    unComma: function (v) {
      if (v === null || v === undefined) { return ""; }
      return String(v).replace(/[,\\¥￥$\s]/g, "");
    },

    /**
     * 円通貨フォーマット。yen(1200) => "￥1,200"
     */
    yen: function (v) {
      if (v === null || v === undefined || v === "") { return ""; }
      return "￥" + Common.Fmt.comma(v);
    },

    /**
     * 左ゼロ埋め。zeroPad(7, 4) => "0007"
     */
    zeroPad: function (v, len) {
      var s = (v === null || v === undefined) ? "" : String(v);
      while (s.length < len) { s = "0" + s; }
      return s;
    },

    /**
     * 右側を指定文字で埋める。padRight("ab", 5, "*") => "ab***"
     */
    padRight: function (v, len, ch) {
      ch = ch || " ";
      var s = (v === null || v === undefined) ? "" : String(v);
      while (s.length < len) { s = s + ch; }
      return s;
    },

    /**
     * 前後の空白（半角・全角）を除去。
     */
    trim: function (v) {
      if (v === null || v === undefined) { return ""; }
      return String(v).replace(/^[\s　]+|[\s　]+$/g, "");
    },

    /**
     * 全角英数字・記号 → 半角に変換。
     * toHankaku("ＡＢＣ１２３") => "ABC123"
     */
    toHankaku: function (v) {
      if (v === null || v === undefined) { return ""; }
      return String(v).replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
      }).replace(/　/g, " ");
    },

    /**
     * 半角英数字・記号 → 全角に変換。
     * toZenkaku("ABC123") => "ＡＢＣ１２３"
     */
    toZenkaku: function (v) {
      if (v === null || v === undefined) { return ""; }
      return String(v).replace(/[A-Za-z0-9!-~]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
      }).replace(/ /g, "　");
    },

    /**
     * 数値を小数 digits 桁に丸めて文字列化（四捨五入）。
     * round(1.2345, 2) => "1.23"
     */
    round: function (v, digits) {
      if (v === null || v === undefined || v === "") { return ""; }
      var n = Number(Common.Fmt.unComma(v));
      if (isNaN(n)) { return ""; }
      var p = Math.pow(10, digits || 0);
      return String(Math.round(n * p) / p);
    },

    /**
     * 電話番号などのハイフン除去（数字以外を削除）。
     */
    numOnly: function (v) {
      if (v === null || v === undefined) { return ""; }
      return String(v).replace(/[^\d]/g, "");
    }
  };
})();
