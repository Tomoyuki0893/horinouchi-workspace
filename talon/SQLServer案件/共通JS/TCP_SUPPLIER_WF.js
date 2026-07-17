/**
 * TCP_SUPPLIER_WF
 * 取引先マスタ申請 - 決裁完了時マスタ反映ロジック
 *
 * 呼び出し元：WFS_CUSTOM.execWorkFlowCustom（TALONワークフロー標準フック）
 *
 * 注意：
 *   WFエンジンフック（Non-loginコンテキスト）から呼ばれるため
 *   TALON.getUserInfoMap() は使用不可。
 *   executorId は WORK テーブルの CREATED_BY（申請者ID）を使用する。
 *
 * 現状は新規登録申請のみ対応（INSERT固定）。
 * 変更・使用停止は RENKET_FLG の値が確定次第、_updateMaster / _stopMaster を有効化する。
 *
 * M_TORIHIKISAKI 監査列：
 *   DELETE_FLG / CREATED_DATE / CREATED_BY / UPDATED_DATE / UPDATED_BY
 */

var TCP_SUPPLIER_WF = (function () {

    var TABLE_WORK   = 'MST_T_TORIHIKISAKI_WORK';
    var TABLE_MASTER = 'M_TORIHIKISAKI';

    // ------------------------------------------------------------------
    // 公開関数
    // ------------------------------------------------------------------

    /**
     * 決裁完了時にWORKデータをマスタへ反映する
     *
     * エラー時は TALON.addErrorMsg / TALON.setIsSuccess(false) を内部で呼ぶ。
     * 呼び出し元（WFS_CUSTOM フック）は戻り値を参照しなくてよい。
     *
     * @param {string} shinseiId - MST_T_TORIHIKISAKI_WORK.SHINSEI_ID
     */
    function reflect(shinseiId) {
        if (!shinseiId) {
            _handleError('申請IDが未指定です。');
            return;
        }

        var conn = TALON.getDbConfig();

        var work = DbUtil.selectOne(conn, TABLE_WORK, null, { SHINSEI_ID: shinseiId }, null);
        if (!work) {
            _handleError('WORKデータが見つかりません。SHINSEI_ID=' + shinseiId);
            return;
        }

        // Non-loginコンテキストのためセッション取得不可
        // 申請者ID（CREATED_BY）を更新者として使用する
        var executorId = getMapVal(work, 'CREATED_BY') || 'SYSTEM';

        try {
            _insertMaster(conn, work, executorId);
        } catch (e) {
            _handleError('マスタ反映中に例外が発生しました: ' + e.message);
        }
    }

    // ------------------------------------------------------------------
    // 内部関数
    // ------------------------------------------------------------------

    /**
     * 新規登録：M_TORIHIKISAKI に INSERT
     * SUP_CD は決裁時に採番する
     */
    function _insertMaster(conn, work, executorId) {
        // 決裁時に SUP_CD を採番
        var supCd = String(TALON.getNumberingData('SUP_CD', 1)[0]);

        if (DbUtil.getCount(conn, TABLE_MASTER, { SUP_CD: supCd }) > 0) {
            _handleError('同一取引先コードが既にマスタに存在します。SUP_CD=' + supCd);
            return;
        }

        var insMap     = _buildMasterMap(work);
        insMap['SUP_CD']     = supCd;
        insMap['DELETE_FLG'] = '0';
        insMap = DbUtil.setInsInitData(insMap);

        // setInsInitData で CREATED_BY/UPDATED_BY がセッションユーザで上書きされるため
        // Non-loginコンテキスト用に申請者IDで再セット
        insMap['CREATED_BY'] = executorId;
        insMap['UPDATED_BY'] = executorId;

        TalonDbUtil.begin(conn);
        try {
            DbUtil.insert(conn, TABLE_MASTER, insMap, true);
            TalonDbUtil.commit(conn);
            TALON.getLogger().writeInfo('[TCP_SUPPLIER_WF] 新規登録完了 SUP_CD=' + supCd);
        } catch (e) {
            _safeRollback(conn);
            throw e;
        }
    }

    /**
     * 変更：M_TORIHIKISAKI を UPDATE
     * ※RENKET_FLG確定後に有効化
     */
    function _updateMaster(conn, work, executorId) {
        var supCd = getMapVal(work, 'SUP_CD');

        if (DbUtil.getCount(conn, TABLE_MASTER, { SUP_CD: supCd }) === 0) {
            _handleError('更新対象の取引先がマスタに存在しません。SUP_CD=' + supCd);
            return;
        }

        var updMap        = _buildMasterMap(work);
        updMap['SUP_CD']  = supCd;
        updMap = DbUtil.setUpdInitData(updMap);
        updMap['UPDATED_BY'] = executorId;

        TalonDbUtil.begin(conn);
        try {
            var cnt = DbUtil.update(conn, TABLE_MASTER, updMap, ['SUP_CD'], true);
            TalonDbUtil.commit(conn);
            TALON.getLogger().writeInfo('[TCP_SUPPLIER_WF] 変更完了 SUP_CD=' + supCd + ' 更新件数=' + cnt);
        } catch (e) {
            _safeRollback(conn);
            throw e;
        }
    }

    /**
     * 使用停止：DELETE_FLG='1' のみ UPDATE（業務カラムは変更しない）
     * ※RENKET_FLG確定後に有効化
     */
    function _stopMaster(conn, work, executorId) {
        var supCd = getMapVal(work, 'SUP_CD');

        if (DbUtil.getCount(conn, TABLE_MASTER, { SUP_CD: supCd }) === 0) {
            _handleError('使用停止対象の取引先がマスタに存在しません。SUP_CD=' + supCd);
            return;
        }

        var updMap = {
            'SUP_CD':     supCd,
            'DELETE_FLG': '1'
        };
        updMap = DbUtil.setUpdInitData(updMap);
        updMap['UPDATED_BY'] = executorId;

        TalonDbUtil.begin(conn);
        try {
            var cnt = DbUtil.update(conn, TABLE_MASTER, updMap, ['SUP_CD'], true);
            TalonDbUtil.commit(conn);
            TALON.getLogger().writeInfo('[TCP_SUPPLIER_WF] 使用停止完了 SUP_CD=' + supCd + ' 更新件数=' + cnt);
        } catch (e) {
            _safeRollback(conn);
            throw e;
        }
    }

    /**
     * WORKレコードから業務カラムのみのMapを組み立てる
     * （SHINSEI_ID / WORK_ID / RENKET_FLG / TALON監査列 は含めない）
     */
    function _buildMasterMap(work) {
        return {
            'NAME1':           getMapVal(work, 'NAME1'),
            'NAME2':           getMapVal(work, 'NAME2'),
            'NAME_KANA':       getMapVal(work, 'NAME_KANA'),
            'ZIP_CODE':        getMapVal(work, 'ZIP_CODE'),
            'PREF_CD':         getMapVal(work, 'PREF_CD'),
            'ADDR1':           getMapVal(work, 'ADDR1'),
            'ADDR2':           getMapVal(work, 'ADDR2'),
            'TEL1':            getMapVal(work, 'TEL1'),
            'TEL2':            getMapVal(work, 'TEL2'),
            'TEL3':            getMapVal(work, 'TEL3'),
            'FAX1':            getMapVal(work, 'FAX1'),
            'FAX2':            getMapVal(work, 'FAX2'),
            'FAX3':            getMapVal(work, 'FAX3'),
            'COUNTRY_CD':      getMapVal(work, 'COUNTRY_CD'),
            'CURR_CD':         getMapVal(work, 'CURR_CD'),
            'TAX_EXEMPT_FLG':  getMapVal(work, 'TAX_EXEMPT_FLG'),
            'CAPITAL':         getMapVal(work, 'CAPITAL'),
            'TRADE_COND':      getMapVal(work, 'TRADE_COND'),
            'SUBCONTRACT_FLG': getMapVal(work, 'SUBCONTRACT_FLG'),
            'PAY_TERM_CD':     getMapVal(work, 'PAY_TERM_CD'),
            'PAY_METHOD':      getMapVal(work, 'PAY_METHOD'),
            'BANK_CD':         getMapVal(work, 'BANK_CD'),
            'BRANCH_CD':       getMapVal(work, 'BRANCH_CD'),
            'ACCT_TYPE':       getMapVal(work, 'ACCT_TYPE'),
            'ACCT_NO':         getMapVal(work, 'ACCT_NO'),
            'ACCT_NAME_KANA':  getMapVal(work, 'ACCT_NAME_KANA'),
            'FEE_FLG':         getMapVal(work, 'FEE_FLG'),
            'BILL_BASE_DT':    getMapVal(work, 'BILL_BASE_DT'),
            'BILL_DUE_DT':     getMapVal(work, 'BILL_DUE_DT'),
            'BILL_SITE_CD':    getMapVal(work, 'BILL_SITE_CD'),
            'BILL_TYPE':       getMapVal(work, 'BILL_TYPE'),
            'BILL_BANK_CD':    getMapVal(work, 'BILL_BANK_CD'),
            'CASH_LIMIT':      getMapVal(work, 'CASH_LIMIT'),
            'DENSAI_USER_NO':  getMapVal(work, 'DENSAI_USER_NO'),
            'DENSAI_SITE_CD':  getMapVal(work, 'DENSAI_SITE_CD'),
            'DENSAI_BANK_CD':  getMapVal(work, 'DENSAI_BANK_CD')
        };
    }

    /**
     * エラー処理：ログ出力 + 画面通知 + 処理失敗フラグ
     */
    function _handleError(msg) {
        TALON.getLogger().writeError('[TCP_SUPPLIER_WF] ' + msg);
        TALON.addErrorMsg(msg);
        TALON.setIsSuccess(false);
    }

    /**
     * ROLLBACKを安全に実行する（失敗しても業務を止めない）
     */
    function _safeRollback(conn) {
        try {
            TalonDbUtil.rollback(conn);
        } catch (re) {
            TALON.getLogger().writeWarn('[TCP_SUPPLIER_WF] ROLLBACK失敗: ' + re.message);
        }
    }

    // ------------------------------------------------------------------
    return {
        reflect: reflect
    };

}());
