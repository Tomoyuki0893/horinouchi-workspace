/**
 * WFS_RESOLVE : [共通]ワークフロー 承認者絞り込み
 *
 * @version 2026/06/23
 *
 * 申請時に相対ロール（担当課長/部長/事業部長/代表）を解決し、
 * WFS_T_WORKAPPROVALRES へ書き込む。実体の絞り込みは
 * ストアド usp_WFS_APPROVALRES_RESOLVE が担当。
 *
 * ※ WFS_MAIL とは直接呼び合わず、WFS_T_WORKAPPROVALRES（テーブル）を継ぎ目に疎結合。
 *   本モジュールが書き、WFS_MAIL.sendApproval が読む。
 *
 * 依存：WFS_CONST / TALON / TalonDbUtil
 */
var WFS_RESOLVE = {

    /**
     * 申請時に相対ロールの承認者を解決し WFS_T_WORKAPPROVALRES へ書き込む。
     *   - 申請(10) かつ WFS_CONST.RESOLVE_WORK 対象の work_id のみ実行
     *   - ROUTE_ID は WFS_T_WORKFLOW の活性行から取得（sendApproval と同じ取り方）
     *   - 申請者は申請操作者（ログインユーザ）。代理申請があるなら LVL=1 の USR_ID に切替
     *   - 絶対グループ（経理/JLT/取締役会/全社員）は書かない＝グループのまま評価
     *
     * @param {string} work_id
     * @param {string} obj_id
     * @param {string} syori_kbn
     */
    resolve: function (work_id, obj_id, syori_kbn) {
        if (syori_kbn !== WFS_CONST.SYORI.SHINSEI) return;   // 申請時のみ
        if (!WFS_CONST.RESOLVE_WORK[work_id]) return;        // 相対ロールを使うフローのみ

        var log = TALON.getLogger();
        var conn = TALON.getDbConfig();

        // ルートID（活性ステップから。WFS_MAIL.sendApproval と同じ取り方）
        var curList = TalonDbUtil.select(conn,
            'SELECT TOP 1 ROUTE_ID ' +
            'FROM   WFS_T_WORKFLOW ' +
            'WHERE  WORK_ID    = ? ' +
            'AND    OBJECT_ID  = ? ' +
            'AND    CURENT_FLG = 1 ' +
            'AND    ACTIVE_FLG = 1 ' +
            'ORDER BY LVL DESC',
            [work_id, obj_id]
        );
        var routeId = (curList && curList.length > 0) ? String(curList[0]['ROUTE_ID'] || '') : '';
        if (!routeId) {
            log.writeInfo('[WFS_RESOLVE.resolve] ROUTE_ID未取得。絞り込みスキップ（グループ評価）。');
            return;
        }

        // 申請者＝申請操作者。※代理申請があるなら WFS_T_WORKFLOW LVL=1 の USR_ID に切替。
        var applicant = TALON.getUserInfoMap()['USER_ID'];

        // 【兼務対応は未実装】申請画面に「申請部門」セレクタが入り、SP側に
        //   @ApplyBumonCd NVARCHAR(200) = N'' を追加した時点で、下記を復活させる：
        //     var applyBumon = String(<申請レコード>['SHINSEI_BUMON_CD'] || '');
        //     param['ApplyBumonCd'] = applyBumon;   // 空=申請者の所属へSP側フォールバック
        //   現状はSPが当該引数を持たないため、渡すと CMN_E0091 になる。

        var OUT = ['oFLG', 'oMSG'];
        var param = {};
        param['WorkId']          = work_id;
        param['ObjectId']        = obj_id;
        param['RouteId']         = routeId;
        param['ApplicantUserId'] = applicant;
        param['ActorId']         = applicant;
        param['ExcludeSelf']     = 0;          // 自己承認を除外し上位へ回すなら 1
        for (var i = 0; i < OUT.length; i++) {
            param[OUT[i]] = '';
        }

        var ret = TalonDbUtil.prepareCall(conn, 'usp_WFS_APPROVALRES_RESOLVE', param, OUT);
        var flg = ret[0];
        var msg = ret[1];

        if (flg !== 'OK') {
            // 絞り込めない申請は中止する。ここで止めないと、メール／エンジンが
            // 相対レベルを全プール（全課長 等）へフォールバックさせ誤配信になる。
            log.writeError('[WFS_RESOLVE.resolve] 絞り込みNG（申請を中止）: ' + msg);
            throw new Error('承認者を特定できないため申請を中止しました: ' + msg);
        }
        log.writeInfo('[WFS_RESOLVE.resolve] ' + msg);
    }
};