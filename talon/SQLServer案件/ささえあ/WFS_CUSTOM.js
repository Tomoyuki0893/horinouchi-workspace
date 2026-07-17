/**
 * WFS_CUSTOM : [共通]ワークフローシステム（ユーザー処理用）
 *
 * @version   2026/06/24
 *
 * 変更点（2026/06/24）:
 *   - setClmParam のバグ修正（conn未定義／バインド引数のカンマ抜けを修正）
 *   - 通知メール処理を try/catch で囲み、失敗時もWF本処理を継続するよう変更
 *   - execWorkFlowCustom の CLM001/CLM002 case をフォールスルーで集約
 *
 * 変更点（2026/06/19）:
 *   - 申請者への「承認完了（決裁）／否認」通知メールを追加（sendApplicantMail）
 *   - 承認ルート完走確認ログを追加（verifyRouteCompletion）
 *   - ダイレクトリンク生成／メールアドレス取得を共通関数化
 */
//-------------------------------------------------------
// パラメータ
//     work_id        ワークフローＩＤ
//     object_id      オブジェクトＩＤ
//     syori_kbn      処理区分
//         10 : 申請                       [ STATUS = 1 ]
//         20 : 承認（次階層あり）         [ STATUS = 2 ]
//         21 : 承認（次階層なし=決裁）    [ STATUS = 2 ]
//         30 : 差戻                       [ STATUS = 3 ]
//         90 : 否認                       [ STATUS = 9 ]
//         50 : 取戻（申請者取戻）         [ STATUS = 5 ]
//         60 : 取消                       [ STATUS = 6 ]
//         70 : 取戻（承認者取戻）         [ STATUS = 7 ]
//         80 : 引上                       [ STATUS = 8 ]
//-------------------------------------------------------
var _WFS_SYORI_KBN_SHINSEI = '10'; // 申請
var _WFS_SYORI_KBN_SHONIN = '20'; // 承認（次階層あり）
var _WFS_SYORI_KBN_KESSAI = '21'; // 承認（次階層なし＝決裁）
var _WFS_SYORI_KBN_SASHIMODOSHI = '30'; // 差戻
var _WFS_SYORI_KBN_HININ = '90'; // 否認
var _WFS_SYORI_KBN_TORIMODOSHIS = '50'; // 取戻（申請者取戻）
var _WFS_SYORI_KBN_TORIKESHI = '60'; // 取消
var _WFS_SYORI_KBN_TORIMODOSHIA = '70'; // 取戻（承認者取戻）
var _WFS_SYORI_KBN_HIKIAGE = '80'; // 引上

// work_idごとの「申請番号カラム名」「ダイレクトリンク機能ID」定義
//   RINGI       : BUNSHO_NO
//   TORIHIKI001 : SHINSEI_ID
//   TORIHIKI002 : SHINSEI_ID
var _WFS_FUNC_MAP = {
    'RINGI': { funcId: 'RIN0001', col: 'BUNSHO_NO' },
    'TORIHIKI001': { funcId: 'MST0004', col: 'SHINSEI_ID' },
    'TORIHIKI002': { funcId: 'MST0005', col: 'SHINSEI_ID' },
    'CLM001': { funcId: 'CLM0002', col: 'SHINSEI_NO' },
    'CLM002': { funcId: 'CLM0004', col: 'SHINSEI_NO' }
};

// =================================================================
// メイン処理
// =================================================================
function execWorkFlowCustom(work_id, obj_id, syori_kbn) {
    switch (work_id) {
        case 'M_TORIHIKISAKI':
            setToriMst(obj_id, syori_kbn);
            break;
        case 'RINGI':
            setRingNo(obj_id, syori_kbn);
            break;
        case 'CLM001':
        case 'CLM002':
            setClmShinseiStatus(obj_id, syori_kbn);
            break;
        default:
            break;
    }

    // 通知メールの失敗でワークフロー本処理が巻き戻らないよう例外を遮断する
    // （通知系はあくまで付随処理のため、エラー時もログ出力のみで継続）
    try {
        // 全work_id共通：次の承認者へ承認依頼メール送信（申請10／承認20）
        sendApprovalMail(work_id, obj_id, syori_kbn);

        // 全work_id共通：申請者へ完了／否認通知メール送信（決裁21／否認90）
        sendApplicantMail(work_id, obj_id, syori_kbn);
    } catch (e) {
        TALON.getLogger().writeInfo('[execWorkFlowCustom] 通知メール処理で例外が発生しました（処理は継続）: ' + e);
    }
}

function setClmShinseiStatus(obj_id, syori_kbn) {

    if (syori_kbn != _WFS_SYORI_KBN_SHINSEI) return;
    setClmParam(obj_id);

}

function setClmParam(obj_id) {

    var conn = TALON.getDbConfig();
    TalonDbUtil.update(conn,
        'UPDATE CLM_T_SHINSEI ' +
        'SET    SHINSEI_STATUS = 2 ' +
        'WHERE  SHINSEI_NO = ? ',
        [obj_id]
    );

}

// =================================================================
// 稟議番号設定
// =================================================================
function setRingNo(obj_id, syori_kbn) {
    if (syori_kbn != _WFS_SYORI_KBN_SHINSEI) return;
    setRing(obj_id);
}

// =================================================================
// 取引先マスタ設定ロジック
// =================================================================
/**
 * 取引先マスタ設定ロジック
 * @param {string} obj_id
 * @param {string} syori_kbn
 */
function setToriMst(obj_id, syori_kbn) {
    if (syori_kbn != _WFS_SYORI_KBN_KESSAI) return;
    TALON.getLogger().writeInfo('[setToriMst] obj_id=' + obj_id + ' syori_kbn=' + syori_kbn);
    var conn = TALON.getDbConfig();
    var workList = TalonDbUtil.select(conn,
        'SELECT SHINSEI_ID, RENKET_FLG FROM MST_T_TORIHIKISAKI_WORK WHERE SHINSEI_ID = ?',
        [obj_id]
    );
    TALON.getLogger().writeInfo('[setToriMst] work=' + JSON.stringify(workList[0] || null));
    // 1. TALONマスタ反映
    TCP_SUPPLIER_WF.reflect(obj_id);
    // 2. JDE連携（新規申請固定）
    // execJdeRenket(obj_id, 'A');
}

// =================================================================
// 共通ユーティリティ
// =================================================================
/**
 * ダイレクトリンクURLを生成する（work_id未対応／baseUrl未設定時は空文字）
 * @param {string} work_id
 * @param {string} obj_id
 * @return {string}
 */
function buildDirectLink(work_id, obj_id) {
    var mBaseUrl = TCP_UTIL.getHanyoMstMap('TLN_GENERAL', 'MAIL_BASE_URL');
    var baseUrl = mBaseUrl ? String(mBaseUrl['DSP1'] || '').trim() : '';
    if (!baseUrl || !_WFS_FUNC_MAP[work_id]) return '';

    var funcDef = _WFS_FUNC_MAP[work_id];
    return baseUrl +
        '/Talon/faces/TALON/APPLICATION/GENERALFREE/GENERALFREE.xhtml' +
        '?PARAM_FUNC_ID=' + funcDef.funcId +
        '&COLUMN_0=' + funcDef.col +
        '&FORMULA_0==' +
        '&VALUE_0=' + encodeURIComponent(String(obj_id)) +
        '&FLAT_VALUE_0=1' +
        '&INIT_SEARCH=true';
}

/**
 * USR_IDの配列からメールアドレスの配列を取得する
 *   IN句はプレースホルダ不可のため文字列連結で組み立て
 * @param {object} conn
 * @param {Array} usrIds
 * @return {Array} メールアドレスの配列
 */
function getMailAddrByUsrIds(conn, usrIds) {
    var toList = [];
    if (!usrIds || usrIds.length === 0) return toList;

    var inClause = usrIds.map(function (id) {
        return "'" + String(id).replace(/'/g, "''") + "'";
    }).join(', ');

    var userList = TalonDbUtil.select(conn,
        'SELECT USER_ID, MAIL_ADDRESS ' +
        'FROM   TLN_M_USER ' +
        'WHERE  USER_ID IN (' + inClause + ') ' +
        "AND    MAIL_ADDRESS IS NOT NULL " +
        "AND    MAIL_ADDRESS <> ''"
    );
    for (var k = 0; k < (userList || []).length; k++) {
        var addr = String(userList[k]['MAIL_ADDRESS'] || '').trim();
        if (addr) toList.push(addr);
    }
    return toList;
}

// =================================================================
// ワークフロー承認通知メール送信（次の承認者あて・共通）
// =================================================================
/**
 * 次の承認者へ承認依頼メールを送信する
 * 送信タイミング：申請(10) / 承認-次階層あり(20)
 *
 * @param {string} work_id    ワークフローID
 * @param {string} obj_id     オブジェクトID（申請ID）
 * @param {string} syori_kbn  処理区分
 */
function sendApprovalMail(work_id, obj_id, syori_kbn) {
    if (syori_kbn !== _WFS_SYORI_KBN_SHINSEI &&
        syori_kbn !== _WFS_SYORI_KBN_SHONIN) return;

    var log = TALON.getLogger();
    var conn = TALON.getDbConfig();

    log.writeInfo('[sendApprovalMail] START work_id=' + work_id
        + ' obj_id=' + obj_id + ' syori_kbn=' + syori_kbn);

    // -------------------------------------------------------
    // 1. 現在LVL・ROUTE_IDを取得
    // -------------------------------------------------------
    var sqlCurrent =
        'SELECT TOP 1 LVL, ROUTE_ID ' +
        'FROM   WFS_T_WORKFLOW ' +
        'WHERE  WORK_ID    = ? ' +
        'AND    OBJECT_ID  = ? ' +
        'AND    CURENT_FLG = 1 ' +
        'AND    ACTIVE_FLG = 1 ' +
        'ORDER BY LVL DESC';
    var currentList = TalonDbUtil.select(conn, sqlCurrent, [work_id, obj_id]);
    if (!currentList || currentList.length === 0) {
        log.writeInfo('[sendApprovalMail] 現在承認ステップが取得できませんでした。送信スキップ。');
        return;
    }

    var current = currentList[0];
    var currentLvl = parseInt(current['LVL'], 10);
    var routeId = String(current['ROUTE_ID'] || '');
    var nextLvl = currentLvl;

    log.writeInfo('[sendApprovalMail] 現在LVL=' + currentLvl
        + ' ROUTE_ID=' + routeId + ' 次LVL=' + nextLvl);

    // -------------------------------------------------------
    // 2. 次承認者のUSR_IDを取得
    //    優先①: WFS_T_WORKAPPROVALRES（承認者指定あり）
    //    優先②: WFS_M_AUTH → WFS_M_USR_GRP_DEPDTL（グループ）
    // -------------------------------------------------------
    var usrIds = [];

    var approvalResList = TalonDbUtil.select(conn,
        'SELECT USR_ID ' +
        'FROM   WFS_T_WORKAPPROVALRES ' +
        'WHERE  WORK_ID   = ? ' +
        'AND    OBJECT_ID = ? ' +
        'AND    LVL       = ?',
        [work_id, obj_id, nextLvl]
    );
    if (approvalResList && approvalResList.length > 0) {
        log.writeInfo('[sendApprovalMail] 承認者指定テーブルから取得。件数=' + approvalResList.length);
        for (var i = 0; i < approvalResList.length; i++) {
            var id = String(approvalResList[i]['USR_ID'] || '').trim();
            if (id) usrIds.push(id);
        }
    }

    if (usrIds.length === 0) {
        var groupList = TalonDbUtil.select(conn,
            'SELECT d.USR_ID ' +
            'FROM   WFS_M_AUTH a ' +
            'JOIN   WFS_M_USR_GRP_DEPDTL d ON d.USR_GRP_ID = a.USR_GRP_ID ' +
            'WHERE  a.WORK_ID  = ? ' +
            'AND    a.ROUTE_ID = ? ' +
            'AND    a.LVL      = ?',
            [work_id, routeId, nextLvl]
        );
        if (groupList && groupList.length > 0) {
            log.writeInfo('[sendApprovalMail] グループテーブルから取得。件数=' + groupList.length);
            for (var j = 0; j < groupList.length; j++) {
                var gid = String(groupList[j]['USR_ID'] || '').trim();
                if (gid) usrIds.push(gid);
            }
        }
    }

    if (usrIds.length === 0) {
        log.writeInfo('[sendApprovalMail] 次承認者が見つかりませんでした。送信スキップ。');
        return;
    }

    // -------------------------------------------------------
    // 3. メールアドレス取得
    // -------------------------------------------------------
    var toList = getMailAddrByUsrIds(conn, usrIds);
    if (toList.length === 0) {
        log.writeInfo('[sendApprovalMail] メールアドレスが取得できませんでした。送信スキップ。');
        return;
    }
    log.writeInfo('[sendApprovalMail] 送信先: ' + toList.join(', '));

    // -------------------------------------------------------
    // 4. ダイレクトリンクURL生成
    // -------------------------------------------------------
    var directLink = buildDirectLink(work_id, obj_id);
    if (directLink) {
        log.writeInfo('[sendApprovalMail] ダイレクトリンク: ' + directLink);
    }

    // -------------------------------------------------------
    // 5. メール送信
    // -------------------------------------------------------
    var labelMap = { '10': '申請', '20': '承認' };
    var actionLabel = labelMap[syori_kbn] || syori_kbn;

    var subject = '【承認依頼】ワークフロー ' + work_id + '（' + actionLabel + '）';
    var body =
        'ワークフローの承認依頼が届いています。\n' +
        '\n' +
        'ワークフローID : ' + work_id + '\n' +
        '申請ID         : ' + obj_id + '\n' +
        '処理区分       : ' + actionLabel + '\n' +
        (directLink
            ? '\n■ 申請内容の確認はこちら\n' + directLink + '\n'
            : ''
        ) +
        '\nシステムにログインして内容をご確認ください。';

    var err = TCP_MAIL.send(toList, null, null, subject, body, null);
    if (err) {
        log.writeInfo('[sendApprovalMail] 送信失敗: ' + err);
    } else {
        log.writeInfo('[sendApprovalMail] 送信完了。');
    }
}

// =================================================================
// 申請者あて完了／否認通知メール送信（共通）
// =================================================================
/**
 * 申請者へ「承認完了（決裁）」または「否認」の通知メールを送信する
 * 送信タイミング：決裁(21) / 否認(90)
 *
 * 申請者の取得ロジック：
 *   WFS_T_WORKFLOW の LVL=1（申請ステップ）行の USR_ID を申請者とする
 *
 * @param {string} work_id    ワークフローID
 * @param {string} obj_id     オブジェクトID（申請ID）
 * @param {string} syori_kbn  処理区分
 */
function sendApplicantMail(work_id, obj_id, syori_kbn) {
    if (syori_kbn !== _WFS_SYORI_KBN_KESSAI &&
        syori_kbn !== _WFS_SYORI_KBN_HININ) return;

    var log = TALON.getLogger();
    var conn = TALON.getDbConfig();

    log.writeInfo('[sendApplicantMail] START work_id=' + work_id
        + ' obj_id=' + obj_id + ' syori_kbn=' + syori_kbn);

    // -------------------------------------------------------
    // 0. 決裁時：承認ルート完走確認ログを出力
    // -------------------------------------------------------
    if (syori_kbn === _WFS_SYORI_KBN_KESSAI) {
        verifyRouteCompletion(conn, work_id, obj_id);
    }

    // -------------------------------------------------------
    // 1. 申請者USR_IDを取得（WFS_T_WORKFLOW LVL=1）
    // -------------------------------------------------------
    var applicantList = TalonDbUtil.select(conn,
        'SELECT TOP 1 USR_ID ' +
        'FROM   WFS_T_WORKFLOW ' +
        'WHERE  WORK_ID   = ? ' +
        'AND    OBJECT_ID = ? ' +
        'AND    LVL       = 1 ' +
        'ORDER BY LVL ASC',
        [work_id, obj_id]
    );
    if (!applicantList || applicantList.length === 0) {
        log.writeInfo('[sendApplicantMail] 申請者(LVL=1)が取得できませんでした。送信スキップ。');
        return;
    }
    var applicantId = String(applicantList[0]['USR_ID'] || '').trim();
    if (!applicantId) {
        log.writeInfo('[sendApplicantMail] 申請者USR_IDが空です。送信スキップ。');
        return;
    }
    log.writeInfo('[sendApplicantMail] 申請者USR_ID=' + applicantId);

    // -------------------------------------------------------
    // 2. メールアドレス取得
    // -------------------------------------------------------
    var toList = getMailAddrByUsrIds(conn, [applicantId]);
    if (toList.length === 0) {
        log.writeInfo('[sendApplicantMail] 申請者のメールアドレスが取得できませんでした。送信スキップ。');
        return;
    }
    log.writeInfo('[sendApplicantMail] 送信先: ' + toList.join(', '));

    // -------------------------------------------------------
    // 3. ダイレクトリンクURL生成
    // -------------------------------------------------------
    var directLink = buildDirectLink(work_id, obj_id);
    if (directLink) {
        log.writeInfo('[sendApplicantMail] ダイレクトリンク: ' + directLink);
    }

    // -------------------------------------------------------
    // 4. 件名・本文（決裁／否認で分岐）
    // -------------------------------------------------------
    var isKessai = (syori_kbn === _WFS_SYORI_KBN_KESSAI);
    var subject = isKessai
        ? '【承認完了】ワークフロー ' + work_id + '（決裁）'
        : '【否認】ワークフロー ' + work_id + '（否認）';

    var headLine = isKessai
        ? 'あなたの申請が承認（決裁）されました。承認ルートは完了です。'
        : 'あなたの申請が否認されました。';

    var body =
        headLine + '\n' +
        '\n' +
        'ワークフローID : ' + work_id + '\n' +
        '申請ID         : ' + obj_id + '\n' +
        '処理区分       : ' + (isKessai ? '決裁（承認完了）' : '否認') + '\n' +
        (directLink
            ? '\n■ 申請内容の確認はこちら\n' + directLink + '\n'
            : ''
        ) +
        '\nシステムにログインして内容をご確認ください。';

    // -------------------------------------------------------
    // 5. メール送信
    // -------------------------------------------------------
    var err = TCP_MAIL.send(toList, null, null, subject, body, null);
    if (err) {
        log.writeInfo('[sendApplicantMail] 送信失敗: ' + err);
    } else {
        log.writeInfo('[sendApplicantMail] 送信完了。');
    }
}

// =================================================================
// 承認ルート完走確認（ログ出力）
// =================================================================
/**
 * WFS_T_WORKFLOW の全ステップ状態をログ出力し、ルートが完走したか確認する。
 * 未処理（ACTIVE_FLG=1 かつ CURENT_FLG=1）のステップが残っていれば警告を出す。
 *
 * @param {object} conn
 * @param {string} work_id
 * @param {string} obj_id
 */
function verifyRouteCompletion(conn, work_id, obj_id) {
    var log = TALON.getLogger();

    var stepList = TalonDbUtil.select(conn,
        'SELECT LVL, STATUS, ROUTE_ID, ACTIVE_FLG, CURENT_FLG ' +
        'FROM   WFS_T_WORKFLOW ' +
        'WHERE  WORK_ID   = ? ' +
        'AND    OBJECT_ID = ? ' +
        'ORDER BY LVL ASC',
        [work_id, obj_id]
    );

    var total = stepList ? stepList.length : 0;
    var pending = 0;

    log.writeInfo('[verifyRouteCompletion] ===== 承認ルート完走確認 work_id=' + work_id
        + ' obj_id=' + obj_id + ' 全' + total + 'ステップ =====');

    for (var i = 0; i < total; i++) {
        var s = stepList[i];
        var lvl = String(s['LVL']);
        var status = String(s['STATUS']);
        var activeFlg = String(s['ACTIVE_FLG']);
        var curentFlg = String(s['CURENT_FLG']);

        log.writeInfo('[verifyRouteCompletion]   LVL=' + lvl
            + ' STATUS=' + status
            + ' ACTIVE_FLG=' + activeFlg
            + ' CURENT_FLG=' + curentFlg);

        // 未処理（処理待ち）ステップの判定：有効かつ現在ステップ
        if (activeFlg === '1' && curentFlg === '1') {
            pending++;
        }
    }

    if (pending === 0) {
        log.writeInfo('[verifyRouteCompletion] ルート完走OK：未処理ステップなし。');
    } else {
        log.writeInfo('[verifyRouteCompletion] 注意：未処理ステップが ' + pending
            + ' 件残っています。ルート未完走の可能性あり。');
    }
}
