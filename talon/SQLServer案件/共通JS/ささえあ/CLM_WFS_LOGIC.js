/* =============================================================================
 *  CLM_WFS_LOGIC  完全版                                          2026/06/23
 * -----------------------------------------------------------------------------
 *  (A) determineClmPattern / readPattern / readWfsRoute  … パターン＆ルート判定
 *  (B) clmExec                                           … 申請フック
 *  (C) setClmShinseiStatus                               … WFS_CUSTOM から呼出
 *      stampHyokaConfirm                                 … 評価画面フック
 *  共通ヘルパー: getLoginUser / recordActor / updateStatus /
 *               getClmWorkId / getActiveLvl / logClaimHistory
 *  局所ユーティリティ: strv / trim / _rowCount / _rowAt / getClmShinseiNo
 *
 *  流儀（全関数共通）:
 *   - DB接続  : var conn = TALON.getDbConfig();
 *   - ロガー  : TALON.getLogger() → log.writeInfo(...)
 *   - SQL     : インライン文字列 + tln_com_escape()
 *   - DB      : SQL Server
 * ========================================================================== */


/* =====================================================================
 *  (B) clmExec() — 申請画面(CLM001/CLM002) の「確定・処理後」フック
 *      パターン判定 → CLM_T_SHINSEI にルート情報を確定書込み。
 * ===================================================================== */
function clmExec() {
    var conn = TALON.getDbConfig();
    var log  = TALON.getLogger();

    var objId = getClmShinseiNo();
    if (!objId) { log.writeInfo('[CLM] clmExec: SHINSEI_NO未取得。中断。'); return; }

    var det = determineClmPattern(conn, objId);
    if (det == null) {
        log.writeInfo('[CLM] clmExec: パターン判定不能 or ルート未登録。ルート未書込み。SHINSEI_NO=' + objId);
        return;
    }

    TalonDbUtil.update(conn,
        "UPDATE CLM_T_SHINSEI SET " +
        "     ROUTE_ID        = '" + tln_com_escape(det.routeId)       + "' " +
        "    ,ROUTE_PARAM_VAL = '" + tln_com_escape(det.routeParamVal) + "' " +
        "    ,PATTERN         = '" + tln_com_escape(det.pattern)       + "' " +
        "    ,WORK_ID         = '" + tln_com_escape(det.workId)        + "' " +
        "    ,MAX_LVL         = '" + tln_com_escape(det.maxLvl)        + "' " +
        "    ,ETSURAN_GROUP   = '" + tln_com_escape(det.etsuranGroup)  + "' " +
        "WHERE SHINSEI_NO     = '" + tln_com_escape(objId)            + "'");

    log.writeInfo('[CLM] clmExec OK: SHINSEI_NO=' + objId
        + ' PATTERN=' + det.pattern + ' ROUTE_ID=' + det.routeId
        + ' ROUTE_PARAM_VAL=' + det.routeParamVal + ' WORK_ID=' + det.workId
        + ' MAX_LVL=' + det.maxLvl + ' ETSURAN_GROUP=' + det.etsuranGroup);
}


/* =====================================================================
 *  (A) determineClmPattern(conn, objId)
 *      ① CLM_T_SHINSEI の5次元 × CLM_M_PATTERN → PATTERN / ETSURAN_GROUP
 *      ② CLM_P{pat} × WFS_M_ROUTE_HED → 実ROUTE_ID
 *      戻り値: {pattern, routeId, routeParamVal, workId, maxLvl, etsuranGroup} / null
 * ===================================================================== */
function determineClmPattern(conn, objId) {
    var row = readPattern(conn, objId);
    if (row == null) { return null; }

    var pat = trim(row.pattern);
    if (pat.length === 1) { pat = '0' + pat; }

    var cat    = trim(row.category);          // 1=有害事象(CLM001) / 2=品質クレーム(CLM002)
    var workId = (cat === '1') ? 'CLM001' : 'CLM002';

    var routeParamVal = trim(row.routeParamVal);
    if (!routeParamVal) { routeParamVal = 'CLM_P' + pat; }

    var wfs = readWfsRoute(conn, routeParamVal);
    if (wfs == null) {
        TALON.getLogger().writeInfo('[CLM] WFSルート未登録 or 無効。'
            + 'ROUTE_PARAM_VAL=' + routeParamVal + ' SHINSEI_NO=' + objId);
        return null;
    }

    return {
        pattern       : pat,
        routeId       : wfs.routeId,
        routeParamVal : routeParamVal,
        workId        : workId,
        maxLvl        : wfs.maxLvl,
        etsuranGroup  : trim(row.etsuranGroup)
    };
}

/* CLM_T_SHINSEI × CLM_M_PATTERN 5次元突合
 * *ALL はリテラル文字列で格納。等価 OR '*ALL' でワイルドカード突合。 */
function readPattern(conn, objId) {
    var sql =
        "SELECT S.CLAIM_CATEGORY AS CLAIM_CATEGORY, P.PATTERN AS PATTERN, " +
        "       P.ETSURAN_GROUP AS ETSURAN_GROUP " +
        "  FROM CLM_T_SHINSEI S " +
        " INNER JOIN CLM_M_PATTERN P " +
        "    ON  P.CLAIM_CATEGORY = S.CLAIM_CATEGORY " +
        "   AND  P.HANBAIMOTO_CD  = S.HANBAI_GAISHA " +
        "   AND (P.CA_FA          = S.CA_FA         OR P.CA_FA         = '*ALL') " +
        "   AND (P.IYAKUHIN_KBN   = S.IYAKUHIN_KBN  OR P.IYAKUHIN_KBN  = '*ALL') " +
        "   AND (P.SEIZOMOTO      = S.SEIZOMOTO     OR P.SEIZOMOTO     = '*ALL') " +
        " WHERE S.SHINSEI_NO     = '" + tln_com_escape(objId) + "'";

    var list = TalonDbUtil.select(conn, sql);
    if (_rowCount(list) === 0) { return null; }
    if (_rowCount(list) > 1) {
        TALON.getLogger().writeInfo('[CLM] パターン複数一致(' + _rowCount(list)
            + ')。CLM_M_PATTERN を確認。SHINSEI_NO=' + objId);
        return null;
    }

    var r = _rowAt(list, 0);
    return {
        category     : strv(getMapVal(r, 'CLAIM_CATEGORY')),
        pattern      : strv(getMapVal(r, 'PATTERN')),
        etsuranGroup : strv(getMapVal(r, 'ETSURAN_GROUP'))
    };
}

/* WFS_M_ROUTE_HED を PARAM_VAL で突合し 実ROUTE_ID を返す。
 * DEL_FLG IS NULL = 有効行。MAX_LVL列は存在しないため '7' 固定。 */
function readWfsRoute(conn, routeParamVal) {
    var sql =
        "SELECT H.ROUTE_ID AS ROUTE_ID " +
        "  FROM WFS_M_ROUTE_HED H " +
        " WHERE H.PARAM_VAL = '" + tln_com_escape(routeParamVal) + "' " +
        "   AND (H.DEL_FLG IS NULL OR H.DEL_FLG <> '1')";

    var list = TalonDbUtil.select(conn, sql);
    if (_rowCount(list) === 0) { return null; }
    if (_rowCount(list) > 1) {
        TALON.getLogger().writeInfo('[CLM] WFSルート複数一致(' + _rowCount(list)
            + ')。WFS_M_ROUTE_HED を確認。PARAM_VAL=' + routeParamVal);
        return null;
    }

    var r = _rowAt(list, 0);
    return {
        routeId : strv(getMapVal(r, 'ROUTE_ID')),
        maxLvl  : '7'   // 全ルート7階層固定（MAX_LVL列なし）
    };
}


/* =====================================================================
 *  (C) setClmShinseiStatus(obj_id, syori_kbn)
 *      WFS_CUSTOM.execWorkFlowCustom の CLM 分岐から呼び出す。
 *
 *      syori_kbn:
 *        '10' 申請     → STATUS=2（申請中）
 *        '20' 承認(次あり) / '21' 決裁
 *                      → WFSの活性LVLをSHINSEI_STATUSに同期
 *                         LVL1→2, LVL2→3, LVL3→4, LVL4→5, LVL5→6, LVL6→7
 *      それ以外（差戻・取消等）は何もしない（CLMは差戻・却下なし設計）。
 *
 *      実対応者記録:
 *        承認時に当該LVLの対応者IDを CLM_T_SHINSEI の担当者列に書く。
 *        LVL→列のマッピングは _CLM_LVL_ACTOR_COL 参照。
 * ===================================================================== */

// 完了LVL → 設定するSHINSEI_STATUS
var _CLM_LVL_STATUS = {
    '1': '2',   // 申請者申請      → 申請中
    '2': '3',   // 安全管理実施責任者確認 → 確認済
    '3': '4',   // 責任者指示      → 対応中
    '4': '5',   // 評価担当評価    → 評価完了
    '5': '6',   // 責任者完了確認  → 完了
    '6': '7'    // 総括最終確認    → 最終確認
};

// 完了LVL → CLM_T_SHINSEI の対応者ID列名
var _CLM_LVL_ACTOR_COL = {
    '2': 'JISSHI_SEKININ_ID',   // 安全管理実施責任者
    '3': 'SEKININSHA_ID',       // 安全管理責任者 or 品質保証責任者
    '4': 'HYOKA_TANTO_ID',      // 評価担当者
    '5': 'SEKININSHA_ID',       // 同上（LVL5も責任者）
    '6': 'SOKATSU_ID'           // 総括製造販売責任者
};

function setClmShinseiStatus(obj_id, syori_kbn) {
    var log  = TALON.getLogger();
    var conn = TALON.getDbConfig();

    // 申請(10) / 承認(20) / 決裁(21) 以外は何もしない
    if (syori_kbn !== '10' && syori_kbn !== '20' && syori_kbn !== '21') {
        log.writeInfo('[setClmShinseiStatus] syori_kbn=' + syori_kbn + ' → スキップ');
        return;
    }

    // 申請直後は必ず STATUS=2
    if (syori_kbn === '10') {
        updateStatus(conn, obj_id, '2');
        recordActor(conn, obj_id, '1', getLoginUser());   // LVL1=申請者
        logClaimHistory(conn, obj_id, '2', getLoginUser());
        log.writeInfo('[setClmShinseiStatus] 申請 → STATUS=2 SHINSEI_NO=' + obj_id);
        return;
    }

    // 承認・決裁: 活性LVLを取得してSTATUSを同期
    var workId = getClmWorkId(conn, obj_id);
    if (!workId) {
        log.writeInfo('[setClmShinseiStatus] WORK_ID取得不可。スキップ。SHINSEI_NO=' + obj_id);
        return;
    }

    var activeLvl = getActiveLvl(conn, workId, obj_id);
    if (activeLvl == null) {
        log.writeInfo('[setClmShinseiStatus] 活性LVL取得不可。スキップ。SHINSEI_NO=' + obj_id);
        return;
    }

    var lvlStr = String(activeLvl);
    var status = _CLM_LVL_STATUS[lvlStr];
    if (!status) {
        log.writeInfo('[setClmShinseiStatus] LVL=' + lvlStr + ' はSTATUSマップ外。スキップ。');
        return;
    }

    updateStatus(conn, obj_id, status);

    // 対応者記録（LVL2〜6）
    var actorCol = _CLM_LVL_ACTOR_COL[lvlStr];
    if (actorCol) {
        recordActor(conn, obj_id, lvlStr, getLoginUser());
    }

    logClaimHistory(conn, obj_id, status, getLoginUser());
    log.writeInfo('[setClmShinseiStatus] LVL=' + lvlStr
        + ' → STATUS=' + status + ' SHINSEI_NO=' + obj_id);
}


/* =====================================================================
 *  stampHyokaConfirm() — 評価画面(CLM0006) の「確定・処理後」フック
 *      各確認欄の日付・ユーザーを自動スタンプする。
 *      ステータス同期は setClmShinseiStatus が担うのでここでは行わない。
 * ===================================================================== */
function stampHyokaConfirm() {
    var conn      = TALON.getDbConfig();
    var log       = TALON.getLogger();
    var loginUser = getLoginUser();

    // 評価画面は block1 に SHINSEI_NO が乗る
    var lineDataMap = TALON.getBlockData_Card(1);
    var shinseiNo   = strv(getMapVal(lineDataMap, 'SHINSEI_NO'));
    if (!shinseiNo) {
        log.writeInfo('[stampHyokaConfirm] SHINSEI_NO未取得。中断。');
        return;
    }

    var workId    = getClmWorkId(conn, shinseiNo);
    var activeLvl = workId ? getActiveLvl(conn, workId, shinseiNo) : null;
    if (activeLvl == null) {
        log.writeInfo('[stampHyokaConfirm] 活性LVL取得不可。スキップ。SHINSEI_NO=' + shinseiNo);
        return;
    }

    var lvlStr = String(activeLvl);
    var now    = 'GETDATE()';   // SQL Server

    // LVLごとに書くべき確認列が異なる
    var stampSql = null;
    if (lvlStr === '2') {
        stampSql =
            "UPDATE CLM_T_HYOKA SET " +
            "  ANZEN_KAKUNIN_DATE = " + now + " " +
            " ,ANZEN_KAKUNIN_USER = '" + tln_com_escape(loginUser) + "' " +
            "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "' " +
            "  AND ANZEN_KAKUNIN_DATE IS NULL";
    } else if (lvlStr === '3') {
        stampSql =
            "UPDATE CLM_T_HYOKA SET " +
            "  UKETSUKE_DATE = " + now + " " +
            " ,SEKININ_USER  = '" + tln_com_escape(loginUser) + "' " +
            "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "' " +
            "  AND UKETSUKE_DATE IS NULL";
    } else if (lvlStr === '4') {
        stampSql =
            "UPDATE CLM_T_HYOKA SET " +
            "  HYOKA_DATE = " + now + " " +
            "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "' " +
            "  AND HYOKA_DATE IS NULL";
    } else if (lvlStr === '5') {
        stampSql =
            "UPDATE CLM_T_HYOKA SET " +
            "  KANRYO_KAKUNIN_DATE = " + now + " " +
            " ,KANRYO_KAKUNIN_USER = '" + tln_com_escape(loginUser) + "' " +
            "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "' " +
            "  AND KANRYO_KAKUNIN_DATE IS NULL";
    } else if (lvlStr === '6') {
        stampSql =
            "UPDATE CLM_T_HYOKA SET " +
            "  SOKATSU_KAKUNIN_DATE = " + now + " " +
            " ,SOKATSU_KAKUNIN_USER = '" + tln_com_escape(loginUser) + "' " +
            "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "' " +
            "  AND SOKATSU_KAKUNIN_DATE IS NULL";
    }

    if (stampSql) {
        TalonDbUtil.update(conn, stampSql);
        log.writeInfo('[stampHyokaConfirm] LVL=' + lvlStr
            + ' スタンプ完了。SHINSEI_NO=' + shinseiNo);
    }
}


/* =====================================================================
 *  共通ヘルパー
 * ===================================================================== */

/* ログインユーザーIDを取得 */
function getLoginUser() {
    return strv(TALON.getUserInfoMap().get('USER_ID'));
}

/* CLM_T_SHINSEIの担当者ID列を更新（LVLごとのマッピングは呼び出し元が解決済み） */
function recordActor(conn, shinseiNo, lvl, userId) {
    var col = _CLM_LVL_ACTOR_COL[String(lvl)];
    if (!col || !userId) { return; }
    TalonDbUtil.update(conn,
        "UPDATE CLM_T_SHINSEI SET " +
        "  " + col + " = '" + tln_com_escape(userId) + "' " +
        "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "'");
}

/* SHINSEI_STATUSを更新し UPDATED_DATE/BY も同時に書く */
function updateStatus(conn, shinseiNo, status) {
    TalonDbUtil.update(conn,
        "UPDATE CLM_T_SHINSEI SET " +
        "  SHINSEI_STATUS = '" + tln_com_escape(status) + "' " +
        " ,UPDATED_DATE   = GETDATE() " +
        " ,UPDATED_BY     = '" + tln_com_escape(getLoginUser()) + "' " +
        "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "'");
}

/* CLM_T_SHINSEI から WORK_ID を取得 */
function getClmWorkId(conn, shinseiNo) {
    var sql =
        "SELECT WORK_ID FROM CLM_T_SHINSEI " +
        "WHERE SHINSEI_NO = '" + tln_com_escape(shinseiNo) + "'";
    var list = TalonDbUtil.select(conn, sql);
    if (_rowCount(list) === 0) { return null; }
    return strv(getMapVal(_rowAt(list, 0), 'WORK_ID'));
}

/* WFS_T_WORKFLOW から活性LVLを取得（CURENT_FLG='1'の最大LVL） */
function getActiveLvl(conn, workId, objId) {
    var sql =
        "SELECT TOP 1 LVL FROM WFS_T_WORKFLOW " +
        "WHERE WORK_ID   = '" + tln_com_escape(workId) + "' " +
        "  AND OBJECT_ID = '" + tln_com_escape(objId)  + "' " +
        "  AND CURENT_FLG = '1' " +
        "ORDER BY LVL DESC";
    var list = TalonDbUtil.select(conn, sql);
    if (_rowCount(list) === 0) { return null; }
    var v = strv(getMapVal(_rowAt(list, 0), 'LVL'));
    return (v === '') ? null : v;
}

/* CLM_T_SHINSEI_RIREKI に履歴を1行追記 */
function logClaimHistory(conn, shinseiNo, status, userId) {
    try {
        TalonDbUtil.update(conn,
            "INSERT INTO CLM_T_SHINSEI_RIREKI " +
            "  (SHINSEI_NO, SHINSEI_STATUS, TANTO_ID, TANTO_DATE) " +
            "VALUES (" +
            "  '" + tln_com_escape(shinseiNo) + "'" +
            " ,'" + tln_com_escape(status)    + "'" +
            " ,'" + tln_com_escape(userId)    + "'" +
            " ,GETDATE())");
    } catch (e) {
        // 履歴テーブルが未作成の環境では警告のみ（本処理は継続）
        TALON.getLogger().writeInfo('[logClaimHistory] 履歴INSERT失敗（テーブル未作成?）: ' + e);
    }
}


/* =====================================================================
 *  申請画面ブロックから SHINSEI_NO を取得
 *  block 0〜4 を総当り → リクエストパラメータ の順に探索。
 *  全滅時は各ブロックのキーをログにダンプ。
 * ===================================================================== */
function getClmShinseiNo() {
    var no = '';

    for (var bi = 0; bi <= 4 && !no; bi++) {
        try {
            var card = TALON.getBlockData_Card(bi);
            if (card != null) {
                var v = strv(getMapVal(card, 'SHINSEI_NO'));
                if (v !== '') { no = v; }
            }
        } catch (e) { /* このブロックは無い。次へ */ }
    }

    if (!no) {
        try { no = strv(getBlockRequestParameter('SHINSEI_NO')); } catch (e2) { /* ignore */ }
    }

    if (!no) {
        try {
            var log = TALON.getLogger();
            for (var bj = 0; bj <= 4; bj++) {
                try {
                    var c = TALON.getBlockData_Card(bj);
                    if (c == null) { continue; }
                    var keys = c.keySet().toArray();
                    var buf = '';
                    for (var k = 0; k < keys.length; k++) {
                        buf += keys[k] + '=' + c.get(keys[k]) + ' | ';
                    }
                    log.writeInfo('[CLM] getClmShinseiNo block' + bj + ': ' + buf);
                } catch (e3) { /* ignore */ }
            }
        } catch (e4) { /* ignore */ }
    }

    return no;
}


/* ---- 局所ユーティリティ ------------------------------------------------ */
function strv(v) { return (v == null) ? '' : String(v); }
function trim(v) { return strv(v).replace(/^\s+|\s+$/g, ''); }

/* TalonDbUtil.select の戻り型吸収（Java List / 配列 いずれも可） */
function _rowCount(list) {
    if (list == null) { return 0; }
    if (typeof list.size   === 'function') { return list.size(); }
    if (typeof list.length === 'number')   { return list.length; }
    return 0;
}
function _rowAt(list, i) {
    if (list == null) { return null; }
    if (typeof list.get === 'function') { return list.get(i); }
    return list[i];
}