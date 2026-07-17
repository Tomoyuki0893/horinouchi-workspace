//精算金情報
function SEI_SAN(obj1, obj2) {
    var seisan_kin = obj1.value;
    var mes = '';

    if (seisan_kin == '1') {
        mes = "1: 精算済";
    } else if (seisan_kin == '2') {
        mes = "2: 未清算"
    }
    obj2.value = mes;
    //      console.log('seisan_kin' + "=" + seisan_kin);
    //      console.log('obj2' + "="  + obj2);
}

//本人退会事由
function HON_YOTAKU(obj1, obj2) {
    var tai_ziyu = obj1.value;
    var mes = '';

    if (tai_ziyu == '1') {
        mes = "1: 自己都合";
    } else if (tai_ziyu == '2') {
        mes = "2: 死亡";
    }
    obj2.value = mes;
}

//配偶者資格
function HAI_SIKAKU(obj1, obj2) {
    var sikaku_hai = obj1.value;
    var mes = '';

    if (sikaku_hai == '1') {
        mes = "1: 認定配偶者の資格を返上しない (継続する)";
    } else if (sikaku_hai == '2') {
        mes = "2: 認定配偶者の資格を返上する (退会する)";
    }
    obj2.value = mes;
    //console.log(obj2.value);
}

//配偶者退会事由
function HAI_TAIKAI_ZIYU(obj1, obj2) {
    var tai_ziyu = obj1.value;
    var mes = '';

    if (tai_ziyu == '1') {
        mes = "1: 自己都合";
    } else if (tai_ziyu == '2') {
        mes = "2: 死亡";
    } else if (tai_ziyu == '3') {
        mes = "3: 結婚・離婚";
    }
    obj2.value = mes;
}

//本人弔慰金
function HON_CHOUI(obj1, obj2) {
    var hon_tai = obj1.value;
    var value = 0;

    if (hon_tai == '2') {
        value = 5000;
    }
    obj2.value = value;
    console.log(obj2.value);
}


// 配偶者特別会員退会日の自動入力ボタン

function haiTaikaibiBtn() {

    // 入力項目の要素取得
    var haiTaikaibiElement = getElementByName("2_HAI_TAIKAI_SEINENGAPI");
    var hoiTaikaibiElement = getElementByName("2_HON_TAIKAI_SEINENGAPI");

    haiTaikaibiElement.value = hoiTaikaibiElement.value;

}

// 本)退会事由が「91:死亡」のとき、本人弔慰金に 5000円を自動設定。

function honTyoikin() {

    var honTaikaiZiyu = getElementByName("2_HON_TAISYOKU_CD").value;
    var honTyoikin = getElementByName("2_HON_SHIHARAI_TYOIKIN");

    if (honTaikaiZiyu == "91") {

        honTyoikin.value = '5000';

    }
}


// 配)退会事由が「91:死亡」のとき、配偶者弔慰金に 5000円を自動設定。

function haiTyoikin() {

    var haiTaikaiZiyu = getElementByName("2_HAI_TAISYOKU_CD").value;
    var haiTyoikin = getElementByName("2_HAI_SHIHARAI_TYOIKIN");

    if (haiTaikaiZiyu == "91") {

        haiTyoikin.value = '5000';

    }
}


function setHininInitDt() {

    var HININ_HAI_KANA_SIMEI = getElementByName("1_HININ_HAI_KANA_SIMEI");
    if (!HININ_HAI_KANA_SIMEI || !HININ_HAI_KANA_SIMEI.value) return;

    var HON_TAISYOKU_CD = getElementByName("2_HON_TAISYOKU_CD");
    if (!HON_TAISYOKU_CD || !HON_TAISYOKU_CD.value) return;

    var HON_TAIKAI_SEINENGAPI = getElementByName("2_HON_TAIKAI_SEINENGAPI");
    if (!HON_TAIKAI_SEINENGAPI || !HON_TAIKAI_SEINENGAPI.value) return;

    // 既に非認定配偶者の退会日が入っている場合は何もしない
    var HININ_HAI_TAIKAI_DT = getElementByName("1_HININ_HAI_TAIKAI_DT");
    if (
        HININ_HAI_TAIKAI_DT &&
        String(HININ_HAI_TAIKAI_DT.value || "").trim() !== ""
    ) {
        return;
    }

    if (HON_TAISYOKU_CD.value == '90' || HON_TAISYOKU_CD.value == '91') {

        // 非認定配偶者は常に90:脱会
        getElementByName("2_HININ_HAI_TAIKAI_JIYU").value = '90';

        // 退会日は本人と同じ
        getElementByName("2_HININ_HAI_TAIKAI_SEINENGAPI").value =
            HON_TAIKAI_SEINENGAPI.value;
    }
}