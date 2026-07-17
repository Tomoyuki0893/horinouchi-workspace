/**
 * ============================================================================
 * DbUtil — 汎用 DB CRUD ライブラリ (TALON / Nashorn ES5)
 * ----------------------------------------------------------------------------
 * 利用例:
 *   var row  = DbUtil.selectOne(conn, 'TBL', null, {ID: 1}, null);
 *   var list = DbUtil.selectList(conn, 'TBL', ['ID','NM'], {KBN: '01'}, 'ID');
 *   var cnt  = DbUtil.getCount(conn, 'TBL', {LOT_NO: '24A001'});
 *   DbUtil.insert(conn, 'TBL', DbUtil.setInsInitData(map), true);
 *   DbUtil.update(conn, 'TBL', DbUtil.setUpdInitData(map), ['ID'], true);
 *   DbUtil.remove(conn, 'TBL', {ID: 1}, ['ID'], true);
 *
 * 提供API:
 *   - DbUtil.selectOne / selectList / getCount
 *   - DbUtil.insert / update / remove
 *   - DbUtil.setInsInitData / setUpdInitData
 *
 * 補助API:
 *   - DbUtil.buildSelectSQL / checkSqlParam / escapeSqlString
 *   - DbUtil.getColumns / isEmptyMap / getMapKeys
 *
 * 前提:
 *   - DB: SQL Server (dbo スキーマ前提)
 *   - 接続: TALON.getDbConfig() 等
 *   - テーブル名は [A-Za-z0-9_] のみ許容
 *
 * 注意:
 *   - "delete" は JS 予約語のため、削除関数は "remove" としています
 * ============================================================================
 */

var DbUtil = (function () {
    "use strict";

    // ========================================================================
    //  内部ユーティリティ
    // ========================================================================

    /**
     * 数値型かどうかを判定する（JS number / Java BigDecimal 等に対応）。
     * @private
     */
    function _isNumeric(value) {
        if (typeof value === "number") return true;
        if (value === null || value === undefined) return false;
        try {
            var clsName = value.getClass().getName();
            return clsName === "java.math.BigDecimal"
                || clsName === "java.lang.Integer"
                || clsName === "java.lang.Long"
                || clsName === "java.lang.Double";
        } catch (e) {
            return false;
        }
    }


    // ========================================================================
    //  SELECT 系
    // ========================================================================

    /**
     * 単一レコードを取得する（内部で TOP 1 を付与）。
     *
     * @param {Object}   conn       DB接続
     * @param {String}   tableName  テーブル名
     * @param {String[]} columns    取得カラム配列（null/空なら *）
     * @param {Object}   whereMap   WHERE条件（必須／値が null は IS NULL）
     * @param {String}   orderBy    ORDER BY 句（省略可）
     * @returns {Object|null}       レコード／該当なしの場合 null
     */
    function selectOne(conn, tableName, columns, whereMap, orderBy) {
        var sql = buildSelectSQL(tableName, columns, whereMap, orderBy, 1);
        var list = TalonDbUtil.select(conn, sql);
        if (!list || list.length === 0) {
            return null;
        }
        return list[0];
    }

    /**
     * 複数レコードを取得する。
     *
     * @param {Object}   conn       DB接続
     * @param {String}   tableName  テーブル名
     * @param {String[]} columns    取得カラム配列（null/空なら *）
     * @param {Object}   whereMap   WHERE条件（必須／値が null は IS NULL）
     * @param {String}   orderBy    ORDER BY 句（省略可）
     * @returns {Object[]}          レコード配列（0件なら空配列）
     */
    function selectList(conn, tableName, columns, whereMap, orderBy) {
        var sql = buildSelectSQL(tableName, columns, whereMap, orderBy, null);
        var list = TalonDbUtil.select(conn, sql);
        return list || [];
    }

    /**
     * 件数（COUNT(*)）を取得する。
     *
     * @param {Object} conn       DB接続
     * @param {String} tableName  テーブル名
     * @param {Object} whereMap   WHERE条件（省略可。指定時は AND 結合）
     * @returns {Number}          件数（取得失敗時は 0）
     */
    function getCount(conn, tableName, whereMap) {
        if (!conn) {
            TALON.addErrorMsg("DbUtil.getCount: DBコネクションが未指定です。");
            return 0;
        }
        if (!tableName || typeof tableName !== 'string') {
            TALON.addErrorMsg("DbUtil.getCount: テーブル名が不正です。");
            return 0;
        }

        var sql = "SELECT COUNT(*) AS CNT FROM " + tableName;

        var keys = (whereMap) ? getMapKeys(whereMap) : [];
        if (keys.length > 0) {
            var whereParts = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var val = whereMap[key];
                if (val === null || val === undefined) {
                    whereParts.push(key + " IS NULL");
                } else {
                    whereParts.push(key + " = '" + escapeSqlString(val) + "'");
                }
            }
            sql += " WHERE " + whereParts.join(" AND ");
        }

        var result = TalonDbUtil.select(conn, sql);
        if (!result || result.length === 0) {
            return 0;
        }
        var cnt = result[0]["CNT"];
        return (cnt != null) ? Number(cnt) : 0;
    }


    // ========================================================================
    //  INSERT / UPDATE / DELETE 系
    // ========================================================================

    /**
     * テーブルに1件 INSERT する（カラムリスト動的取得・ログ対応）。
     *
     * @param {Object}  conn       DB接続
     * @param {String}  tableName  テーブル名
     * @param {Object}  map        登録データ
     * @param {Boolean} enableLog  true でログ出力
     * @returns {Boolean}          成功時 true／空マップ時 false／失敗時は例外
     */
    function insert(conn, tableName, map, enableLog) {
        var logger = TALON.getLogger();

        if (isEmptyMap(map)) {
            if (enableLog) {
                logger.writeDebug("[SKIP] insert対象マップが空です → テーブル: " + tableName);
            }
            return false;
        }

        checkSqlParam(tableName);

        try {
            var colList = getColumns(conn, tableName);

            if (enableLog) {
                logger.writeDebug("[INFO] insert開始 → テーブル: " + tableName);
            }

            TalonDbUtil.insertByMap(conn, tableName, map, colList);

            if (enableLog) {
                logger.writeDebug("[SUCCESS] insert完了 → 1件挿入");
            }

            return true;

        } catch (e) {
            logger.writeDebug("[ERROR] insert失敗 → テーブル: " + tableName + " / エラー: " + e.message);
            throw e;
        }
    }

    /**
     * テーブルを UPDATE する。
     * WHERE条件の値は updateMap 内に含めておくこと。
     *
     * @param {Object}   conn        DB接続
     * @param {String}   tableName   テーブル名
     * @param {Object}   updateMap   更新値＋WHEREキーの値
     * @param {String[]} whereKeys   WHERE条件に使うカラム名配列
     * @param {Boolean}  enableLog   true でログ出力
     * @returns {Number}             更新件数（空マップ時 0／失敗時は例外）
     */
    function update(conn, tableName, updateMap, whereKeys, enableLog) {
        var logger = TALON.getLogger();

        if (isEmptyMap(updateMap)) {
            if (enableLog) {
                logger.writeDebug("[SKIP] update対象マップが空です → テーブル: " + tableName);
            }
            return 0;
        }

        checkSqlParam(tableName);

        try {
            var colList = getColumns(conn, tableName);

            var whereList = [];
            for (var i = 0; i < whereKeys.length; i++) {
                whereList.push([null, '=', whereKeys[i]]);
            }

            if (enableLog) {
                logger.writeDebug("[INFO] update開始 → テーブル: " + tableName
                    + " 条件キー: " + JSON.stringify(whereKeys));
            }

            var count = TalonDbUtil.updateByMap(conn, tableName, updateMap, colList, whereList);

            if (enableLog) {
                logger.writeDebug("[SUCCESS] update完了 → " + count + " 件 テーブル: " + tableName);
            }

            return count;

        } catch (e) {
            logger.writeDebug("[ERROR] update失敗 → テーブル: " + tableName + " / エラー: " + e.message);
            throw e;
        }
    }

    /**
     * テーブルから DELETE する。
     * （"delete" は JS 予約語のため、本関数名は "remove"）
     *
     * @param {Object}   conn        DB接続
     * @param {String}   tableName   テーブル名
     * @param {Object}   map         WHEREキーの値を含むマップ
     * @param {String[]} whereKeys   WHERE条件に使うカラム名配列
     * @param {Boolean}  enableLog   true でログ出力
     * @returns {Number}             削除件数（空マップ時 0／失敗時は例外）
     */
    function remove(conn, tableName, map, whereKeys, enableLog) {
        var logger = TALON.getLogger();

        if (isEmptyMap(map)) {
            if (enableLog) {
                logger.writeDebug("[SKIP] delete対象マップが空です → テーブル: " + tableName);
            }
            return 0;
        }

        checkSqlParam(tableName);

        try {
            var whereList = [];
            for (var i = 0; i < whereKeys.length; i++) {
                whereList.push([null, '=', whereKeys[i]]);
            }

            if (enableLog) {
                logger.writeDebug("[INFO] delete開始 → テーブル: " + tableName
                    + " 条件キー: " + JSON.stringify(whereKeys));
            }

            var count = TalonDbUtil.deleteByMap(conn, tableName, map, whereList);

            if (enableLog) {
                logger.writeDebug("[SUCCESS] delete完了 → " + count + " 件 テーブル: " + tableName);
            }

            return count;

        } catch (e) {
            logger.writeDebug("[ERROR] delete失敗 → テーブル: " + tableName + " / エラー: " + e.message);
            throw e;
        }
    }


    // ========================================================================
    //  監査列 自動補完
    // ========================================================================

    /**
     * INSERT 用の監査列を自動セット。
     *
     *   FUNC_ID / CREATED_DATE / CREATED_BY / CREATED_PRG_NM
     *   UPDATED_DATE / UPDATED_BY / UPDATED_PRG_NM / MODIFY_COUNT(=0)
     *
     * @param {Object} map  対象マップ
     * @returns {Object}    監査列を補完したマップ（同一参照）
     */
    function setInsInitData(map) {
        var userData = TALON.getUserInfoMap();
        var func_id = userData['FUNC_ID'];
        var user_id = userData['USER_ID'];
        var sysdate = new java.util.Date();

        map['FUNC_ID']         = func_id;
        map['CREATED_DATE']    = sysdate;
        map['CREATED_BY']      = user_id;
        map['CREATED_PRG_NM']  = func_id;
        map['UPDATED_DATE']    = sysdate;
        map['UPDATED_BY']      = user_id;
        map['UPDATED_PRG_NM']  = func_id;
        map['MODIFY_COUNT']    = 0;

        return map;
    }

    /**
     * UPDATE 用の監査列を自動セット。
     *
     *   UPDATED_DATE / UPDATED_BY / UPDATED_PRG_NM
     *
     * @param {Object} map  対象マップ
     * @returns {Object}    監査列を補完したマップ（同一参照）
     */
    function setUpdInitData(map) {
        var userData = TALON.getUserInfoMap();
        var func_id = userData['FUNC_ID'];
        var user_id = userData['USER_ID'];
        var sysdate = new java.util.Date();

        map['UPDATED_DATE']    = sysdate;
        map['UPDATED_BY']      = user_id;
        map['UPDATED_PRG_NM']  = func_id;

        return map;
    }


    // ========================================================================
    //  補助関数
    // ========================================================================

    /**
     * SELECT 文文字列を生成する（SQL Server 向け／WHERE 必須）。
     *
     * @param {String}   tableName  テーブル名
     * @param {String[]} columns    取得カラム配列（null/空なら *）
     * @param {Object}   whereMap   WHERE条件（必須）
     * @param {String}   orderBy    ORDER BY 句
     * @param {Number}   top        TOP 句件数（省略可）
     * @returns {String}            SQL文字列
     */
    function buildSelectSQL(tableName, columns, whereMap, orderBy, top) {
        if (!tableName) {
            throw new Error("テーブル名は必須です。");
        }
        if (isEmptyMap(whereMap)) {
            throw new Error("WHERE条件が必須です。");
        }

        var selectClause = "SELECT ";
        if (top && typeof top === "number") {
            selectClause += "TOP " + top + " ";
        }
        selectClause += (!columns || columns.length === 0) ? "*" : columns.join(", ");

        var sql = selectClause + " FROM " + tableName;

        var whereParts = [];
        var keys = getMapKeys(whereMap);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = whereMap[key];

            if (value === null || value === undefined) {
                whereParts.push(key + " IS NULL");
            } else if (_isNumeric(value)) {
                whereParts.push(key + " = " + String(value));
            } else {
                whereParts.push(key + " = '" + escapeSqlString(value) + "'");
            }
        }

        sql += " WHERE " + whereParts.join(" AND ");

        if (orderBy) {
            sql += " ORDER BY " + orderBy;
        }

        return sql;
    }

    /**
     * SQLパラメータの安全性をチェック（シングルクォート禁止）。
     *
     * @param {*} param  チェック対象
     * @throws {Error}   不正な値が含まれている場合
     */
    function checkSqlParam(param) {
        if (param == null) {
            return;
        }
        var strParam = String(param);
        if (strParam.indexOf("'") !== -1) {
            TALON.addErrorMsg("引数の受け渡し値が不正です。 param=[" + strParam + "]");
            TALON.setIsSuccess(false);
            throw new Error("SQLパラメータに不正な文字が含まれています。");
        }
    }

    /**
     * SQL用に文字列をエスケープ（' → ''）。
     *
     * @param {*} str  対象
     * @returns {String|*} エスケープ済み文字列（null/undefined はそのまま返す）
     */
    function escapeSqlString(str) {
        if (str === null || str === undefined) {
            return str;
        }
        if (typeof str !== "string") {
            str = String(str);
        }
        return str.replace(/'/g, "''");
    }

    /**
     * 指定テーブルのカラム名リストを取得（SQL Server / dbo 前提）。
     *
     * @param {Object} conn       DB接続
     * @param {String} tableName  テーブル名（[A-Za-z0-9_] のみ許容）
     * @returns {String[]}        カラム名配列
     */
    function getColumns(conn, tableName) {
        if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
            throw new Error("Invalid table name: " + tableName);
        }

        var sql = [
            "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE",
            "FROM INFORMATION_SCHEMA.COLUMNS",
            "WHERE TABLE_NAME = '" + tableName + "'",
            "AND TABLE_SCHEMA = 'dbo'"
        ].join(" ");

        var mapList = TalonDbUtil.select(conn, sql);
        var colList = [];
        for (var i = 0; i < mapList.size(); i++) {
            var map = mapList.get(i);
            colList.push(String(map.get("COLUMN_NAME")));
        }
        return colList;
    }

    /**
     * Java Map / JS Object の空判定。
     *
     * @param {Object} map
     * @returns {Boolean}
     */
    function isEmptyMap(map) {
        if (!map) return true;
        if (typeof map.isEmpty === 'function') {
            return map.isEmpty();
        }
        if (typeof map.size === "function") {
            return map.size() === 0;
        }
        if (typeof map.keySet === "function" && typeof map.keySet().isEmpty === "function") {
            return map.keySet().isEmpty();
        }
        return Object.keys(map).length === 0;
    }

    /**
     * Java Map / JS Object のキー一覧取得。
     *
     * @param {Object} map
     * @returns {String[]}
     */
    function getMapKeys(map) {
        if (typeof map.keySet === "function" && typeof map.get === "function") {
            var iter = map.keySet().iterator();
            var result = [];
            while (iter.hasNext()) {
                var key = iter.next();
                result.push(String(key));
            }
            return result;
        }
        return Object.keys(map);
    }


    // ========================================================================
    //  公開API
    // ========================================================================
    return {
        // SELECT 系
        selectOne:       selectOne,
        selectList:      selectList,
        getCount:        getCount,

        // INSERT / UPDATE / DELETE 系
        insert:          insert,
        update:          update,
        remove:          remove,

        // 監査列 自動補完
        setInsInitData:  setInsInitData,
        setUpdInitData:  setUpdInitData,

        // 補助関数
        buildSelectSQL:  buildSelectSQL,
        checkSqlParam:   checkSqlParam,
        escapeSqlString: escapeSqlString,
        getColumns:      getColumns,
        isEmptyMap:      isEmptyMap,
        getMapKeys:      getMapKeys
    };
})();
