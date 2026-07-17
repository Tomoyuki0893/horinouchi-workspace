setInit();

function setInit() {

    var conn = TALON.getDbConfig();

    var conditionMap = TALON.getConditionData();
    var LOT_NO = conditionMap["LOT_NO"];
    var userMap = TALON.getUserInfoMap();
    var USER_ID = userMap['USER_ID'];
    var FUNC_ID = userMap['FUNC_ID'];
    var cnt = getCount(conn, "NP_T_INPUT_ITAATSU_LOT_HEADER", { LOT_NO: LOT_NO }) || 0;

    if (0 < cnt) return;

    // 日付フォーマット（Java形式）
    var sdf = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss"); // ← 12時間制→24時間制(HHに修正)
    var strDate = sdf.format(new java.util.Date());

    var insMap = {
        LOT_NO: LOT_NO,
        CREATED_DATE: strDate,
        CREATED_BY: USER_ID,
        CREATED_PRG_NM: FUNC_ID,
        UPDATED_DATE: strDate,
        UPDATED_BY: USER_ID,
        UPDATED_PRG_NM: FUNC_ID,
        ITAATSU: 0
    };


    TalonDbUtil.begin(conn);
    insertByMapEx(conn, "NP_T_INPUT_ITAATSU_LOT_HEADER", insMap, true);
    TalonDbUtil.commit(conn);
}