/**
 * WFS_BIZ : [共通]ワークフロー work_id別 本処理
 *
 * @version 2026/06/21
 *
 * work_idごとの業務ロジック（本処理）。ここで例外が出た場合は本処理失敗として
 * 上位へ伝播させる（マスタ反映失敗等を握り潰さない）。
 * CLM（setClmShinseiStatus）・稟議番号採番（setRing）は既存の外部モジュールへ委譲。
 *
 * 依存：WFS_CONST / TALON / TalonDbUtil / TCP_SUPPLIER_WF / setRing(外部)
 */
var WFS_BIZ = {

    /**
     * 稟議番号設定（申請時のみ）
     * @param {string} obj_id
     * @param {string} syori_kbn
     */
    setRingNo: function (obj_id, syori_kbn) {
        if (syori_kbn != WFS_CONST.SYORI.SHINSEI) return;
        // ★要確認: setRing は本モジュール未定義。別モジュールで定義されていることを確認すること。
        //          未定義のままだと稟議申請時に ReferenceError となる。
        setRing(obj_id);
    },

    /**
     * 取引先マスタ設定ロジック（決裁時のみ）
     * @param {string} obj_id
     * @param {string} syori_kbn
     */
    setToriMst: function (obj_id, syori_kbn) {
        if (syori_kbn != WFS_CONST.SYORI.KESSAI) return;
        TALON.getLogger().writeInfo('[WFS_BIZ.setToriMst] obj_id=' + obj_id + ' syori_kbn=' + syori_kbn);
        var conn = TALON.getDbConfig();

        // ★要確認: 下記 workList(RENKET_FLG) は現状ログ出力のみで未使用。
        //          JDE連携（execJdeRenket）の分岐判定に使う想定なら活用、不要なら削除を。
        var workList = TalonDbUtil.select(conn,
            'SELECT SHINSEI_ID, RENKET_FLG FROM MST_T_TORIHIKISAKI_WORK WHERE SHINSEI_ID = ?',
            [obj_id]
        );
        TALON.getLogger().writeInfo('[WFS_BIZ.setToriMst] work=' + JSON.stringify(workList[0] || null));
        // 1. TALONマスタ反映
        TCP_SUPPLIER_WF.reflect(obj_id);
        // 2. JDE連携（新規申請固定）
        // execJdeRenket(obj_id, 'A');   // ★TODO: 連携実装が保留中
    }
};
