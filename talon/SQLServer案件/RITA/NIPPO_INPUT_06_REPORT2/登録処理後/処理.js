pressEnd();
pressOBIC2();

/**
 * プレスOBIC
 */
function pressOBIC2() {
    handlePress(['090', '091']);
}

/**
 * プレス連携の共通処理
 * 
 * @param {Array} validSAGYOKU - 有効な作業区コードの配列
 */
function handlePress(validSAGYOKU) {
    var itemBlockList = TALON.getBlockData_List(2);
    for (var i = 0; i < itemBlockList.length; i++) {
        var lineDataMap = itemBlockList[i];
        var ID = lineDataMap['ID'];
        var PID = lineDataMap['PID'];
        var LOT_NO = lineDataMap['LOT_NO'];
        var SIYOSYO_SEQ = lineDataMap['SIYOSYO_SEQ'];

        // 必須データのバリデーション
        if (!ID || !LOT_NO || !PID) {
            continue;
        }

        // 前提としてプレス工程に入るものが来ている
        var renkeiMap = getRenkeikanriInitlatest(LOT_NO);
        if (!renkeiMap || !renkeiMap['SAGYO_KU']) {
            continue;
        }
        var SAGYO_KU = renkeiMap['SAGYO_KU'];

        // 作業区コードが有効な場合のみ処理
        if (validSAGYOKU.indexOf(SAGYO_KU) !== -1) {

            if (SAGYO_KU == "010" || SAGYO_KU == "011") {
                insOtherOBICCustom(ID, renkeiMap);
                setPress2();
            } else {

                insOtherOBICCustom(ID, renkeiMap);
            }
        }
    }
}

/**
 * 作業報告終了処理を行います。
 * 
 * ・ブロックパラメータ（1ブロック）から作業終了日・時間・担当者コードを取得します。
 * ・2ブロック目の各明細に対し、対応するレコードの `NP_T_INPUT_COMMON` を更新します。
 * ・各レコードに対し `setKoteiShincyokuPress` を呼び、進捗を更新します。
 *
 * 使用カラム：
 * - 1ブロック：
 *   - 1_OBIC_HOKOKU_SAGYO_DT（作業日付）
 *   - 1_OBIC_HOKOKU_SAGYO_TIME（作業時間）
 *   - 1_OBIC_HOKOKU_TNT_CD（担当者コード）
 * - 2ブロック（明細）：
 *   - ID（更新対象レコードキー）
 *
 * 更新テーブル：
 * - NP_T_INPUT_COMMON（IDキーで該当行のEND_DT, END_JIKAN, UPDATED_DATE, TANTO_SYA_CDを更新）
 */
function pressEnd() {
    var END_DT = TALON.getBlockRequestParameter('1_OBIC_HOKOKU_SAGYO_DT');
    var END_JIKAN = TALON.getBlockRequestParameter('1_OBIC_HOKOKU_SAGYO_TIME');
    var TANTO_SYA_CD = TALON.getBlockRequestParameter('1_OBIC_HOKOKU_TNT_CD');

    var itemBlockList = TALON.getBlockData_List(2);
    var sysDate = new java.sql.Timestamp(new java.util.Date().getTime());

    for (var i = 0; i < itemBlockList.length; i++) {
        var lineDataMap = itemBlockList[i];

        var map = {
            ID: lineDataMap['ID'],
            END_DT: END_DT,
            END_JIKAN: END_JIKAN,
            UPDATED_DATE: sysDate,
            TANTO_SYA_CD: TANTO_SYA_CD
        };

        var whereKeys = ["ID"];
        updateByMapEx(TALON.getDbConfig(), "NP_T_INPUT_COMMON", map, whereKeys, true);

        setKoteiShincyokuPress(lineDataMap, END_DT, END_JIKAN);
    }
}

/**
 * 工程進捗を更新する処理を実行します。
 *
 * 呼出元の業務種別（FUNC_ID）に応じて、
 * - 「日報初期登録（NIPPO_INPUT_00）」の場合は現在日時と投入数を設定、
 * - それ以外の場合は入力された完了日・時間と合格数を設定します。
 *
 * 更新対象は `NP_T_KOTEI_KANRI` テーブルで、LOT_NO をキーに該当行を更新します。
 *
 * @param {Object} lineDataMap - 対象データ行（LOT_NO, GOUKAKU_PCS_SUU を含む）
 * @param {string} END_DT - 完了日（yyyy/MM/dd形式）
 * @param {string} END_JIKAN - 完了時間（hh:mm形式）
 */
function setKoteiShincyokuPress(lineDataMap, END_DT, END_JIKAN) {
    var mapColumnList = getTargetKoteiCd();
    if (mapColumnList.length === 0) return;

    var mapColumn = mapColumnList[0];
    var LOT_NO = lineDataMap['LOT_NO'];
    var GOUKAKU_PCS = lineDataMap['GOUKAKU_PCS_SUU'];

    if (!END_DT || !END_JIKAN) return;

    var DSP2 = mapColumn['DSP2']; // 日時格納カラム
    var DSP3 = mapColumn['DSP3']; // 数値格納カラム（合格数や投入数）

    var targetMap = {};
    var userInfoMap = TALON.getUserInfoMap();
    var funcid = userInfoMap['FUNC_ID'];

    if (funcid === 'NIPPO_INPUT_00') {
        // 初期入力時：現在日時と投入数を設定
        targetMap[DSP2] = new java.util.Date();

        var conn = TALON.getDbConfig();
        var tableName = "NP_T_TEHAI_JOHO";
        var whereMap = { LOT_NO: LOT_NO };
        var row = selectOne(conn, tableName, ["TOUNYU_PCS_SUU"], whereMap, null);
        var TOUNYU_PCS_SUU = row ? row["TOUNYU_PCS_SUU"] : 0;

        targetMap[DSP3] = isNaN(TOUNYU_PCS_SUU) ? 0 : TOUNYU_PCS_SUU;
    } else {
        // 通常処理：指定された日時と合格数を設定
        targetMap[DSP2] = formatDateTime(END_DT, END_JIKAN);
        targetMap[DSP3] = isNaN(GOUKAKU_PCS) ? 0 : GOUKAKU_PCS;
    }

    targetMap['LOT_NO'] = LOT_NO;

    var whereList = [];
    whereList.push([null, '=', 'LOT_NO']);

    updNP_T_KOTEI_KANRIbyMap(targetMap, whereList);
}

