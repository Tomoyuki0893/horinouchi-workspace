/**
 * ============================================================================
 *  TCP.Json : JSONヘルパー（共通基盤 / CORE-03）
 * ----------------------------------------------------------------------------
 *  安全なJSONパース / 文字列化と、null安全なパスアクセスを提供する。
 *  REST共通基盤（TCP.Rest）のレスポンス処理の土台にもなる。
 *
 *  提供API:
 *    parse / stringify / getPath / isJson
 *
 *  依存: TCP.Conv（任意・Java Map対応の getPath で使用）
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Json = (function () {
    'use strict';

    /**
     * 安全なJSONパース。失敗時は例外を投げず def（既定 null）を返す。
     * @param {String} str  JSON文字列
     * @param {*}      def  失敗時の戻り値（省略時 null）
     * @returns {*}
     */
    function parse(str, def) {
        var fallback = (def === undefined) ? null : def;
        if (str === null || str === undefined || str === '') return fallback;
        try {
            return JSON.parse(String(str));
        } catch (e) {
            return fallback;
        }
    }

    /**
     * 安全な文字列化。失敗時は空文字を返す。
     * @param {*}      obj     対象
     * @param {Number} indent  インデント空白数（省略時 0＝1行）
     * @returns {String}
     */
    function stringify(obj, indent) {
        if (obj === undefined) return '';
        try {
            return (indent && indent > 0)
                ? JSON.stringify(obj, null, indent)
                : JSON.stringify(obj);
        } catch (e) {
            return '';
        }
    }

    /**
     * null安全なパスアクセス。'a.b.c' や 'list.0.name' を辿る。
     * 途中が null/未定義なら def（既定 null）を返す。
     * Java Map が混在する場合は TCP.Conv.getVal で取得を試みる。
     * @param {Object} obj   対象オブジェクト
     * @param {String} path  ドット区切りパス
     * @param {*}      def   見つからない場合の戻り値（省略時 null）
     * @returns {*}
     */
    function getPath(obj, path, def) {
        var fallback = (def === undefined) ? null : def;
        if (!obj || isBlank(path)) return fallback;

        var keys = String(path).split('.');
        var cur = obj;
        for (var i = 0; i < keys.length; i++) {
            if (cur === null || cur === undefined) return fallback;
            var k = keys[i];
            var next;
            if (typeof TCP !== 'undefined' && TCP.Conv && TCP.Conv.isJavaMap && TCP.Conv.isJavaMap(cur)) {
                next = TCP.Conv.getVal(cur, k);
            } else if (typeof TCP !== 'undefined' && TCP.Conv && TCP.Conv.isJavaList && TCP.Conv.isJavaList(cur)) {
                next = cur.get(parseInt(k, 10));
            } else {
                next = cur[k];
            }
            if (next === undefined || next === null) {
                // 最終キーで null の場合のみ fallback、途中なら継続不可
                return (i === keys.length - 1 && next === null) ? null : fallback;
            }
            cur = next;
        }
        return cur;
    }

    /** 文字列がJSONとしてパース可能か */
    function isJson(str) {
        if (str === null || str === undefined || str === '') return false;
        try {
            JSON.parse(String(str));
            return true;
        } catch (e) {
            return false;
        }
    }

    function isBlank(val) {
        return val === null || val === undefined
            || String(val).replace(/^\s+|\s+$/g, '') === '';
    }

    return {
        parse:     parse,
        stringify: stringify,
        getPath:   getPath,
        isJson:    isJson
    };
})();
