/**
 * ============================================================================
 *  TCP.Valid : バリデーション（共通基盤 / BIZ-03）
 * ----------------------------------------------------------------------------
 *  入力チェックの共通関数群。個別判定（boolean）と、ルール一括検証
 *  （エラーメッセージ収集）の両方を提供する。
 *
 *  提供API:
 *    判定 : required / maxLen / minLen / isNumber / isInt / isMail /
 *           isZip / isTel / isDate / isHankaku / isZenkaku
 *    一括 : validate(value, rules) / check(list)
 *
 *  利用例:
 *    if (!TCP.Valid.required(name)) { ... }
 *    var errs = TCP.Valid.check([
 *      { label:'取引先名', value:name, rules:{ required:true, maxLen:40 } },
 *      { label:'メール',   value:mail, rules:{ required:true, isMail:true } }
 *    ]);
 *    if (errs.length) { return TCP.Error.fail(errs[0], 'E10001'); }
 *
 *  依存: TCP.Fmt（trim等） / TCP.Msg(任意)
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Valid = (function () {
    'use strict';

    function _s(v) { return TCP.Fmt.trim(v); }

    // ------------------------------------------------------------------
    //  個別判定（true=OK）
    // ------------------------------------------------------------------

    /** 必須（null/undefined/空白はNG） */
    function required(v) { return !TCP.Fmt.isBlank(v); }

    /** 最大桁（空はOK扱い。required と併用想定） */
    function maxLen(v, n) { return _s(v).length <= n; }

    /** 最小桁 */
    function minLen(v, n) { return _s(v).length >= n; }

    /** 数値（符号・小数可） */
    function isNumber(v) {
        var s = _s(v);
        return s !== '' && /^[-+]?(\d+|\d*\.\d+)$/.test(s);
    }

    /** 整数（符号可） */
    function isInt(v) {
        var s = _s(v);
        return s !== '' && /^[-+]?\d+$/.test(s);
    }

    /** メール形式（簡易RFC） */
    function isMail(v) {
        var s = _s(v);
        return s === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }

    /** 郵便番号（7桁。ハイフン有無どちらも可） */
    function isZip(v) {
        var s = _s(v);
        return s === '' || /^\d{3}-?\d{4}$/.test(s);
    }

    /** 電話番号（数字とハイフン、10〜11桁相当の緩いチェック） */
    function isTel(v) {
        var s = _s(v);
        return s === '' || /^[0-9\-]{10,13}$/.test(s);
    }

    /** 日付（yyyy/MM/dd or yyyy-MM-dd。実在日もチェック） */
    function isDate(v) {
        var s = _s(v);
        if (s === '') return true;
        if (!/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(s)) return false;
        var p = s.replace(/-/g, '/').split('/');
        var y = parseInt(p[0], 10), m = parseInt(p[1], 10), d = parseInt(p[2], 10);
        if (m < 1 || m > 12 || d < 1 || d > 31) return false;
        var dim = [31, ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28,
                   31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        return d <= dim[m - 1];
    }

    /** 半角のみ（ASCII印字可能文字） */
    function isHankaku(v) {
        var s = _s(v);
        return s === '' || /^[\x20-\x7E]*$/.test(s);
    }

    /** 全角のみ（半角を含まない） */
    function isZenkaku(v) {
        var s = _s(v);
        if (s === '') return true;
        return !/[\x01-\x7E｡-ﾟ]/.test(s); // 半角英数記号・半角カナを含まない
    }


    // ------------------------------------------------------------------
    //  一括検証
    // ------------------------------------------------------------------

    var _CHECKERS = {
        required: function (v) { return required(v); },
        isNumber: function (v) { return isNumber(v); },
        isInt:    function (v) { return isInt(v); },
        isMail:   function (v) { return isMail(v); },
        isZip:    function (v) { return isZip(v); },
        isTel:    function (v) { return isTel(v); },
        isDate:   function (v) { return isDate(v); },
        isHankaku:function (v) { return isHankaku(v); },
        isZenkaku:function (v) { return isZenkaku(v); }
    };

    var _LABELS = {
        required: 'は必須です。',
        maxLen:   'は{0}文字以内で入力してください。',
        minLen:   'は{0}文字以上で入力してください。',
        isNumber: 'は数値で入力してください。',
        isInt:    'は整数で入力してください。',
        isMail:   'はメール形式で入力してください。',
        isZip:    'は郵便番号形式で入力してください。',
        isTel:    'は電話番号形式で入力してください。',
        isDate:   'は日付形式（yyyy/MM/dd）で入力してください。',
        isHankaku:'は半角で入力してください。',
        isZenkaku:'は全角で入力してください。'
    };

    /**
     * 単一値を複数ルールで検証し、エラーメッセージ配列を返す（OKなら空）。
     * @param {String} label  項目名
     * @param {*}      value  値
     * @param {Object} rules  { required:true, maxLen:40, isMail:true, ... }
     * @returns {String[]}
     */
    function validate(label, value, rules) {
        var errs = [];
        if (!rules) return errs;

        // 必須を最初に。未入力かつ非必須なら以降スキップ
        if (rules.required && !required(value)) {
            errs.push(label + _LABELS.required);
            return errs;
        }
        if (TCP.Fmt.isBlank(value)) return errs;

        if (rules.maxLen !== undefined && !maxLen(value, rules.maxLen)) {
            errs.push(label + _fmt(_LABELS.maxLen, rules.maxLen));
        }
        if (rules.minLen !== undefined && !minLen(value, rules.minLen)) {
            errs.push(label + _fmt(_LABELS.minLen, rules.minLen));
        }
        for (var key in _CHECKERS) {
            if (_CHECKERS.hasOwnProperty(key) && key !== 'required'
                && rules[key] && !_CHECKERS[key](value)) {
                errs.push(label + _LABELS[key]);
            }
        }
        return errs;
    }

    /**
     * 複数項目をまとめて検証する。
     * @param {Array} list  [{ label, value, rules }, ...]
     * @returns {String[]}  全エラーメッセージ
     */
    function check(list) {
        var all = [];
        if (!list) return all;
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var errs = validate(item.label, item.value, item.rules);
            for (var j = 0; j < errs.length; j++) { all.push(errs[j]); }
        }
        return all;
    }

    function _fmt(tpl, arg) {
        return tpl.replace(/\{0\}/g, String(arg));
    }


    return {
        required:  required,
        maxLen:    maxLen,
        minLen:    minLen,
        isNumber:  isNumber,
        isInt:     isInt,
        isMail:    isMail,
        isZip:     isZip,
        isTel:     isTel,
        isDate:    isDate,
        isHankaku: isHankaku,
        isZenkaku: isZenkaku,
        validate:  validate,
        check:     check
    };
})();
