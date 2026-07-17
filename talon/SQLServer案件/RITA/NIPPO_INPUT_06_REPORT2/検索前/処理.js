// main()
/**
 * 主処理：LOT_NOの存在チェックにより INSERT 実行
 */
function main() {
    var conn = TALON.getDbConfig();
    var conditionMap = TALON.getConditionData();
    var PTID = conditionMap["PID"];

    var pressList = getPressList(conn, PTID);

    TalonDbUtil.begin(conn);
    for (var i = 0; i < pressList.length; i++) {
        var pressMap = pressList[i];

        var LOT_NO = pressMap['LOT_NO'];
        var SIYOSYO_SEQ = pressMap['SIYOSYO_SEQ'];

        var whereMap = { LOT_NO: LOT_NO };
        var count = getCount(conn, "NP_T_INPUT_ITAATSU", whereMap);

        if (count === 0) {
            insertSokuteiData(conn, LOT_NO, SIYOSYO_SEQ);
        }
    }
    TalonDbUtil.commit(conn);
}

/**
 * 指定PTIDに基づき、未取込の圧力データを取得する
 *
 * @param {Object} conn - DBコネクション
 * @param {string} PID - 圧力測定ID
 * @returns {Array<Object>} 測定データリスト
 */
function getPressList(conn, PID) {
    var whereMap = { PID: PID };
    return selectList(conn, "NP_T_INPUT_COMMON", null, whereMap, null);
}

/**
 * 測定値データを挿入する（SOKUTEI1～10は全て "0" 初期化）
 *
 * @param {Object} conn - DBコネクション
 * @param {string} LOT_NO - ロット番号
 * @param {string} SIYOSYO_SEQ - 仕様書SEQ
 */
function insertSokuteiData(conn, LOT_NO, SIYOSYO_SEQ) {


    var map = {
        LOT_NO: LOT_NO,
        SIYOSYO_SEQ: SIYOSYO_SEQ
      
    };

    for (var i = 1; i <= 10; i++) {
        map["SOKUTEI" + i] = "0";
    }

    insertByMapEx(conn, "NP_T_INPUT_ITAATSU", map, true);
}

