function setRing(bunshoNo) {

    var tableName = 'RIN_T_SHINSEI';
    var conn = TALON.getDbConfig();

    var work = DbUtil.selectOne(conn, tableName, null, { BUNSHO_NO: bunshoNo }, null);
    if (!work) {
        TALON.addErrorMsg('申請データが見つかりません。文書番号：' + bunshoNo);
        TALON.setIsSuccess(false);
        return;
    }

    var daibunrui = getMapVal(work, 'RIN_DAI');

    if (!bunshoNo || !daibunrui) {
        TALON.addErrorMsg('大分類コードまたは文書番号が取得できませんでした。');
        TALON.setIsSuccess(false);
        return;
    }

    // 大分類コードから採番名を組み立て
    var paddedCode = ('00' + daibunrui).slice(-2);
    var saibanCode = 'RINGI_NO' + paddedCode; // 例: 大分類=01 → 'RINGI_NO01'

    // 採番マスタから番号を1件取得
    var numList = TALON.getNumberingData(saibanCode, 1);
    if (!numList || numList.length === 0) {
        TALON.addErrorMsg('採番マスタに該当レコードが存在しません。採番名：' + saibanCode);
        TALON.setIsSuccess(false);
        return;
    }
    var _NUM = numList[0];

    // 更新
    var updateMap = {
        BUNSHO_NO: bunshoNo,
        RINGI_NO: _NUM
    };
    updateMap = DbUtil.setUpdInitData(updateMap);

    var updateCount = DbUtil.update(conn, tableName, updateMap, ['BUNSHO_NO'], true);

    if (updateCount === 0) {
        TALON.addErrorMsg('申請テーブルの更新対象が見つかりません。文書番号：' + bunshoNo);
        TALON.setIsSuccess(false);
    }
}