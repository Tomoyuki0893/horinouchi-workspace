setItaatsukekka();
/**
 * 測定値（SOKUTEI1～10）の合計を計算し、公差範囲内なら "3"、外なら "2" を SOKUTEI_STS に設定する
 */
function setItaatsukekka() {
    var logger = TALON.getLogger();
    var lineDataMap = TALON.getTargetData();
    var LOT_NO = lineDataMap['LOT_NO'];
    var sumValue = 0;
    var existCount = 0;

    for (var i = 1; i <= 10; i++) {
        var raw = lineDataMap['SOKUTEI' + i];
        var value = parseFloat(raw);
        if (isNaN(value)) value = 0;
        sumValue += value;
        if(value)existCount++;
    }
    
    var averageValue = sumValue / (existCount || 1);
    TalonDbUtil.update(TALON.getDbConfig(), 'UPDATE NP_T_INPUT_ITAATSU SET SOKUTEI_AVG = \'' + averageValue+ '\' WHERE LOT_NO = \'' + LOT_NO+ '\'');

    var KOSA_A_FROM = parseFloat(lineDataMap['KOSA_A_FROM']);
    var KOSA_A_TO = parseFloat(lineDataMap['KOSA_A_TO']);
    logger.writeDebug("KOSA_A_FROM: " + KOSA_A_FROM);
    logger.writeDebug("KOSA_A_TO: " + KOSA_A_TO);
    logger.writeDebug("sumValue: " + sumValue);

    if (!isNaN(KOSA_A_FROM) && !isNaN(KOSA_A_TO)) {
        if (KOSA_A_FROM <= sumValue && sumValue <= KOSA_A_TO) {
            setSokuteiKekka(LOT_NO, "3");
            return;
        }
    }

    setSokuteiKekka(LOT_NO, "2");
}

/**
 * 測定結果ステータス（SOKUTEI_STS）を指定LOT_NOに対して更新する
 *
 * @param {string} LOT_NO - 対象のロット番号（主キー）
 * @param {string} SOKUTEI_STS - 測定ステータス（更新値）
 */
function setSokuteiKekka(LOT_NO, SOKUTEI_STS) {
    var conn = TALON.getDbConfig();
    var tableName = "NP_T_INPUT_ITAATSU";

    var updateMap = {
        LOT_NO: LOT_NO,
        SOKUTEI_STS: SOKUTEI_STS
    };

    var whereKeys = ["LOT_NO"];

    updateByMapEx(conn, tableName, updateMap, whereKeys, true);
}
