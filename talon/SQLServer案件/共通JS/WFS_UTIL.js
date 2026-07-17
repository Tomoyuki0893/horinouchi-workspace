/**
 * WFS_UTIL : [共通]ワークフロー ユーティリティ
 *
 * @version 2026/06/21
 *
 * ダイレクトリンク生成・メールアドレス取得・メール送信ゲートウェイなど、
 * 複数モジュールで共用する補助関数。
 *
 * 依存：WFS_CONST / TALON / TCP_UTIL / TCP_MAIL / TalonDbUtil
 */
var WFS_UTIL = {

    /**
     * ダイレクトリンクURLを生成する（work_id未対応／baseUrl未設定時は空文字）
     * @param {string} work_id
     * @param {string} obj_id
     * @return {string}
     */
    buildDirectLink: function (work_id, obj_id) {
        var mBaseUrl = TCP_UTIL.getHanyoMstMap('TLN_GENERAL', 'MAIL_BASE_URL');
        var baseUrl = mBaseUrl ? String(mBaseUrl['DSP1'] || '').trim() : '';
        if (!baseUrl || !WFS_CONST.FUNC_MAP[work_id]) return '';

        var funcDef = WFS_CONST.FUNC_MAP[work_id];
        return baseUrl +
            '/Talon/faces/TALON/APPLICATION/GENERALFREE/GENERALFREE.xhtml' +
            '?PARAM_FUNC_ID=' + funcDef.funcId +
            '&COLUMN_0=' + funcDef.col +
            '&FORMULA_0==' +
            '&VALUE_0=' + encodeURIComponent(String(obj_id)) +
            '&FLAT_VALUE_0=1' +
            '&INIT_SEARCH=true';
    },

    /**
     * USR_IDの配列からメールアドレスの配列を取得する
     *   IN句はプレースホルダ不可のため文字列連結で組み立て
     *   （USR_IDはDB由来かつ '' エスケープ済みのため実害は低い）
     * @param {object} conn
     * @param {Array} usrIds
     * @return {Array} メールアドレスの配列
     */
    getMailAddrByUsrIds: function (conn, usrIds) {
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
    },

    /**
     * メール送信ゲートウェイ（WFS通知の唯一の送信口）
     *
     * TCP_MAIL.send を呼ぶ前に、汎用マスタ TLN_GENERAL による送信制御を適用する：
     *   - MAIL_SEND_FLG（DSP1）: 表示値 '0' のときだけ送信抑止。
     *       それ以外（未設定含む）は送信＝「'0'のときだけ止める」（本番不達の逆事故を避ける）。
     *   - MAIL_TEST_TO（DSP1）: アドレスが設定されていれば、本来の宛先を本文末尾へ退避し、
     *       全メールをこの宛先へ振替（dev誤送信防止）。
     *
     * @param {Array}  toList   宛先メールアドレス配列
     * @param {string} subject  件名
     * @param {string} body     本文
     * @return {string|undefined} エラー時はメッセージ、成功・抑止時は undefined
     */
    sendMail: function (toList, subject, body) {
        var log = TALON.getLogger();
        if (!toList || toList.length === 0) {
            log.writeInfo('[WFS_UTIL.sendMail] 宛先が空のため送信しません。');
            return;
        }

        // --- 送信抑止フラグ（'0' のときだけ止める） ---
        var flgMap  = TCP_UTIL.getHanyoMstMap('TLN_GENERAL', 'MAIL_SEND_FLG');
        var sendFlg = flgMap ? String(flgMap['DSP1'] || '').trim() : '';
        if (sendFlg === '0') {
            log.writeInfo('[WFS_UTIL.sendMail] MAIL_SEND_FLG=0 のため送信抑止。宛先=' + toList.join(','));
            return;
        }

        // --- テスト中継先（設定時は全メールをそこへ振替） ---
        var testMap = TCP_UTIL.getHanyoMstMap('TLN_GENERAL', 'MAIL_TEST_TO');
        var testTo  = testMap ? String(testMap['DSP1'] || '').trim() : '';

        var actualTo   = toList;
        var actualBody = String(body == null ? '' : body);
        if (testTo) {
            actualBody = actualBody +
                '\n\n----- [TEST REDIRECT] 本来の宛先 -----\n' + toList.join('\n');
            actualTo = [testTo];
            log.writeInfo('[WFS_UTIL.sendMail] MAIL_TEST_TO=' + testTo + ' へ振替（本来宛先=' + toList.join(',') + '）');
        }

        // --- 送信（TCP_MAIL.send: cc/bcc/添付なし） ---
        var err = TCP_MAIL.send(actualTo, null, null, subject, actualBody);
        if (err) {
            log.writeError('[WFS_UTIL.sendMail] 送信失敗: ' + err +
                ' / 宛先=' + (testTo ? testTo : toList.join(',')));
            return err;
        }
        return;
    }
};
