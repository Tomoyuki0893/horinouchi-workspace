/**
 * ============================================================================
 *  TCP.Conv : JS ↔ Java 変換ユーティリティ（共通基盤 / CORE-01）
 * ----------------------------------------------------------------------------
 *  TALON JavaScriptエンジン（Nashorn / ES5）では、DB結果や引数が
 *  Java の List / 配列 / Map で渡ることが多く、JS配列の .map() / .forEach() を
 *  そのまま使えないケースがある。本モジュールはその差異を吸収する土台。
 *
 *  ※ 新共通基盤。既存の WFS_COMMON(getMapVal/setMapVal) や
 *    DbUtil(getMapKeys/isEmptyMap) に散在していた処理を、TCP名前空間へ集約。
 *    既存ファイルは変更しない（ささえあ用としてそのまま残す）。
 *
 *  利用例:
 *    TCP.Conv.each(list, function (row, i) { ... });
 *    var names = TCP.Conv.mapTo(list, function (row) { return TCP.Conv.getVal(row, 'NM'); });
 *    var jsArr = TCP.Conv.toJsArray(javaList);
 *    var v     = TCP.Conv.getVal(rowMap, 'USER_ID');   // Java Map / JS Object 両対応
 *
 *  提供API:
 *    判定   : isJavaList / isJavaArray / isArrayLike / isJavaMap
 *    配列   : size / at / each / mapTo / toJsArray / toJavaArray
 *    マップ : getVal / setVal / keys / isEmptyMap / toJsObject
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Conv = (function () {
    'use strict';

    // ========================================================================
    //  判定
    // ========================================================================

    /** Java の List（size()/get() を持つ）か */
    function isJavaList(o) {
        return !!o && typeof o.size === 'function' && typeof o.get === 'function'
            && typeof o.keySet !== 'function'; // Map を除外
    }

    /** Java のネイティブ配列か（String[] 等） */
    function isJavaArray(o) {
        if (o === null || o === undefined) return false;
        try {
            return typeof o.getClass === 'function' && o.getClass().isArray();
        } catch (e) {
            return false;
        }
    }

    /** JS配列 / Java配列 / Java List のいずれか（反復可能）か */
    function isArrayLike(o) {
        if (o === null || o === undefined) return false;
        if (Object.prototype.toString.call(o) === '[object Array]') return true;
        if (isJavaArray(o)) return true;
        if (isJavaList(o)) return true;
        return false;
    }

    /** Java の Map（keySet()/get() を持つ）か */
    function isJavaMap(o) {
        return !!o && typeof o.keySet === 'function' && typeof o.get === 'function';
    }


    // ========================================================================
    //  配列系
    // ========================================================================

    /** 反復可能オブジェクトの要素数（非配列は 0） */
    function size(arr) {
        if (arr === null || arr === undefined) return 0;
        if (isJavaList(arr)) return arr.size();
        if (typeof arr.length === 'number') return arr.length; // JS配列・Java配列
        return 0;
    }

    /** i番目の要素を取得（JS配列 / Java配列 / Java List 共通） */
    function at(arr, i) {
        if (arr === null || arr === undefined) return undefined;
        if (isJavaList(arr)) return arr.get(i);
        return arr[i];
    }

    /**
     * 反復処理（.forEach 代替）。Java List / Java配列 / JS配列いずれもOK。
     * @param {Object}   arr  反復対象（null可：何もしない）
     * @param {Function} fn   function(element, index)
     */
    function each(arr, fn) {
        var n = size(arr);
        for (var i = 0; i < n; i++) {
            fn(at(arr, i), i);
        }
    }

    /**
     * 変換（.map 代替）。常に **JS配列** を返す。
     * @param {Object}   arr  反復対象
     * @param {Function} fn   function(element, index) -> 変換後の値
     * @returns {Array}       JS配列
     */
    function mapTo(arr, fn) {
        var out = [];
        var n = size(arr);
        for (var i = 0; i < n; i++) {
            out.push(fn(at(arr, i), i));
        }
        return out;
    }

    /** Java List / Java配列 を JS配列へ（要素はそのまま） */
    function toJsArray(arr) {
        return mapTo(arr, function (e) { return e; });
    }

    /**
     * JS配列 を Java配列へ。
     * @param {Array}  jsArr     JS配列
     * @param {String} javaType  例 'java.lang.String[]'（省略時 Object[]）
     * @returns {Object}         Java配列
     */
    function toJavaArray(jsArr, javaType) {
        var type = javaType || 'java.lang.Object[]';
        return Java.to(jsArr || [], type);
    }


    // ========================================================================
    //  マップ系（Java Map / JS Object 両対応）
    // ========================================================================

    /**
     * マップから値を取得。完全一致が無ければ大文字/小文字違いをフォールバック。
     * （DB列名の大小差異・Postgres小文字化対策。既存 getMapVal 相当）
     * @param {Object} map  Java Map または JS Object
     * @param {String} key  キー
     * @returns {*}         値（無ければ null）
     */
    function getVal(map, key) {
        if (!map || key === null || key === undefined) return null;
        var v;
        if (isJavaMap(map)) {
            v = map.get(key);
            if (v === null || v === undefined) v = map.get(String(key).toLowerCase());
            if (v === null || v === undefined) v = map.get(String(key).toUpperCase());
            return (v === undefined) ? null : v;
        }
        v = map[key];
        if (v === null || v === undefined) v = map[String(key).toLowerCase()];
        if (v === null || v === undefined) v = map[String(key).toUpperCase()];
        return (v === undefined) ? null : v;
    }

    /**
     * マップへ値をセット（Java Map / JS Object 両対応）。
     * @param {Object} map  対象マップ
     * @param {String} key  キー
     * @param {*}      val  値
     * @returns {Object}    同一マップ
     */
    function setVal(map, key, val) {
        if (!map) return map;
        if (isJavaMap(map)) {
            map.put(key, val);
        } else {
            map[key] = val;
        }
        return map;
    }

    /** マップのキー一覧を JS配列で取得 */
    function keys(map) {
        if (!map) return [];
        if (isJavaMap(map)) {
            var result = [];
            var iter = map.keySet().iterator();
            while (iter.hasNext()) {
                result.push(String(iter.next()));
            }
            return result;
        }
        return Object.keys(map);
    }

    /** マップが空か（null含む） */
    function isEmptyMap(map) {
        if (!map) return true;
        if (typeof map.isEmpty === 'function') return map.isEmpty();
        if (typeof map.size === 'function') return map.size() === 0;
        return Object.keys(map).length === 0;
    }

    /** Java Map を素の JS Object へ浅く変換 */
    function toJsObject(map) {
        if (!map) return {};
        if (!isJavaMap(map)) return map;
        var obj = {};
        var ks = keys(map);
        for (var i = 0; i < ks.length; i++) {
            obj[ks[i]] = map.get(ks[i]);
        }
        return obj;
    }


    // ========================================================================
    //  公開API
    // ========================================================================
    return {
        // 判定
        isJavaList:  isJavaList,
        isJavaArray: isJavaArray,
        isArrayLike: isArrayLike,
        isJavaMap:   isJavaMap,
        // 配列
        size:        size,
        at:          at,
        each:        each,
        mapTo:       mapTo,
        toJsArray:   toJsArray,
        toJavaArray: toJavaArray,
        // マップ
        getVal:      getVal,
        setVal:      setVal,
        keys:        keys,
        isEmptyMap:  isEmptyMap,
        toJsObject:  toJsObject
    };
})();
