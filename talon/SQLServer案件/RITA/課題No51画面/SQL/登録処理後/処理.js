main();

function main() {
    var lineDataMap = TALON.getConditionData();
    var SIYOSYO_SEQ = lineDataMap['SIYOSYO_SEQ'];
    var KOUTEI_SEQ = lineDataMap['KOUTEI_SEQ'];

    delKOUTEI_MEISAI_KOUMOKU2(SIYOSYO_SEQ, KOUTEI_SEQ);
    // 画面の連携項目を取得（1行目）
    _insertFixedLines(SIYOSYO_SEQ, KOUTEI_SEQ, TALON.getBlockData_Card(2));

    // 3ブロック：プログラム一覧
    _insertFromBlockList(SIYOSYO_SEQ, KOUTEI_SEQ, 3, 2);

    // 4ブロック：備考一覧
    _insertFromBlockList(SIYOSYO_SEQ, KOUTEI_SEQ, 4, 20, true);

    // SIYOSYOへの変換処理
    _convertKomokuToSiyosyoCommon(SIYOSYO_SEQ, KOUTEI_SEQ);
}

/**
 * 固定2行分の処理
 */
function _insertFixedLines(SIYOSYO_SEQ, KOUTEI_SEQ, map) {
    insKouteiMeisaiGyosu(SIYOSYO_SEQ, KOUTEI_SEQ, 1, map['DATA0001'], null, null, null, null, map['TOKUSYU_JOKEN00']);
}
