/**
 * ============================================================================
 *  TCP.Db : DB・SQL補助（共通基盤 / BIZ-02）
 * ----------------------------------------------------------------------------
 *  SQL Server 向け 汎用DB CRUD。既存 DbUtil.js（完成度高）を参考に、
 *  TCP名前空間で新規構築。ページング（OFFSET/FETCH）・IN句生成を追加。
 *
 *  提供API:
 *    SELECT : selectOne / selectList / getCount / paging
 *    更新   : insert / update / remove
 *    監査列 : setInsInitData / setUpdInitData
 *    補助   : buildInClause / escapeSql / checkSqlParam / getColumns
 *
 *  前提:
 *    - DB: SQL Server（dbo スキーマ）
 *    - 接続: TALON.getDbConfig()
 *    - テーブル名は [A-Za-z0-9_] のみ許容
 *    - "delete" はJS予約語のため削除関数は "remove"
 *
 *  依存: TALON / TalonDbUtil / TCP.Conv / TCP.Log / TCP.Error / TCP.Fmt
 * ============================================================================
 */
var TCP = TCP || {};

TCP.Db = (function () {
    'use strict';

    function _conn() { return TALON.getDbConfig(); }
    function _esc(v) { return TCP.Fmt.escapeSql(v); }

    function _isNumeric(value) {
        if (typeof value === 'number') return true;
        if (value === null || value === undefined) return false;
        try {
            var c = value.getClass().getName();
            return c === 'java.math.BigDecimal' || c === 'java.lang.Integer'
                || c === 'java.lang.Long' || c === 'java.lang.Double';
        } catch (e) { return false; }
    }


    // ========================================================================
    //  SELECT 系
    // ========================================================================

    /** 単一レコード取得（内部で TOP 1） */
    function selectOne(conn, tableName, columns, whereMap, orderBy) {
        var sql = buildSelectSQL(tableName, columns, whereMap, orderBy, 1);
        var list = TalonDbUtil.select(conn || _conn(), sql);
        return (list && TCP.Conv.size(list) > 0) ? TCP.Conv.at(list, 0) : null;
    }

    /** 複数レコード取得 */
    function selectList(conn, tableName, columns, whereMap, orderBy) {
        var sql = buildSelectSQL(tableName, columns, whereMap, orderBy, null);
        var list = TalonDbUtil.select(conn || _conn(), sql);
        return list || [];
    }

    /** 件数取得（COUNT(*)） */
    function getCount(conn, tableName, whereMap) {
        checkSqlParam(tableName);
        var sql = 'SELECT COUNT(*) AS CNT FROM ' + tableName + _whereClause(whereMap);
        var list = TalonDbUtil.select(conn || _conn(), sql);
        if (!list || TCP.Conv.size(list) === 0) return 0;
        var cnt = TCP.Conv.getVal(TCP.Conv.at(list, 0), 'CNT');
        return (cnt != null) ? Number(cnt) : 0;
    }

    /**
     * ページング取得（SQL Server OFFSET/FETCH）。ORDER BY 必須。
     * @param {Object} conn      接続（null可）
     * @param {String} sqlBody   'SELECT ... FROM ... WHERE ... ORDER BY ...'（ORDER BY必須）
     * @param {Number} page      1始まりのページ番号
     * @param {Number} pageSize  1ページ件数
     * @returns {Object[]}       レコード配列
     */
    function paging(conn, sqlBody, page, pageSize) {
        var p  = (page > 0) ? page : 1;
        var sz = (pageSize > 0) ? pageSize : 20;
        if (!/order\s+by/i.test(sqlBody)) {
            throw TCP.Error.create('E30001', 'ページングにはORDER BYが必須です。');
        }
        var offset = (p - 1) * sz;
        var sql = sqlBody + ' OFFSET ' + offset + ' ROWS FETCH NEXT ' + sz + ' ROWS ONLY';
        var list = TalonDbUtil.select(conn || _conn(), sql);
        return list || [];
    }


    // ========================================================================
    //  INSERT / UPDATE / DELETE 系
    // ========================================================================

    /** 1件 INSERT（カラム動的取得） */
    function insert(conn, tableName, map, enableLog) {
        if (TCP.Conv.isEmptyMap(map)) {
            if (enableLog) TCP.Log.debug('[TCP.Db] insertスキップ（空マップ） table=' + tableName);
            return false;
        }
        checkSqlParam(tableName);
        var c = conn || _conn();
        try {
            var cols = getColumns(c, tableName);
            if (enableLog) TCP.Log.info('[TCP.Db] insert開始 table=' + tableName);
            TalonDbUtil.insertByMap(c, tableName, map, cols);
            if (enableLog) TCP.Log.info('[TCP.Db] insert完了 1件 table=' + tableName);
            return true;
        } catch (e) {
            TCP.Log.error('[TCP.Db] insert失敗 table=' + tableName, e);
            throw TCP.Error.wrap(e);
        }
    }

    /** UPDATE（WHERE値は updateMap に含める） */
    function update(conn, tableName, updateMap, whereKeys, enableLog) {
        if (TCP.Conv.isEmptyMap(updateMap)) {
            if (enableLog) TCP.Log.debug('[TCP.Db] updateスキップ（空マップ） table=' + tableName);
            return 0;
        }
        checkSqlParam(tableName);
        var c = conn || _conn();
        try {
            var cols = getColumns(c, tableName);
            var whereList = [];
            for (var i = 0; i < whereKeys.length; i++) { whereList.push([null, '=', whereKeys[i]]); }
            if (enableLog) TCP.Log.info('[TCP.Db] update開始 table=' + tableName + ' 条件=' + whereKeys.join(','));
            var count = TalonDbUtil.updateByMap(c, tableName, updateMap, cols, whereList);
            if (enableLog) TCP.Log.info('[TCP.Db] update完了 ' + count + '件 table=' + tableName);
            return count;
        } catch (e) {
            TCP.Log.error('[TCP.Db] update失敗 table=' + tableName, e);
            throw TCP.Error.wrap(e);
        }
    }

    /** DELETE（"delete"予約語回避のため remove） */
    function remove(conn, tableName, map, whereKeys, enableLog) {
        if (TCP.Conv.isEmptyMap(map)) {
            if (enableLog) TCP.Log.debug('[TCP.Db] removeスキップ（空マップ） table=' + tableName);
            return 0;
        }
        checkSqlParam(tableName);
        var c = conn || _conn();
        try {
            var whereList = [];
            for (var i = 0; i < whereKeys.length; i++) { whereList.push([null, '=', whereKeys[i]]); }
            if (enableLog) TCP.Log.info('[TCP.Db] delete開始 table=' + tableName + ' 条件=' + whereKeys.join(','));
            var count = TalonDbUtil.deleteByMap(c, tableName, map, whereList);
            if (enableLog) TCP.Log.info('[TCP.Db] delete完了 ' + count + '件 table=' + tableName);
            return count;
        } catch (e) {
            TCP.Log.error('[TCP.Db] delete失敗 table=' + tableName, e);
            throw TCP.Error.wrap(e);
        }
    }


    // ========================================================================
    //  監査列 自動補完
    // ========================================================================

    /** INSERT用 監査列セット（FUNC_ID/CREATED_*/UPDATED_*/MODIFY_COUNT=0） */
    function setInsInitData(map) {
        var u = TALON.getUserInfoMap();
        var funcId = TCP.Conv.getVal(u, 'FUNC_ID');
        var userId = TCP.Conv.getVal(u, 'USER_ID');
        var now = new java.util.Date();
        TCP.Conv.setVal(map, 'FUNC_ID',        funcId);
        TCP.Conv.setVal(map, 'CREATED_DATE',   now);
        TCP.Conv.setVal(map, 'CREATED_BY',     userId);
        TCP.Conv.setVal(map, 'CREATED_PRG_NM', funcId);
        TCP.Conv.setVal(map, 'UPDATED_DATE',   now);
        TCP.Conv.setVal(map, 'UPDATED_BY',     userId);
        TCP.Conv.setVal(map, 'UPDATED_PRG_NM', funcId);
        TCP.Conv.setVal(map, 'MODIFY_COUNT',   0);
        return map;
    }

    /** UPDATE用 監査列セット（UPDATED_*） */
    function setUpdInitData(map) {
        var u = TALON.getUserInfoMap();
        var funcId = TCP.Conv.getVal(u, 'FUNC_ID');
        var userId = TCP.Conv.getVal(u, 'USER_ID');
        TCP.Conv.setVal(map, 'UPDATED_DATE',   new java.util.Date());
        TCP.Conv.setVal(map, 'UPDATED_BY',     userId);
        TCP.Conv.setVal(map, 'UPDATED_PRG_NM', funcId);
        return map;
    }


    // ========================================================================
    //  補助
    // ========================================================================

    /** SELECT文生成（WHERE必須） */
    function buildSelectSQL(tableName, columns, whereMap, orderBy, top) {
        if (!tableName) throw TCP.Error.create('E30002', 'テーブル名は必須です。');
        if (TCP.Conv.isEmptyMap(whereMap)) throw TCP.Error.create('E30003', 'WHERE条件が必須です。');

        var sel = 'SELECT ';
        if (top && typeof top === 'number') sel += 'TOP ' + top + ' ';
        sel += (!columns || columns.length === 0) ? '*' : columns.join(', ');

        return sel + ' FROM ' + tableName + _whereClause(whereMap)
            + (orderBy ? (' ORDER BY ' + orderBy) : '');
    }

    /** WHERE句生成（whereMap が空なら空文字） */
    function _whereClause(whereMap) {
        if (TCP.Conv.isEmptyMap(whereMap)) return '';
        var keys = TCP.Conv.keys(whereMap);
        var parts = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var val = TCP.Conv.getVal(whereMap, key);
            if (val === null || val === undefined) {
                parts.push(key + ' IS NULL');
            } else if (_isNumeric(val)) {
                parts.push(key + ' = ' + String(val));
            } else {
                parts.push(key + " = '" + _esc(val) + "'");
            }
        }
        return ' WHERE ' + parts.join(' AND ');
    }

    /**
     * IN句を生成する（値はエスケープ）。空配列なら "(NULL)"（ヒット0件）。
     * @param {Array}   list      値配列
     * @param {Boolean} isNumeric 数値として扱うか（true でクォートなし）
     * @returns {String}          '('値1','値2',...)' 形式
     */
    function buildInClause(list, isNumeric) {
        if (!list || list.length === 0) return '(NULL)';
        var parts = [];
        for (var i = 0; i < list.length; i++) {
            parts.push(isNumeric ? String(Number(list[i])) : ("'" + _esc(String(list[i])) + "'"));
        }
        return '(' + parts.join(', ') + ')';
    }

    /** SQLパラメータ安全チェック（シングルクォート禁止） */
    function checkSqlParam(param) {
        if (param == null) return;
        if (String(param).indexOf("'") !== -1) {
            throw TCP.Error.create('E30004', 'SQLパラメータに不正な文字が含まれています。');
        }
    }

    /** SQL用エスケープ（TCP.Fmt委譲） */
    function escapeSql(v) { return _esc(v); }

    /** テーブルのカラム名リスト取得（dbo前提） */
    function getColumns(conn, tableName) {
        if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
            throw TCP.Error.create('E30005', 'Invalid table name: ' + tableName);
        }
        var sql = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS'
            + " WHERE TABLE_NAME = '" + tableName + "' AND TABLE_SCHEMA = 'dbo'";
        var list = TalonDbUtil.select(conn || _conn(), sql);
        return TCP.Conv.mapTo(list, function (row) {
            return String(TCP.Conv.getVal(row, 'COLUMN_NAME'));
        });
    }


    return {
        selectOne:      selectOne,
        selectList:     selectList,
        getCount:       getCount,
        paging:         paging,
        insert:         insert,
        update:         update,
        remove:         remove,
        setInsInitData: setInsInitData,
        setUpdInitData: setUpdInitData,
        buildSelectSQL: buildSelectSQL,
        buildInClause:  buildInClause,
        checkSqlParam:  checkSqlParam,
        escapeSql:      escapeSql,
        getColumns:     getColumns
    };
})();
