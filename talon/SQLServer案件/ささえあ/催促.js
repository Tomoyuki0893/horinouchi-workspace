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
 */

var TCP_SUPPLIER_WF = (function () {

    var TABLE_WORK = 'MST_T_TORIHIKISAKI_WORK';
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
        var executorId = work['CREATED_BY'] || 'SYSTEM';

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
     */
    function _insertMaster(conn, work, executorId) {
        // 決裁時に SUP_CD を採番
        var supCd = String(TALON.getNumberingData('SUP_CD', 1)[0]);

        if (DbUtil.getCount(conn, TABLE_MASTER, { SUP_CD: supCd }) > 0) {
            _handleError('同一取引先コードが既にマスタに存在します。SUP_CD=' + supCd);
            return;
        }

        var now = new Date();
        var insMap = _buildMasterMap(work);
        insMap['SUP_CD'] = supCd;   // 採番した値で上書き
        insMap['削除フラグ'] = '0';
        insMap['登録日時'] = now;
        insMap['登録者'] = executorId;
        insMap['更新日時'] = now;
        insMap['更新者'] = executorId;

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
     * WORKレコードから業務カラムのみのMapを組み立てる
     * （SHINSEI_ID / WORK_ID / RENKET_FLG / TALON監査列 は含めない）
     */
    function _buildMasterMap(work) {
        return {
            'SUP_CD': work['SUP_CD'],
            'NAME1': work['NAME1'],
            'NAME2': work['NAME2'],
            'NAME_KANA': work['NAME_KANA'],
            'ZIP_CODE': work['ZIP_CODE'],
            'PREF_CD': work['PREF_CD'],
            'ADDR1': work['ADDR1'],
            'ADDR2': work['ADDR2'],
            'TEL1': work['TEL1'],
            'TEL2': work['TEL2'],
            'TEL3': work['TEL3'],
            'FAX1': work['FAX1'],
            'FAX2': work['FAX2'],
            'FAX3': work['FAX3'],
            'COUNTRY_CD': work['COUNTRY_CD'],
            'CURR_CD': work['CURR_CD'],
            'TAX_EXEMPT_FLG': work['TAX_EXEMPT_FLG'],
            'CAPITAL': work['CAPITAL'],
            'TRADE_COND': work['TRADE_COND'],
            'SUBCONTRACT_FLG': work['SUBCONTRACT_FLG'],
            'PAY_TERM_CD': work['PAY_TERM_CD'],
            'PAY_METHOD': work['PAY_METHOD'],
            'BANK_CD': work['BANK_CD'],
            'BRANCH_CD': work['BRANCH_CD'],
            'ACCT_TYPE': work['ACCT_TYPE'],
            'ACCT_NO': work['ACCT_NO'],
            'ACCT_NAME_KANA': work['ACCT_NAME_KANA'],
            'FEE_FLG': work['FEE_FLG'],
            'BILL_BASE_DT': work['BILL_BASE_DT'],
            'BILL_DUE_DT': work['BILL_DUE_DT'],
            'BILL_SITE_CD': work['BILL_SITE_CD'],
            'BILL_TYPE': work['BILL_TYPE'],
            'BILL_BANK_CD': work['BILL_BANK_CD'],
            'CASH_LIMIT': work['CASH_LIMIT'],
            'DENSAI_USER_NO': work['DENSAI_USER_NO'],
            'DENSAI_SITE_CD': work['DENSAI_SITE_CD'],
            'DENSAI_BANK_CD': work['DENSAI_BANK_CD']
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
