var WfsCommon = (function () {
    'use strict';

    /**
     * 申請種別 → 申請番号キー名 のマッピング（単一の真実点）
     *  RINGI : 稟議WF
     *  MASTER: マスタ申請WF
     *  CLM   : クレーム管理
     * ※種別が増えたらここに追記するだけでよい
     */
    var SHINSEI_KEY = {
        RINGI : 'SHINSEI_ID',
        MASTER: 'SHINSEI_ID',
        CLM   : 'SHINSEI_NO'
    };

    function _getUserId() {
        return TALON.getUserInfoMap().get('USER_ID');
    }

    /**
     * objectIdKey の解決
     *  - 申請種別コード（RINGI/MASTER/CLM等）が渡された場合 → マッピングからキー名を解決
     *  - 直接キー名（'SHINSEI_NO'等）が渡された場合      → そのまま使用（従来互換）
     *  - 省略された場合                                  → 'SHINSEI_ID'
     */
    function _resolveObjectIdKey(objectIdKeyOrType) {
        if (!objectIdKeyOrType) {
            return 'SHINSEI_ID';
        }
        if (SHINSEI_KEY.hasOwnProperty(objectIdKeyOrType)) {
            return SHINSEI_KEY[objectIdKeyOrType];
        }
        return objectIdKeyOrType;
    }

    /**
     * WFS申請実行
     * @param {Object} lineDataMap  TALON.getBlockData_Card(1) の結果
     * @param {String} titleKey     申請タイトルに使う項目名
     * @param {String} appMemo      申請メモ
     * @param {String} objectIdKey  申請番号のキー名 または 申請種別コード（省略時: 'SHINSEI_ID'）
     */
    function apply(lineDataMap, titleKey, appMemo, objectIdKey) {
        var userId    = _getUserId();
        var idKey     = _resolveObjectIdKey(objectIdKey);
        var WORK_ID   = lineDataMap.get('WORK_ID');
        var OBJECT_ID = lineDataMap.get(idKey);
        var TITLE     = lineDataMap.get(titleKey);
        var ROUTE_ID  = lineDataMap.get('ROUTE_ID');

        if (!ROUTE_ID || ROUTE_ID == '' || ROUTE_ID == 'undefined') {
            TALON.getLogger().writeError('[WFS] ROUTE_ID未設定: OBJECT_ID=' + OBJECT_ID);
            TALON.addErrorMsg('承認ルートが設定されていません。');
            TALON.setIsSuccess(false);
            return false;
        }

        var r = TCP_WFS.applyOne({
            workId    : WORK_ID,
            objectId  : OBJECT_ID,
            objectNm  : TITLE,
            routeId   : ROUTE_ID,
            usrId     : userId,
            appMemo   : appMemo || '申請を行います。',
            executorId: userId
        });

        if (r.ok) {
            TALON.getLogger().writeInfo(
                '[WFS] 申請OK WORK_ID=' + WORK_ID + ' OBJECT_ID=' + OBJECT_ID + ' USR_ID=' + userId
            );
        } else {
            TALON.getLogger().writeError(
                '[WFS] 申請NG WORK_ID=' + WORK_ID + ' OBJECT_ID=' + OBJECT_ID +
                ' USR_ID=' + userId + ' / ' + r.errorMsg
            );
            TALON.addErrorMsg(r.errorMsg);
            TALON.setIsSuccess(false);
            return false;
        }

        return true;
    }

    /**
     * WFS承認実行
     * @param {Object} lineDataMap  TALON.getBlockData_Card(1) の結果
     * @param {String} objectIdKey  申請番号のキー名 または 申請種別コード（省略時: 'SHINSEI_ID'）
     */
    function approve(lineDataMap, objectIdKey) {
        var userId    = _getUserId();
        var idKey     = _resolveObjectIdKey(objectIdKey);
        var WORK_ID   = lineDataMap.get('WORK_ID');
        var OBJECT_ID = lineDataMap.get(idKey);
        var STEP      = lineDataMap.get('STEP');
        var RES_MEMO  = lineDataMap.get('RES_MEMO');

        var r = TCP_WFS.approveOne({
            workId    : WORK_ID,
            objectId  : OBJECT_ID,
            step      : STEP,
            shoninId  : userId,
            executorId: userId,
            resMemo   : RES_MEMO || ''
        });

        if (r.ok) {
            TALON.getLogger().writeInfo(
                '[WFS] 承認OK WORK_ID=' + WORK_ID + ' OBJECT_ID=' + OBJECT_ID +
                ' STEP=' + STEP + ' SHONIN_ID=' + userId
            );
        } else {
            TALON.getLogger().writeError(
                '[WFS] 承認NG WORK_ID=' + WORK_ID + ' OBJECT_ID=' + OBJECT_ID +
                ' STEP=' + STEP + ' SHONIN_ID=' + userId + ' / ' + r.errorMsg
            );
            TALON.addErrorMsg(r.errorMsg);
            TALON.setIsSuccess(false);
            return false;
        }

        return true;
    }

    /**
     * WFS差戻実行
     * @param {Object} lineDataMap  TALON.getBlockData_Card(1) の結果
     * @param {String} objectIdKey  申請番号のキー名 または 申請種別コード（省略時: 'SHINSEI_ID'）
     */
    function reject(lineDataMap, objectIdKey) {
        var userId    = _getUserId();
        var idKey     = _resolveObjectIdKey(objectIdKey);
        var WORK_ID   = lineDataMap.get('WORK_ID');
        var OBJECT_ID = lineDataMap.get(idKey);
        var STEP      = lineDataMap.get('STEP');
        var RES_MEMO  = lineDataMap.get('RES_MEMO');

        if (!RES_MEMO || RES_MEMO == '') {
            TALON.addErrorMsg('差戻し理由を入力してください。');
            TALON.setIsSuccess(false);
            return false;
        }

        var r = TCP_WFS.rejectOne({
            workId    : WORK_ID,
            objectId  : OBJECT_ID,
            step      : STEP,
            shoninId  : userId,
            executorId: userId,
            resMemo   : RES_MEMO
        });

        if (r.ok) {
            TALON.getLogger().writeInfo(
                '[WFS] 差戻OK WORK_ID=' + WORK_ID + ' OBJECT_ID=' + OBJECT_ID +
                ' STEP=' + STEP + ' SHONIN_ID=' + userId
            );
        } else {
            TALON.getLogger().writeError(
                '[WFS] 差戻NG WORK_ID=' + WORK_ID + ' OBJECT_ID=' + OBJECT_ID +
                ' STEP=' + STEP + ' SHONIN_ID=' + userId + ' / ' + r.errorMsg
            );
            TALON.addErrorMsg(r.errorMsg);
            TALON.setIsSuccess(false);
            return false;
        }

        return true;
    }

    return {
        SHINSEI_KEY: SHINSEI_KEY,
        apply      : apply,
        approve    : approve,
        reject     : reject
    };
})();