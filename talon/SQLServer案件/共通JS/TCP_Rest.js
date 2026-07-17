/**
 * ============================================================================
 *  TCP.Rest : REST共通基盤（共通基盤 / BIZ-01）
 * ----------------------------------------------------------------------------
 *  java.net.HttpURLConnection ベースの汎用HTTPクライアント。
 *  外部API連携・TALON REST連携のいずれにも使える土台。
 *
 *  特長:
 *    - get / post / put / del のシンプルなAPI
 *    - 共通ヘッダ・タイムアウト・リトライを設定で一元管理
 *    - 認証は「プラグイン式」。Bearerトークン／カスタムヘッダ／
 *      トークン自動再取得(401時)に対応。方式が固まったら設定を埋めるだけ。
 *    - レスポンスは TCP.Json でパース、エラーは TCP.Error 形式へ整形
 *
 *  認証方式メモ（TALON）:
 *    - トークン認証(Ver6.2.3〜): 取得したトークンをヘッダ付与。
 *      ヘッダ名・取得エンドポイントは環境依存のため configure() で指定する。
 *    - FORM認証(j_security_check): セッションCookie方式。初期スコープ外
 *      （必要時 opts.headers に Cookie を渡せば送信は可能）。
 *
 *  利用例:
 *    TCP.Rest.configure({
 *      baseUrl: 'https://api.example.com',
 *      readTimeout: 20000,
 *      retry: 1,
 *      auth: { scheme: 'Bearer', token: 'xxxxx' }   // 静的トークン
 *    });
 *    var res = TCP.Rest.get('/v1/users', { query: { page: 1 } });
 *    if (res.success) { TCP.Log.info('件数=' + res.data.length); }
 *
 *    // トークン自動取得（401時に再取得して1回リトライ）
 *    TCP.Rest.configure({
 *      baseUrl: '...',
 *      auth: { scheme: 'Bearer', tokenProvider: function () { return myLogin(); } }
 *    });
 *
 *  依存: TCP.Json / TCP.Error / TCP.Log / java.*
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Rest = (function () {
    'use strict';

    // ------------------------------------------------------------------
    //  既定設定（configure で上書き）
    // ------------------------------------------------------------------
    var _cfg = {
        baseUrl:        '',
        connectTimeout: 15000,
        readTimeout:    30000,
        retry:          0,     // ネットワーク例外/5xx時の追加試行回数
        retryWaitMs:    500,
        defaultHeaders: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'application/json' },
        auth:           null   // { scheme:'Bearer', header:'Authorization', token:'..', tokenProvider:function(){} }
    };

    /**
     * 共通設定を上書きする（部分指定可）。
     * @param {Object} opts  上書きする設定
     */
    function configure(opts) {
        if (!opts) return;
        for (var k in opts) {
            if (opts.hasOwnProperty(k)) {
                if (k === 'defaultHeaders' && opts.defaultHeaders) {
                    for (var h in opts.defaultHeaders) {
                        if (opts.defaultHeaders.hasOwnProperty(h)) {
                            _cfg.defaultHeaders[h] = opts.defaultHeaders[h];
                        }
                    }
                } else {
                    _cfg[k] = opts[k];
                }
            }
        }
    }

    /** 現在の設定（参照ではなく浅いコピー） */
    function getConfig() {
        var c = {};
        for (var k in _cfg) { if (_cfg.hasOwnProperty(k)) c[k] = _cfg[k]; }
        return c;
    }


    // ------------------------------------------------------------------
    //  内部ヘルパー
    // ------------------------------------------------------------------

    function _isAbsolute(path) {
        return /^https?:\/\//i.test(String(path));
    }

    function _buildUrl(path, query) {
        var url = _isAbsolute(path) ? String(path) : (_cfg.baseUrl + String(path));
        var qs = _buildQuery(query);
        if (qs) { url += (url.indexOf('?') === -1 ? '?' : '&') + qs; }
        return url;
    }

    function _buildQuery(query) {
        if (!query) return '';
        var parts = [];
        for (var k in query) {
            if (query.hasOwnProperty(k) && query[k] !== null && query[k] !== undefined) {
                parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(query[k])));
            }
        }
        return parts.join('&');
    }

    /** 認証ヘッダを headers へ適用 */
    function _applyAuth(headers) {
        var auth = _cfg.auth;
        if (!auth) return;
        var token = auth.token;
        if (!token && typeof auth.tokenProvider === 'function') {
            token = auth.tokenProvider();
            auth.token = token; // キャッシュ
        }
        if (token) {
            var name = auth.header || 'Authorization';
            var scheme = (auth.scheme === undefined) ? 'Bearer' : auth.scheme;
            headers[name] = scheme ? (scheme + ' ' + token) : String(token);
        }
    }

    /** トークン強制再取得（401時） */
    function _refreshToken() {
        var auth = _cfg.auth;
        if (auth && typeof auth.tokenProvider === 'function') {
            auth.token = auth.tokenProvider();
            return !!auth.token;
        }
        return false;
    }

    function _readStream(is) {
        if (!is) return '';
        var br = new java.io.BufferedReader(new java.io.InputStreamReader(is, 'UTF-8'));
        var sb = new java.lang.StringBuilder();
        var first = true;
        var line;
        while ((line = br.readLine()) !== null) {
            if (!first) sb.append('\n');
            sb.append(line);
            first = false;
        }
        br.close();
        return String(sb.toString());
    }

    /**
     * 1回のHTTP通信を実行（低レベル）。例外は呼び出し側で捕捉。
     * @returns {Object} { status, body }
     */
    function _exec(method, urlStr, headers, bodyStr) {
        var conn = null;
        try {
            var url = new java.net.URL(urlStr);
            conn = url.openConnection();
            conn.setRequestMethod(method);
            conn.setConnectTimeout(_cfg.connectTimeout);
            conn.setReadTimeout(_cfg.readTimeout);
            conn.setInstanceFollowRedirects(true);

            for (var h in headers) {
                if (headers.hasOwnProperty(h) && headers[h] !== null && headers[h] !== undefined) {
                    conn.setRequestProperty(h, String(headers[h]));
                }
            }

            if (bodyStr !== null && bodyStr !== undefined && bodyStr !== '') {
                conn.setDoOutput(true);
                var os = conn.getOutputStream();
                try {
                    os.write(new java.lang.String(bodyStr).getBytes('UTF-8'));
                    os.flush();
                } finally {
                    os.close();
                }
            }

            var status = conn.getResponseCode();
            var is = (status >= 400) ? conn.getErrorStream() : conn.getInputStream();
            var body = _readStream(is);
            return { status: status, body: body };

        } finally {
            if (conn) { try { conn.disconnect(); } catch (e) {} }
        }
    }

    function _sleep(ms) {
        try { java.lang.Thread.sleep(ms); } catch (e) {}
    }


    // ------------------------------------------------------------------
    //  公開：汎用リクエスト
    // ------------------------------------------------------------------

    /**
     * HTTPリクエストを実行する。
     * @param {String} method  'GET' | 'POST' | 'PUT' | 'DELETE'
     * @param {String} path    パス（baseUrl相対）または絶対URL
     * @param {Object} body    リクエストボディ（オブジェクトはJSON化／文字列はそのまま）
     * @param {Object} opts    { query, headers, raw }
     * @returns {Object}       { success, status, data, raw } または TCP.Error 形式
     */
    function request(method, path, body, opts) {
        opts = opts || {};
        var urlStr = _buildUrl(path, opts.query);

        // ヘッダ構築（既定 → 認証 → 個別）
        var headers = {};
        var dh = _cfg.defaultHeaders;
        for (var d in dh) { if (dh.hasOwnProperty(d)) headers[d] = dh[d]; }
        _applyAuth(headers);
        if (opts.headers) {
            for (var o in opts.headers) { if (opts.headers.hasOwnProperty(o)) headers[o] = opts.headers[o]; }
        }

        // ボディ整形
        var bodyStr = null;
        if (body !== null && body !== undefined) {
            bodyStr = (typeof body === 'string') ? body : TCP.Json.stringify(body);
        }

        var attempts = (_cfg.retry || 0) + 1;
        var authRetried = false;
        var lastErr = null;

        for (var i = 0; i < attempts; i++) {
            try {
                var res = _exec(method, urlStr, headers, bodyStr);

                // 401 → トークン再取得して1回だけ即リトライ（attempts消費せず）
                if (res.status === 401 && !authRetried && _refreshToken()) {
                    authRetried = true;
                    _applyAuth(headers);
                    i--; // この試行はカウントしない
                    continue;
                }

                // 5xx はリトライ対象
                if (res.status >= 500 && i < attempts - 1) {
                    TCP.Log.warn('[TCP.Rest] ' + method + ' ' + urlStr + ' → ' + res.status + ' リトライ(' + (i + 1) + ')');
                    _sleep(_cfg.retryWaitMs);
                    continue;
                }

                return _toResult(res, opts.raw);

            } catch (e) {
                lastErr = e;
                TCP.Log.warn('[TCP.Rest] 通信例外 ' + method + ' ' + urlStr + ' : ' + (e.message || e));
                if (i < attempts - 1) { _sleep(_cfg.retryWaitMs); continue; }
            }
        }

        // 全試行失敗
        TCP.Log.error('[TCP.Rest] 通信失敗 ' + method + ' ' + urlStr, lastErr);
        return TCP.Error.toResponse(TCP.Error.create('E40001', '外部システムとの通信に失敗しました。'));
    }

    /** レスポンスを結果オブジェクトへ整形 */
    function _toResult(res, raw) {
        var ok = (res.status >= 200 && res.status < 300);
        var data = raw ? res.body : TCP.Json.parse(res.body, res.body);
        if (ok) {
            return { success: true, status: res.status, data: data, raw: res.body };
        }
        return {
            success: false,
            status:  res.status,
            code:    'E40' + (res.status >= 400 && res.status < 500 ? '002' : '003'),
            message: '外部システムがエラーを返しました(HTTP ' + res.status + ')。',
            data:    data,
            raw:     res.body
        };
    }


    // ------------------------------------------------------------------
    //  公開：ショートカット
    // ------------------------------------------------------------------
    function get(path, opts)        { return request('GET',    path, null, opts); }
    function post(path, body, opts) { return request('POST',   path, body, opts); }
    function put(path, body, opts)  { return request('PUT',    path, body, opts); }
    function del(path, opts)        { return request('DELETE', path, null, opts); }

    /** 認証トークンを直接セット／クリア */
    function setToken(token) {
        if (!_cfg.auth) _cfg.auth = { scheme: 'Bearer' };
        _cfg.auth.token = token;
    }


    return {
        configure: configure,
        getConfig: getConfig,
        request:   request,
        get:       get,
        post:      post,
        put:       put,
        del:       del,
        setToken:  setToken
    };
})();
