/**
 * ============================================================
 *  共通CSJS : validation.js  入力チェック（バリデーション）
 * ------------------------------------------------------------
 *  TALON クライアントサイドJavaScript 共通部品
 *  名前空間 : Common.Valid
 *
 *  使い方:
 *    if (!Common.Valid.required(value)) { ... }
 *    if (!Common.Valid.isNumber(value))  { ... }
 *
 *  すべての関数は「OKなら true / NGなら false」を返す（boolean）。
 *  空文字を許可するかどうかは各関数のコメントを参照。
 *  ※ TALON環境を考慮し ES5 互換（var / function）で記述。
 * ============================================================
 */
var Common = Common || {};
Common.Valid = (function () {
  "use strict";

  // null / undefined / "" を空とみなすか判定（内部用）
  function _isEmpty(v) {
    return v === null || v === undefined || String(v) === "";
  }

  return {
    /**
     * 必須チェック。値があれば true。
     * 空白だけの文字列は未入力とみなす。
     */
    required: function (v) {
      if (v === null || v === undefined) { return false; }
      return String(v).replace(/^[\s　]+|[\s　]+$/g, "") !== "";
    },

    /**
     * 数値チェック（整数・小数・マイナス可）。空はOK（必須は別途）。
     */
    isNumber: function (v) {
      if (_isEmpty(v)) { return true; }
      return /^-?\d+(\.\d+)?$/.test(String(v));
    },

    /**
     * 整数チェック（マイナス可）。空はOK。
     */
    isInteger: function (v) {
      if (_isEmpty(v)) { return true; }
      return /^-?\d+$/.test(String(v));
    },

    /**
     * 半角数字のみ（0-9）チェック。空はOK。郵便番号・コード等向け。
     */
    isDigits: function (v) {
      if (_isEmpty(v)) { return true; }
      return /^\d+$/.test(String(v));
    },

    /**
     * 半角英数字チェック。空はOK。
     */
    isAlphaNumeric: function (v) {
      if (_isEmpty(v)) { return true; }
      return /^[0-9a-zA-Z]+$/.test(String(v));
    },

    /**
     * メールアドレス形式チェック。空はOK。
     */
    isMail: function (v) {
      if (_isEmpty(v)) { return true; }
      return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(v));
    },

    /**
     * 日付形式チェック（YYYY/MM/DD・YYYY-MM-DD）。
     * 実在日（うるう年含む）まで判定。空はOK。
     */
    isDate: function (v) {
      if (_isEmpty(v)) { return true; }
      var m = String(v).match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (!m) { return false; }
      var y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
      if (mo < 1 || mo > 12 || d < 1) { return false; }
      var last = new Date(y, mo, 0).getDate();
      return d <= last;
    },

    /**
     * 最大文字数チェック。空はOK。max文字以下なら true。
     */
    maxLength: function (v, max) {
      if (_isEmpty(v)) { return true; }
      return String(v).length <= max;
    },

    /**
     * 最小文字数チェック。空はNG扱いにしたくないので空はOK。
     */
    minLength: function (v, min) {
      if (_isEmpty(v)) { return true; }
      return String(v).length >= min;
    },

    /**
     * 数値の範囲チェック（min以上 max以下）。空はOK。
     */
    range: function (v, min, max) {
      if (_isEmpty(v)) { return true; }
      var n = Number(v);
      if (isNaN(n)) { return false; }
      return n >= min && n <= max;
    },

    /**
     * 全角・半角まじりの「実体の文字数」ではなく
     * 全角を2バイト換算したバイト数で最大チェック（DB桁数対策）。空はOK。
     */
    maxByte: function (v, maxByte) {
      if (_isEmpty(v)) { return true; }
      var s = String(v), len = 0, i, c;
      for (i = 0; i < s.length; i++) {
        c = s.charCodeAt(i);
        // 半角(ASCII・半角カナ域)は1、それ以外は2でカウント
        len += (c >= 0x0 && c <= 0x7f) || (c >= 0xff61 && c <= 0xff9f) ? 1 : 2;
      }
      return len <= maxByte;
    }
  };
})();
