// ========== Public API ==========
setYotakuKaiinData();

/**
 * 預託金会員データ連携メイン処理
 */
function setYotakuKaiinData() {
    try {
        var db = TALON.getDbConfig();
        var conditionMap = TALON.getConditionData() || {};
        var SHORI_TUKI = asStr(conditionMap['SHORI_TUKI']);
        if (!SHORI_TUKI) return;

        var sokinInfo = getSokinInfo(db, SHORI_TUKI);
        var list = selectList(db, "TK_YOTAKU_RENKEI", null, { "SHORI_TUKI": SHORI_TUKI }, null) || [];

        for (var i = 0; i < list.length; i++) {
            var row = list[i];
            // 【修正】 || {} を削除。asStrで空文字になればOKです
            var TK_NO = asStr(row.get('TK_NO'));

            if (!TK_NO) {
                TALON.addErrorMsg((i + 1) + "行目：TK_NO が空のためスキップしました。");
                continue;
            }

            var tkMap = getTkMap(TK_NO);
            var honTaisyoCd = asStr(row.get('HON_TAISYOKU_CD'));
            var haiTaisyoCd = asStr(row.get('HAI_TAISYOKU_CD'));

            // 会員マスタ更新
            var memberUpdateMap = pickNonBlankToJs(row);
            memberUpdateMap["TK_NO"] = TK_NO;
            if (Object.keys(memberUpdateMap).length > 1) {
                updateByMapEx(db, "TK_MEMBER", memberUpdateMap, ["TK_NO"], false);
            }

            // 預託退会日 → 会員マスタ退会日 同期
            syncTaikaiDate(db, row, tkMap, TK_NO);

            // 本人処理
            if (honTaisyoCd)
                processShiharai(db, TK_NO, "HON", row, tkMap, SHORI_TUKI, sokinInfo);

            // 配偶者処理
            if (haiTaisyoCd)
                processShiharai(db, TK_NO, "HAI", row, tkMap, SHORI_TUKI, sokinInfo);

        }

        updateCloseStatus(db, SHORI_TUKI, "06");

    } catch (e) {
        TALON.addErrorMsg(asMessage(e));
    }
}

/**
 * 支払データおよび履歴更新（upsert対応版）
 */
function processShiharai(db, tkNo, prefix, row, tkMap, SHORI_TUKI, sokinInfo) {
    var ymd = sokinInfo.ymd;
    var wareki = sokinInfo.wareki;

    // カナ決定
    var kanaNm = resolveKana(db, row, tkMap, tkNo);

    var bank = {
        GINKOU_CD:
            asStr(row.get('GINKOU_CD')) ||
            asStr(tkMap['GINKOU_CD']),
        SHITEN_CD:
            asStr(row.get('SHITEN_CD')) ||
            asStr(tkMap['SHITEN_CD']),
        KOUZA_NO:
            asStr(row.get('KOUZA_NO')) ||
            asStr(tkMap['KOUZA_NO']),
        KANA_NM: kanaNm
    };

    var mergedData = {
        SIMEI_KANA: kanaNm,
        HON_TAISYOKU_CD: row.get('HON_TAISYOKU_CD'),
        GINKOU_CD: bank.GINKOU_CD,
        SHITEN_CD: bank.SHITEN_CD,
        KOUZA_NO: bank.KOUZA_NO
    };

    // TK_SHIHARAI レコードの存在確認（1回だけ実行）
    var shiharaiExists = (selectOne(db, "TK_SHIHARAI", null, { "TK_NO": tkNo }, null) != null);

    // --- 預託金 ---
    var yotakuKin = normalizeAmount(row.get(prefix + '_SHIHARAI_YOTAKUKIN'));
    if (hasPositiveAmount(yotakuKin)) {
        var updYotaku = buildShiharaiMap(prefix, tkNo, ymd, wareki, yotakuKin, bank, "YOTAKUKIN");
        if (shiharaiExists) {
            updateByMapEx(db, "TK_SHIHARAI", updYotaku, ['TK_NO'], false);
        } else {
            insertByMapEx(db, "TK_SHIHARAI", updYotaku, false);
            // 次のinsertを防ぐため、insert後はフラグを立てる
            shiharaiExists = true;
        }

        var typeYotaku = (prefix === "HON") ? 1 : 2;
        var kindYotaku = (prefix === "HON") ? "03" : "04";
        insertCom02(tkMap, SHORI_TUKI, typeYotaku, kindYotaku, yotakuKin, mergedData);
    }

    // --- 弔慰金（死亡=91） ---
    var taisyoCd = asStr(row.get(prefix + '_TAISYOKU_CD'));
    if (taisyoCd === "91") {
        var choiKin = normalizeAmount(row.get(prefix + '_SHIHARAI_TYOIKIN'));
        if (hasPositiveAmount(choiKin)) {
            var updChoi = buildShiharaiMap(prefix, tkNo, ymd, wareki, choiKin, bank, "TYOIKIN");
            if (shiharaiExists) {
                updateByMapEx(db, "TK_SHIHARAI", updChoi, ['TK_NO'], false);
            } else {
                insertByMapEx(db, "TK_SHIHARAI", updChoi, false);
                shiharaiExists = true;
            }

            var typeChoi = (prefix === "HON") ? 3 : 4;
            var kindChoi = (prefix === "HON") ? "05" : "06";
            insertCom02(tkMap, SHORI_TUKI, typeChoi, kindChoi, choiKin, mergedData);
        }
    }
}
/**
 * 通知先カナ決定ロジック
 */
function resolveKana(db, row, tkMap, TK_NO) {

    var kanaYotaku = row ? asStr(row.get("SIMEI_KANA")) : "";
    var kanaMember = tkMap ? asStr(tkMap["SEIKYU_KANA_NM"]) : "";
    var tkKanaMember = tkMap ? asStr(tkMap["KOUZAMEIGI"]) : "";

    var result = "";

    if (kanaYotaku && kanaYotaku !== "0") {
        result = kanaYotaku;
    } else if (kanaMember && kanaMember !== "0") {
        result = kanaMember;
    } else if (tkKanaMember && tkKanaMember !== "0") {
        result = tkKanaMember;
    }

    // 更新（値がある場合のみ）
    if (result) {
        var updateMap = {
            TK_NO: TK_NO,
            SEIKYU_KANA_NM: result
        };

        updateByMapEx(db, "TK_MEMBER", updateMap, ["TK_NO"], false);
    }

    return result;
}

/**
 * 預託退会日 → 会員マスタ退会日 同期
 */
function syncTaikaiDate(db, row, tkMap, TK_NO) {

    // VIEW側退会日
    var yotakuTaikai = asStr(row.get("HON_TAIKAI_SEINENGAPI"));
    if (!yotakuTaikai) return;

    // 会員マスタ退会日
    var memberTaikai = tkMap ? asStr(tkMap["HON_DAKKAI_SEINENGAPI"]) : "";

    // 同じなら更新不要
    if (yotakuTaikai === memberTaikai) return;

    var updateMap = {
        TK_NO: TK_NO,
        HON_DAKKAI_SEINENGAPI: yotakuTaikai
    };

    updateByMapEx(db, "TK_MEMBER", updateMap, ["TK_NO"], false);
}

// ========== 既存ライブラリ・ユーティリティ（変更なし） ==========
function adjustHonKanaForKeizoku(tkMap, row, HAI_TAISYOKU_CD) {
    tkMap['HON_KANA_SIMEI'] = (tkMap['HAI_KANA_SIMEI'] && HAI_TAISYOKU_CD === '99')
        ? row.get('HAI_KANA_SIMEI')
        : asStr(row.get('SEIKYU_KANA_NM'));
}

function buildShiharaiMap(prefix, tkNo, ymd, wareki, amount, bank, type) {

    var p = prefix.toUpperCase();
    var m = { TK_NO: tkNo };

    var suffix;

    if (type === "YOTAKUKIN") {
        suffix = "_YOTAKUKIN";
    } else {

        // 配偶者弔慰金だけカラム名が違う
        if (p === "HAI") {
            suffix = "_TYOUKIKIN";
        } else {
            suffix = "_TYOIKIN";
        }

    }

    m[p + suffix + "_SHIHARAI_SDT"] = ymd;
    m[p + suffix + "_SHIHARAI_WDT"] = wareki;
    m[p + suffix] = amount;
    m[p + suffix + "_GINKO_CD"] = bank.GINKOU_CD;
    m[p + suffix + "_SHITEN_CD"] = bank.SHITEN_CD;
    m[p + suffix + "_KOZA_NO"] = bank.KOUZA_NO;
    m[p + suffix + "_KOZA_MEIGI"] = bank.KANA_NM;

    // 追加：配偶者弔慰金専用カラム
    if (p === "HAI" && type !== "YOTAKUKIN") {
        m["HAI_TYOUKIKIN_SDT"] = ymd;
        m["HAI_TYOUKIKIN_WDT"] = wareki;
    }

    return m;
}

function getSokinInfo(db, SHORI_TUKI) {
    var list = TalonDbUtil.select(db, "SELECT * FROM TPIM0004 WHERE YM_ID = '" + SHORI_TUKI + "'") || [];
    if (!list.length) return { ymd: "", wareki: "" };
    var dateObj = list[0]['SOKIN_YOTEI_DATE'];
    return { ymd: formatDateYYYYMMDD(dateObj), wareki: formatWarekiCustom(dateObj) };
}

function normalizeAmount(v) { return v == null ? 0 : v; }
function hasPositiveAmount(v) { return Number(v || 0) > 0; }
function formatDateYYYYMMDD(d) { return d ? new java.text.SimpleDateFormat("yyyyMMdd").format(d) : ""; }
function asStr(v) { return (v == null) ? "" : String(v).trim(); }
function asMessage(e) { return (e && e.message) ? e.message : String(e); }

function pickNonBlankToJs(javaMap) {
    var out = {};
    if (!javaMap) return out;
    var it = javaMap.keySet().iterator();
    while (it.hasNext()) {
        var k = it.next();
        var v = javaMap.get(k);
        if (v !== null && String(v).trim() !== "") out[String(k)] = String(v).trim();
    }
    return out;
}

// (以下、日付・和暦変換などのユーティリティ関数は元のものを維持してください)
/**
 * 和暦数値形式への変換（令和: 5, 平成: 4, 昭和: 3）
 * 例）令和7年3月15日 → 5070315
 */
function formatWarekiCustom(d) {
    if (!d) return "";

    var ymd = formatDateYYYYMMDD(d); // "yyyyMMdd"
    if (!ymd || ymd.length !== 8) return "";

    var year = parseInt(ymd.substring(0, 4), 10);
    var monthDay = ymd.substring(4); // "MMDD"

    // 令和 5xxxxxx（2019/05/01〜）
    if (year > 2019 || (year === 2019 && monthDay >= "0501")) {
        var wYearR = year - 2018;
        return "5" + zeroPad(wYearR, 2) + monthDay;
    }

    // 平成 4xxxxxx（1989/01/08〜2019/04/30）
    if (year > 1989 || (year === 1989 && monthDay >= "0108")) {
        var wYearH = year - 1988;
        return "4" + zeroPad(wYearH, 2) + monthDay;
    }

    // 昭和 3xxxxxx（1926/12/25〜1989/01/07）
    if (year > 1926 || (year === 1926 && monthDay >= "1225")) {
        var wYearS = year - 1925;
        return "3" + zeroPad(wYearS, 2) + monthDay;
    }

    return "";
}

/**
 * 数値を指定桁数でゼロ埋めする
 */
function zeroPad(n, width) {
    var s = String(n);
    while (s.length < width) s = "0" + s;
    return s;
}