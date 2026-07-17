/**
 * TCP_MAIL : メール送信共通基盤
 *
 * SMTP接続情報は汎用マスタ（TLN_GENERAL）から自動取得する。
 * Jakarta Mail / javax.mail の両方に対応（ランタイム自動解決）。
 *
 * 使用例:
 *   var err = TCP_MAIL.send('to@example.com', null, null, '件名', '本文');
 *   if (err) { TALON.getLogger().writeError('送信失敗: ' + err); }
 *
 * @version 2026/04/29
 */

var TCP_MAIL = TCP_MAIL || {};

(function(NS) {

    // =================================================================
    // メール送信（公開関数）
    // =================================================================

    /**
     * メール送信
     *
     * SMTP接続情報は汎用マスタ TLN_GENERAL の以下のキーから取得する:
     *   - MAIL_FROM_ADDRESS : 送信元アドレス（DSP1）
     *   - MAIL_SMTP_SERVER  : SMTPサーバ（DSP1=ホスト, DSP2=ポート）
     *   - MAIL_SMTP_LOGIN   : SMTP認証（DSP1=ユーザ, DSP2=パスワード、任意）
     *
     * @param  {string|Array} to       宛先（単一or配列）
     * @param  {string|Array} cc       CC（任意）
     * @param  {string|Array} bcc      BCC（任意）
     * @param  {string}       subject  件名
     * @param  {string}       body     本文
     * @param  {string|Array} files    添付ファイルパス（任意）
     * @return {string|undefined}      エラー時はメッセージ、成功時は undefined
     */
    NS.send = function(to, cc, bcc, subject, body, files) {
        var log = TALON.getLogger();
        log.writeInfo('[MAIL_START] メール送信処理を開始します。');

        var getMst = function(key) { return TCP_UTIL.getHanyoMstMap('TLN_GENERAL', key); };

        var mAddr  = getMst('MAIL_FROM_ADDRESS');
        var mSmtp  = getMst('MAIL_SMTP_SERVER');
        var mLogin = getMst('MAIL_SMTP_LOGIN');

        var mailConfig = {
            host: (mSmtp  && String(mSmtp['DSP1']  || '').trim()),
            port: parseInt(mSmtp && mSmtp['DSP2'], 10) || 25,
            user: (mLogin && String(mLogin['DSP1'] || '').trim()) || null,
            pass: (mLogin && String(mLogin['DSP2'] || '').trim()) || null,
            from: (mAddr  && String(mAddr['DSP1']  || '').trim()),
            to:      to,
            cc:      cc,
            bcc:     bcc,
            subject: subject,
            body:    body,
            attachments: (function(f) {
                var fileList = Array.isArray(f) ? f : (f ? [f] : []);
                return fileList.map(function(path) {
                    return String(path).replace(/\\/g, '/').trim();
                });
            })(files)
        };

        log.writeInfo('[MAIL_CONFIG] Host: ' + mailConfig.host + ':' + mailConfig.port
                      + ' / From: ' + mailConfig.from);

        if (!mailConfig.host) {
            log.writeInfo('[MAIL_ERROR] SMTPサーバが未設定です。');
            return 'SMTPサーバが未設定です。';
        }
        if (!mailConfig.from) {
            log.writeInfo('[MAIL_ERROR] 送信元アドレスが未設定です。');
            return '送信元アドレスが未設定です。';
        }

        // 送信実行
        var error = NS._sendEngine(mailConfig);

        if (error) {
            log.writeInfo('[MAIL_FINISHED] 送信失敗: ' + error);
            return error;
        }

        log.writeInfo('[MAIL_FINISHED] 送信が正常に完了しました。');
        return undefined;
    };


    // =================================================================
    // 内部関数：低レベル送信処理
    // =================================================================

    /**
     * メール送信エンジン（内部関数）
     */
    NS._sendEngine = function(config) {
        var log  = TALON.getLogger();
        var Mail = NS._getMailClasses();
        if (!Mail) return 'メールライブラリ(Jakarta/javax)が見つかりません。';

        var props = new java.util.Properties();
        props.put("mail.smtp.host", config.host);
        props.put("mail.smtp.port", String(config.port));

        var isAuth = (config.user && config.pass);
        props.put("mail.smtp.auth", isAuth ? "true" : "false");
        log.writeInfo('[MAIL_ENGINE] SMTP認証: ' + (isAuth ? 'あり (User: ' + config.user + ')' : 'なし'));

        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.timeout",           "15000");
        props.put("mail.mime.encodefilename",    "true");
        props.put("mail.mime.decodefilename",    "true");
        props.put("mail.mime.charset",           "UTF-8");

        // ポート番号に応じたTLS/SSL設定
        if (config.port === 465) {
            props.put("mail.smtp.ssl.enable",      "true");
            props.put("mail.smtp.starttls.enable", "false");
        } else if (config.port === 587) {
            props.put("mail.smtp.ssl.enable",      "false");
            props.put("mail.smtp.starttls.enable", "true");
        } else {
            props.put("mail.smtp.ssl.enable",      "false");
            props.put("mail.smtp.starttls.enable", "false");
        }

        try {
            var authObj = null;
            if (isAuth) {
                var AuthClass = Java.extend(Mail.Authenticator, {
                    getPasswordAuthentication: function() {
                        return new Mail.PasswordAuthentication(config.user, config.pass);
                    }
                });
                authObj = new AuthClass();
            }

            var session = Mail.Session.getInstance(props, authObj);
            var message = new Mail.MimeMessage(session);

            message.setFrom(new Mail.InternetAddress(config.from));

            var addRecipients = function(type, list) {
                if (!list) return;
                var input    = Array.isArray(list) ? list : [list];
                var addrList = input.filter(function(s) { return !!s; }).map(function(s) {
                    return new Mail.InternetAddress(String(s).trim());
                });
                if (addrList.length > 0) {
                    message.setRecipients(type, Java.to(addrList, Mail.AddressArray));
                }
            };

            addRecipients(Mail.RecipientType.TO,  config.to);
            addRecipients(Mail.RecipientType.CC,  config.cc);
            addRecipients(Mail.RecipientType.BCC, config.bcc);

            message.setSubject(config.subject || "No Subject", "UTF-8");

            var multipart = new Mail.MimeMultipart();
            var bodyPart  = new Mail.MimeBodyPart();
            bodyPart.setText(String(config.body || ''), "UTF-8");
            multipart.addBodyPart(bodyPart);

            // 添付ファイル処理
            if (config.attachments && config.attachments.length > 0) {
                config.attachments.forEach(function(pathStr) {
                    try {
                        if (!pathStr) return;
                        var p = Paths.get(String(pathStr));
                        if (Files.exists(p)) {
                            var fileName = p.getFileName().toString();
                            log.writeInfo('[MAIL_ENGINE] 添付ファイルを処理中: ' + fileName);

                            var part  = new Mail.MimeBodyPart();
                            var bytes = Files.readAllBytes(p);
                            var mime  = Files.probeContentType(p) || 'application/octet-stream';

                            part.setDataHandler(new Mail.DataHandler(new Mail.ByteArrayDataSource(bytes, mime)));
                            part.setFileName(fileName);
                            multipart.addBodyPart(part);
                        } else {
                            log.writeInfo('[MAIL_WARN] ファイルが見つかりません: ' + pathStr);
                        }
                    } catch (ex) {
                        log.writeInfo('[MAIL_ERROR] 添付処理中に例外発生: ' + pathStr + " (" + ex + ")");
                    }
                });
            }

            message.setContent(multipart);
            message.setSentDate(new java.util.Date());

            log.writeInfo('[MAIL_ENGINE] SMTPサーバに接続を試みます...');

            var transport = session.getTransport("smtp");
            try {
                transport.connect(config.host, config.port, config.user, config.pass);
                transport.sendMessage(message, message.getAllRecipients());
                log.writeInfo('[MAIL_ENGINE] 送信完了。');
            } finally {
                if (transport) transport.close();
            }
            return null;

        } catch (e) {
            log.writeInfo('[MAIL_CRITICAL] 送信プロセスでエラー: ' + e.toString());
            return e.toString();
        }
    };


    // =================================================================
    // 内部関数：メールライブラリ動的解決
    // =================================================================

    /**
     * メールライブラリ(Jakarta/javax)の動的解決（内部関数）
     */
    NS._getMailClasses = function() {
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
                    MimeUtility:            Java.type(pre + '.internet.MimeUtility'),
                    RecipientType:          Java.type(pre + '.Message$RecipientType'),
                    AddressArray:           Java.type(pre + '.Address[]'),
                    Authenticator:          Java.type(pre + '.Authenticator'),
                    PasswordAuthentication: Java.type(pre + '.PasswordAuthentication'),
                    ByteArrayDataSource:    (pre === 'jakarta.mail')
                        ? Java.type('jakarta.mail.util.ByteArrayDataSource')
                        : Java.type('javax.mail.util.ByteArrayDataSource'),
                    DataHandler:            Java.type(act + '.DataHandler'),
                    Transport:              Java.type(pre + '.Transport')
                };
            } catch (e) { continue; }
        }
        return null;
    };

})(TCP_MAIL);