/**
 * ============================================================================
 *  TCP.Config : 設定読込（共通基盤 / BASE-04）
 * ----------------------------------------------------------------------------
 *  アプリ設定（メモリ）と汎用マスタ（DB）の設定値を一元的に取得する。
 *  既存 TCP_UTIL.getHanyoMstMap(sikibetuCode, keyCode) と同等の参照を、
 *  キャッシュ付きで提供する。
 *
 *  汎用マスタ仕様（TCP_UTIL に準拠）:
 *    参照VIEW : TLN_M_HANYO_CODE（物理 TLN_M_HANYO_CODE_MAIN）
 *    キー列   : SIKIBETU_CODE（識別コード） / KEY_CODE（キーコード）
 *    値列     : DSP1〜DSP5 / DSP_NO1〜DSP_NO5 / SIKIBETU_NM 等
 *
 *  提供API:
 *    set / get               … メモリ設定
 *    getMaster / getMasterVal … 汎用マスタ参照（キャッシュ付き）
 *    clearCache
 *
 *  利用例:
 *    TCP.Config.set('apiBaseUrl', 'https://...');
 *    var url  = TCP.Config.get('apiBaseUrl', '');
 *    var base = TCP.Config.getMasterVal('TLN_GENERAL', 'MAIL_BASE_URL', 'DSP1');
 *
 *  依存: TALON / TalonDbUtil / TCP.Conv / TCP.Fmt(任意)
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Config = (function () {
    'use strict';

    // 汎用マスタの物理仕様（TCP_UTIL.getHanyoMstMap に準拠）
    var _MASTER = {
        TABLE:   'TLN_M_HANYO_CODE', // 参照VIEW（物理 TLN_M_HANYO_CODE_MAIN）
        COL_KBN: 'SIKIBETU_CODE',    // 識別コード列
        COL_CD:  'KEY_CODE'          // キーコード列
    };

    var _settings = {};  // メモリ設定
    var _cache = {};     // 汎用マスタキャッシュ（key='KBN\tCD'）

    // ------------------------------------------------------------------
    //  メモリ設定
    // ------------------------------------------------------------------

    /** 設定値をセット */
    function set(key, val) {
        _settings[key] = val;
        return val;
    }

    /** 設定値を取得（無ければ def） */
    function get(key, def) {
        var v = _settings[key];
        return (v === undefined || v === null) ? (def === undefined ? null : def) : v;
    }

    /** まとめてセット */
    function setAll(obj) {
        if (!obj) return;
        for (var k in obj) { if (obj.hasOwnProperty(k)) _settings[k] = obj[k]; }
    }


    // ------------------------------------------------------------------
    //  汎用マスタ参照（キャッシュ付き）
    // ------------------------------------------------------------------

    /**
     * 汎用マスタの1レコードを取得する（JS Object）。
     * @param {String} kbn  区分コード（例 'TLN_GENERAL'）
     * @param {String} cd   コード（例 'MAIL_BASE_URL'）
     * @returns {Object|null}  レコード（無ければ null）
     */
    function getMaster(kbn, cd) {
        var ckey = String(kbn) + '\t' + String(cd);
        if (_cache.hasOwnProperty(ckey)) return _cache[ckey];

        var row = null;
        try {
            var sql =
                'SELECT * FROM ' + _MASTER.TABLE +
                ' WHERE ' + _MASTER.COL_KBN + " = '" + _esc(kbn) + "'" +
                '   AND ' + _MASTER.COL_CD  + " = '" + _esc(cd)  + "'";
            var list = TalonDbUtil.select(TALON.getDbConfig(), sql);
            if (list && TCP.Conv.size(list) > 0) {
                row = TCP.Conv.toJsObject(TCP.Conv.at(list, 0));
            }
        } catch (e) {
            if (TCP.Log) TCP.Log.warn('[TCP.Config] 汎用マスタ取得失敗 kbn=' + kbn + ' cd=' + cd + ' : ' + (e.message || e));
            row = null;
        }
        _cache[ckey] = row;
        return row;
    }

    /**
     * 汎用マスタの指定列値を取得する。
     * @param {String} kbn  区分コード
     * @param {String} cd   コード
     * @param {String} col  列名（省略時 'DSP1'）
     * @param {String} def  無い場合の戻り値（省略時 ''）
     * @returns {String}
     */
    function getMasterVal(kbn, cd, col, def) {
        var fallback = (def === undefined) ? '' : def;
        var row = getMaster(kbn, cd);
        if (!row) return fallback;
        var v = TCP.Conv.getVal(row, col || 'DSP1');
        return (v === null || v === undefined) ? fallback : String(v);
    }

    /** キャッシュクリア（マスタ更新後やバッチ再実行時） */
    function clearCache() {
        _cache = {};
    }

    /** 物理仕様を上書き（テーブル/列名が確定したら起動時に1回） */
    function configureMaster(opts) {
        if (!opts) return;
        if (opts.table)  _MASTER.TABLE   = opts.table;
        if (opts.kbnCol) _MASTER.COL_KBN = opts.kbnCol;
        if (opts.cdCol)  _MASTER.COL_CD  = opts.cdCol;
        clearCache();
    }

    function _esc(v) {
        if (TCP.Fmt && TCP.Fmt.escapeSql) return TCP.Fmt.escapeSql(v);
        return (typeof v === 'string') ? v.replace(/'/g, "''") : v;
    }


    return {
        set:             set,
        setAll:          setAll,
        get:             get,
        getMaster:       getMaster,
        getMasterVal:    getMasterVal,
        clearCache:      clearCache,
        configureMaster: configureMaster
    };
})();
