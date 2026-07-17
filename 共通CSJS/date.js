/**
 * ============================================================
 *  共通CSJS : date.js  日付ユーティリティ
 * ------------------------------------------------------------
 *  TALON クライアントサイドJavaScript 共通部品
 *  名前空間 : Common.DateUtil
 *
 *  使い方:
 *    Common.DateUtil.today()                  => "2026/06/27"
 *    Common.DateUtil.format(new Date(),'YYYYMMDD')
 *    Common.DateUtil.addDays("2026/06/27", 7) => "2026/07/04"
 *    Common.DateUtil.wareki("2026/06/27")     => "令和8年6月27日"
 *
 *  ※ TALON環境を考慮し ES5 互換（var / function）で記述。
 *  ※ 内部では Date オブジェクトに正規化して扱う。
 * ============================================================
 */
var Common = Common || {};
Common.DateUtil = (function () {
  "use strict";

  var WEEK = ["日", "月", "火", "水", "木", "金", "土"];

  // "YYYY/MM/DD" 等の文字列 / Date を Date に変換（内部用）
  function _toDate(v) {
    if (v instanceof Date) { return v; }
    if (v === null || v === undefined || v === "") { return null; }
    var s = String(v).replace(/[\-\.]/g, "/").replace(/[年月]/g, "/").replace(/日/g, "");
    var m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) { return null; }
    return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }

  function _z(n) { return (n < 10 ? "0" : "") + n; }

  return {
    // 内部変換を外部にも公開（他関数から使えるように）
    toDate: _toDate,

    /**
     * 日付を指定パターンで文字列化。
     * トークン: YYYY MM DD HH mm ss (M D は0埋めなし)
     * format(new Date(), 'YYYY/MM/DD HH:mm')
     */
    format: function (v, pattern) {
      var d = _toDate(v);
      if (!d) { return ""; }
      pattern = pattern || "YYYY/MM/DD";
      return pattern
        .replace(/YYYY/g, d.getFullYear())
        .replace(/MM/g, _z(d.getMonth() + 1))
        .replace(/DD/g, _z(d.getDate()))
        .replace(/HH/g, _z(d.getHours()))
        .replace(/mm/g, _z(d.getMinutes()))
        .replace(/ss/g, _z(d.getSeconds()))
        .replace(/M/g, d.getMonth() + 1)
        .replace(/D/g, d.getDate());
    },

    /**
     * 本日を "YYYY/MM/DD"（または指定パターン）で取得。
     */
    today: function (pattern) {
      return Common.DateUtil.format(new Date(), pattern || "YYYY/MM/DD");
    },

    /**
     * 日数加算（マイナスで減算）。結果は "YYYY/MM/DD"（または指定パターン）。
     */
    addDays: function (v, days, pattern) {
      var d = _toDate(v);
      if (!d) { return ""; }
      d.setDate(d.getDate() + days);
      return Common.DateUtil.format(d, pattern || "YYYY/MM/DD");
    },

    /**
     * 月数加算（マイナスで減算）。月末日の繰り上がりを補正。
     */
    addMonths: function (v, months, pattern) {
      var d = _toDate(v);
      if (!d) { return ""; }
      var day = d.getDate();
      d.setDate(1);
      d.setMonth(d.getMonth() + months);
      var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, last));
      return Common.DateUtil.format(d, pattern || "YYYY/MM/DD");
    },

    /**
     * 曜日の文字を返す。dayOfWeek("2026/06/27") => "土"
     */
    dayOfWeek: function (v) {
      var d = _toDate(v);
      return d ? WEEK[d.getDay()] : "";
    },

    /**
     * 2日付の差（日数）。from から to までの日数（to - from）。
     */
    diffDays: function (from, to) {
      var a = _toDate(from), b = _toDate(to);
      if (!a || !b) { return null; }
      var MS = 24 * 60 * 60 * 1000;
      return Math.round((b.getTime() - a.getTime()) / MS);
    },

    /**
     * 期間の前後チェック。from <= to なら true（同日もOK）。
     */
    isPeriodOk: function (from, to) {
      var d = Common.DateUtil.diffDays(from, to);
      return d !== null && d >= 0;
    },

    /**
     * 月末日を取得。endOfMonth("2026/06/10") => "2026/06/30"
     */
    endOfMonth: function (v, pattern) {
      var d = _toDate(v);
      if (!d) { return ""; }
      var e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return Common.DateUtil.format(e, pattern || "YYYY/MM/DD");
    },

    /**
     * 和暦変換。wareki("2026/06/27") => "令和8年6月27日"
     * 明治～令和に対応。
     */
    wareki: function (v) {
      var d = _toDate(v);
      if (!d) { return ""; }
      var y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
      var t = new Date(y, m - 1, day).getTime();
      var eras = [
        { name: "令和", start: new Date(2019, 4, 1).getTime(), base: 2018 },
        { name: "平成", start: new Date(1989, 0, 8).getTime(), base: 1988 },
        { name: "昭和", start: new Date(1926, 11, 25).getTime(), base: 1925 },
        { name: "大正", start: new Date(1912, 6, 30).getTime(), base: 1911 },
        { name: "明治", start: new Date(1868, 0, 25).getTime(), base: 1867 }
      ];
      for (var i = 0; i < eras.length; i++) {
        if (t >= eras[i].start) {
          var yy = y - eras[i].base;
          return eras[i].name + (yy === 1 ? "元" : yy) + "年" + m + "月" + day + "日";
        }
      }
      return Common.DateUtil.format(d, "YYYY年M月D日");
    }
  };
})();
