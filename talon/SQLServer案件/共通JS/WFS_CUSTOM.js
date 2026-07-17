/**
 * WFS_CUSTOM : [共通]ワークフローシステム（ユーザー処理用）ディスパッチャ
 *
 * @version 2026/06/21
 *
 * ワークフローエンジンが呼ぶ唯一の入口。本処理・絞り込み・通知を各モジュールへ委譲し、
 * 実装はここに置かない（薄いオーケストレーションのみ）。
 *
 *   本処理      → WFS_BIZ（取引先/稟議） / setClmShinseiStatus（CLM・外部）
 *   承認者絞込  → WFS_RESOLVE
 *   通知メール  → WFS_MAIL
 *
 * 依存：WFS_BIZ / WFS_RESOLVE / WFS_MAIL / setClmShinseiStatus(外部) / TALON
 * ※全モジュールが本モジュールより先（または同時）にロードされていること。
 *   呼び出しは全て関数内＝実行時参照のため、定義順は不問。
 */
//-------------------------------------------------------
// パラメータ
//     work_id    ワークフローID
//     obj_id     オブジェクトID
//     syori_kbn  処理区分（定義は WFS_CONST.SYORI 参照）
//       10 申請 / 20 承認(次あり) / 21 決裁 / 30 差戻 / 90 否認
//       50 取戻(申請者) / 60 取消 / 70 取戻(承認者) / 80 引上
//-------------------------------------------------------
function execWorkFlowCustom(work_id, obj_id, syori_kbn) {

    // --- 業務ロジック（本処理）---
    //     例外は本処理失敗として上位へ伝播させる（握り潰さない）。
    switch (work_id) {
        case 'TORIHIKI001':
        case 'TORIHIKI002':
            WFS_BIZ.setToriMst(obj_id, syori_kbn);
            break;
        case 'RINGI':
            WFS_BIZ.setRingNo(obj_id, syori_kbn);
            break;
        case 'CLM001':
        case 'CLM002':
            setClmShinseiStatus(obj_id, syori_kbn);   // CLM（外部モジュール）
            break;
        default:
            break;
    }

    var log = TALON.getLogger();

    // --- 承認者絞り込み（申請時・相対ロール）---
    //     WFS_MAIL.sendApproval が WFS_T_WORKAPPROVALRES を読むため、メールより前に実行。
    //     ★本処理扱い：絞り込みNG/失敗は例外を上位へ伝播させ申請を中止する。
    //       （握り潰すと相対レベルが全プール＝全課長等へ誤配信されるため）
    WFS_RESOLVE.resolve(work_id, obj_id, syori_kbn);

    // --- 通知メール（非致命）---
    //     通知失敗で本処理を巻き戻さないよう try/catch で隔離。
    try {
        WFS_MAIL.sendApproval(work_id, obj_id, syori_kbn);
    } catch (e) {
        log.writeError('[WFS_MAIL.sendApproval] 通知送信で例外（本処理は継続）: ' + e);
    }

    try {
        WFS_MAIL.sendApplicant(work_id, obj_id, syori_kbn);
    } catch (e) {
        log.writeError('[WFS_MAIL.sendApplicant] 通知送信で例外（本処理は継続）: ' + e);
    }
}
