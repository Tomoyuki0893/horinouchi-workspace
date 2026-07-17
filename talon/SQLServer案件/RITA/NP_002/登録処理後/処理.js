setHinmokuSumData();

function setHinmokuSumData() {

    var conditionMap = TALON.getConditionData() || {};
    var LOT_NO = conditionMap["LOT_NO"];
    var conn = TALON.getDbConfig();

    var lineDataMap = TALON.getBlockData_Card(1) || {};
    var HINMOKU_CD = lineDataMap['HINMOKU_CD'];
    var SIYOSYO_SEQ = lineDataMap['SIYOSYO_SEQ'];

    var updMap = {
        LOT_NO: LOT_NO,
        HINMOKU_CD: HINMOKU_CD
    };

    var avg090 = getAvgIta(HINMOKU_CD, LOT_NO, "090");

    var whereIta = {
        SIKIBETU_CODE: 'ITA_JISSOKU'
    }

    var map = selectOne(conn, "TLN_M_HANYO_CODE_MAIN", null, whereIta, null);
    var kosa = map['DSP_NO1'];


    if (avg090 !== null && avg090 !== undefined) {
        var siyoMap090 = getKouteiFromTo(SIYOSYO_SEQ, "090");
        if (siyoMap090) {
            updMap['ITAATSU'] = avg090; // 代表値として持つなら
            updMap['SIYO_090_ITA_FROM'] = siyoMap090['FROM'];
            updMap['SIYO_090_ITA_TO'] = siyoMap090['TO'];

            var whereCnt090 = { HINMOKU_CD: HINMOKU_CD, KBN: '090' };
            updMap['ITA090_CNT'] = getCount(conn, "NP_T_INPUT_ITAATSU_HINMOKU_MEISAI", whereCnt090) || 0;
            var avg090Hinmoku = getAvgIta2(HINMOKU_CD, '090');

            updMap['ITA_090_FROM'] = avg090Hinmoku - kosa;
            updMap['ITA_090_TO'] = avg090Hinmoku + kosa;
        }
    }

    var avg091 = getAvgIta(HINMOKU_CD, LOT_NO, "091");
    if (avg091 !== null && avg091 !== undefined) {
        var siyoMap091 = getKouteiFromTo(SIYOSYO_SEQ, "091");
        if (siyoMap091) {
            updMap['ITAATSU'] = avg091; // 091優先ならここで上書きOK
            updMap['SIYO_091_ITA_FROM'] = siyoMap091['FROM']; // ★修正
            updMap['SIYO_091_ITA_TO'] = siyoMap091['TO'];     // ★修正

            var whereCnt091 = { HINMOKU_CD: HINMOKU_CD, KBN: '091' };
            updMap['ITA091_CNT'] = getCount(conn, "NP_T_INPUT_ITAATSU_HINMOKU_MEISAI", whereCnt091) || 0;
            var avg091Hinmoku = getAvgIta2(HINMOKU_CD, '091');
            updMap['ITA_091_FROM'] = avg091Hinmoku - kosa;
            updMap['ITA_091_TO'] = avg091Hinmoku + kosa;
        }
    }

    // ★ここは本当に要確認：SUMテーブルに更新すべき。MEISAIはキー設計が合わない。
    updateByMapEx(conn, "NP_T_INPUT_ITAATSU_LOT_HEADER", updMap, ['LOT_NO'], true);
}

function getKouteiFromTo(SIYOSYO_SEQ, KBN) {

    var conn = TALON.getDbConfig();

    var whereMap = {
        SIYOSYO_SEQ: SIYOSYO_SEQ,
        KOUTEI_CD: KBN
    };

    var kouteiMap = selectOne(conn, "KOUTEIJUN_KANRI", null, whereMap, null);
    if (!kouteiMap) return null;

    var KOUTEI_SEQ = kouteiMap["KOUTEI_SEQ"];
    if (!KOUTEI_SEQ) return null;

    // 仕様：GYOUSU=1 に FROM/TO が入る前提
    var whereMap2 = {
        SIYOSYO_SEQ: SIYOSYO_SEQ,
        KOUTEI_SEQ: KOUTEI_SEQ,
        GYOUSU: 1
    };

    var kouteiMap2 = selectOne(conn, "KOUTEI_MEISAI_KOUMOKU", null, whereMap2, null);
    if (!kouteiMap2) return null;

    return {
        FROM: kouteiMap2['DATA01'],
        TO: kouteiMap2['DATA02']
    };
}

function setHinmokuAvgData(HINMOKU_CD, LOT_NO, KBN, ITAATSU) {

    if (ITAATSU === null || ITAATSU === undefined) return;

    var conn = TALON.getDbConfig();

    var map = {
        HINMOKU_CD: HINMOKU_CD,
        LOT_NO: LOT_NO,
        KBN: KBN,
        ITAATSU: ITAATSU
    };

    var whereCnt = {
        HINMOKU_CD: HINMOKU_CD,
        LOT_NO: LOT_NO,
        KBN: KBN
    };

    var cnt = getCount(conn, "NP_T_INPUT_ITAATSU_HINMOKU_MEISAI", whereCnt) || 0;

    if (cnt > 0) {
        updateByMapEx(conn, "NP_T_INPUT_ITAATSU_HINMOKU_MEISAI", map, ['HINMOKU_CD', 'LOT_NO', 'KBN'], true);
    } else {
        insertByMapEx(conn, "NP_T_INPUT_ITAATSU_HINMOKU_MEISAI", map, true);
    }
}



function getAvgIta(HINMOKU_CD, LOT_NO, KBN) {

    var conn = TALON.getDbConfig();

    // 最低限：' をエスケープ（''）
    var safeLot = escapeSqlLiteral(LOT_NO);
    var safeKbn = escapeSqlLiteral(KBN);

    var sql = ""
        + " SELECT AVG(ITAATSU) AS AVG_ITAATSU "
        + " FROM NP_T_INPUT_ITAATSU_LOT_MEISAI "
        + " WHERE LOT_NO = '" + safeLot + "' "
        + "   AND KBN = '" + safeKbn + "' "
        + "   AND ( CHK_JOGAI IS NULL OR CHK_JOGAI <> '1' ) ";

    var resultList = TalonDbUtil.select(conn, sql);

    if (!resultList || resultList.length === 0) return null;

    var v = resultList[0]['AVG_ITAATSU'];
    if (v === null || v === undefined) return null;

    setHinmokuAvgData(HINMOKU_CD, LOT_NO, KBN, v);

    // 必要なら数値化（不要ならこの行は削ってOK）
    return Number(v);
}

function getAvgIta2(HINMOKU_CD, KBN) {

    var conn = TALON.getDbConfig();

    // 最低限：' をエスケープ（''）
    var safeKbn = escapeSqlLiteral(KBN);

    var sql = ""
        + " SELECT AVG(ITAATSU) AS AVG_ITAATSU "
        + " FROM NP_T_INPUT_ITAATSU_HINMOKU_MEISAI "
        + " WHERE HINMOKU_CD = '" + HINMOKU_CD + "' "
        + "   AND KBN = '" + safeKbn + "' "
        + "   AND ( CHK_JOGAI IS NULL OR CHK_JOGAI <> '1' ) ";

    var resultList = TalonDbUtil.select(conn, sql);

    if (!resultList || resultList.length === 0) return null;

    var v = resultList[0]['AVG_ITAATSU'];
    if (v === null || v === undefined) return null;

    // 必要なら数値化（不要ならこの行は削ってOK）
    return Number(v);
}

function getItaJissekiMin(HINMOKU_CD, KBN) {

    var conn = TALON.getDbConfig();

    var safeHin = escapeSqlLiteral(HINMOKU_CD);
    var safeKbn = escapeSqlLiteral(KBN);

    var sql = ""
        + " SELECT MIN(ITAATSU) AS MIN_ITAATSU "
        + " FROM NP_T_INPUT_ITAATSU_HINMOKU_MEISAI "
        + " WHERE HINMOKU_CD = '" + safeHin + "' "
        + "   AND KBN = '" + safeKbn + "' "
        + "   AND ( CHK_JOGAI IS NULL OR CHK_JOGAI <> '1' ) ";

    var resultList = TalonDbUtil.select(conn, sql);
    if (!resultList || resultList.length === 0) return null;

    var v = resultList[0]['MIN_ITAATSU'];
    if (v === null || v === undefined) return null;

    return Number(v);
}

function getItaJissekiMax(HINMOKU_CD, KBN) {

    var conn = TALON.getDbConfig();

    var safeHin = escapeSqlLiteral(HINMOKU_CD);
    var safeKbn = escapeSqlLiteral(KBN);

    var sql = ""
        + " SELECT MAX(ITAATSU) AS MAX_ITAATSU "
        + " FROM NP_T_INPUT_ITAATSU_HINMOKU_MEISAI "
        + " WHERE HINMOKU_CD = '" + safeHin + "' "
        + "   AND KBN = '" + safeKbn + "' "
        + "   AND ( CHK_JOGAI IS NULL OR CHK_JOGAI <> '1' ) ";

    var resultList = TalonDbUtil.select(conn, sql);
    if (!resultList || resultList.length === 0) return null;

    var v = resultList[0]['MAX_ITAATSU'];
    if (v === null || v === undefined) return null;

    return Number(v);
}

function escapeSqlLiteral(v) {
    if (v === null || v === undefined) return "";
    return ("" + v).replace(/'/g, "''");
}



function escapeSqlLiteral(v) {
    if (v === null || v === undefined) return "";
    return ("" + v).replace(/'/g, "''");
}
