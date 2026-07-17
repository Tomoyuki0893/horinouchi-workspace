main();

/**
 * 工程明細項目の登録処理
 * - 固定6行分の項目を登録
 * - 備考データ（ブロック3）を登録
 * - 品名（DATA0001）をSIYOSYO_MAIN_WORKへ更新
 * - 登録完了後、共通変換処理を実行
 */
function main() {
    var lineDataMap = TALON.getConditionData();
    var SIYOSYO_SEQ = lineDataMap['SIYOSYO_SEQ'];
    var KOUTEI_SEQ = lineDataMap['KOUTEI_SEQ'];

    delKOUTEI_MEISAI_KOUMOKU2(SIYOSYO_SEQ, KOUTEI_SEQ);
    // 固定6行分の連携項目を登録（DATA0001 ～ DATA0501）
    _insertFixedLines(SIYOSYO_SEQ, KOUTEI_SEQ, TALON.getBlockData_Card(2));

    // ブロック3：備考データを登録（DATA01 のみ使用、SEQ は 20番以降）
    _insertFromBlockList(SIYOSYO_SEQ, KOUTEI_SEQ, 3, 20, true);

    // 項目コードをSIYOSYO形式へ変換
    _convertKomokuToSiyosyoCommon(SIYOSYO_SEQ, KOUTEI_SEQ);
}

/**
 * 固定6行分の工程明細データを登録し、
 * 1行目の品名（DATA0001）を主データ（SIYOSYO_MAIN_WORK）に反映する
 */
function _insertFixedLines(SIYOSYO_SEQ, KOUTEI_SEQ, map) {
    insKouteiMeisaiGyosu(SIYOSYO_SEQ, KOUTEI_SEQ, 1, map['DATA0001'], null, null, null, null, map['TOKUSYU_JOKEN00']);
    insKouteiMeisaiGyosu(SIYOSYO_SEQ, KOUTEI_SEQ, 2, map['DATA0101'], null, null, null, null, map['TOKUSYU_JOKEN01']);
    insKouteiMeisaiGyosu(SIYOSYO_SEQ, KOUTEI_SEQ, 3, map['DATA0201'], null, null, null, null, map['TOKUSYU_JOKEN02']);
    insKouteiMeisaiGyosu(SIYOSYO_SEQ, KOUTEI_SEQ, 4, map['DATA0301'], null, null, null, null, map['TOKUSYU_JOKEN03']);
    insKouteiMeisaiGyosu(SIYOSYO_SEQ, KOUTEI_SEQ, 6, map['DATA0401'], null, null, null, null, map['TOKUSYU_JOKEN04']);
    insKouteiMeisaiGyosu(SIYOSYO_SEQ, KOUTEI_SEQ, 7, map['DATA0501'], null, null, null, null, map['TOKUSYU_JOKEN05']);

    // 1行目の品名を主テーブルに反映
    _updateMiniViaToMain(SIYOSYO_SEQ, map['DATA0101']);
}

/**
 * SIYOSYO_MAIN_WORK の SOU_HIT（総品目）列に品名を反映
 *
 * @param {string} SIYOSYO_SEQ - 主キー
 * @param {string} DATA0001 - 登録する品名（1行目のデータ）
 */
function _updateMiniViaToMain(SIYOSYO_SEQ, DATA0101) {
    var conn = TALON.getDbConfig();
    if (!DATA0101) {
        return

    }
    var whereMap = {
        SIYOSYO_SEQ: SIYOSYO_SEQ

    }
    var map = selectOne(conn, "SIYOSYO_MAIN_WORK", null, whereMap, null);

    var SOU_HIT = map ? map['SOU_HIT'] : null;
    if (!SOU_HIT && SOU_HIT > 0) return;
    var updateMap = {
        SIYOSYO_SEQ: SIYOSYO_SEQ,
        MINI_VIA: DATA0101 / SOU_HIT * 100
    };
    var whereKeys = ["SIYOSYO_SEQ"];

    updateByMapEx(conn, "SIYOSYO_MAIN_WORK", updateMap, whereKeys, true);
}
