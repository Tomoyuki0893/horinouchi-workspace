/**
 * ============================================================================
 *  TCP.Log : ログ共通（共通基盤 / BASE-01）
 * ----------------------------------------------------------------------------
 *  TALON.getLogger() の薄いラッパー。出力レベルの統一・コンテキスト
 *  （ユーザID / 機能ID）の自動付与・処理の開始/終了ログを提供する。
 *
 *  ※ 既存コードは log.writeDebug/writeInfo/writeError を各所で直叩きしていた。
 *    今後はこのモジュール経由に寄せることで、ログ書式を一元管理する。
 *
 *  前提:
 *    - TALON.getLogger() は writeDebug / writeInfo / writeError を持つ。
 *      （writeWarn は無い前提で、WARN は writeInfo に [WARN] タグで出力）
 *    - 非ログインコンテキスト（WFエンジンフック等）では getUserInfoMap() が
 *      使えないため、コンテキスト取得は try/catch で握りつぶす。
 *
 *  利用例:
 *    TCP.Log.info('処理を開始します');
 *    TCP.Log.start('取引先反映');
 *    try { ... } catch (e) { TCP.Log.error('反映失敗', e); }
 *    TCP.Log.end('取引先反映');
 *
 *  依存: TALON / TCP.Conv（任意）
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Log = (function () {
    'use strict';

    var _ctx = null; // コンテキスト文字列のキャッシュ

    function _logger() {
        return TALON.getLogger();
    }

    /** [USER/FUNC] 形式のコンテキストを構築（1回だけ・失敗時は空） */
    function _context() {
        if (_ctx !== null) return _ctx;
        var userId = '';
        var funcId = '';
        try {
            var info = TALON.getUserInfoMap();
            if (info) {
                userId = String(info.get ? (info.get('USER_ID') || '') : (info['USER_ID'] || ''));
                funcId = String(info.get ? (info.get('FUNC_ID') || '') : (info['FUNC_ID'] || ''));
            }
        } catch (e) {
            // 非ログインコンテキスト等。コンテキスト無しで継続。
        }
        _ctx = (userId || funcId) ? ('[' + funcId + '/' + userId + '] ') : '';
        return _ctx;
    }

    /** メッセージへ接頭辞（コンテキスト＋レベルタグ）を付与 */
    function _format(tag, msg) {
        return _context() + (tag ? ('[' + tag + '] ') : '') + _str(msg);
    }

    function _str(v) {
        if (v === null || v === undefined) return '';
        if (typeof v === 'string') return v;
        try { return String(v); } catch (e) { return ''; }
    }

    /** 例外オブジェクトを読みやすい文字列へ */
    function _errStr(e) {
        if (!e) return '';
        var msg = (e.message !== undefined && e.message !== null) ? e.message : String(e);
        var stack = e.stack ? ('\n' + e.stack) : '';
        return msg + stack;
    }


    // ========================================================================
    //  公開API
    // ========================================================================

    function debug(msg) { _logger().writeDebug(_format(null, msg)); }

    function info(msg)  { _logger().writeInfo(_format(null, msg)); }

    /** WARN（TALONロガーに専用メソッドが無いため writeInfo + [WARN] タグ） */
    function warn(msg)  { _logger().writeInfo(_format('WARN', msg)); }

    /**
     * エラー出力。第2引数に例外を渡すとメッセージ＋スタックを連結。
     * @param {String} msg  メッセージ
     * @param {Object} e    例外（任意）
     */
    function error(msg, e) {
        var text = _format('ERROR', msg);
        if (e) text += ' / ' + _errStr(e);
        _logger().writeError(text);
    }

    /** 処理開始ログ */
    function start(name) { info('=== START ' + _str(name) + ' ==='); }

    /** 処理終了ログ */
    function end(name)   { info('=== END '   + _str(name) + ' ==='); }

    /** コンテキストキャッシュをクリア（ユーザ切替・バッチ多重実行時） */
    function resetContext() { _ctx = null; }

    return {
        debug:        debug,
        info:         info,
        warn:         warn,
        error:        error,
        start:        start,
        end:          end,
        resetContext: resetContext
    };
})();
