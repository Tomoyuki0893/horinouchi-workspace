/**
 * WFS_COMMON : [共通]ワークフローシステム
 *
 * 最終更新：　WFS_2_0_3
 * @version   2025/07/29
 */


//-------------------------------------------
//［共通］部品
//-------------------------------------------
var _USER_ID = '';
var _FUNC_ID = '';
function tln_com_escape(val) {
    var toStr = Object.prototype.toString;
    var tType = toStr.call( val ).slice(8, -1).toUpperCase();
    if (tType == 'STRING' ) {
        return val.replace( /'/g , "''" );
    } else {
        return val;
    }
}
function tln_com_nowdate() {
    var sysDate = new java.util.Date();
    return sysDate;
}
function tln_com_todate(val) {
    y = parseInt(val.split("/")[0]) - 1900;
    m = parseInt(val.split("/")[1]) - 1;
    d = parseInt(val.split("/")[2]);

    var sysDate = new java.util.Date(y,m,d);
    return sysDate;
}
function tln_com_func_id() {
    if (_FUNC_ID == '') {
        _FUNC_ID = TALON.getUserInfoMap().get("FUNC_ID");
    }
    return _FUNC_ID;
}
function tln_com_user_id() {
    if (_USER_ID == '') {
        var lineDataMap = TALON.getUserInfoMap();
        _USER_ID = getMapVal( lineDataMap , 'USER_ID' );
    }
    return _USER_ID;
}
function tln_com_log(val) {
    var log = TALON.getLogger();
    log.writeDebug(val);
}



//-------------------------------------------
//［共通］部品０
//-------------------------------------------
function tln_insertByMap(tbl, lst ,name) {
    if ( chkLowercase() ) {
        TalonDbUtil.insertByMap( TALON.getDbConfig(),  tbl.toLowerCase(), lst , name );
    } else {
        TalonDbUtil.insertByMap( TALON.getDbConfig(),  tbl              , lst , name );
    }
}
function tln_updateByMap(tbl, lst ,name ,where) {
    if ( chkLowercase() ) {
        TalonDbUtil.updateByMap( TALON.getDbConfig(),  tbl.toLowerCase(), lst , name , where);
    } else {
        TalonDbUtil.updateByMap( TALON.getDbConfig(),  tbl              , lst , name , where);
    }
}
function tln_deleteByMap(tbl, lst ,name) {
    if ( chkLowercase() ) {
        TalonDbUtil.deleteByMap( TALON.getDbConfig(),  tbl.toLowerCase(), lst , name );
    } else {
        TalonDbUtil.deleteByMap( TALON.getDbConfig(),  tbl              , lst , name );
    }
}



//-------------------------------------------
//［共通］処理０
//-------------------------------------------
function getMapVal(map , id) {
    var _rec = null;
    _rec = map[id];
    if (_rec == null) {
        _rec = map[id.toLowerCase()];
    }
    return _rec;
}
function setMapVal(map , id , val) {
    if ( TALON.getDbConfig().isPostgres() ) {
        map[ id.toLowerCase() ]   = val;
    } else {
        map[ id ]   = val;
    }
}
function putBindVal(key , val) {
    if ( TALON.getDbConfig().isPostgres() ) {
        TALON.putBindValue( key.toLowerCase() , val );
    } else {
        TALON.putBindValue( key , val );
    }
}
function chkLowercase() {
    if ( TALON.getDbConfig().isPostgres() ) {
        return true;
    } else if ( TALON.getDbConfig().isMy() ) {
        var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(),  "SELECT COUNT(*) AS CNT FROM TLN_M_NAME_MANAGER WHERE BINARY TABLE_NAME = BINARY 'WFS_M_AUTH' " );
        var lineDataMap = itemSelectList[0];
        var _CNT = getMapVal( lineDataMap , 'CNT' );
        if (_CNT == 0) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
function editLowList(obj) {
    if ( TALON.getDbConfig().isPostgres() ) {
        for(var lop = 0; lop < obj.length; lop++) {
            obj[lop] = obj[lop].toLowerCase();
        }
    }
    return obj;
}



//-------------------------------------------
//［共通］処理
//-------------------------------------------
//-------------------------------------------
//WFSワークフロー管理マスタ
function selectWFS_M_CONTROL(_WORK_ID) {
    var sql = 
        "SELECT " +
        "     WORK_ID          " + 
        ",    WORK_NM          " + 
        ",    LVL_ROWS         " + 
        ",    REJECT_KBN       " + 
        ",    DAIRI_FLG        " + 
        ",    MAIL_SEND_FLG    " + 
        ",    CREATED_DATE     " + 
        ",    CREATED_BY       " + 
        ",    CREATED_PRG_NM   " + 
        ",    UPDATED_DATE     " + 
        ",    UPDATED_BY       " + 
        ",    UPDATED_PRG_NM   " + 
        ",    MODIFY_COUNT     " + 
        "FROM WFS_M_CONTROL "       +
        "WHERE WORK_ID = '" + tln_com_escape( _WORK_ID ) + "'"
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
//WFSワークフロー階層マスタ
function selectWFS_M_LEVEL(_WORK_ID, _LVL, _ROUTE_ID) {
    var sql = 
        "SELECT " +
        "     WFS_M_LEVEL.WORK_ID           " + 
        ",    WFS_M_LEVEL.LVL               " + 
        ",    WFS_M_LEVEL.LVL_NM            " + 
        ",    CASE WHEN WFS_M_LEVEL.SYONIN_PTN IS NOT NULL THEN WFS_M_LEVEL.SYONIN_PTN ELSE WFS_M_AUTH.SYONIN_PTN END AS SYONIN_PTN " +
        ",    WFS_M_LEVEL.CREATED_DATE      " + 
        ",    WFS_M_LEVEL.CREATED_BY        " + 
        ",    WFS_M_LEVEL.CREATED_PRG_NM    " + 
        ",    WFS_M_LEVEL.UPDATED_DATE      " + 
        ",    WFS_M_LEVEL.UPDATED_BY        " + 
        ",    WFS_M_LEVEL.UPDATED_PRG_NM    " + 
        ",    WFS_M_LEVEL.MODIFY_COUNT      " + 
        "FROM WFS_M_LEVEL "       +
        "LEFT OUTER JOIN WFS_M_AUTH " + 
        "  ON WFS_M_LEVEL.WORK_ID = WFS_M_AUTH.WORK_ID " + 
        " AND WFS_M_LEVEL.LVL     = WFS_M_AUTH.LVL " + 
        " AND '" + tln_com_escape( _ROUTE_ID ) + "' = WFS_M_AUTH.ROUTE_ID " + 
        "WHERE WFS_M_LEVEL.WORK_ID = '" + tln_com_escape( _WORK_ID ) + "'" + 
        "  AND WFS_M_LEVEL.LVL     = '" + tln_com_escape( _LVL )     + "'"
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}
function selectWFS_M_LEVEL_NEXTPRE(_WORK_ID,_ROUTE_ID,_LVL,_FLG) {
    //_FLG : 1 = 次のレベル　/ ELSE = 前のレベル
    var wh = '';
    if (_FLG == '1') {
        wh = "  AND WFS_M_LEVEL.LVL > '" + _LVL + "' " + 
             "ORDER BY WFS_M_LEVEL.LVL ";
    } else {
        wh = "  AND WFS_M_LEVEL.LVL < '" + _LVL + "' " + 
             "ORDER BY WFS_M_LEVEL.LVL DESC ";
    }
    var sql = 
        "SELECT " +
        "  WFS_M_LEVEL.LVL  " + 
        "FROM WFS_M_LEVEL   " +
        "INNER JOIN WFS_M_AUTH " + 
        "   ON WFS_M_AUTH.WORK_ID    = WFS_M_LEVEL.WORK_ID " +
        "  AND WFS_M_AUTH.LVL        = WFS_M_LEVEL.LVL " + 
        "  AND WFS_M_AUTH.ROUTE_ID = '" + tln_com_escape( _ROUTE_ID ) + "'" + 
        "WHERE WFS_M_LEVEL.WORK_ID = '" + tln_com_escape( _WORK_ID  ) + "'" + 
        wh
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
//WFSワークフローグループ権限割り付けマスタ
function selectWFS_M_AUTH(_WORK_ID,_LVL,_ROUTE_ID) {
    var sql = 
        "SELECT " +
        "     WORK_ID       " + 
        ",    LVL           " + 
        ",    ROUTE_ID    " + 
        ",    USR_GRP_ID    " + 
        ",    CREATED_DATE      " + 
        ",    CREATED_BY        " + 
        ",    CREATED_PRG_NM    " + 
        ",    UPDATED_DATE      " + 
        ",    UPDATED_BY        " + 
        ",    UPDATED_PRG_NM    " + 
        ",    MODIFY_COUNT      " + 
        "FROM WFS_M_AUTH "       +
        "WHERE WORK_ID    = '" + tln_com_escape( _WORK_ID  )  + "'" + 
        "  AND LVL        = '" + tln_com_escape( _LVL      )  + "'" + 
        "  AND ROUTE_ID   = '" + tln_com_escape( _ROUTE_ID )  + "'" 
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
//WFSワークフローグループ権限割り付けマスタ
function selectWFS_M_AUTH_TANTO_CNT(_WORK_ID,_LVL,_ROUTE_ID,_OBJECT_ID) {
    //承認者指定を行っている場合はその人数が次階層に移動する基準となる
    var sql = 
        "SELECT  " + 
        " WFS_M_AUTH.WORK_ID " + 
        ",WFS_M_AUTH.LVL " + 
        ",WFS_M_AUTH.ROUTE_ID " + 
        ",WFS_M_AUTH.USR_GRP_ID " + 
        ",CASE WHEN WFS_T_WORKAPPROVALRES_CNT.CNT IS NULL THEN COUNT(*) ELSE WFS_T_WORKAPPROVALRES_CNT.CNT END as TANTO_CNT  " + 
        "FROM WFS_M_AUTH " + 
        "INNER JOIN WFS_M_USR_GRP_DEPDTL " + 
        "   ON WFS_M_USR_GRP_DEPDTL.USR_GRP_ID = WFS_M_AUTH.USR_GRP_ID " + 
        "LEFT OUTER JOIN ( " + 
        "   SELECT  " + 
        "      WORK_ID " + 
        "     ,OBJECT_ID " + 
        "     ,LVL " + 
        "     ,COUNT(*) AS CNT  " + 
        "   FROM WFS_T_WORKAPPROVALRES  " + 
        "   GROUP BY  " + 
        "      WORK_ID " + 
        "     ,OBJECT_ID " + 
        "     ,LVL " + 
        " ) WFS_T_WORKAPPROVALRES_CNT " + 
        "   ON WFS_M_AUTH.WORK_ID    = WFS_T_WORKAPPROVALRES_CNT.WORK_ID " + 
        "  AND '" + _OBJECT_ID + "'  = WFS_T_WORKAPPROVALRES_CNT.OBJECT_ID " + 
        "  AND WFS_M_AUTH.LVL        = WFS_T_WORKAPPROVALRES_CNT.LVL " + 
        "WHERE WFS_M_AUTH.WORK_ID    = '" + tln_com_escape( _WORK_ID  ) + "'" + 
        "  AND WFS_M_AUTH.LVL        = '" + tln_com_escape( _LVL      ) + "'" + 
        "  AND WFS_M_AUTH.ROUTE_ID   = '" + tln_com_escape( _ROUTE_ID ) + "'"  + 
        "GROUP BY  " + 
        " WFS_M_AUTH.WORK_ID " + 
        ",WFS_M_AUTH.LVL " + 
        ",WFS_M_AUTH.ROUTE_ID " + 
        ",WFS_M_AUTH.USR_GRP_ID " +
        ",WFS_T_WORKAPPROVALRES_CNT.CNT "
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
function selectWFS_T_WORKFLOW(_WORK_ID,_OBJECT_ID,_STEP) {
    var sql = 
        "SELECT " +
        "     WORK_ID          " + 
        ",    OBJECT_ID        " + 
        ",    STEP             " + 
        ",    OBJECT_NM        " + 
        ",    ROUTE_ID       " + 
        ",    USR_ID           " + 
        ",    STATUS           " + 
        ",    LVL              " + 
        ",    APP_MEMO         " + 
        ",    RES_MEMO         " + 
        ",    REJECT_KBN       " + 
        ",    CURENT_FLG       " + 
        ",    CREATED_DATE     " + 
        ",    CREATED_BY       " + 
        ",    CREATED_PRG_NM   " + 
        ",    UPDATED_DATE     " + 
        ",    UPDATED_BY       " + 
        ",    UPDATED_PRG_NM   " + 
        ",    MODIFY_COUNT     " + 
        "FROM WFS_T_WORKFLOW "       +
        "WHERE WORK_ID   = '" + tln_com_escape( _WORK_ID   ) + "'" + 
        "  AND OBJECT_ID = '" + tln_com_escape( _OBJECT_ID ) + "'" + 
        "  AND STEP      = '" + tln_com_escape( _STEP      ) + "'" 
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
if ( TALON.getDbConfig().isPostgres() ) {
    var itemColName_WFS_T_WORKFLOW = [
         'work_id'
        ,'object_id'
        ,'step'
        ,'object_nm'
        ,'route_id'
        ,'usr_id'
        ,'status'
        ,'lvl'
        ,'app_memo'
        ,'res_memo'
        ,'curent_flg'
        ,'active_flg'
        ,'created_date'
        ,'created_by'
        ,'created_prg_nm'
        ,'updated_date'
        ,'updated_by'
        ,'updated_prg_nm'
        ,'modify_count'
    ];
} else {
    var itemColName_WFS_T_WORKFLOW = [
         'WORK_ID'
        ,'OBJECT_ID'
        ,'STEP'
        ,'OBJECT_NM'
        ,'ROUTE_ID'
        ,'USR_ID'
        ,'STATUS'
        ,'LVL'
        ,'APP_MEMO'
        ,'RES_MEMO'
        ,'CURENT_FLG'
        ,'ACTIVE_FLG'
        ,'CREATED_DATE'
        ,'CREATED_BY'
        ,'CREATED_PRG_NM'
        ,'UPDATED_DATE'
        ,'UPDATED_BY'
        ,'UPDATED_PRG_NM'
        ,'MODIFY_COUNT'
    ];
}

//-------------------------------------------
function insertWFS_T_WORKFLOW(itemDataList) {
    setMapVal( itemDataList , 'CREATED_DATE'   , tln_com_nowdate() );
    setMapVal( itemDataList , 'CREATED_BY'     , tln_com_user_id() );
    setMapVal( itemDataList , 'CREATED_PRG_NM' , tln_com_func_id() );
    setMapVal( itemDataList , 'UPDATED_DATE'   , tln_com_nowdate() );
    setMapVal( itemDataList , 'UPDATED_BY'     , tln_com_user_id() );
    setMapVal( itemDataList , 'UPDATED_PRG_NM' , tln_com_func_id() );
    setMapVal( itemDataList , 'MODIFY_COUNT'   , 1                 );

    setMapVal( itemDataList , 'ACTIVE_FLG'     , '1'               );

    tln_insertByMap( 'WFS_T_WORKFLOW', itemDataList , itemColName_WFS_T_WORKFLOW );
}

//-------------------------------------------
function updateWFS_T_WORKFLOW(itemDataList) {

    setMapVal( itemDataList , 'UPDATED_DATE'   , tln_com_nowdate() );
    setMapVal( itemDataList , 'UPDATED_BY'     , tln_com_user_id() );
    setMapVal( itemDataList , 'UPDATED_PRG_NM' , tln_com_func_id() );
    setMapVal( itemDataList , 'MODIFY_COUNT'   , 1                 );

    if ( TALON.getDbConfig().isPostgres() ) {
        var whereTbl1 = [ null, '=' , 'work_id'   ];
        var whereTbl2 = [ null, '=' , 'object_id' ];
        var whereTbl3 = [ null, '=' , 'step' ];
    } else {
        var whereTbl1 = [ null, '=' , 'WORK_ID'   ];
        var whereTbl2 = [ null, '=' , 'OBJECT_ID' ];
        var whereTbl3 = [ null, '=' , 'STEP' ];
    }

    var whereList = new Array();
    whereList.push(whereTbl1);
    whereList.push(whereTbl2);
    whereList.push(whereTbl3);

    tln_updateByMap( 'WFS_T_WORKFLOW', itemDataList , itemColName_WFS_T_WORKFLOW , whereList );
}

//-------------------------------------------
function updateWFS_T_WORKFLOW_CURENT_FLG(_WORK_ID, _OBJECT_ID) {
    TalonDbUtil.update( TALON.getDbConfig(),  "update WFS_T_WORKFLOW set CURENT_FLG = '0' where WORK_ID = '" + tln_com_escape( _WORK_ID ) + "' and OBJECT_ID = '" + tln_com_escape( _OBJECT_ID ) + "'" );
}

//-------------------------------------------
function updateWFS_T_WORKFLOW_ACTIVE_FLG(_WORK_ID, _OBJECT_ID, _TRG_LVL) {
    TalonDbUtil.update( TALON.getDbConfig(),  
            "update WFS_T_WORKFLOW set ACTIVE_FLG = '0' " +
            "where WORK_ID   = '" + tln_com_escape( _WORK_ID   ) + "' " +
            "  and OBJECT_ID = '" + tln_com_escape( _OBJECT_ID ) + "'" +
            "  and LVL      >=  " + tln_com_escape( _TRG_LVL   ) + ""
    );
}

//-------------------------------------------
function selectWFS_T_WORKFLOW_CURENT_DATA(_WORK_ID,_OBJECT_ID) {
    //承認者も取得する（連続承認者の時の承認省略に使用→and承認の場合は発動しない為MAXで取得）
    var sql = 
        "SELECT " +
        "  COUNT(*) AS CURENT_DATA_CNT " + 
        " ,MAX(SHONIN_ID) AS SHONIN_ID " + 
        "FROM WFS_T_WORKFLOW "       +
        "WHERE WORK_ID    = '" + tln_com_escape( _WORK_ID   ) + "'" + 
        "  AND OBJECT_ID  = '" + tln_com_escape( _OBJECT_ID ) + "'" + 
        "  AND CURENT_FLG = '1'"
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
function selectWFS_T_WORKFLOW_CURENT_MY_DATA(_WORK_ID,_OBJECT_ID,_EXEC_BY) {
    var sql = 
        "SELECT " +
        " COUNT(*) AS MY_DATA_CNT " + 
        "FROM WFS_T_WORKFLOW "       +
        "WHERE WORK_ID    = '" + tln_com_escape( _WORK_ID   ) + "'" + 
        "  AND OBJECT_ID  = '" + tln_com_escape( _OBJECT_ID ) + "'" + 
        "  AND SHONIN_ID  = '" + tln_com_escape( _EXEC_BY   ) + "'" + 
        "  AND CURENT_FLG = '1'" + 
        "  AND STATUS <> '4'"
    ;


    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
//取戻時、対象のレベルを取得
function selectWFS_T_WORKFLOW_MY_LVL_BACK(_WORK_ID,_ROUTE_ID,_NOW_LVL,_SHONIN_ID) {
    var sql = 
        "SELECT  " + 
        "  WFS_M_AUTH.WORK_ID " + 
        " ,WFS_M_AUTH.ROUTE_ID " + 
        " ,MAX(WFS_M_AUTH.LVL) AS LVL " + 
        "FROM WFS_M_AUTH " + 
        "INNER JOIN WFS_M_USR_GRP_DEPDTL " + 
        "   ON WFS_M_AUTH.USR_GRP_ID = WFS_M_USR_GRP_DEPDTL.USR_GRP_ID " + 
        "  AND ( " + 
        "       WFS_M_USR_GRP_DEPDTL.USR_ID = '" + tln_com_escape( _SHONIN_ID ) + "' " + 
        "       OR  " + 
        "       1 = (SELECT CASE WHEN ADMIN_USER_ID IS NULL THEN 0 ELSE 1 END FROM WFS_M_USR_ADMIN WHERE ADMIN_USER_ID = '" + tln_com_escape( _SHONIN_ID ) + "' ) " + 
        "      ) " + 
        "WHERE WFS_M_AUTH.WORK_ID  = '" + tln_com_escape( _WORK_ID  ) + "' " + 
        "  AND WFS_M_AUTH.ROUTE_ID = '" + tln_com_escape( _ROUTE_ID ) + "' " + 
        "  AND WFS_M_AUTH.LVL     <=  " + tln_com_escape( _NOW_LVL  ) + " -1 " + 
        "GROUP BY  " + 
        "  WFS_M_AUTH.WORK_ID " + 
        " ,WFS_M_AUTH.ROUTE_ID "
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//引上げ時、対象のレベルを取得
function selectWFS_T_WORKFLOW_MY_LVL_PLUP(_WORK_ID,_ROUTE_ID,_NOW_LVL,_SHONIN_ID) {
    var sql = 
        "SELECT  " + 
        "  WFS_M_AUTH.WORK_ID " + 
        " ,WFS_M_AUTH.ROUTE_ID " + 
        " ,MIN(WFS_M_AUTH.LVL) AS LVL " + 
        "FROM WFS_M_AUTH " + 
        "INNER JOIN WFS_M_USR_GRP_DEPDTL " + 
        "   ON WFS_M_AUTH.USR_GRP_ID = WFS_M_USR_GRP_DEPDTL.USR_GRP_ID " + 
        "  AND ( " + 
        "       WFS_M_USR_GRP_DEPDTL.USR_ID = '" + tln_com_escape( _SHONIN_ID ) + "' " + 
        "       OR  " + 
        "       1 = (SELECT CASE WHEN ADMIN_USER_ID IS NULL THEN 0 ELSE 1 END FROM WFS_M_USR_ADMIN WHERE ADMIN_USER_ID = '" + tln_com_escape( _SHONIN_ID ) + "' ) " + 
        "      ) " + 
        "WHERE WFS_M_AUTH.WORK_ID  = '" + tln_com_escape( _WORK_ID  ) + "' " + 
        "  AND WFS_M_AUTH.ROUTE_ID = '" + tln_com_escape( _ROUTE_ID ) + "' " + 
        "  AND WFS_M_AUTH.LVL      >  " + tln_com_escape( _NOW_LVL  ) + " " + 
        "GROUP BY  " + 
        "  WFS_M_AUTH.WORK_ID " + 
        " ,WFS_M_AUTH.ROUTE_ID "
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}

//-------------------------------------------
//承認者連続時省略フラグ制御用、同一ルートで承認者が承認可能なリスト
function selectWFS_T_WORKFLOW_APPROVAL(_WORK_ID,_ROUTE_ID,_LVL,_SHONIN_ID, _OBJECT_ID, _LOGIN_USER_ID) {
    //承認者も取得する（連続承認者の時の承認省略に使用→and承認の場合は発動しない為MAXで取得）
    var sql = 
        "SELECT  " + 
        "  WFS_M_CONTROL.WORK_ID " + 
        " ,WFS_M_CONTROL.WORK_NM " + 
        " ,WFS_M_AUTH.ROUTE_ID " + 
        " ,WFS_M_AUTH.LVL " + 
        " ,WFS_M_USR_GRP_DEPDTL.USR_GRP_ID " + 
        " ,WFS_M_USR_GRP_DEPDTL.USR_ID " + 
        " ,CASE WHEN WFS_M_LEVEL.SYONIN_PTN IS NOT NULL THEN WFS_M_LEVEL.SYONIN_PTN ELSE WFS_M_AUTH.SYONIN_PTN END AS SYONIN_PTN " +
        "FROM WFS_M_CONTROL " + 
        "INNER JOIN WFS_M_AUTH " + 
        "   ON WFS_M_CONTROL.WORK_ID = WFS_M_AUTH.WORK_ID " + 
        "  AND '" + _ROUTE_ID + "'   = WFS_M_AUTH.ROUTE_ID " + 
        "  AND " + _LVL + "         <= WFS_M_AUTH.LVL " + 
        "INNER JOIN WFS_M_USR_GRP_DEPDTL " + 
        "   ON WFS_M_AUTH.USR_GRP_ID   = WFS_M_USR_GRP_DEPDTL.USR_GRP_ID " + 
        "  AND '" + _SHONIN_ID + "'    = WFS_M_USR_GRP_DEPDTL.USR_ID " + 
        "LEFT OUTER JOIN WFS_M_LEVEL " + 
        "  ON WFS_M_AUTH.WORK_ID = WFS_M_LEVEL.WORK_ID " + 
        " AND WFS_M_AUTH.LVL     = WFS_M_LEVEL.LVL " + 
        " " + 
        "LEFT OUTER JOIN ( " + 
        "  SELECT  " + 
        "     WORK_ID " + 
        "    ,OBJECT_ID " + 
        "    ,LVL " + 
        "    ,COUNT(*) AS CNT  " + 
        "  FROM WFS_T_WORKAPPROVALRES  " + 
        "  GROUP BY  " + 
        "     WORK_ID " + 
        "    ,OBJECT_ID " + 
        "    ,LVL " + 
        ") WFS_T_WORKAPPROVALRES_CNT " + 
        "  ON WFS_M_AUTH.WORK_ID    = WFS_T_WORKAPPROVALRES_CNT.WORK_ID " + 
        " AND '" + _OBJECT_ID + "'  = WFS_T_WORKAPPROVALRES_CNT.OBJECT_ID " + 
        " AND WFS_M_AUTH.LVL        = WFS_T_WORKAPPROVALRES_CNT.LVL " + 
        " " + 
        "LEFT OUTER JOIN WFS_T_WORKAPPROVALRES " + 
        "  ON WFS_M_AUTH.WORK_ID          = WFS_T_WORKAPPROVALRES.WORK_ID " + 
        " AND '" + _OBJECT_ID + "'        = WFS_T_WORKAPPROVALRES.OBJECT_ID " + 
        " AND WFS_M_AUTH.LVL              = WFS_T_WORKAPPROVALRES.LVL " + 
        " AND WFS_M_USR_GRP_DEPDTL.USR_ID = WFS_T_WORKAPPROVALRES.USR_ID " + 
        " AND ( " + 
        "   WFS_T_WORKAPPROVALRES.USR_ID = '" + tln_com_escape( _LOGIN_USER_ID ) + "' " + 
        "   OR " + 
        "   WFS_T_WORKAPPROVALRES.USR_ID IN (SELECT USR_ID FROM WFS_M_USR_DAIRI WHERE DAIRI_USR_ID = '" + tln_com_escape( _LOGIN_USER_ID ) + "' AND YUKO_KBN = '1' AND SHONIN_FLG = '1') " + 
        "  ) " + 
        " " + 
        "WHERE WFS_M_CONTROL.WORK_ID      = '" + tln_com_escape( _WORK_ID ) + "' " + 
        "  AND WFS_M_CONTROL.APPROVAL_FLG = '1' " + 
        "  AND ( " + 
        "    WFS_T_WORKAPPROVALRES_CNT.CNT IS NULL  " + 
        "    OR  " + 
        "    WFS_T_WORKAPPROVALRES_CNT.CNT = 0 " + 
        "    OR  " + 
        "    (  " + 
        "        WFS_T_WORKAPPROVALRES_CNT.CNT IS NOT NULL  " + 
        "        AND  " + 
        "        WFS_T_WORKAPPROVALRES.WORK_ID IS NOT NULL " + 
        "    ) " + 
        "  ) " + 
        "ORDER BY LVL "
    ;
    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig(), sql);

    return itemSelectList;
}
function updateWFS_T_WORKFLOW_STATUS(_WORK_ID, _OBJECT_ID, _STATUS, _STEP, _RES_MEMO, _SHONIN_ID) {
    TalonDbUtil.update( TALON.getDbConfig(),  
        "update WFS_T_WORKFLOW set " + 
        "  STATUS    = '" + tln_com_escape( _STATUS    ) + "' " + 
        " ,RES_MEMO  = '" + tln_com_escape( _RES_MEMO  ) + "' " + 
        " ,SHONIN_ID = '" + tln_com_escape( _SHONIN_ID ) + "' " + 
        "where WORK_ID   = '" + tln_com_escape( _WORK_ID   ) + "' " +
        "  and OBJECT_ID = '" + tln_com_escape( _OBJECT_ID ) + "' " + 
        "  and STEP      = '" + tln_com_escape( _STEP      ) + "' " 
    );
}


function execWorkFlow() {
    //入力値取得
    var itemBlockListHed = TALON.getBlockData_List(1);
    var lineDataMap = itemBlockListHed[0];

    return execWorkFlowMain(lineDataMap);
}

var _WFS_SYORI_KBN_SHINSEI      = '10';        //申請
var _WFS_SYORI_KBN_SHONIN       = '20';        //承認（次階層あり）
var _WFS_SYORI_KBN_KESSAI       = '21';        //承認（次階層なし＝決裁）
var _WFS_SYORI_KBN_SASHIMODOSHI = '30';        //差戻
var _WFS_SYORI_KBN_HININ        = '90';        //否認
var _WFS_SYORI_KBN_TORIMODOSHIS = '50';        //取戻（申請者取戻）
var _WFS_SYORI_KBN_TORIKESHI    = '60';        //取消
var _WFS_SYORI_KBN_TORIMODOSHIS = '70';        //取戻（承認者取戻）
var _WFS_SYORI_KBN_HIKIAGE      = '80';        //引上

function execWorkFlowMain(lineDataMap) {
    //入力値取得
    //var itemBlockListHed = TALON.getBlockData_List(1);
    //var lineDataMap = itemBlockListHed[0];

    var lineUserDataMap = TALON.getUserInfoMap();
    var _LOGIN_USER_ID  = getMapVal( lineUserDataMap , 'USER_ID' );

    //承認結果が申請の場合
    if (getMapVal( lineDataMap , 'STATUS' ) == '1') {

        //階層テーブルにて次のレベルが存在するかチェック
        var itemSelectList = selectWFS_M_LEVEL_NEXTPRE( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'ROUTE_ID' ), getMapVal( lineDataMap , 'LVL' ), '1');
        if (itemSelectList.length > 0) {
            var lineSelectDataMap = itemSelectList[0];
            var _NX_LVL = getMapVal( lineSelectDataMap , 'LVL' );

            //次期対象以外のCURENT_FLGを０に更新
            updateWFS_T_WORKFLOW_CURENT_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ));


            //データありの場合のみ　次レコード作成
            var itemDataList = new Array();

            setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'   )       );
            setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID' )       );
            setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
            setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM' )       );
            setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID'  )       );
            setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'    )       );
            setMapVal( itemDataList , 'STATUS'      ,   '4'      );
            setMapVal( itemDataList , 'LVL'         ,   _NX_LVL  );
            setMapVal( itemDataList , 'APP_MEMO'    ,   getMapVal( lineDataMap , 'APP_MEMO'  )       );
            setMapVal( itemDataList , 'CURENT_FLG'  ,   '1' );

            insertWFS_T_WORKFLOW(itemDataList);

            execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_SHINSEI);
        }
    }

    //承認結果が取戻の場合（申請者が取り戻す）
    if ( getMapVal( lineDataMap , 'STATUS' ) == '5' ) {

        //次期対象以外のCURENT_FLGを０に更新
        updateWFS_T_WORKFLOW_CURENT_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ) );

        //申請者に戻すのでLVLが１以上のデータのACTIVE_FLGをゼロに更新(18/08/07)
        updateWFS_T_WORKFLOW_ACTIVE_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID'), 1 );

        //データありの場合のみ　次レコード作成
        var itemDataList = new Array();

        setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'   )      );
        setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID' )      );
        setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
        setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM' )      );
        setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID'  )      );
        setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'    )      );
        setMapVal( itemDataList , 'STATUS'      ,   '4'  );
        setMapVal( itemDataList , 'LVL'         ,    1   );
        setMapVal( itemDataList , 'APP_MEMO'    ,   ''   );
        setMapVal( itemDataList , 'CURENT_FLG'  ,   '1'  );

        insertWFS_T_WORKFLOW(itemDataList);

        execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_TORIMODOSHIS);
    }

    //承認結果が取戻の場合（承認者が取り戻す）
    if ( getMapVal( lineDataMap , 'STATUS' ) == '7' ) {

        //次期対象以外のCURENT_FLGを０に更新
        updateWFS_T_WORKFLOW_CURENT_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ) );

        ////取戻時、対象のレベルを取得
        var itemSelectList    = selectWFS_T_WORKFLOW_MY_LVL_BACK( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'ROUTE_ID'  ), getMapVal( lineDataMap , 'LVL' ), tln_com_user_id() );

        var lineSelectDataMap = itemSelectList[0];
        var _MY_LVL       = getMapVal( lineSelectDataMap , 'LVL' );

        //指定したレベルまで戻すのでLVLがその値以上のデータのACTIVE_FLGをゼロに更新(18/08/07)
        updateWFS_T_WORKFLOW_ACTIVE_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID'), _MY_LVL );

        //データありの場合のみ　次レコード作成
        var itemDataList = new Array();

        setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'   )      );
        setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID' )      );
        setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
        setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM' )      );
        setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID'  )      );
        setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'    )      );
        setMapVal( itemDataList , 'STATUS'      ,   '4'  );
        setMapVal( itemDataList , 'LVL'         ,    _MY_LVL );
        setMapVal( itemDataList , 'APP_MEMO'    ,   ''   );
        setMapVal( itemDataList , 'CURENT_FLG'  ,   '1'  );

        insertWFS_T_WORKFLOW(itemDataList);

        execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_TORIMODOSHIS);
    }

    //承認結果が引上げの場合（承認者が引き上げる）
    if ( getMapVal( lineDataMap , 'STATUS' ) == '8' ) {

        //次期対象以外のCURENT_FLGを０に更新
        updateWFS_T_WORKFLOW_CURENT_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ) );

        ////引上時、対象のレベルを取得
        var itemSelectList    = selectWFS_T_WORKFLOW_MY_LVL_PLUP( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'ROUTE_ID'  ), getMapVal( lineDataMap , 'LVL' ), tln_com_user_id() );

        var lineSelectDataMap = itemSelectList[0];
        var _MY_LVL       = getMapVal( lineSelectDataMap , 'LVL' );

        //データありの場合のみ　次レコード作成
        var itemDataList = new Array();

        setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'   )      );
        setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID' )      );
        setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
        setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM' )      );
        setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID'  )      );
        setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'    )      );
        setMapVal( itemDataList , 'STATUS'      ,   '4'  );
        setMapVal( itemDataList , 'LVL'         ,    _MY_LVL );
        setMapVal( itemDataList , 'APP_MEMO'    ,   ''   );
        setMapVal( itemDataList , 'CURENT_FLG'  ,   '1'  );

        insertWFS_T_WORKFLOW(itemDataList);

        execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_HIKIAGE);
    }




    //承認、差戻、否認の処理で対象階層がAND承認の場合、すでに同一承認者で処理されていればエラーとする。
    if (
          ( getMapVal( lineDataMap , 'STATUS' ) == '2') || 
          ( getMapVal( lineDataMap , 'STATUS' ) == '3') || 
          ( getMapVal( lineDataMap , 'STATUS' ) == '9') 
       ) {
        var itemSelectList    = selectWFS_M_LEVEL( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'LVL' ), getMapVal( lineDataMap , 'ROUTE_ID'  ) );
        var lineSelectDataMap = itemSelectList[0];
        var _SYONIN_PTN       = getMapVal( lineSelectDataMap , 'SYONIN_PTN' );

        if (_SYONIN_PTN == '2') {

            //同一ユーザーで既に当サイクルで承認されている場合はエラーとする  
            //→同一ユーザーを同一承認者ID(SHONIN_ID)で判断するようにする

            var itemSelectList    = selectWFS_T_WORKFLOW_CURENT_MY_DATA( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ), getMapVal( lineDataMap , 'SHONIN_ID' ) );
            var lineSelectDataMap = itemSelectList[0];
            var _MY_DATA_CNT      = getMapVal( lineSelectDataMap , 'MY_DATA_CNT' );

            //ここまでの処理で１件は登録されている為
            if ( _MY_DATA_CNT != 1 ) {
                TALON.addErrorMsg( "既に指定された承認者で「承認／差戻／否認」処理が実施されている為、実行する事は出来ません。" );
                TALON.setIsSuccess(false);

                return false;
            }
        }
    }




    //承認結果が承認の場合
    if ( getMapVal( lineDataMap , 'STATUS' ) == '2') {
        var next_flg = '0';

        var itemSelectList    = selectWFS_M_LEVEL( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'LVL' ), getMapVal( lineDataMap , 'ROUTE_ID'  ) );
        var lineSelectDataMap = itemSelectList[0];
        var _SYONIN_PTN       = getMapVal( lineSelectDataMap , 'SYONIN_PTN' );

        var itemSelectList    = selectWFS_T_WORKFLOW_CURENT_DATA( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ) );
        var lineSelectDataMap = itemSelectList[0];
        var _CURENT_DATA_CNT  = getMapVal( lineSelectDataMap , 'CURENT_DATA_CNT' );
        var _SHONIN_ID        = getMapVal( lineSelectDataMap , 'SHONIN_ID' );

        var itemSelectList    = selectWFS_M_AUTH_TANTO_CNT( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'LVL' ), getMapVal( lineDataMap , 'ROUTE_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' )  );
        var lineSelectDataMap = itemSelectList[0];
        var _TANTO_CNT        = getMapVal( lineSelectDataMap , 'TANTO_CNT' );


        if (_SYONIN_PTN == '1') {
            next_flg = '1';
        }
        if (_SYONIN_PTN == '2') {

            // * 上位でチェックするのでここでは実施しない
            // * -------------------------------------------
            // * //同一ユーザーで既に当サイクルで承認されている場合はエラーとする  →同一ユーザーを同一承認者ID(SHONIN_ID)で判断するようにする
            // * var lineUserDataMap = TALON.getUserInfoMap();
            // * var _LOGIN_USER_ID  = getMapVal( lineUserDataMap , 'USER_ID' );
            // * 
            // * //var itemSelectList  = selectWFS_T_WORKFLOW_CURENT_MY_DATA( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ), _LOGIN_USER_ID );
            // * var itemSelectList    = selectWFS_T_WORKFLOW_CURENT_MY_DATA( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ), getMapVal( lineDataMap , 'SHONIN_ID' ) );
            // * var lineSelectDataMap = itemSelectList[0];
            // * var _MY_DATA_CNT      = getMapVal( lineSelectDataMap , 'MY_DATA_CNT' );
            // * 
            // * //ここまでの処理で１件は登録されている為
            // * if ( _MY_DATA_CNT != 1 ) {
            // *     TALON.addErrorMsg( "既に指定された承認者で「承認」処理が実施されている為、実行する事は出来ません。" );
            // *     TALON.setIsSuccess(false);
            // * 
            // *     return false;
            // * }

            if (_CURENT_DATA_CNT >= _TANTO_CNT) {
                next_flg = '1';
            }
        }

        if (next_flg == '1') {
            //階層テーブルにて次のレベルが存在するかチェック
            var itemSelectList = selectWFS_M_LEVEL_NEXTPRE( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'ROUTE_ID' ), getMapVal( lineDataMap , 'LVL' ), '1');
            if (itemSelectList.length > 0) {

                var lineSelectDataMap = itemSelectList[0];
                var _NX_LVL = getMapVal( lineSelectDataMap , 'LVL' );

                //次期対象以外のCURENT_FLGを０に更新
                updateWFS_T_WORKFLOW_CURENT_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ) );


                //データありの場合のみ　次レコード作成
                var itemDataList = new Array();

                setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'   )       );
                setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID' )       );
                setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1) );
                setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM' )       );
                setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID'  )       );
                setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'    )       );
                setMapVal( itemDataList , 'STATUS'      ,   '4'       );
                setMapVal( itemDataList , 'LVL'         ,   _NX_LVL   );
                setMapVal( itemDataList , 'APP_MEMO'    ,   getMapVal( lineDataMap , 'APP_MEMO' )        );
                setMapVal( itemDataList , 'CURENT_FLG'  ,   '1'       );

                insertWFS_T_WORKFLOW(itemDataList);




                //----------------------------------------------------------
                // 以降の階層で今回の承認者が実施可能な階層を抽出
                // OR承認の場合に発動

                var _T_WORK_ID   = getMapVal( lineDataMap , 'WORK_ID'   );
                var _T_OBJECT_ID = getMapVal( lineDataMap , 'OBJECT_ID' );
                var _T_OBJECT_NM = getMapVal( lineDataMap , 'OBJECT_NM' );
                var _T_ROUTE_ID  = getMapVal( lineDataMap , 'ROUTE_ID'  );
                var _T_USR_ID    = getMapVal( lineDataMap , 'USR_ID'    );
                var _T_APP_MEMO  = getMapVal( lineDataMap , 'APP_MEMO'  );
                var _T_RES_MEMO  = getMapVal( lineDataMap , 'RES_MEMO'  );

                var _T_STEP = parseInt( getMapVal( lineDataMap , 'STEP' ) + 1);
                var _T_LVL  = parseInt(_NX_LVL);
                if (_SYONIN_PTN == '1') {

                    var itemSelectListApproval = selectWFS_T_WORKFLOW_APPROVAL( _T_WORK_ID, _T_ROUTE_ID, _NX_LVL, _SHONIN_ID, _T_OBJECT_ID, _LOGIN_USER_ID);
                    for (var i = 0; i < itemSelectListApproval.length; i++) {
                        var lineDataMap = itemSelectListApproval[i];

                        var _NOW_SYONIN_PTN = getMapVal( lineDataMap , 'SYONIN_PTN' );

                        if ( _T_LVL == parseInt( getMapVal( lineDataMap , 'LVL' ) ) && (_NOW_SYONIN_PTN == '1') ) {

                            //承認待ち階層にも承認者の権限あり

                            //上位で作成した承認待ちデータを承認済みに更新
                            //以下を更新
                            // ｽﾃｰﾀｽ＝2承認
                            // 理由＝入力値
                            // 承認者
                            updateWFS_T_WORKFLOW_STATUS( _T_WORK_ID, _T_OBJECT_ID, '2', _T_STEP , _T_RES_MEMO , _SHONIN_ID);

                            //階層テーブルにて次のレベルが存在するかチェック
                            var itemSelectList = selectWFS_M_LEVEL_NEXTPRE( _T_WORK_ID, _T_ROUTE_ID, _T_LVL, '1');
                            if (itemSelectList.length > 0) {

                                var lineSelectDataMap = itemSelectList[0];
                                var _NX_LVL = getMapVal( lineSelectDataMap , 'LVL' );

                                _T_STEP++;

                                //次期対象以外のCURENT_FLGを０に更新
                                updateWFS_T_WORKFLOW_CURENT_FLG( _T_WORK_ID, _T_OBJECT_ID );

                                //データありの場合のみ　次レコード作成
                                var itemDataList = new Array();

                                setMapVal( itemDataList , 'WORK_ID'     ,   _T_WORK_ID       );
                                setMapVal( itemDataList , 'OBJECT_ID'   ,   _T_OBJECT_ID     );
                                setMapVal( itemDataList , 'STEP'        ,   _T_STEP          );
                                setMapVal( itemDataList , 'OBJECT_NM'   ,   _T_OBJECT_NM     );
                                setMapVal( itemDataList , 'ROUTE_ID'    ,   _T_ROUTE_ID      );
                                setMapVal( itemDataList , 'USR_ID'      ,   _T_USR_ID        );
                                setMapVal( itemDataList , 'STATUS'      ,   '4'              );
                                setMapVal( itemDataList , 'LVL'         ,   _NX_LVL          );
                                setMapVal( itemDataList , 'APP_MEMO'    ,   _T_APP_MEMO      );
                                setMapVal( itemDataList , 'CURENT_FLG'  ,   '1'              );

                                insertWFS_T_WORKFLOW(itemDataList);
                            }

                            _T_LVL++;

                        } else {
                            //連続していないので終了
                            break;
                        }
                    }
                }
                //----------------------------------------------------------




                execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_SHONIN);

             } else {
                //決裁
                execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_KESSAI);
             }

        } else {
            //同じ階層で　次レコード作成
            var itemDataList = new Array();

            setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'  )      );
            setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID')      );
            setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
            setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM')      );
            setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID' )      );
            setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'   )      );
            setMapVal( itemDataList , 'STATUS'      ,   '4'    );
            setMapVal( itemDataList , 'LVL'         ,   getMapVal( lineDataMap , 'LVL'      )      );
            setMapVal( itemDataList , 'APP_MEMO'    ,   getMapVal( lineDataMap , 'APP_MEMO' )      );
            setMapVal( itemDataList , 'CURENT_FLG'  ,   '1'    );

            insertWFS_T_WORKFLOW(itemDataList);
        }
    }

    //承認結果が差戻の場合
    if (getMapVal( lineDataMap , 'STATUS' ) == '3') {
        //否決の動きが申請者に戻るか一つ前に戻るか確認
        
        if (getMapVal( lineDataMap , 'REJECT_KBN' ) == '1') {
            //申請者に戻る場合

            //次期対象以外のCURENT_FLGを０に更新
            updateWFS_T_WORKFLOW_CURENT_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID') );

            //申請者に戻すのでLVLが1以上のデータのACTIVE_FLGをゼロに更新(18/08/07)
            updateWFS_T_WORKFLOW_ACTIVE_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID'), 1 );

            //データありの場合のみ　次レコード作成
            var itemDataList = new Array();

            setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'   )       );
            setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID' )       );
            setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
            setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM' )       );
            setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID'  )       );
            setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'    )       );
            setMapVal( itemDataList , 'STATUS'      ,   '4'   );
            setMapVal( itemDataList , 'LVL'         ,    1    );
            setMapVal( itemDataList , 'APP_MEMO'    ,   ''    );
            setMapVal( itemDataList , 'CURENT_FLG'  ,   '1'   );

            insertWFS_T_WORKFLOW(itemDataList);

            execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_SASHIMODOSHI);
        }

        if (getMapVal( lineDataMap , 'REJECT_KBN' ) == '2') {
            //ひとつ前に戻る場合

            //階層テーブルにて前のレベルが存在するかチェック
            var itemSelectList = selectWFS_M_LEVEL_NEXTPRE( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'ROUTE_ID' ), getMapVal( lineDataMap , 'LVL' ), '2');
            if (itemSelectList.length > 0) {
                var lineSelectDataMap = itemSelectList[0];
                var _NX_LVL = getMapVal( lineSelectDataMap , 'LVL' );

                //次期対象以外のCURENT_FLGを０に更新
                updateWFS_T_WORKFLOW_CURENT_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ) );

                //申請者に戻すのでLVLが一つ前の値以上のデータのACTIVE_FLGをゼロに更新(18/08/07)
                updateWFS_T_WORKFLOW_ACTIVE_FLG( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID'), _NX_LVL );

                //データありの場合のみ　次レコード作成
                var itemDataList = new Array();

                setMapVal( itemDataList , 'WORK_ID'     ,   getMapVal( lineDataMap , 'WORK_ID'  )      );
                setMapVal( itemDataList , 'OBJECT_ID'   ,   getMapVal( lineDataMap , 'OBJECT_ID')      );
                setMapVal( itemDataList , 'STEP'        ,   parseInt( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
                setMapVal( itemDataList , 'OBJECT_NM'   ,   getMapVal( lineDataMap , 'OBJECT_NM')      );
                setMapVal( itemDataList , 'ROUTE_ID'    ,   getMapVal( lineDataMap , 'ROUTE_ID' )      );
                setMapVal( itemDataList , 'USR_ID'      ,   getMapVal( lineDataMap , 'USR_ID'   )      );
                setMapVal( itemDataList , 'STATUS'      ,   '4'      );
                setMapVal( itemDataList , 'LVL'         ,   _NX_LVL  );
                if (_NX_LVL == 1) {
                    setMapVal( itemDataList , 'APP_MEMO'   ,  '' );
                } else {
                    setMapVal( itemDataList , 'APP_MEMO'   ,  getMapVal( lineDataMap , 'APP_MEMO' )    );
                }
                setMapVal( itemDataList , 'CURENT_FLG'  ,   '1' );

                insertWFS_T_WORKFLOW(itemDataList);

                execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_SASHIMODOSHI);
            }
        }
    }

    //承認結果が否認の場合（当処理としては何もしない（上位TALONで実施済み）
    if ( getMapVal( lineDataMap , 'STATUS' ) == '9' ) {
        
        execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_HININ);
        
    }

    return true;
}



function execWorkFlowStop() {
    //入力値取得
    var itemBlockListHed = TALON.getBlockData_List(1);
    var lineDataMap = itemBlockListHed[0];

    //次ステップのデータが
    //存在する場合はエラーとする
    var itemSelectList = selectWFS_T_WORKFLOW( getMapVal( lineDataMap , 'WORK_ID' ), getMapVal( lineDataMap , 'OBJECT_ID' ), ( getMapVal( lineDataMap , 'STEP' ) + 1 ) );
    if (itemSelectList.length > 0) {
        TALON.addErrorMsg( "既に処理が行われている為、中止処理を実施できません" );
        TALON.setIsSuccess(false);
    } else {
        //データありの場合のみ　次レコード作成
        var itemDataList = new Array();

        setMapVal( itemDataList , 'WORK_ID'     ,  getMapVal( lineDataMap , 'WORK_ID'  )  );
        setMapVal( itemDataList , 'OBJECT_ID'   ,  getMapVal( lineDataMap , 'OBJECT_ID')  );
        setMapVal( itemDataList , 'STEP'        ,  parseInt( getMapVal( lineDataMap , 'STEP' ) ) );
        setMapVal( itemDataList , 'STATUS'      ,  '6'  );

        updateWFS_T_WORKFLOW(itemDataList);

        execWorkFlowCustom(getMapVal( lineDataMap , 'WORK_ID'  ) , getMapVal( lineDataMap , 'OBJECT_ID' ) , _WFS_SYORI_KBN_TORIKESHI);

        TALON.addMsg( "中止処理を実施しました" );
        TALON.setIsSuccess(true);
    }
}



function _mail_data_wfs(_WORK_ID, _STEP, _OBJECT_ID) {
    var mailData = {};

    mailData.WFS_SUBJ   = null;
    mailData.WFS_MAIL   = null;
    mailData.WFS_MLTEXT = null;

    var sql = "" + 
        "SELECT " + 
        " " + 
        " BASE.WORK_ID " + 
        ",BASE.WORK_NM " + 
        ",BASE.STEP " + 
        ",BASE.OBJECT_ID " + 
        ",BASE.USR_ID " + 
        ",BASE.MAIL_ADD AS MAIL " + 
        " " + 
        ",REPLACE( " + 
        "   REPLACE( " + 
        "     REPLACE( " + 
        "       REPLACE( " + 
        "         REPLACE( " + 
        "           REPLACE( " + 
        "             BASE.MAIL_TITLE, " + 
        "             '%1_STEP%', " + 
        "             concat(BASE.STEP ,'') " + 
        "           ), " + 
        "           '%1_OBJECT_NM%', " + 
        "           case when BASE.OBJECT_NM is null then '' else BASE.OBJECT_NM end  " + 
        "         ), " + 
        "         '%1_WORK_ID%', " + 
        "         BASE.WORK_ID  " + 
        "       ), " + 
        "       '%1_WORK_NM%', " + 
        "       case when BASE.WORK_NM is null then '' else BASE.WORK_NM end  " + 
        "     ), " + 
        "     '%1_OBJECT_ID%', " + 
        "     BASE.OBJECT_ID  " + 
        "   ), " + 
        "   '%1_RES_MEMO%', " + 
        "   case when BASE.RES_MEMO is null then '' else BASE.RES_MEMO end  " + 
        " ) AS SUBJ " + 
        " " + 
        " " + 
        ",REPLACE( " + 
        "   REPLACE( " + 
        "     REPLACE( " + 
        "       REPLACE( " + 
        "         REPLACE( " + 
        "           REPLACE( " + 
        "             BASE.MAIL_TEXT, " + 
        "             '%1_STEP%', " + 
        "             concat(BASE.STEP ,'') " + 
        "           ), " + 
        "           '%1_OBJECT_NM%', " + 
        "           case when BASE.OBJECT_NM is null then '' else BASE.OBJECT_NM end  " + 
        "         ), " + 
        "         '%1_WORK_ID%', " + 
        "         BASE.WORK_ID  " + 
        "       ), " + 
        "       '%1_WORK_NM%', " + 
        "       case when BASE.WORK_NM is null then '' else BASE.WORK_NM end  " + 
        "     ), " + 
        "     '%1_OBJECT_ID%', " + 
        "     BASE.OBJECT_ID  " + 
        "   ), " + 
        "   '%1_RES_MEMO%', " + 
        "   case when BASE.RES_MEMO is null then '' else BASE.RES_MEMO end  " + 
        " ) AS MLTEXT " + 
        " " + 
        "FROM ( " + 
        "    SELECT  " + 
        " " + 
        "     WFS_T_WORKFLOW.WORK_ID " + 
        "    ,WFS_M_CONTROL.WORK_NM " + 
        "    ,WFS_T_WORKFLOW.STEP " + 
        "    ,WFS_T_WORKFLOW.OBJECT_ID " + 
        "    ,WFS_T_WORKFLOW.OBJECT_NM " + 
        "    ,WFS_T_WORKFLOW.USR_ID " + 
        "    ,WFS_T_WORKFLOW.LVL " + 
        "    ,WFS_T_WORKFLOW.ROUTE_ID " + 
        "    ,WFS_T_WORKFLOW.STATUS " + 
        "    ,WFS_T_WORKFLOW.RES_MEMO " + 
        " " + 
        "    ,CASE  " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NULL AND WFS_T_WORKFLOW.STATUS = '2'  THEN '決裁' " + 
        "     WHEN WFS_T_WORKFLOW.LVL = '1'                                           THEN '再申請' " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NOT NULL AND (WFS_T_WORKFLOW.STATUS = '1' or WFS_T_WORKFLOW.STATUS = '2') THEN '承認' " + 
        "     WHEN WFS_T_WORKFLOW.LVL <> '1' AND WFS_T_WORKFLOW.STATUS = '3'          THEN '否認' " + 
        "     END AS EXEC_FLG " + 
        " " + 
        "    ,CASE  " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NULL AND WFS_T_WORKFLOW.STATUS = '2'  THEN  " + 
        "        dbo.TLN_CONCAT( " + 
        "            dbo.WFS_ALL_MAIL(WFS_M_AUTH_FT.USR_GRP_ID, WFS_T_WORKFLOW.USR_ID     ,WFS_T_WORKFLOW.WORK_ID ,WFS_T_WORKFLOW.OBJECT_ID ,WFS_M_AUTH_FT.LVL), " + 
        "            CASE WHEN WFS_M_ROUTE_HED.END_SEND_MAIL IS NULL THEN '' ELSE WFS_M_ROUTE_HED.END_SEND_MAIL END , " + 
        "            ',' " + 
        "        ) " + 
        "     WHEN WFS_T_WORKFLOW.LVL = '1'                                           THEN dbo.WFS_ALL_MAIL(WFS_M_AUTH_NX.USR_GRP_ID, NULL     ,WFS_T_WORKFLOW.WORK_ID ,WFS_T_WORKFLOW.OBJECT_ID ,WFS_M_AUTH_NX.LVL) " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NOT NULL AND (WFS_T_WORKFLOW.STATUS = '1' or WFS_T_WORKFLOW.STATUS = '2') THEN dbo.WFS_ALL_MAIL(WFS_M_AUTH_NX.USR_GRP_ID, NULL     ,WFS_T_WORKFLOW.WORK_ID ,WFS_T_WORKFLOW.OBJECT_ID ,WFS_M_AUTH_NX.LVL) " + 
        "     WHEN WFS_T_WORKFLOW.LVL <> '1' AND WFS_T_WORKFLOW_NX.LVL <> '1' AND WFS_T_WORKFLOW.STATUS = '3' THEN dbo.WFS_ALL_MAIL(WFS_M_AUTH_NX.USR_GRP_ID, NULL                  ,WFS_T_WORKFLOW.WORK_ID ,WFS_T_WORKFLOW.OBJECT_ID ,WFS_M_AUTH_NX.LVL) " + 
        "     WHEN WFS_T_WORKFLOW.LVL <> '1' AND WFS_T_WORKFLOW_NX.LVL =  '1' AND WFS_T_WORKFLOW.STATUS = '3' THEN dbo.WFS_ALL_MAIL(WFS_M_AUTH_FT.USR_GRP_ID, WFS_T_WORKFLOW.USR_ID ,WFS_T_WORKFLOW.WORK_ID ,WFS_T_WORKFLOW.OBJECT_ID ,WFS_M_AUTH_FT.LVL) " + 
        "     WHEN WFS_T_WORKFLOW.STATUS = '9'                                        THEN dbo.WFS_ALL_MAIL(WFS_M_AUTH_FT.USR_GRP_ID, WFS_T_WORKFLOW.USR_ID     ,WFS_T_WORKFLOW.WORK_ID ,WFS_T_WORKFLOW.OBJECT_ID ,WFS_M_AUTH_FT.LVL) " + 
        "     END AS MAIL_ADD " + 
        " " + 
        "    ,CASE  " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NULL AND WFS_T_WORKFLOW.STATUS = '2'  THEN WFS_M_CONTROL.MAIL_TITLE_KESSAI " + 
        "     WHEN WFS_T_WORKFLOW.LVL = '1'                                           THEN WFS_M_CONTROL.MAIL_TITLE_SINSEI " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NOT NULL AND (WFS_T_WORKFLOW.STATUS = '1' or WFS_T_WORKFLOW.STATUS = '2') THEN WFS_M_CONTROL.MAIL_TITLE_SYONIN " + 
        "     WHEN WFS_T_WORKFLOW.LVL <> '1' AND WFS_T_WORKFLOW.STATUS = '3'          THEN WFS_M_CONTROL.MAIL_TITLE_HININ " + 
        "     WHEN WFS_T_WORKFLOW.STATUS = '9'                                        THEN WFS_M_CONTROL.MAIL_TITLE_HININ2 " + 
        "     END AS MAIL_TITLE " + 
        " " + 
        "    ,CASE  " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NULL AND WFS_T_WORKFLOW.STATUS = '2'  THEN WFS_M_CONTROL.MAIL_TEXT_KESSAI " + 
        "     WHEN WFS_T_WORKFLOW.LVL = '1'                                           THEN WFS_M_CONTROL.MAIL_TEXT_SINSEI " + 
        "     WHEN WFS_T_WORKFLOW_NX.WORK_ID IS NOT NULL AND (WFS_T_WORKFLOW.STATUS = '1' or WFS_T_WORKFLOW.STATUS = '2') THEN WFS_M_CONTROL.MAIL_TEXT_SYONIN " + 
        "     WHEN WFS_T_WORKFLOW.LVL <> '1' AND WFS_T_WORKFLOW.STATUS = '3'          THEN WFS_M_CONTROL.MAIL_TEXT_HININ " + 
        "     WHEN WFS_T_WORKFLOW.STATUS = '9'                                        THEN WFS_M_CONTROL.MAIL_TEXT_HININ2 " + 
        "     END AS MAIL_TEXT " + 
        " " + 
        "    FROM WFS_T_WORKFLOW " + 
        " " + 
        "    INNER JOIN WFS_M_CONTROL " + 
        "       ON WFS_M_CONTROL.WORK_ID       = WFS_T_WORKFLOW.WORK_ID " + 
        " " + 
        "    LEFT OUTER JOIN WFS_T_WORKFLOW WFS_T_WORKFLOW_NX " + 
        "      ON WFS_T_WORKFLOW.WORK_ID       = WFS_T_WORKFLOW_NX.WORK_ID   " + 
        "     AND WFS_T_WORKFLOW.OBJECT_ID     = WFS_T_WORKFLOW_NX.OBJECT_ID " + 
        "     AND WFS_T_WORKFLOW.STEP + 1      = WFS_T_WORKFLOW_NX.STEP " + 
        " " + 
        "    LEFT OUTER JOIN WFS_M_AUTH WFS_M_AUTH_NX " + 
        "      ON WFS_T_WORKFLOW_NX.WORK_ID   = WFS_M_AUTH_NX.WORK_ID " + 
        "     AND WFS_T_WORKFLOW_NX.LVL       = WFS_M_AUTH_NX.LVL " + 
        "     AND WFS_T_WORKFLOW_NX.ROUTE_ID  = WFS_M_AUTH_NX.ROUTE_ID  " + 
        " " + 
        "    LEFT OUTER JOIN WFS_T_WORKFLOW WFS_T_WORKFLOW_FT " + 
        "      ON WFS_T_WORKFLOW.WORK_ID       = WFS_T_WORKFLOW_FT.WORK_ID  " + 
        "     AND WFS_T_WORKFLOW.OBJECT_ID     = WFS_T_WORKFLOW_FT.OBJECT_ID " + 
        "     AND 1                            = WFS_T_WORKFLOW_FT.STEP " + 
        " " + 
        "    LEFT OUTER JOIN WFS_M_AUTH WFS_M_AUTH_FT " + 
        "      ON WFS_T_WORKFLOW_FT.WORK_ID  = WFS_M_AUTH_FT.WORK_ID " + 
        "     AND WFS_T_WORKFLOW_FT.LVL      = WFS_M_AUTH_FT.LVL " + 
        "     AND WFS_T_WORKFLOW_FT.ROUTE_ID = WFS_M_AUTH_FT.ROUTE_ID  " + 
        " " + 
        "    LEFT OUTER JOIN WFS_M_ROUTE_HED " + 
        "       ON WFS_T_WORKFLOW.ROUTE_ID = WFS_M_ROUTE_HED.ROUTE_ID " + 
        " " + 
        "    WHERE WFS_T_WORKFLOW.WORK_ID   = '" + tln_com_escape( _WORK_ID   ) + "' " + 
        "      AND WFS_T_WORKFLOW.STEP      = '" + tln_com_escape( _STEP      ) + "' " + 
        "      AND WFS_T_WORKFLOW.OBJECT_ID = '" + tln_com_escape( _OBJECT_ID ) + "' " + 
        " " + 
        ") BASE " + 
        " "; 


    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig() , sql );
    if (itemSelectList.length > 0) {
        var lineDataMap = itemSelectList[0];

        mailData.WFS_SUBJ   = getMapVal( lineDataMap , 'SUBJ' );
        mailData.WFS_MAIL   = getMapVal( lineDataMap , 'MAIL' );
        mailData.WFS_MLTEXT = getMapVal( lineDataMap , 'MLTEXT' );
    }

    return mailData;

}



function _mail_data_reminder(_WORK_ID, _STEP, _OBJECT_ID) {
    var mailData = {};

    mailData.WFS_SUBJ   = null;
    mailData.WFS_MAIL   = null;
    mailData.WFS_MLTEXT = null;

    var sql = "" + 
        "SELECT " + 
        " " + 
        " BASE.WORK_ID " + 
        ",BASE.WORK_NM " + 
        ",BASE.STEP as STEP " + 
        ",BASE.REMINDER_ID " + 
        " " + 
        ",BASE.OBJECT_ID " + 
        ",BASE.USR_ID " + 
        ",BASE.MAIL_ADD AS MAIL " + 
        " " + 
        ",REPLACE( " + 
        "   REPLACE( " + 
        "     REPLACE( " + 
        "       REPLACE( " + 
        "         REPLACE( " + 
        "           REPLACE( " + 
        "             BASE.MAIL_TITLE, " + 
        "             '%1_STEP%', " + 
        "             concat(BASE.STEP ,'') " + 
        "           ), " + 
        "           '%1_OBJECT_NM%', " + 
        "           case when BASE.OBJECT_NM is null then '' else BASE.OBJECT_NM end  " + 
        "         ), " + 
        "         '%1_WORK_ID%', " + 
        "         BASE.WORK_ID  " + 
        "       ), " + 
        "       '%1_WORK_NM%', " + 
        "       case when BASE.WORK_NM is null then '' else BASE.WORK_NM end  " + 
        "     ), " + 
        "     '%1_OBJECT_ID%', " + 
        "     BASE.OBJECT_ID  " + 
        "   ), " + 
        "   '%1_RES_MEMO%', " + 
        "   case when BASE.RES_MEMO is null then '' else BASE.RES_MEMO end  " + 
        " ) AS SUBJ " + 
        " " + 
        ",REPLACE( " + 
        "   REPLACE( " + 
        "     REPLACE( " + 
        "       REPLACE( " + 
        "         REPLACE( " + 
        "           REPLACE( " + 
        "             BASE.MAIL_TEXT, " + 
        "             '%1_STEP%', " + 
        "             concat(BASE.STEP ,'') " + 
        "           ), " + 
        "           '%1_OBJECT_NM%', " + 
        "           case when BASE.OBJECT_NM is null then '' else BASE.OBJECT_NM end  " + 
        "         ), " + 
        "         '%1_WORK_ID%', " + 
        "         BASE.WORK_ID  " + 
        "       ), " + 
        "       '%1_WORK_NM%', " + 
        "       case when BASE.WORK_NM is null then '' else BASE.WORK_NM end  " + 
        "     ), " + 
        "     '%1_OBJECT_ID%', " + 
        "     BASE.OBJECT_ID  " + 
        "   ), " + 
        "   '%1_RES_MEMO%', " + 
        "   case when BASE.RES_MEMO is null then '' else BASE.RES_MEMO end  " + 
        " ) AS MLTEXT " + 
        " " + 
        "FROM ( " + 
        " " + 
        "    SELECT  " + 
        "     WFS_T_WORKREMINDER.WORK_ID " + 
        "    ,WFS_M_CONTROL.WORK_NM " + 
        "    ,WFS_T_WORKREMINDER.STEP " + 
        "    ,WFS_T_WORKREMINDER.OBJECT_ID " + 
        "    ,WFS_T_WORKFLOW.OBJECT_NM " + 
        "    ,WFS_T_WORKREMINDER.REMINDER_ID " + 
        "    ,WFS_T_WORKFLOW.USR_ID " + 
        "    ,WFS_T_WORKFLOW.LVL " + 
        "    ,WFS_T_WORKFLOW.ROUTE_ID " + 
        "    ,WFS_T_WORKFLOW.STATUS " + 
        "    ,WFS_T_WORKREMINDER.RES_MEMO " + 
        " " + 
        "    ,dbo.WFS_ALL_MAIL(WFS_M_AUTH.USR_GRP_ID, NULL    , WFS_T_WORKREMINDER.WORK_ID , WFS_T_WORKREMINDER.OBJECT_ID , WFS_M_AUTH.LVL) AS MAIL_ADD " + 
        " " + 
        "    ,WFS_M_CONTROL.MAIL_TITLE_SAISOKU AS MAIL_TITLE " + 
        " " + 
        "    ,WFS_M_CONTROL.MAIL_TEXT_SAISOKU AS MAIL_TEXT " + 
        " " + 
        "    FROM WFS_T_WORKREMINDER " + 
        " " + 
        "    INNER JOIN WFS_T_WORKFLOW " + 
        "       ON WFS_T_WORKREMINDER.WORK_ID   = WFS_T_WORKFLOW.WORK_ID " + 
        "      AND WFS_T_WORKREMINDER.OBJECT_ID = WFS_T_WORKFLOW.OBJECT_ID " + 
        "      AND WFS_T_WORKREMINDER.STEP      = WFS_T_WORKFLOW.STEP " + 
        " " + 
        "    INNER JOIN WFS_M_CONTROL " + 
        "       ON WFS_M_CONTROL.WORK_ID        = WFS_T_WORKFLOW.WORK_ID " + 
        " " + 
        "    LEFT OUTER JOIN WFS_M_AUTH WFS_M_AUTH " + 
        "      ON WFS_T_WORKFLOW.WORK_ID    = WFS_M_AUTH.WORK_ID " + 
        "     AND WFS_T_WORKFLOW.LVL        = WFS_M_AUTH.LVL " + 
        "     AND WFS_T_WORKFLOW.ROUTE_ID   = WFS_M_AUTH.ROUTE_ID " + 
        " " + 
        "    WHERE WFS_T_WORKFLOW.WORK_ID   = '" + tln_com_escape( _WORK_ID   ) + "' " + 
        "      AND WFS_T_WORKFLOW.STEP      = '" + tln_com_escape( _STEP      ) + "' " + 
        "      AND WFS_T_WORKFLOW.OBJECT_ID = '" + tln_com_escape( _OBJECT_ID ) + "' " + 
        " " + 
        ") BASE " + 
        " ";


    var itemSelectList = TalonDbUtil.select( TALON.getDbConfig() , sql );
    if (itemSelectList.length > 0) {
        var lineDataMap = itemSelectList[itemSelectList.length - 1]; // STEPが進行しないまま複数回の催促が起こり得るため、最後の催促内容をメール送信する

        mailData.WFS_SUBJ   = getMapVal( lineDataMap , 'SUBJ' );
        mailData.WFS_MAIL   = getMapVal( lineDataMap , 'MAIL' );
        mailData.WFS_MLTEXT = getMapVal( lineDataMap , 'MLTEXT' );
    }

    return mailData;

}


