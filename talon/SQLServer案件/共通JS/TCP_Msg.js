/**
 * ============================================================================
 *  TCP.Msg : 定数・メッセージ（共通基盤 / BASE-03）
 * ----------------------------------------------------------------------------
 *  メッセージID→文言の解決（{0},{1}.. 置換）と、共通定数の保持を行う。
 *  WFS_CONST はワークフロー専用のため、汎用メッセージ機構として新設。
 *
 *  提供API:
 *    register / registerConst / msg / has / constant(C)
 *
 *  利用例:
 *    TCP.Msg.register({
 *      'E10001': '{0} は必須項目です。',
 *      'I00001': '{0}件を登録しました。'
 *    });
 *    var m = TCP.Msg.msg('E10001', ['取引先名']);  // → '取引先名 は必須項目です。'
 *
 *    TCP.Msg.registerConst({ MAX_ROWS: 1000, DELETE_FLG_ON: '1' });
 *    var n = TCP.Msg.C.MAX_ROWS;
 *
 *  依存: なし（末端モジュール）
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Msg = (function () {
    'use strict';

    var _messages = {}; // id -> テンプレート文字列
    var _const = {};    // 共通定数

    /**
     * メッセージを登録（既存IDは上書き）。
     * @param {Object} map  { id: 'テンプレート', ... }
     */
    function register(map) {
        if (!map) return;
        for (var k in map) { if (map.hasOwnProperty(k)) _messages[k] = String(map[k]); }
    }

    /**
     * メッセージIDから文言を取得し、引数で {0},{1}.. を置換する。
     * 未登録IDの場合はID自体を返す（実行を止めない）。
     * @param {String}        id    メッセージID
     * @param {Array|*}       args  置換引数（配列 or 単値）
     * @returns {String}
     */
    function msg(id, args) {
        var tpl = _messages[id];
        if (tpl === undefined || tpl === null) {
            return String(id); // フォールバック
        }
        var list = (Object.prototype.toString.call(args) === '[object Array]')
            ? args
            : (args === undefined ? [] : [args]);
        return tpl.replace(/\{(\d+)\}/g, function (whole, idx) {
            var v = list[parseInt(idx, 10)];
            return (v === undefined || v === null) ? '' : String(v);
        });
    }

    /** メッセージIDが登録済みか */
    function has(id) {
        return _messages.hasOwnProperty(id);
    }

    /**
     * 共通定数を登録（既存は上書き）。TCP.Msg.C.XXX で参照可能になる。
     * @param {Object} obj
     */
    function registerConst(obj) {
        if (!obj) return;
        for (var k in obj) { if (obj.hasOwnProperty(k)) _const[k] = obj[k]; }
    }

    /** 定数取得（無ければ def） */
    function constant(key, def) {
        var v = _const[key];
        return (v === undefined) ? (def === undefined ? null : def) : v;
    }


    return {
        register:      register,
        msg:           msg,
        has:           has,
        registerConst: registerConst,
        constant:      constant,
        C:             _const   // 直接参照用（TCP.Msg.C.XXX）
    };
})();
