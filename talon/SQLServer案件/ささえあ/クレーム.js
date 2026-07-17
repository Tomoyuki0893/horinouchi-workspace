/**
 * ============================================================================
 * CLM_WFS_LOGIC — クレーム管理（標準WFS承認）ロジック一式
 * ----------------------------------------------------------------------------
 *  含むもの:
 *    (A) CLM_PATTERN.determine(conn, shinseiNo)
 *          申請項目から CLM_M_PATTERN を引き、パターン '01'〜'09' を返す
 *    (B) 申請画面 確定(処理後) フック
 *          パターン → PARAM_VAL=CLM_P0x のルートを選択し ROUTE_ID/MAX_LVL を設定
 *          ※既存フックの「paramVal 固定」を差し替えるだけ
 *    (C) setClmShinseiStatus(obj_id, syori_kbn)
 *          WFS_CUSTOM.execWorkFlowCustom から呼ばれ、承認の度に
 *          CLM_T_SHINSEI.SHINSEI_STATUS を現LVL（=ステータス）に同期
 *
 *  前提モジュール: TALON / TalonDbUtil / DbUtil / tln_com_escape / getMapVal
 *  WORK_ID: CLM002=品質クレーム / CLM001=異常所見(有害事象)
 * ----------------------------------------------------------------------------
 * @version 2026/06/20
 * ========================================================================== */


/* =====================================================================
 * (A) パターン判定
 *   各次元を「一致 OR *ALL」で候補抽出し、*ALL が最少（最も具体的）な
 *   行のパターンを採用する。
 * ===================================================================== */
var CLM_PATTERN = (function () {
    'use strict';

    var TBL_PATTERN = 'CLM_M_PATTERN';
    var TBL_SHINSEI = 'CLM_T_SHINSEI';
    var WILD = '*ALL';

    function sval(v) { return (v === null || v === undefined) ? '' : String(v).trim(); }

    /**
     * @param {object} conn       DB接続
     * @param {string} shinseiNo  申請番号
     * @return {string}           パターン '01'〜'09'（判定不能時は ''）
     */
    function determine(conn, shinseiNo) {
        var sRow = DbUtil.selectOne(conn, TBL_SHINSEI, null, { SHINSEI_NO: shinseiNo }, null);
        if (!sRow) return '';

        var category = sval(sRow['CLAIM_CATEGORY']);
        var hanbaiCd = sval(sRow['HANBAIMOTO_CD']);
        var caFa = sval(sRow['CA_FA']);
        var iyaku = sval(sRow['IYAKUHIN_KBN']);
        var seizo = sval(sRow['SEIZOMOTO']);

        var sql =
            'SELECT PATTERN, HANBAIMOTO_CD, CA_FA, IYAKUHIN_KBN, SEIZOMOTO ' +
            'FROM   ' + TBL_PATTERN + ' ' +
            'WHERE  CLAIM_CATEGORY = ? ' +
            'AND   (HANBAIMOTO_CD = ? OR HANBAIMOTO_CD = ?) ' +
            'AND   (CA_FA         = ? OR CA_FA         = ?) ' +
            'AND   (IYAKUHIN_KBN  = ? OR IYAKUHIN_KBN  = ?) ' +
            'AND   (SEIZOMOTO     = ? OR SEIZOMOTO     = ?)';
        var rows = TalonDbUtil.select(conn, sql,
            [category, hanbaiCd, WILD, caFa, WILD, iyaku, WILD, seizo, WILD]);
        if (!rows || rows.length === 0) return '';

        var best = null, bestWild = 999;
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i], wild = 0;
            if (sval(r['HANBAIMOTO_CD']) === WILD) wild++;
            if (sval(r['CA_FA']) === WILD) wild++;
            if (sval(r['IYAKUHIN_KBN']) === WILD) wild++;
            if (sval(r['SEIZOMOTO']) === WILD) wild++;
            if (wild < bestWild) { bestWild = wild; best = r; }
        }
        return best ? sval(best['PATTERN']) : '';
    }

    return { determine: determine };
})();


/* =====================================================================
 * (B) 申請画面 確定(処理後) フック
 *   既存フックの「var paramVal = 'CLM002'」固定を、下記の
 *   パターン判定に差し替える。それ以外（ROUTE_ID/MAX_LVL更新）は従来どおり。
 *
 *   ▼ 設定例（処理呼出: 確定 / 処理後 / JavaScriptエンジン）
 * ===================================================================== */
function clmExec() {
    var conn = TALON.getDbConfig();
    var lineDataMap = TALON.getBlockData_Card(1);
    var shinseiNo = getMapVal(lineDataMap, 'SHINSEI_NO');
    var workId = getMapVal(lineDataMap, 'WORK_ID');   // CLM001 / CLM002
    var routeIdCurrent = getMapVal(lineDataMap, 'ROUTE_ID');

    // ROUTE_IDが既に設定済みならスキップ（再確定対策）
    if (routeIdCurrent != null && routeIdCurrent != '' && routeIdCurrent != 'undefined') {
        return true;
    }
    // WORK_IDチェック
    if (!workId || workId == '' || workId == 'undefined') {
        TALON.addErrorMsg('WORK_IDが取得できません。画面定義を確認してください。');
        TALON.setIsSuccess(false);
        return false;
    }

    // ★ここが差し替えの肝：パターン判定 → PARAM_VAL
    var pattern = CLM_PATTERN.determine(conn, shinseiNo);
    if (!pattern) {
        TALON.addErrorMsg('クレームパターンを判定できませんでした。申請項目（カテゴリ／販売元／品目情報）をご確認ください。');
        TALON.setIsSuccess(false);
        return false;
    }
    var paramVal = 'CLM_P' + pattern;   // CLM_P01 〜 CLM_P09

    // 物理ROUTE_ID取得（PARAM_FM/PARAM_TP はCLMルートの登録値に合わせる）
    var sqlRoute =
        "SELECT ROUTE_ID FROM WFS_M_ROUTE_HED " +
        "WHERE PARAM_VAL = '" + tln_com_escape(paramVal) + "' " +
        "  AND PARAM_FM  = '1' " +
        "  AND PARAM_TP  = '1' " +
        "  AND (DEL_FLG IS NULL OR DEL_FLG <> '1')";
    var resultRoute = TalonDbUtil.select(conn, sqlRoute);
    if (resultRoute.length === 0) {
        TALON.addErrorMsg('該当する承認ルートが見つかりません。(' + paramVal + ')');
        TALON.setIsSuccess(false);
        return false;
    }
    var routeId = getMapVal(resultRoute[0], 'ROUTE_ID');

    // MAX_LVL取得
    var sqlLvl =
        "SELECT MAX(LVL) AS MAX_LVL FROM WFS_M_AUTH " +
        "WHERE WORK_ID  = '" + tln_com_escape(workId) + "' " +
        "  AND ROUTE_ID = '" + tln_com_escape(routeId) + "'";
    var resultLvl = TalonDbUtil.select(conn, sqlLvl);
    if (resultLvl.length === 0 || getMapVal(resultLvl[0], 'MAX_LVL') == null) {
        TALON.addErrorMsg('承認階層の取得に失敗しました。');
        TALON.setIsSuccess(false);
        return false;
    }
    var maxLvl = getMapVal(resultLvl[0], 'MAX_LVL');

    // CLM_T_SHINSEI へ反映（PATTERN も保存しておく）
    TalonDbUtil.update(conn,
        "UPDATE CLM_T_SHINSEI SET " +
        "     ROUTE_ID        = '" + tln_com_escape(routeId) + "' " +
        "    ,ROUTE_PARAM_VAL = '" + tln_com_escape(paramVal) + "' " +
        "    ,WORK_ID         = '" + tln_com_escape(workId) + "' " +
        "    ,MAX_LVL         =  " + tln_com_escape(maxLvl) + " " +
        "    ,PATTERN         = '" + tln_com_escape(pattern) + "' " +
        "    ,UPDATED_DATE    = dbo.TLN_SYSDATE() " +
        "    ,UPDATED_BY      = '" + tln_com_escape(TALON.getUserInfoMap().get('USER_ID')) + "' " +
        "    ,UPDATED_PRG_NM  = '" + tln_com_escape(TALON.getUserInfoMap().get('FUNC_ID')) + "' " +
        "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "'"
    );
    return true;
}


/* =====================================================================
 * (C) ステータス同期
 *   WFS_CUSTOM.execWorkFlowCustom の CLM 分岐から呼び出す。
 *   LVL名 = ステータス名（1:下書き〜7:最終確認）なので、
 *   WFSが進めた「現在の活性LVL」を SHINSEI_STATUS にそのまま同期する。
 *
 *   ★要確認（タイミング）:
 *     本フックがエンジンのLVL進行より「後」に走る前提。
 *     もし「前」に走る環境なら getActiveLvl の結果に +1 する必要がある
 *     （HOOK_RUNS_AFTER_ADVANCE を false に）。テストで1度だけ確認のこと。
 * ===================================================================== */
function setClmShinseiStatus(obj_id, syori_kbn) {
    var _CLM_HOOK_RUNS_AFTER_ADVANCE = false;
    // 申請(10) / 承認(20) / 決裁(21) のみステータスを進める
    if (syori_kbn !== '10' && syori_kbn !== '20' && syori_kbn !== '21') return;

    var conn = TALON.getDbConfig();
    var log = TALON.getLogger();

    // 申請直後は必ず 2:申請中
    if (syori_kbn === '10') {
        updateStatus(conn, obj_id, '2');
        log.writeInfo('[setClmShinseiStatus] 申請 → STATUS=2 SHINSEI_NO=' + obj_id);
        return;
    }

    // 承認/決裁：WFSが保持する現在の活性LVLを取得し、ステータスへ同期
    var workId = getClmWorkId(conn, obj_id);
    if (!workId) {
        log.writeInfo('[setClmShinseiStatus] WORK_ID取得不可。スキップ。SHINSEI_NO=' + obj_id);
        return;
    }

    var activeLvl = getActiveLvl(conn, workId, obj_id);
    if (activeLvl == null) {
        log.writeInfo('[setClmShinseiStatus] 活性LVL取得不可。スキップ。');
        return;
    }
    var status = _CLM_HOOK_RUNS_AFTER_ADVANCE
        ? activeLvl              // 進行後：活性LVL = 到達ステータス
        : (activeLvl + 1);       // 進行前：+1 が到達ステータス

    if (status > 7) status = 7;
    updateStatus(conn, obj_id, String(status));
    log.writeInfo('[setClmShinseiStatus] 承認 → STATUS=' + status
        + ' (activeLvl=' + activeLvl + ') SHINSEI_NO=' + obj_id);
}

/** CLM_T_SHINSEI.SHINSEI_STATUS を更新 */
function updateStatus(conn, obj_id, status) {
    TalonDbUtil.update(conn,
        "UPDATE CLM_T_SHINSEI SET " +
        "     SHINSEI_STATUS = '" + tln_com_escape(status) + "' " +
        "    ,UPDATED_DATE   = dbo.TLN_SYSDATE() " +
        "    ,UPDATED_BY     = '" + tln_com_escape(TALON.getUserInfoMap().get('USER_ID')) + "' " +
        "WHERE SHINSEI_NO = '" + tln_com_escape(obj_id) + "'"
    );
}

/** 申請のWORK_IDを取得 */
function getClmWorkId(conn, obj_id) {
    var rows = TalonDbUtil.select(conn,
        "SELECT WORK_ID FROM CLM_T_SHINSEI WHERE SHINSEI_NO = '" + tln_com_escape(obj_id) + "'");
    if (!rows || rows.length === 0) return '';
    return getMapVal(rows[0], 'WORK_ID');
}

/** WFS_T_WORKFLOW から現在の活性LVLを取得 */
function getActiveLvl(conn, work_id, obj_id) {
    var rows = TalonDbUtil.select(conn,
        "SELECT TOP 1 LVL FROM WFS_T_WORKFLOW " +
        "WHERE WORK_ID = '" + tln_com_escape(work_id) + "' " +
        "  AND OBJECT_ID = '" + tln_com_escape(obj_id) + "' " +
        "  AND CURENT_FLG = 1 AND ACTIVE_FLG = 1 " +
        "ORDER BY LVL DESC");
    if (!rows || rows.length === 0) return null;
    return parseInt(getMapVal(rows[0], 'LVL'), 10);
}