/**
 * ============================================================================
 *  TCP.Fmt : 日付・文字列・数値ユーティリティ（共通基盤 / CORE-02）
 * ----------------------------------------------------------------------------
 *  ES5(Nashorn)には日付整形ライブラリが無いため自前で提供する。
 *  既存 WFS_COMMON の tln_com_escape / tln_com_nowdate / tln_com_todate を
 *  参考に、TCP名前空間へ整理・拡張したもの。
 *
 *  提供API:
 *    日付 : now / toDate / formatDate / toWareki
 *    文字列: trim / isBlank / nvl / zeroPad / lpad / rpad / escapeSql
 *    数値 : toNumber / formatNumber / round
 *
 *  注意:
 *    - java.util.Date / java.text.SimpleDateFormat を利用する。
 *    - formatDate のパターンは SimpleDateFormat 準拠（yyyy/MM/dd HH:mm:ss 等）。
 *
 *  依存: TALON(任意) / java.*
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Fmt = (function () {
    'use strict';

    var SimpleDateFormat = java.text.SimpleDateFormat;
    var JavaDate         = java.util.Date;

    // ========================================================================
    //  日付
    // ========================================================================

    /** 現在日時（java.util.Date） */
    function now() {
        return new JavaDate();
    }

    /**
     * 'yyyy/MM/dd' 文字列を java.util.Date へ。
     * @param {String} val  例 '2026/06/27'（区切りは / または -）
     * @returns {Object|null}  java.util.Date（不正時 null）
     */
    function toDate(val) {
        if (isBlank(val)) return null;
        var parts = String(val).replace(/-/g, '/').split('/');
        if (parts.length < 3) return null;
        var y = parseInt(parts[0], 10);
        var m = parseInt(parts[1], 10);
        var d = parseInt(parts[2], 10);
        if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
        // 月は 0 始まり
        return new JavaDate(y - 1900, m - 1, d);
    }

    /**
     * 日付を指定パターンで整形する。
     * @param {Object} dateObj  java.util.Date（null可）
     * @param {String} pattern  SimpleDateFormat 形式（省略時 'yyyy/MM/dd'）
     * @returns {String}        整形文字列（null時は空）
     */
    function formatDate(dateObj, pattern) {
        if (!dateObj) return '';
        var p = pattern || 'yyyy/MM/dd';
        try {
            return String(new SimpleDateFormat(p).format(dateObj));
        } catch (e) {
            return '';
        }
    }

    /**
     * 和暦へ変換する（令和のみ簡易対応。改元時はここを更新）。
     * @param {Object} dateObj  java.util.Date
     * @returns {String}        例 '令和8年6月27日'（範囲外は西暦表記）
     */
    function toWareki(dateObj) {
        if (!dateObj) return '';
        var y = parseInt(formatDate(dateObj, 'yyyy'), 10);
        var md = formatDate(dateObj, 'M月d日');
        // 令和: 2019/05/01〜
        if (y >= 2019) {
            var ry = y - 2018;
            return '令和' + (ry === 1 ? '元' : ry) + '年' + md;
        }
        return formatDate(dateObj, 'yyyy年M月d日');
    }


    // ========================================================================
    //  文字列
    // ========================================================================

    /** 前後空白除去（null/undefined安全。Java文字列も可） */
    function trim(val) {
        if (val === null || val === undefined) return '';
        return String(val).replace(/^\s+|\s+$/g, '');
    }

    /** null / undefined / 空白のみ なら true */
    function isBlank(val) {
        return trim(val) === '';
    }

    /** val が空なら def を返す（NVL相当） */
    function nvl(val, def) {
        return isBlank(val) ? (def === undefined ? '' : def) : val;
    }

    /**
     * 左ゼロ埋め。
     * @param {*}      val  値
     * @param {Number} len  桁数
     * @returns {String}
     */
    function zeroPad(val, len) {
        return lpad(val, len, '0');
    }

    /** 左詰め（指定文字でlen桁まで埋める） */
    function lpad(val, len, ch) {
        var s = (val === null || val === undefined) ? '' : String(val);
        var c = ch || ' ';
        while (s.length < len) { s = c + s; }
        return s;
    }

    /** 右詰め */
    function rpad(val, len, ch) {
        var s = (val === null || val === undefined) ? '' : String(val);
        var c = ch || ' ';
        while (s.length < len) { s = s + c; }
        return s;
    }

    /** SQL用エスケープ（' → ''）。文字列以外はそのまま返す（既存 tln_com_escape 相当） */
    function escapeSql(val) {
        if (typeof val === 'string') {
            return val.replace(/'/g, "''");
        }
        return val;
    }


    // ========================================================================
    //  数値
    // ========================================================================

    /** 数値へ変換（不正時は def、未指定なら 0） */
    function toNumber(val, def) {
        if (val === null || val === undefined || val === '') {
            return (def === undefined) ? 0 : def;
        }
        var n = Number(val);
        return isNaN(n) ? ((def === undefined) ? 0 : def) : n;
    }

    /**
     * 3桁カンマ区切り。
     * @param {*}      val      値
     * @param {Number} digits   小数桁（省略時 0）
     * @returns {String}
     */
    function formatNumber(val, digits) {
        var n = toNumber(val, 0);
        var d = (digits === undefined) ? 0 : digits;
        var fixed = n.toFixed(d);
        var sign = '';
        if (fixed.charAt(0) === '-') { sign = '-'; fixed = fixed.substring(1); }
        var p = fixed.split('.');
        p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return sign + p.join('.');
    }

    /** 指定小数桁で四捨五入（数値を返す） */
    function round(val, digits) {
        var d = (digits === undefined) ? 0 : digits;
        var f = Math.pow(10, d);
        return Math.round(toNumber(val, 0) * f) / f;
    }


    return {
        // 日付
        now:          now,
        toDate:       toDate,
        formatDate:   formatDate,
        toWareki:     toWareki,
        // 文字列
        trim:         trim,
        isBlank:      isBlank,
        nvl:          nvl,
        zeroPad:      zeroPad,
        lpad:         lpad,
        rpad:         rpad,
        escapeSql:    escapeSql,
        // 数値
        toNumber:     toNumber,
        formatNumber: formatNumber,
        round:        round
    };
})();
