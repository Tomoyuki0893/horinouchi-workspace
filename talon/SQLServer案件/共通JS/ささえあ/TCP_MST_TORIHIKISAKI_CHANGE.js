/**
 * TCP_MST_TORIHIKISAKI_CHANGE
 *
 * 取引先マスタ変更申請ロジック
 *
 * 機能：
 *   - initChange(conn, supCd, shinseiId)
 *       画面検索時に M_TORIHIKISAKI の現在値を
 *       MST_T_TORIHIKISAKI_CHANGE へ初期書き込みする。
 *       既存の未申請レコード（DEL_FLG='0'）がある場合は UPDATE、
 *       なければ採番して INSERT する。
 *
 *   - getChangeRec(conn, shinseiId)
 *       申請IDを指定して変更申請レコードを1件取得する（画面初期表示用）。
 *
 * 前提：
 *   - TALON サーバーサイドJS (Nashorn / ES5)
 *   - DbUtil, TalonDbUtil が同一スコープで利用可能
 *   - WORK_ID は呼び出し元から渡す（ワークフロー定義IDは業務依存のため外部化）
 *   - 採番は TALON.getNumberingData を使用
 *
 * @namespace TCP_MST_TORIHIKISAKI_CHANGE
 */
var TCP_MST_TORIHIKISAKI_CHANGE = (function () {

    // ----------------------------------------------------------------
    // 定数
    // ----------------------------------------------------------------
    var TABLE_MASTER = 'M_TORIHIKISAKI';
    var TABLE_CHANGE = 'MST_T_TORIHIKISAKI_CHANGE';
    var TABLE_WORK   = 'MST_T_TORIHIKISAKI_WORK';

    // DEL_FLG 値
    var DEL_FLG_ACTIVE  = '0';

    // CHG_* フラグ初期値（変更なし）
    var CHG_DEFAULT = '0';

    // ----------------------------------------------------------------
    // BEFORE/AFTER にコピーするカラム名一覧
    // M_TORIHIKISAKI のカラム名と BEFORE_*/AFTER_* のサフィックスが
    // 1対1に対応している前提
    // ----------------------------------------------------------------
    var COPY_COLUMNS = [
        'SUP_CD',
        'NAME1',
        'NAME2',
        'NAME_KANA',
        'ZIP_CODE',
        'PREF_CD',
        'ADDR1',
        'ADDR2',
        'TEL1',
        'TEL2',
        'TEL3',
        'FAX1',
        'FAX2',
        'FAX3',
        'COUNTRY_CD',
        'CURR_CD',
        'TAX_EXEMPT_FLG',
        'CAPITAL',
        'TRADE_COND',
        'SUBCONTRACT_FLG',
        'PAY_TERM_CD',
        'PAY_METHOD',
        'BANK_CD',
        'BRANCH_CD',
        'ACCT_TYPE',
        'ACCT_NO',
        'ACCT_NAME_KANA',
        'FEE_FLG',
        'BILL_BASE_DT',
        'BILL_DUE_DT',
        'BILL_SITE_CD',
        'BILL_TYPE',
        'BILL_BANK_CD',
        'CASH_LIMIT',
        'DENSAI_USER_NO',
        'DENSAI_SITE_CD',
        'DENSAI_BANK_CD'
    ];

    // CHG_* フラグカラム名一覧（CHANGE テーブル固有）
    var CHG_COLUMNS = [
        'CHG_SUP_CD',
        'CHG_NAME1',
        'CHG_NAME2',
        'CHG_NAME_KANA',
        'CHG_ZIP_CODE',
        'CHG_PREF_CD',
        'CHG_ADDR1',
        'CHG_ADDR2',
        'CHG_TEL1',
        'CHG_TEL2',
        'CHG_TEL3',
        'CHG_FAX1',
        'CHG_FAX2',
        'CHG_FAX3',
        'CHG_COUNTRY_CD',
        'CHG_CURR_CD',
        'CHG_TAX_EXEMPT_FLG',
        'CHG_CAPITAL',
        'CHG_TRADE_COND',
        'CHG_SUBCONTRACT_FLG',
        'CHG_PAY_TERM_CD',
        'CHG_PAY_METHOD',
        'CHG_BANK_CD',
        'CHG_BRANCH_CD',
        'CHG_ACCT_TYPE',
        'CHG_ACCT_NO',
        'CHG_ACCT_NAME_KANA',
        'CHG_FEE_FLG',
        'CHG_BILL_BASE_DT',
        'CHG_BILL_DUE_DT',
        'CHG_BILL_SITE_CD',
        'CHG_BILL_TYPE',
        'CHG_BILL_BANK_CD',
        'CHG_CASH_LIMIT',
        'CHG_DENSAI_USER_NO',
        'CHG_DENSAI_SITE_CD',
        'CHG_DENSAI_BANK_CD'
    ];

    // ----------------------------------------------------------------
    // プライベート関数
    // ----------------------------------------------------------------

    /**
     * M_TORIHIKISAKI から1件取得する
     * @param {Object} conn  DB接続
     * @param {string} supCd 取引先コード
     * @returns {Object|null} レコード または null
     */
    function _fetchMaster(conn, supCd) {
        return DbUtil.selectOne(
            conn,
            TABLE_MASTER,
            null,
            { SUP_CD: supCd, DELETE_FLG: DEL_FLG_ACTIVE },
            null
        );
    }

    /**
     * MST_T_TORIHIKISAKI_CHANGE から未申請レコードを1件取得する
     * （同一 SUP_CD で DEL_FLG='0' のもの）
     * @param {Object} conn  DB接続
     * @param {string} supCd 取引先コード
     * @returns {Object|null} レコード または null
     */
    function _fetchExistingChange(conn, supCd) {
        return DbUtil.selectOne(
            conn,
            TABLE_CHANGE,
            ['SHINSEI_ID', 'BEFORE_SUP_CD'],
            { BEFORE_SUP_CD: supCd, DEL_FLG: DEL_FLG_ACTIVE },
            'CREATED_DATE DESC'
        );
    }

    /**
     * COPY_COLUMNS を元に BEFORE_* / AFTER_* / CHG_* を含む変更申請マップを生成する
     * @param {Object} masterRow M_TORIHIKISAKI のレコード
     * @returns {Object} 変更申請レコードのマップ（SHINSEI_ID / WORK_ID は含まない）
     */
    function _buildChangeMap(masterRow) {
        var map = {};

        for (var i = 0; i < COPY_COLUMNS.length; i++) {
            var col = COPY_COLUMNS[i];
            var val = masterRow[col] !== undefined ? masterRow[col] : null;
            map['BEFORE_' + col] = val;
            map['AFTER_'  + col] = val;  // 初期値は BEFORE と同値
        }

        // CHG_* フラグをすべて '0'（変更なし）で初期化
        for (var j = 0; j < CHG_COLUMNS.length; j++) {
            map[CHG_COLUMNS[j]] = CHG_DEFAULT;
        }

        map['DEL_FLG'] = DEL_FLG_ACTIVE;

        return map;
    }

    // ----------------------------------------------------------------
    // 公開関数
    // ----------------------------------------------------------------

    /**
     * 画面検索時の初期書き込み処理
     *
     * 1. M_TORIHIKISAKI から現在値を取得
     * 2. MST_T_TORIHIKISAKI_CHANGE に未申請レコード（DEL_FLG='0'）が既に存在する場合は
     *    M_TORIHIKISAKI の現在値で BEFORE_* / AFTER_* / CHG_* を上書き UPDATE する
     *    （SHINSEI_ID / WORK_ID は変更しない）
     * 3. 未申請レコードがない場合は採番して INSERT する
     *    INSERT / UPDATE はトランザクション内で実施する
     *
     * @param  {Object} conn    DB接続
     * @param  {string} supCd   取引先コード
     * @param  {string} workId  ワークフロー定義ID（新規INSERT時のみ使用）
     * @returns {{ ok: boolean, errorMsg: string, shinseiId: string|null }}
     */
    function initChange(conn, supCd, workId) {

        // --- 入力チェック ---
        if (!conn) {
            return { ok: false, errorMsg: 'DB接続が未指定です。', shinseiId: null };
        }
        if (!supCd) {
            return { ok: false, errorMsg: '取引先コードが未指定です。', shinseiId: null };
        }
        if (!workId) {
            return { ok: false, errorMsg: 'ワークフロー定義IDが未指定です。', shinseiId: null };
        }

        // --- M_TORIHIKISAKI から現在値取得 ---
        var masterRow = _fetchMaster(conn, supCd);
        if (!masterRow) {
            return {
                ok: false,
                errorMsg: '取引先マスタに該当データがありません。SUP_CD=' + supCd,
                shinseiId: null
            };
        }

        // --- 変更申請マップ生成（BEFORE/AFTER/CHG）---
        var changeMap = _buildChangeMap(masterRow);

        // --- 既存の未申請レコードを確認 ---
        var existing = _fetchExistingChange(conn, supCd);

        var shinseiId;
        var isInsert;

        if (existing) {
            // 既存レコードあり → M_MASTER 現在値で上書き UPDATE
            shinseiId = existing['SHINSEI_ID'];
            isInsert  = false;
        } else {
            // 既存レコードなし → 採番して INSERT
            shinseiId = TALON.getNumberingData('SHINSEI_ID', 1)[0];
            isInsert  = true;
        }

        // --- トランザクション内で DB 書き込み ---
        TalonDbUtil.begin(conn);
        try {

            if (isInsert) {
                changeMap['SHINSEI_ID'] = shinseiId;
                changeMap['WORK_ID']    = workId;
                changeMap = DbUtil.setInsInitData(changeMap);

                DbUtil.insert(conn, TABLE_CHANGE, changeMap, true);

                TALON.getLogger().writeInfo(
                    '[TCP_MST_TORIHIKISAKI_CHANGE] initChange INSERT完了 SHINSEI_ID='
                    + shinseiId + ' / SUP_CD=' + supCd
                );

            } else {
                // SHINSEI_ID をキーにセット（WORK_ID は初回値を保持するため含めない）
                changeMap['SHINSEI_ID'] = shinseiId;
                changeMap = DbUtil.setUpdInitData(changeMap);

                DbUtil.update(conn, TABLE_CHANGE, changeMap, ['SHINSEI_ID'], true);

                TALON.getLogger().writeInfo(
                    '[TCP_MST_TORIHIKISAKI_CHANGE] initChange UPDATE完了 SHINSEI_ID='
                    + shinseiId + ' / SUP_CD=' + supCd
                );
            }

            TalonDbUtil.commit(conn);

        } catch (e) {
            try { TalonDbUtil.rollback(conn); } catch (re) {
                TALON.getLogger().writeWarn(
                    '[TCP_MST_TORIHIKISAKI_CHANGE] rollback失敗: ' + re.message
                );
            }
            TALON.getLogger().writeError(
                '[TCP_MST_TORIHIKISAKI_CHANGE] initChange エラー: ' + e.message
            );
            return {
                ok: false,
                errorMsg: '変更申請レコードの書き込みに失敗しました。' + e.message,
                shinseiId: null
            };
        }

        return { ok: true, errorMsg: '', shinseiId: String(shinseiId) };
    }

    /**
     * 申請IDを指定して変更申請レコードを1件取得する（画面初期表示用）
     *
     * @param  {Object} conn      DB接続
     * @param  {string} shinseiId 申請ID
     * @returns {Object|null} 変更申請レコード または null
     */
    function getChangeRec(conn, shinseiId) {
        if (!conn || !shinseiId) {
            return null;
        }
        return DbUtil.selectOne(
            conn,
            TABLE_CHANGE,
            null,
            { SHINSEI_ID: shinseiId, DEL_FLG: DEL_FLG_ACTIVE },
            null
        );
    }

    // ----------------------------------------------------------------
    // 公開インターフェース
    // ----------------------------------------------------------------
    return {
        initChange   : initChange,
        getChangeRec : getChangeRec
    };

}());


/* ================================================================
 * 呼び出し例（画面の LogicDesigner / サーバーサイドJS から）
 * ================================================================
 *
 * // ① 画面検索ボタン押下時
 * //    単票ブロック（ブロック番号1）から SUP_CD を取得して initChange を呼び出す
 * var blockData = TALON.getBlockData_Card(1);
 * var supCd     = blockData['SUP_CD'];
 * var workId    = 'MST_TORIHIKISAKI_CHG';   // ワークフロー定義ID（固定値でも可）
 * var conn      = TALON.getDbConfig();
 *
 * var result = TCP_MST_TORIHIKISAKI_CHANGE.initChange(conn, supCd, workId);
 *
 * if (!result.ok) {
 *     TALON.addErrorMsg(result.errorMsg);
 *     TALON.setIsSuccess(false);
 *     return;
 * }
 *
 * // result.shinseiId を以降の処理（画面セット等）に使用する
 * TALON.addMsg('申請ID：' + result.shinseiId);
 *
 *
 * // ② 画面初期表示（申請IDが単票ブロックに既にある場合）
 * var blockData2 = TALON.getBlockData_Card(1);
 * var shinseiId  = blockData2['SHINSEI_ID'];
 * var conn2      = TALON.getDbConfig();
 *
 * var rec = TCP_MST_TORIHIKISAKI_CHANGE.getChangeRec(conn2, shinseiId);
 * if (!rec) {
 *     TALON.addErrorMsg('変更申請レコードが取得できませんでした。');
 *     TALON.setIsSuccess(false);
 * }
 *
 * ================================================================ */
