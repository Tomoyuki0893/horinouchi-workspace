/**
 * ============================================================================
 *  TCP.Mail : メール送信（共通基盤 / BIZ-04）
 * ----------------------------------------------------------------------------
 *  ※ ファイル名は TCP_Mailer.js（既存 TCP_MAIL.js とのWindowsでのファイル名
 *    衝突を避けるため）。クラス名は TCP.Mail。
 *
 *  SMTP設定を汎用マスタ（TCP.Config経由）から取得して送信する共通基盤。
 *  Jakarta Mail / javax.mail の両方にランタイム自動対応。
 *  既存 TCP_MAIL.js（送信エンジン）と WFS_UTIL.sendMail（送信制御）を
 *  参考に、TCP名前空間へ統合・新規構築。
 *
 *  送信制御（汎用マスタ SIKIBETU_CODE='TLN_GENERAL'）:
 *    MAIL_FROM_ADDRESS : 送信元（DSP1）
 *    MAIL_SMTP_SERVER  : ホスト(DSP1) / ポート(DSP2)
 *    MAIL_SMTP_LOGIN   : ユーザ(DSP1) / パスワード(DSP2)（任意）
 *    MAIL_SEND_FLG     : DSP1='0' のとき送信抑止（それ以外は送信）
 *    MAIL_TEST_TO      : DSP1にアドレスがあれば全送信をそこへ振替（誤送信防止）
 *
 *  利用例:
 *    var err = TCP.Mail.send('to@example.com', null, null, '件名', '本文');
 *    if (err) { TCP.Log.error('送信失敗', err); }
 *
 *  依存: TALON / TCP.Config / TCP.Log / TCP.Conv / java.* / jakarta|javax.mail
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Mail = (function () {
    'use strict';

    var KBN = 'TLN_GENERAL';

    function _mst(key, col) {
        return TCP.Config.getMasterVal(KBN, key, col || 'DSP1', '');
    }


    // ========================================================================
    //  送信（公開）— 送信制御つきゲートウェイ
    // ========================================================================

    /**
     * メール送信（送信抑止・テスト中継を内蔵）。
     * @param {String|Array} to       宛先（単一or配列）
     * @param {String|Array} cc       CC（任意）
     * @param {String|Array} bcc      BCC（任意）
     * @param {String}       subject  件名
     * @param {String}       body     本文
     * @param {String|Array} files    添付パス（任意）
     * @returns {String|undefined}    エラー時メッセージ、成功・抑止時 undefined
     */
    function send(to, cc, bcc, subject, body, files) {
        TCP.Log.info('[TCP.Mail] 送信処理開始');

        // --- 送信抑止フラグ（'0'のときだけ止める） ---
        if (_mst('MAIL_SEND_FLG') === '0') {
            TCP.Log.info('[TCP.Mail] MAIL_SEND_FLG=0 のため送信抑止');
            return undefined;
        }

        // --- テスト中継（設定時は全送信を振替） ---
        var testTo = _mst('MAIL_TEST_TO');
        var actualTo = to;
        var actualBody = String(body == null ? '' : body);
        if (testTo) {
            actualBody += '\n\n----- [TEST REDIRECT] 本来の宛先 -----\n' + _join(to);
            actualTo = [testTo];
            cc = null; bcc = null;
            TCP.Log.info('[TCP.Mail] MAIL_TEST_TO=' + testTo + ' へ振替');
        }

        var config = {
            host: _mst('MAIL_SMTP_SERVER', 'DSP1'),
            port: parseInt(_mst('MAIL_SMTP_SERVER', 'DSP2'), 10) || 25,
            user: _mst('MAIL_SMTP_LOGIN', 'DSP1') || null,
            pass: _mst('MAIL_SMTP_LOGIN', 'DSP2') || null,
            from: _mst('MAIL_FROM_ADDRESS', 'DSP1'),
            to: actualTo, cc: cc, bcc: bcc,
            subject: subject, body: actualBody,
            attachments: _toPaths(files)
        };

        if (!config.host) { TCP.Log.error('[TCP.Mail] SMTPサーバ未設定'); return 'SMTPサーバが未設定です。'; }
        if (!config.from) { TCP.Log.error('[TCP.Mail] 送信元未設定'); return '送信元アドレスが未設定です。'; }

        var err = _sendEngine(config);
        if (err) { TCP.Log.error('[TCP.Mail] 送信失敗: ' + err); return err; }
        TCP.Log.info('[TCP.Mail] 送信完了');
        return undefined;
    }


    // ========================================================================
    //  低レベル送信エンジン
    // ========================================================================

    function _sendEngine(config) {
        var Mail = _getMailClasses();
        if (!Mail) return 'メールライブラリ(Jakarta/javax)が見つかりません。';

        var props = new java.util.Properties();
        props.put('mail.smtp.host', config.host);
        props.put('mail.smtp.port', String(config.port));
        var isAuth = !!(config.user && config.pass);
        props.put('mail.smtp.auth', isAuth ? 'true' : 'false');
        props.put('mail.smtp.connectiontimeout', '15000');
        props.put('mail.smtp.timeout', '15000');
        props.put('mail.mime.charset', 'UTF-8');

        if (config.port === 465) {
            props.put('mail.smtp.ssl.enable', 'true');
            props.put('mail.smtp.starttls.enable', 'false');
        } else if (config.port === 587) {
            props.put('mail.smtp.ssl.enable', 'false');
            props.put('mail.smtp.starttls.enable', 'true');
        } else {
            props.put('mail.smtp.ssl.enable', 'false');
            props.put('mail.smtp.starttls.enable', 'false');
        }

        try {
            var authObj = null;
            if (isAuth) {
                var AuthClass = Java.extend(Mail.Authenticator, {
                    getPasswordAuthentication: function () {
                        return new Mail.PasswordAuthentication(config.user, config.pass);
                    }
                });
                authObj = new AuthClass();
            }

            var session = Mail.Session.getInstance(props, authObj);
            var message = new Mail.MimeMessage(session);
            message.setFrom(new Mail.InternetAddress(config.from));

            _addRecipients(Mail, message, Mail.RecipientType.TO, config.to);
            _addRecipients(Mail, message, Mail.RecipientType.CC, config.cc);
            _addRecipients(Mail, message, Mail.RecipientType.BCC, config.bcc);

            message.setSubject(config.subject || 'No Subject', 'UTF-8');

            var multipart = new Mail.MimeMultipart();
            var bodyPart = new Mail.MimeBodyPart();
            bodyPart.setText(String(config.body || ''), 'UTF-8');
            multipart.addBodyPart(bodyPart);

            _addAttachments(Mail, multipart, config.attachments);

            message.setContent(multipart);
            message.setSentDate(new java.util.Date());

            var transport = session.getTransport('smtp');
            try {
                transport.connect(config.host, config.port, config.user, config.pass);
                transport.sendMessage(message, message.getAllRecipients());
            } finally {
                if (transport) transport.close();
            }
            return null;

        } catch (e) {
            return e.toString();
        }
    }

    function _addRecipients(Mail, message, type, list) {
        if (!list) return;
        var input = _toArray(list);
        var addrs = [];
        TCP.Conv.each(input, function (s) {
            if (s) addrs.push(new Mail.InternetAddress(String(s).replace(/^\s+|\s+$/g, '')));
        });
        if (addrs.length > 0) {
            message.setRecipients(type, Java.to(addrs, Mail.AddressArray));
        }
    }

    function _addAttachments(Mail, multipart, paths) {
        if (!paths || paths.length === 0) return;
        var Files = java.nio.file.Files;
        var Paths = java.nio.file.Paths;
        TCP.Conv.each(paths, function (pathStr) {
            try {
                if (!pathStr) return;
                var p = Paths.get(String(pathStr));
                if (Files.exists(p)) {
                    var part = new Mail.MimeBodyPart();
                    var bytes = Files.readAllBytes(p);
                    var mime = Files.probeContentType(p) || 'application/octet-stream';
                    part.setDataHandler(new Mail.DataHandler(new Mail.ByteArrayDataSource(bytes, mime)));
                    part.setFileName(p.getFileName().toString());
                    multipart.addBodyPart(part);
                } else {
                    TCP.Log.warn('[TCP.Mail] 添付が見つかりません: ' + pathStr);
                }
            } catch (ex) {
                TCP.Log.warn('[TCP.Mail] 添付処理で例外: ' + pathStr + ' (' + ex + ')');
            }
        });
    }

    /** メールライブラリ(Jakarta/javax)の動的解決 */
    function _getMailClasses() {
        var prefixes = ['jakarta.mail', 'javax.mail'];
        for (var i = 0; i < prefixes.length; i++) {
            try {
                var pre = prefixes[i];
                var act = (pre === 'jakarta.mail') ? 'jakarta.activation' : 'javax.activation';
                return {
                    Session:                Java.type(pre + '.Session'),
                    MimeMessage:            Java.type(pre + '.internet.MimeMessage'),
                    MimeMultipart:          Java.type(pre + '.internet.MimeMultipart'),
                    MimeBodyPart:           Java.type(pre + '.internet.MimeBodyPart'),
                    InternetAddress:        Java.type(pre + '.internet.InternetAddress'),
                    RecipientType:          Java.type(pre + '.Message$RecipientType'),
                    AddressArray:           Java.type(pre + '.Address[]'),
                    Authenticator:          Java.type(pre + '.Authenticator'),
                    PasswordAuthentication: Java.type(pre + '.PasswordAuthentication'),
                    ByteArrayDataSource:    Java.type(pre + '.util.ByteArrayDataSource'),
                    DataHandler:            Java.type(act + '.DataHandler')
                };
            } catch (e) { continue; }
        }
        return null;
    }


    // ========================================================================
    //  小物
    // ========================================================================

    function _toArray(v) {
        if (v === null || v === undefined) return [];
        return (Object.prototype.toString.call(v) === '[object Array]') ? v : [v];
    }

    function _join(v) {
        return _toArray(v).join('\n');
    }

    function _toPaths(files) {
        var out = [];
        TCP.Conv.each(_toArray(files), function (path) {
            if (path) out.push(String(path).replace(/\\/g, '/').replace(/^\s+|\s+$/g, ''));
        });
        return out;
    }


    return {
        send: send
    };
})();
