/**
 * WFS_CONST : [共通]ワークフロー 定数
 *
 * @version 2026/06/21
 *
 * ワークフロー各モジュール（WFS_CUSTOM / WFS_MAIL / WFS_RESOLVE / WFS_BIZ / WFS_UTIL）
 * が参照する定数を一元管理する。値の変更はここ1か所で完結させること。
 *
 * 依存：なし（末端モジュール）
 *
 * 2026/06/21 追加：MAIL_EVENT（メールテンプレEVENT_KBN）/ SYORI_TO_MAIL_EVENT
 *                （処理区分→EVENT_KBN 変換表）。APP_M_MAIL_TEMPLATE と対。
 */
var WFS_CONST = {
    // 処理区分（syori_kbn）
    //   10 申請 / 20 承認(次あり) / 21 承認(次なし=決裁) / 30 差戻 / 90 否認
    //   50 取戻(申請者) / 60 取消 / 70 取戻(承認者) / 80 引上
    SYORI: {
        SHINSEI:      '10', // 申請
        SHONIN:       '20', // 承認（次階層あり）
        KESSAI:       '21', // 承認（次階層なし＝決裁）
        SASHIMODOSHI: '30', // 差戻
        HININ:        '90', // 否認
        TORIMODOSHIS: '50', // 取戻（申請者取戻）
        TORIKESHI:    '60', // 取消
        TORIMODOSHIA: '70', // 取戻（承認者取戻）
        HIKIAGE:      '80'  // 引上
    },
    // work_idごとの「ダイレクトリンク機能ID」「申請番号カラム名」
    //   RINGI       : BUNSHO_NO
    //   TORIHIKI001 : SHINSEI_ID  （取引先 申請）
    //   TORIHIKI002 : SHINSEI_ID  （取引先 変更）
    //
    // 注: work_id は WFS_M_AUTH 実データに一致（TORIHIKI001/002）。旧 M_TORIHIKISAKI は廃止。
    //     funcId は直リンクで開く画面機能ID（work_idとは別物）。
    FUNC_MAP: {
        'RINGI':       { funcId: 'RIN0001', col: 'BUNSHO_NO' },
        'TORIHIKI001': { funcId: 'MST0004', col: 'SHINSEI_ID' },
        'TORIHIKI002': { funcId: 'MST0005', col: 'SHINSEI_ID' },
        'CLM001':      { funcId: 'CLM0002', col: 'SHINSEI_NO' },
        'CLM002':      { funcId: 'CLM0004', col: 'SHINSEI_NO' }
    },
    // 相対ロール絞り込み（WFS_RESOLVE.resolve）の対象ワークフロー。
    // CLMは clmExec で別途解決済のため対象外。
    // 注: TORIHIKI001/002 は GRP_ALL→ROLE_KACHO→ROLE_BUCHO の相対ロールルート。
    RESOLVE_WORK: {
        'RINGI':       true,
        'TORIHIKI001': true,
        'TORIHIKI002': true
    },
    // メールテンプレートのEVENT_KBN（APP_M_MAIL_TEMPLATE.EVENT_KBN と一致させること）。
    //   APV_REQ      申請/中間承認 → 承認者宛（承認依頼）
    //   KESSAI       決裁          → 申請者宛
    //   HIKETSU      否認          → 申請者宛
    //   SASHIMODOSHI 差戻          → 申請者宛（CLMはout of scope）
    //   TORISAGE     申請者取戻    → 承認待ち者宛（宛先要確認）
    //   APP_RECEIPT  申請          → 申請者宛（★設定不要＝送信しない印。マスタにseedしない）
    MAIL_EVENT: {
        APV_REQ:      'APV_REQ',
        KESSAI:       'KESSAI',
        HIKETSU:      'HIKETSU',
        SASHIMODOSHI: 'SASHIMODOSHI',
        TORISAGE:     'TORISAGE',
        APP_RECEIPT:  'APP_RECEIPT'
    },
    // 処理区分（SYORI）→ メールEVENT_KBN 変換表。
    // 値は MAIL_EVENT の文字列と一致させること（自己参照不可のため文字列直書き）。
    // null = メール送出対象外（必要になれば値を入れる）。
    //   '10' 申請        → APV_REQ（次承認者へ承認依頼。申請者宛受付は設定不要）
    //   '20' 承認(次あり)→ APV_REQ（次承認者へ）
    //   '21' 決裁        → KESSAI（申請者へ）
    //   '30' 差戻        → SASHIMODOSHI（申請者へ）
    //   '90' 否認        → HIKETSU（申請者へ）
    //   '50' 申請者取戻  → TORISAGE（承認待ち者へ。★宛先・発火要確認）
    //   '60' 取消        → null（要確認）
    //   '70' 承認者取戻  → null（要確認）
    //   '80' 引上        → null（要確認）
    SYORI_TO_MAIL_EVENT: {
        '10': 'APV_REQ',
        '20': 'APV_REQ',
        '21': 'KESSAI',
        '30': 'SASHIMODOSHI',
        '90': 'HIKETSU',
        '50': 'TORISAGE',
        '60': null,
        '70': null,
        '80': null
    }
};
