/**
 * TCP_UTIL : 業務共通ユーティリティ
 *
 * 業務側で独自に定義する汎用関数を集約する名前空間。
 * WFS_COMMON（TALON標準共通ロジック）には依存するが、
 * TCP_WFS / TCP_REMINDER / TCP_MAIL からは独立して呼び出される。
 *
 * 使用例:
 *   var smtp = TCP_UTIL.getHanyoMstMap('TLN_GENERAL', 'MAIL_SMTP_SERVER');
 *
 * @version 2026/04/29
 */

var TCP_UTIL = TCP_UTIL || {};

(function (NS) {

    // =================================================================
    // 汎用マスタ取得
    // =================================================================

    /**
     * 汎用マスタ（TLN_M_HANYO_CODE）から、指定された識別コードと
     * キーコードに一致するレコードを1件取得する。
     *
     * 物理テーブル: TLN_M_HANYO_CODE_MAIN
     * 参照VIEW   : TLN_M_HANYO_CODE
     *
     * @param  {string} sikibetuCode  識別コード（データのカテゴリ）
     * @param  {string} keyCode       キーコード（カテゴリ内の個別データ）
     * @return {object|null}          該当レコードのMap（DSP1〜DSP5, DSP_NO1〜DSP_NO5, SIKIBETU_NM等を含む）。
     *                                存在しない場合は null
     */
    NS.getHanyoMstMap = function (sikibetuCode, keyCode) {
        var conn = TALON.getDbConfig();
        var whereMap = {
            SIKIBETU_CODE: sikibetuCode,
            KEY_CODE: keyCode
        };
        return DbUtil.selectOne(conn, 'TLN_M_HANYO_CODE', null, whereMap, null);
    };

})(TCP_UTIL);