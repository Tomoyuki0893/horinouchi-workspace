/**
 * ============================================================
 *  共通CSJS : rest.js  TALON REST-API 呼び出しラッパー
 * ------------------------------------------------------------
 *  TALON クライアントサイドJavaScript 共通部品
 *  名前空間 : Common.Rest
 *
 *  TALON REST URL 形式:
 *    http(s)://host:port/Talon/rest/{機能ID}/{リソース名}
 *
 *  このラッパーは「機能ID」「リソース名」を渡すだけで
 *  コンテキストルート(/Talon/rest/)からのURLを自動生成し、
 *  JSON送受信・共通エラーハンドリングをまとめて行う。
 *
 *  使い方:
 *    // 初期設定（任意。トークン認証を使う場合など）
 *    Common.Rest.config({ basePath: "/Talon/rest", token: "xxxx" });
 *
 *    // GET
 *    Common.Rest.get("FNC0001", "users", { id: "001" },
 *      function (data) { ... },          // 成功
 *      function (err)  { alert(err.message); }); // 失敗
 *
 *    // POST（bodyはオブジェクト→自動でJSON化）
 *    Common.Rest.post("FNC0001", "users", { name: "山田" }, onOk, onErr);
 *
 *  ※ TALON環境を考慮し ES5 互換 + XMLHttpRequest で記述（fetch不使用）。
 * ============================================================
 */
var Common = Common || {};
Common.Rest = (function () {
  "use strict";

  // 既定設定
  var _cfg = {
    basePath: "/Talon/rest", // コンテキストルート配下のRESTパス
    token: null,             // トークン認証(Ver6.2.3~)を使う場合に設定
    timeout: 30000,          // ミリ秒
    async: true
  };

  // 設定上書き
  function config(opt) {
    if (!opt) { return _cfg; }
    for (var k in opt) {
      if (opt.hasOwnProperty(k)) { _cfg[k] = opt[k]; }
    }
    return _cfg;
  }

  // クエリ文字列生成
  function _toQuery(params) {
    if (!params) { return ""; }
    var arr = [];
    for (var k in params) {
      if (params.hasOwnProperty(k) && params[k] !== null && params[k] !== undefined) {
        arr.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
      }
    }
    return arr.length ? ("?" + arr.join("&")) : "";
  }

  // URL組み立て
  function _buildUrl(functionId, resource, query) {
    var url = _cfg.basePath.replace(/\/$/, "") + "/" + functionId;
    if (resource) { url += "/" + resource; }
    return url + (query || "");
  }

  /**
   * 共通の送信処理。
   * method   : "GET"/"POST"/"PUT"/"DELETE"
   * body     : オブジェクト or null（自動でJSON化）
   * onOk     : function(data, xhr)   data はJSONパース結果（不可なら生文字列）
   * onErr    : function({status, message, raw}, xhr)
   */
  function _send(method, url, body, onOk, onErr) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, _cfg.async);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.setRequestHeader("Accept", "application/json");
    // トークン認証ヘッダ（設定時のみ）
    if (_cfg.token) {
      xhr.setRequestHeader("Authorization", "Bearer " + _cfg.token);
    }
    if (_cfg.timeout) { xhr.timeout = _cfg.timeout; }

    function _fail(msg) {
      if (typeof onErr === "function") {
        onErr({ status: xhr.status, message: msg, raw: xhr.responseText }, xhr);
      }
    }

    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) { return; }
      var data = xhr.responseText;
      try { data = data ? JSON.parse(data) : null; } catch (e) { /* 生文字列のまま */ }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (typeof onOk === "function") { onOk(data, xhr); }
      } else if (xhr.status === 0) {
        _fail("通信に失敗しました（タイムアウトまたはネットワーク切断）");
      } else if (xhr.status === 401 || xhr.status === 403) {
        _fail("認証エラーです。再ログインしてください。(" + xhr.status + ")");
      } else {
        var m = (data && data.message) ? data.message : ("サーバエラーが発生しました。(" + xhr.status + ")");
        _fail(m);
      }
    };
    xhr.ontimeout = function () { _fail("タイムアウトしました。"); };

    xhr.send(body ? JSON.stringify(body) : null);
    return xhr;
  }

  return {
    config: config,

    /** GET。params はクエリ文字列に変換。 */
    get: function (functionId, resource, params, onOk, onErr) {
      return _send("GET", _buildUrl(functionId, resource, _toQuery(params)), null, onOk, onErr);
    },

    /** POST。body はオブジェクト（自動JSON化）。 */
    post: function (functionId, resource, body, onOk, onErr) {
      return _send("POST", _buildUrl(functionId, resource), body, onOk, onErr);
    },

    /** PUT。 */
    put: function (functionId, resource, body, onOk, onErr) {
      return _send("PUT", _buildUrl(functionId, resource), body, onOk, onErr);
    },

    /** DELETE。 */
    remove: function (functionId, resource, params, onOk, onErr) {
      return _send("DELETE", _buildUrl(functionId, resource, _toQuery(params)), null, onOk, onErr);
    }
  };
})();
