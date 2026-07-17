function setHinNm(targetObj) {

    var objHinNm = getElementByName("1_HIN_NM")

    if (!objHinNm) return;

    var hinNm = objHinNm.value;
    targetObj.value = hinNm;
}

function setSiyoNo(targetObj) {

    var objSiyosyoNo = getElementByName("1_SIYOSYO_NO")

    if (!objSiyosyoNo) return;

    var siyosyoNo = objSiyosyoNo.value.substring(2);
    targetObj.value = siyosyoNo;
}