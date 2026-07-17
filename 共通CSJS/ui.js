/**
 * ============================================================
 *  共通CSJS : ui.js  画面制御 / 共通UI
 * ------------------------------------------------------------
 *  TALON クライアントサイドJavaScript 共通部品
 *  名前空間 : Common.UI
 *
 *  全画面で揃えたい挙動をまとめたもの:
 *    - 二重送信防止           Common.UI.lockSubmit / unlockSubmit / guardSubmit
 *    - ローディング表示       Common.UI.showLoading / hideLoading
 *    - 確認ダイアログ         Common.UI.confirm
 *    - 必須項目ハイライト     Common.UI.highlight / clearHighlight / markErrors
 *    - メッセージ表示         Common.UI.toast
 *
 *  DOM操作は素のJavaScript（document）で行うため、jQuery等は不要。
 *  ※ TALON環境を考慮し ES5 互換（var / function）で記述。
 *  ※ 必要なスタイルは init() 実行時に <style> を自動注入する。
 * ============================================================
 */
var Common = Common || {};
Common.UI = (function () {
  "use strict";

  var STYLE_ID = "common-ui-style";
  var LOADING_ID = "common-ui-loading";
  var TOAST_ID = "common-ui-toast";
  var _inited = false;

  // 要素を id で取得（id文字列 or 要素そのものを許容）
  function _el(target) {
    if (!target) { return null; }
    return (typeof target === "string") ? document.getElementById(target) : target;
  }

  // スタイルを一度だけ注入
  function _init() {
    if (_inited) { return; }
    _inited = true;
    if (document.getElementById(STYLE_ID)) { return; }
    var css =
      "#" + LOADING_ID + "{position:fixed;top:0;left:0;width:100%;height:100%;" +
      "background:rgba(0,0,0,0.35);z-index:99999;display:none;" +
      "text-align:center;}" +
      "#" + LOADING_ID + " .cui-spin{position:absolute;top:50%;left:50%;" +
      "width:48px;height:48px;margin:-24px 0 0 -24px;border:5px solid #fff;" +
      "border-top-color:#3a8dde;border-radius:50%;animation:cui-rot 0.8s linear infinite;}" +
      "@keyframes cui-rot{to{transform:rotate(360deg);}}" +
      ".cui-error{background-color:#fff3f3 !important;border:1px solid #e25b5b !important;}" +
      "#" + TOAST_ID + "{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);" +
      "background:rgba(40,40,40,0.92);color:#fff;padding:10px 20px;border-radius:6px;" +
      "font-size:14px;z-index:100000;opacity:0;transition:opacity 0.25s;pointer-events:none;}" +
      "#" + TOAST_ID + ".cui-show{opacity:1;}";
    var st = document.createElement("style");
    st.id = STYLE_ID;
    st.type = "text/css";
    st.appendChild(document.createTextNode(css));
    (document.head || document.getElementsByTagName("head")[0]).appendChild(st);
  }

  return {
    /** 任意。明示的にスタイルを初期化したい場合に呼ぶ（通常は自動）。 */
    init: _init,

    /* ---------- 二重送信防止 ---------- */

    /**
     * ボタンを無効化して二重押下を防ぐ。
     * lockSubmit("btnRegister") もしくは要素を渡す。
     */
    lockSubmit: function (target) {
      var b = _el(target);
      if (b) { b.disabled = true; }
    },

    /** 無効化の解除。 */
    unlockSubmit: function (target) {
      var b = _el(target);
      if (b) { b.disabled = false; }
    },

    /**
     * 処理をラップして二重送信を防ぐ。
     * ボタン押下時:
     *   Common.UI.guardSubmit("btnRegister", function () {
     *     // ...登録処理（同期 or コールバック内でdoneを呼ぶ）
     *   });
     * fn には done 関数が渡される。非同期処理の完了後に done() を呼ぶと
     * ボタンが再び有効化される。fn 内で false を返すと即時解除。
     */
    guardSubmit: function (target, fn) {
      var b = _el(target);
      if (b && b.disabled) { return; } // すでに処理中
      Common.UI.lockSubmit(b);
      var done = function () { Common.UI.unlockSubmit(b); };
      var ret;
      try {
        ret = fn(done);
      } catch (e) {
        done();
        throw e;
      }
      // fn が同期で false を返したら即解除（バリデーションNG等）
      if (ret === false) { done(); }
    },

    /* ---------- ローディング表示 ---------- */

    /** 画面全体にローディングオーバーレイを表示。 */
    showLoading: function () {
      _init();
      var ov = document.getElementById(LOADING_ID);
      if (!ov) {
        ov = document.createElement("div");
        ov.id = LOADING_ID;
        ov.innerHTML = '<div class="cui-spin"></div>';
        document.body.appendChild(ov);
      }
      ov.style.display = "block";
    },

    /** ローディングを隠す。 */
    hideLoading: function () {
      var ov = document.getElementById(LOADING_ID);
      if (ov) { ov.style.display = "none"; }
    },

    /* ---------- 確認ダイアログ ---------- */

    /**
     * 確認ダイアログ。OKでtrue。
     * コールバック版とブール返却版の両対応:
     *   if (Common.UI.confirm("登録しますか？")) { ... }
     *   Common.UI.confirm("登録しますか？", function (ok) { if (ok) {...} });
     */
    confirm: function (message, callback) {
      var ok = window.confirm(message);
      if (typeof callback === "function") { callback(ok); }
      return ok;
    },

    /* ---------- 必須項目ハイライト ---------- */

    /** 入力欄にエラー色を付ける。 */
    highlight: function (target) {
      _init();
      var e = _el(target);
      if (e && e.className.indexOf("cui-error") < 0) {
        e.className = (e.className ? e.className + " " : "") + "cui-error";
      }
    },

    /** エラー色を外す。 */
    clearHighlight: function (target) {
      var e = _el(target);
      if (e) {
        e.className = e.className.replace(/\s*cui-error\b/g, "");
      }
    },

    /**
     * 複数項目をまとめてエラー表示し、最初の項目にフォーカス。
     * markErrors(["USER_NM","MAIL"]) のように id配列を渡す。
     * 返り値: エラー件数。
     */
    markErrors: function (ids) {
      _init();
      var first = null, i, e;
      for (i = 0; i < ids.length; i++) {
        e = _el(ids[i]);
        if (e) {
          Common.UI.highlight(e);
          if (!first) { first = e; }
        }
      }
      if (first && first.focus) { first.focus(); }
      return ids.length;
    },

    /** 指定id配列のエラー色を一括解除。 */
    clearErrors: function (ids) {
      for (var i = 0; i < ids.length; i++) {
        Common.UI.clearHighlight(ids[i]);
      }
    },

    /* ---------- 簡易メッセージ（トースト） ---------- */

    /**
     * 画面下部に数秒だけメッセージを表示する。
     * Common.UI.toast("保存しました");
     * Common.UI.toast("保存しました", 3000);  // 表示時間ミリ秒
     */
    toast: function (message, duration) {
      _init();
      var t = document.getElementById(TOAST_ID);
      if (!t) {
        t = document.createElement("div");
        t.id = TOAST_ID;
        document.body.appendChild(t);
      }
      t.innerHTML = "";
      t.appendChild(document.createTextNode(message));
      // 一旦表示
      t.className = "cui-show";
      if (t._timer) { clearTimeout(t._timer); }
      t._timer = setTimeout(function () {
        t.className = "";
      }, duration || 2500);
    }
  };
})();
