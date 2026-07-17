/**
 * ============================================================================
 *  TCP.Error : エラーハンドリング共通（共通基盤 / BASE-02）
 * ----------------------------------------------------------------------------
 *  業務エラーの生成・ラップ・TALON連携・標準レスポンス整形を一元化する。
 *
 *  ※ 既存コードは TALON.addErrorMsg(...) / TALON.setIsSuccess(false) を
 *    各所で直接呼んでいた。今後はこのモジュール経由に寄せ、エラーコード体系と
 *    画面/API向けレスポンス書式を統一する。
 *
 *  エラーコード体系（暫定・レビューで確定）:
 *    E + 区分2桁 + 連番3桁   例) E10001
 *      10: 入力/バリデーション
 *      20: 業務ルール
 *      30: DB
 *      40: 外部連携（REST/JDE等）
 *      90: システム/想定外
 *
 *  利用例:
 *    // 業務エラーを投げる
 *    throw TCP.Error.create('E20001', '既に承認済みのため実行できません。');
 *
 *    // 画面側でユーザにメッセージ提示しつつ処理失敗を確定
 *    TCP.Error.fail('入力に誤りがあります。', 'E10001');
 *
 *    // catch でまとめてハンドリング
 *    try { ... } catch (e) { return TCP.Error.handle(e); }
 *
 *  依存: TALON / TCP.Log
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Error = (function () {
    'use strict';

    var DEFAULT_CODE = 'E90000'; // システム/想定外

    /**
     * 業務エラーオブジェクトを生成する（throw 用）。
     * @param {String} code  エラーコード（例 'E20001'）
     * @param {String} msg   ユーザ向けメッセージ
     * @returns {Error}      code / appError 付きの Error
     */
    function create(code, msg) {
        var e = new Error(msg || '');
        e.code = code || DEFAULT_CODE;
        e.appError = true;   // 業務エラー（想定内）であることの目印
        return e;
    }

    /** 任意の値を Error 風オブジェクトへ正規化する */
    function wrap(e) {
        if (e && e.appError) return e;             // 既に業務エラー
        if (e instanceof Error) {
            e.code = e.code || DEFAULT_CODE;
            return e;
        }
        // 文字列や Java 例外など
        return create(DEFAULT_CODE, _msgOf(e));
    }

    function _msgOf(e) {
        if (e === null || e === undefined) return '';
        if (typeof e === 'string') return e;
        if (e.message !== undefined && e.message !== null) return String(e.message);
        try { return String(e); } catch (x) { return ''; }
    }

    function _codeOf(e) {
        return (e && e.code) ? e.code : DEFAULT_CODE;
    }

    /**
     * ユーザにメッセージを提示し、処理を失敗状態にする（画面処理向け）。
     * 例外は投げない（呼び出し側で return false 等に使う）。
     * @param {String} msg   ユーザ向けメッセージ
     * @param {String} code  エラーコード（任意・ログ用）
     * @returns {Boolean}    常に false
     */
    function fail(msg, code) {
        TCP.Log.warn('[' + (code || DEFAULT_CODE) + '] ' + msg);
        TALON.addErrorMsg(msg);
        TALON.setIsSuccess(false);
        return false;
    }

    /**
     * catch 節でのまとめ処理。ログ出力＋ユーザメッセージ＋失敗確定。
     * 業務エラー(appError)はそのメッセージを、想定外は汎用メッセージを提示。
     * @param {Object} e             捕捉した例外
     * @param {String} fallbackMsg   想定外時のユーザ向けメッセージ（任意）
     * @returns {Object}             toResponse(e) と同形のオブジェクト
     */
    function handle(e, fallbackMsg) {
        var we = wrap(e);
        TCP.Log.error('業務処理で例外を捕捉しました', we);

        var userMsg = we.appError
            ? we.message
            : (fallbackMsg || 'システムエラーが発生しました。管理者に連絡してください。');

        TALON.addErrorMsg(userMsg);
        TALON.setIsSuccess(false);
        return toResponse(we, userMsg);
    }

    /**
     * 画面/API向けの標準エラーレスポンスを整形する。
     * @param {Object} e        例外
     * @param {String} userMsg  上書きメッセージ（任意）
     * @returns {Object}        { success:false, code, message }
     */
    function toResponse(e, userMsg) {
        var we = wrap(e);
        return {
            success: false,
            code:    _codeOf(we),
            message: userMsg || we.message || ''
        };
    }

    /** 成功レスポンス（対になる整形ヘルパー） */
    function ok(data) {
        return { success: true, code: null, message: '', data: (data === undefined ? null : data) };
    }


    return {
        DEFAULT_CODE: DEFAULT_CODE,
        create:       create,
        wrap:         wrap,
        fail:         fail,
        handle:       handle,
        toResponse:   toResponse,
        ok:           ok
    };
})();
