/**
 * TCP_REMINDER : ワークフロー催促メール共通ロジック
 *
 * 未承認データを検知し、承認候補者にメールを送信する。
 * バッチ専用。WFS_COMMON の関数群に依存する。
 *
 * 使用例:
 *   var r = TCP_REMINDER.runBatch();
 *   if (!r.ok) { TALON.getLogger().writeError(r.errorMsg); }
 *
 * @version 2026/04/29
 */

var TCP_REMINDER = TCP_REMINDER || {};

(function (NS) {

    // =================================================================
    // 催促対象抽出
    // =================================================================

    /**
     * 催促対象の未承認データを抽出
     *
     * 抽出条件:
     *   - STATUS = '4'         （承認待ち）
     *   - CURENT_FLG = '1'     （現在のステップ）
     *   - ACTIVE_FLG = '1'     （有効）
     *   - HOLD_FLG <> '1'      （保留除外）
     *   - SAISOKU_FLG = '1'    （催促有効）
     *   - KIJUN_HOURS 経過済   （CREATED_DATE から基準時間以上経過）
     *
     * @return {Array<object>}  催促対象レコードの配列
     */
    NS.findTargets = function () {
        var sql =
            "SELECT " +
            "  WFS_T_WORKFLOW.WORK_ID " +
            " ,WFS_T_WORKFLOW.OBJECT_ID " +
            " ,WFS_T_WORKFLOW.STEP " +
            " ,WFS_T_WORKFLOW.LVL " +
            " ,WFS_T_WORKFLOW.ROUTE_ID " +
            " ,WFS_T_WORKFLOW.OBJECT_NM " +
            " ,WFS_T_WORKFLOW.USR_ID " +
            " ,WFS_T_WORKFLOW.CREATED_DATE " +
            " ,WFS_M_CONTROL.WORK_NM " +
            " ,WFS_M_CONTROL.KIJUN_HOURS " +
            " ,DATEDIFF(HOUR, WFS_T_WORKFLOW.CREATED_DATE, GETDATE()) AS KEIKA_HOURS " +
            "FROM WFS_T_WORKFLOW " +
            "INNER JOIN WFS_M_CONTROL " +
            "   ON WFS_T_WORKFLOW.WORK_ID = WFS_M_CONTROL.WORK_ID " +
            "WHERE WFS_T_WORKFLOW.STATUS     = '4' " +
            "  AND WFS_T_WORKFLOW.CURENT_FLG = '1' " +
            "  AND WFS_T_WORKFLOW.ACTIVE_FLG = '1' " +
            "  AND ( WFS_T_WORKFLOW.HOLD_FLG IS NULL OR WFS_T_WORKFLOW.HOLD_FLG <> '1' ) " +
            "  AND WFS_M_CONTROL.SAISOKU_FLG  = '1' " +
            "  AND WFS_M_CONTROL.KIJUN_HOURS IS NOT NULL " +
            "  AND DATEDIFF(HOUR, WFS_T_WORKFLOW.CREATED_DATE, GETDATE()) >= WFS_M_CONTROL.KIJUN_HOURS " +
            "ORDER BY WFS_T_WORKFLOW.WORK_ID, WFS_T_WORKFLOW.OBJECT_ID ";
        return TalonDbUtil.select(TALON.getDbConfig(), sql);
    };


    // =================================================================
    // 承認者抽出（メールアドレス付き）
    // =================================================================

    /**
     * 指定ワークフロー・レベル・ルートで承認可能なユーザ（メール付き）を取得
     *
     * @param  {string} workId
     * @param  {string} lvl
     * @param  {string} routeId
     * @return {Array<object>}  [{ USR_ID, MAIL }, ...]
     */
    NS.findApprovers = function (workId, lvl, routeId) {
        var sql =
            "SELECT DISTINCT " +
            "  WFS_M_USR_GRP_DEPDTL.USR_ID " +
            " ,WFS_M_USR_GRP_DEPDTL.MAIL " +
            "FROM WFS_M_AUTH " +
            "INNER JOIN WFS_M_USR_GRP_DEPDTL " +
            "   ON WFS_M_AUTH.USR_GRP_ID = WFS_M_USR_GRP_DEPDTL.USR_GRP_ID " +
            "WHERE WFS_M_AUTH.WORK_ID  = '" + tln_com_escape(workId) + "' " +
            "  AND WFS_M_AUTH.LVL      = '" + tln_com_escape(lvl) + "' " +
            "  AND WFS_M_AUTH.ROUTE_ID = '" + tln_com_escape(routeId) + "' " +
            "  AND WFS_M_USR_GRP_DEPDTL.MAIL IS NOT NULL " +
            "  AND WFS_M_USR_GRP_DEPDTL.MAIL <> '' ";
        return TalonDbUtil.select(TALON.getDbConfig(), sql);
    };


    // =================================================================
    // 催促メール文言生成
    // =================================================================

    /**
     * 催促メールの件名・本文を生成（変数置換済み）
     *
     * 変数: %1_WORK_ID% / %1_WORK_NM% / %1_OBJECT_ID% / %1_OBJECT_NM% / %1_STEP%
     *
     * @param  {string} workId
     * @param  {string} objectId
     * @param  {string} step
     * @return {object} { ok, errorMsg, subject, body }
     */
    NS.buildMailData = function (workId, objectId, step) {
        var sql =
            "SELECT " +
            "  WFS_T_WORKFLOW.WORK_ID " +
            " ,WFS_M_CONTROL.WORK_NM " +
            " ,WFS_T_WORKFLOW.OBJECT_ID " +
            " ,WFS_T_WORKFLOW.OBJECT_NM " +
            " ,WFS_T_WORKFLOW.STEP " +
            " ,WFS_M_CONTROL.MAIL_TITLE_SAISOKU " +
            " ,WFS_M_CONTROL.MAIL_TEXT_SAISOKU " +
            "FROM WFS_T_WORKFLOW " +
            "INNER JOIN WFS_M_CONTROL " +
            "   ON WFS_T_WORKFLOW.WORK_ID = WFS_M_CONTROL.WORK_ID " +
            "WHERE WFS_T_WORKFLOW.WORK_ID   = '" + tln_com_escape(workId) + "' " +
            "  AND WFS_T_WORKFLOW.OBJECT_ID = '" + tln_com_escape(objectId) + "' " +
            "  AND WFS_T_WORKFLOW.STEP      = '" + tln_com_escape(step) + "' ";
        var rows = TalonDbUtil.select(TALON.getDbConfig(), sql);

        if (rows.length === 0) {
            return { ok: false, errorMsg: "催促メール文言の生成に失敗（対象データなし）", subject: null, body: null };
        }

        var rec = rows[0];
        var _WORK_ID = getMapVal(rec, 'WORK_ID') || '';
        var _WORK_NM = getMapVal(rec, 'WORK_NM') || '';
        var _OBJECT_ID = getMapVal(rec, 'OBJECT_ID') || '';
        var _OBJECT_NM = getMapVal(rec, 'OBJECT_NM') || '';
        var _STEP = getMapVal(rec, 'STEP') + '';
        var _TITLE_RAW = getMapVal(rec, 'MAIL_TITLE_SAISOKU') || '';
        var _TEXT_RAW = getMapVal(rec, 'MAIL_TEXT_SAISOKU') || '';

        if (_TITLE_RAW === '' && _TEXT_RAW === '') {
            return { ok: false, errorMsg: "催促メール文言が WFS_M_CONTROL に設定されていません (WORK_ID=" + _WORK_ID + ")", subject: null, body: null };
        }

        var subject = NS._replaceVars(_TITLE_RAW, _WORK_ID, _WORK_NM, _OBJECT_ID, _OBJECT_NM, _STEP);
        var body = NS._replaceVars(_TEXT_RAW, _WORK_ID, _WORK_NM, _OBJECT_ID, _OBJECT_NM, _STEP);

        return { ok: true, errorMsg: "", subject: subject, body: body };
    };

    /**
     * メール文言の変数置換（内部関数）
     */
    NS._replaceVars = function (template, workId, workNm, objectId, objectNm, step) {
        if (template == null) { return ''; }
        var s = template;
        s = s.split('%1_WORK_ID%').join(workId);
        s = s.split('%1_WORK_NM%').join(workNm);
        s = s.split('%1_OBJECT_ID%').join(objectId);
        s = s.split('%1_OBJECT_NM%').join(objectNm);
        s = s.split('%1_STEP%').join(step);
        return s;
    };


    // =================================================================
    // メール送信（差し替えポイント）
    // =================================================================

    /**
     * 1件分のメール送信（内部関数）
     *
     * @param  {string} toMail
     * @param  {string} subject
     * @param  {string} body
     * @return {object} { ok, errorMsg }
     */
    NS._sendMail = function (toMail, subject, body) {
        try {
            // TCP_MAIL.send は エラー時にメッセージ、成功時に undefined を返す
            var err = TCP_MAIL.send(toMail, null, null, subject, body, null);
            if (err) {
                return { ok: false, errorMsg: err };
            }
            return { ok: true, errorMsg: "" };
        } catch (e) {
            return { ok: false, errorMsg: e.message };
        }
    };


    // =================================================================
    // バッチ エントリポイント
    // =================================================================

    /**
     * 催促バッチ：未承認データを検知し、承認候補者にメールを送信する
     *
     * @return {object} { ok, errorMsg, totalTargets, totalMails, errorCount }
     */
    NS.runBatch = function () {
        var totalTargets = 0;
        var totalMails = 0;
        var errorCount = 0;

        var targets = NS.findTargets();
        totalTargets = targets.length;

        TALON.getLogger().writeInfo(
            '[REMINDER] 催促バッチ開始 対象件数=' + totalTargets
        );

        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            var _WORK_ID = getMapVal(t, 'WORK_ID');
            var _OBJECT_ID = getMapVal(t, 'OBJECT_ID');
            var _STEP = getMapVal(t, 'STEP');
            var _LVL = getMapVal(t, 'LVL');
            var _ROUTE_ID = getMapVal(t, 'ROUTE_ID');

            try {
                // メール文言生成
                var rMail = NS.buildMailData(_WORK_ID, _OBJECT_ID, _STEP);
                if (!rMail.ok) {
                    TALON.getLogger().writeWarn(
                        '[REMINDER] メール文言生成NG ' +
                        'WORK_ID=' + _WORK_ID + ' OBJECT_ID=' + _OBJECT_ID + ' STEP=' + _STEP +
                        ' / ' + rMail.errorMsg
                    );
                    errorCount++;
                    continue;
                }

                // 承認候補者抽出
                var approvers = NS.findApprovers(_WORK_ID, _LVL, _ROUTE_ID);
                if (approvers.length === 0) {
                    TALON.getLogger().writeWarn(
                        '[REMINDER] 承認候補者なし ' +
                        'WORK_ID=' + _WORK_ID + ' OBJECT_ID=' + _OBJECT_ID + ' STEP=' + _STEP
                    );
                    errorCount++;
                    continue;
                }

                // 承認者ごとにメール送信
                for (var j = 0; j < approvers.length; j++) {
                    var ap = approvers[j];
                    var _USR_ID = getMapVal(ap, 'USR_ID');
                    var _MAIL = getMapVal(ap, 'MAIL');

                    var rSend = NS._sendMail(_MAIL, rMail.subject, rMail.body);
                    if (rSend.ok) {
                        totalMails++;
                        TALON.getLogger().writeInfo(
                            '[REMINDER] メール送信OK ' +
                            'WORK_ID=' + _WORK_ID + ' OBJECT_ID=' + _OBJECT_ID + ' STEP=' + _STEP +
                            ' TO=' + _USR_ID + '<' + _MAIL + '>'
                        );
                    } else {
                        errorCount++;
                        TALON.getLogger().writeError(
                            '[REMINDER] メール送信NG ' +
                            'WORK_ID=' + _WORK_ID + ' OBJECT_ID=' + _OBJECT_ID + ' STEP=' + _STEP +
                            ' TO=' + _USR_ID + '<' + _MAIL + '>' +
                            ' / ' + rSend.errorMsg
                        );
                    }
                }

            } catch (e) {
                errorCount++;
                TALON.getLogger().writeError(
                    '[REMINDER] 例外発生 ' +
                    'WORK_ID=' + _WORK_ID + ' OBJECT_ID=' + _OBJECT_ID + ' STEP=' + _STEP +
                    ' / ' + e.message
                );
            }
        }

        TALON.getLogger().writeInfo(
            '[REMINDER] 催促バッチ終了 ' +
            '対象件数=' + totalTargets +
            ' 送信成功=' + totalMails +
            ' エラー=' + errorCount
        );

        return {
            ok: (errorCount === 0),
            errorMsg: (errorCount === 0 ? '' : errorCount + '件のエラーが発生しました'),
            totalTargets: totalTargets,
            totalMails: totalMails,
            errorCount: errorCount
        };
    };

})(TCP_REMINDER);