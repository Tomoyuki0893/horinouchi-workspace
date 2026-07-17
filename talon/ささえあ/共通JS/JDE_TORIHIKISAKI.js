/**
 * JDE連携処理
 * 機能：取引先マスタ申請承認時にJDE連携テーブル（F0101Z2/F0030/F0401Z1）へINSERT
 * 実行環境：TALONサーバーサイドJavaScript（Nashorn/ES5）
 * トリガー：WFエンジン承認アクション
 *
 * 処理概要：
 *   1. SHINSEI_IDをキーにMST_T_TORIHIKISAKI_WORKから申請データ取得
 *   2. F0101Z2（住所録マスタ）へINSERT ※新規・変更共通／重複時スキップ
 *   3. 支払手段が振込(0)/手形(3)/でんさい(4) の場合、F0030（銀行口座マスタ）へINSERT／重複時スキップ
 *   4. 新規申請(shinseiCategory='A') の場合、F0401Z1（仕入先マスタ）へINSERT／重複時スキップ
 *   5. WORKテーブルのRENKET_FLGを'1'に更新
 *
 * 修正履歴：
 *   - 削除フラグ条件を除去（MST_T_TORIHIKISAKI_WORKに列なし）
 *   - work['XXX'] → getMapVal(work, 'XXX') に統一（Java Map対応）
 *   - getTaxRate廃止 → JP10固定
 *   - F0101Z2/F0030/F0401Z1に重複チェック追加
 */

// ============================================================
// エントリーポイント
// 引数：shinseiId        - MST_T_TORIHIKISAKI_WORK.SHINSEI_ID
//       shinseiCategory  - 申請種別 'A'=新規 / 'U'=変更 / 'D'=削除
// ============================================================
function execJdeRenket(shinseiId, shinseiCategory) {

    var conn = TALON.getDbConfig();

    TalonDbUtil.begin(conn);
    try {
        // ----------------------------------------------------------
        // 1. WORKテーブルから申請データ取得
        // ----------------------------------------------------------
        var work = DbUtil.selectOne(conn, 'MST_T_TORIHIKISAKI_WORK', null, {
            SHINSEI_ID: shinseiId
        }, null);

        if (!work) {
            TALON.addErrorMsg('JDE連携エラー：WORKデータが見つかりません SHINSEI_ID=' + shinseiId);
            TALON.setIsSuccess(false);
            TalonDbUtil.rollback(conn);
            return false;
        }

        // 共通変数
        var now = new Date();
        var edbt = formatDate(now, 'YYYYMMDD') + formatDate(now, 'hhnnss');
        var julianDt = toJulian(now);
        var timeSec = parseFloat(formatDate(now, 'hhnnss'));

        // ----------------------------------------------------------
        // 2. F0101Z2 INSERT（住所録マスタ）※新規・変更共通
        // ----------------------------------------------------------
        insertF0101Z2(conn, shinseiId, work, edbt, julianDt, timeSec, shinseiCategory);

        // ----------------------------------------------------------
        // 3. F0030 INSERT（銀行口座マスタ）
        //    支払手段が振込(0)/手形(3)/でんさい(4) の場合のみ
        // ----------------------------------------------------------
        var payMethod = nvl(getMapVal(work, 'PAY_METHOD'), '');
        if (payMethod === '0' || payMethod === '3' || payMethod === '4') {
            insertF0030(conn, shinseiId, work, julianDt, timeSec);
        }

        // ----------------------------------------------------------
        // 4. F0401Z1 INSERT（仕入先マスタ）※新規申請のみ
        // ----------------------------------------------------------
        if (shinseiCategory === 'A') {
            insertF0401Z1(conn, shinseiId, work, edbt, julianDt, timeSec);
        }

        // ----------------------------------------------------------
        // 5. WORKテーブルの連携フラグを更新
        // ----------------------------------------------------------
        var updMap = {
            SHINSEI_ID: shinseiId,
            RENKET_FLG: '1'
        };
        updMap = DbUtil.setUpdInitData(updMap);
        DbUtil.update(conn, 'MST_T_TORIHIKISAKI_WORK', updMap, ['SHINSEI_ID'], true);

        TalonDbUtil.commit(conn);
        TALON.getLogger().writeInfo('JDE連携完了 SHINSEI_ID=' + shinseiId);
        return true;

    } catch (e) {
        TalonDbUtil.rollback(conn);
        TALON.addErrorMsg('JDE連携エラー：' + e.message + ' SHINSEI_ID=' + shinseiId);
        TALON.setIsSuccess(false);
        throw e;
    }
}

// ============================================================
// F0101Z2 INSERT（住所録マスタ）
// ============================================================
function insertF0101Z2(conn, shinseiId, w, edbt, julianDt, timeSec, shinseiCategory) {

    // 重複チェック：既にINSERT済みの場合はスキップ
    if (DbUtil.getCount(conn, 'F0101Z2', { SHINSEI_ID: shinseiId }) > 0) {
        TALON.getLogger().writeInfo('[execJdeRenket] F0101Z2 既登録のためスキップ SHINSEI_ID=' + shinseiId);
        return;
    }

    var an8 = toLong('6' + nvl(getMapVal(w, 'SUP_CD'), ''));
    var tnac = (shinseiCategory === 'A') ? 'A' : 'C'; // 新規:A / 変更:C

    // 住所（全角スペース後ろ埋め20桁）
    var add1 = leftPad(nvl(getMapVal(w, 'ADDR1'), ''), 20);
    var add2 = leftPad(nvl(getMapVal(w, 'ADDR2'), ''), 20);

    // 府県コード・郵便番号・国コード（海外判定）
    var prefCd = nvl(getMapVal(w, 'PREF_CD'), '');
    var szAdds, szAddz, szCtr;
    if (prefCd === '98') {
        szAdds = '93';
        szAddz = nvl(getMapVal(w, 'ZIP_CODE'), '');
        szCtr = left(nvl(getMapVal(w, 'COUNTRY_CD'), ''), 2);
    } else {
        szAdds = left(prefCd, 2);
        szAddz = formatZip(nvl(getMapVal(w, 'ZIP_CODE'), ''));
        szCtr = '';
    }

    // 電話番号
    var tel1 = nvl(getMapVal(w, 'TEL1'), '');
    var szPh1 = '', szPht1 = '';
    if (tel1 !== '') {
        szPh1 = tel1 + '-' + nvl(getMapVal(w, 'TEL2'), '') + '-' + nvl(getMapVal(w, 'TEL3'), '');
        szPht1 = 'TEL';
    }

    // FAX番号
    var fax1 = nvl(getMapVal(w, 'FAX1'), '');
    var szPh2 = '', szPht2 = '';
    if (fax1 !== '') {
        szPh2 = fax1 + '-' + nvl(getMapVal(w, 'FAX2'), '') + '-' + nvl(getMapVal(w, 'FAX3'), '');
        szPht2 = 'FAX';
    }

    var insMap = {
        SHINSEI_ID: shinseiId,
        SZEDUS: 'SUPPLIER',
        SZEDBT: edbt,
        SZEDTN: '1',
        SZEDLN: 0,
        SZEDCT: '',
        SZTYTN: 'JDEAB',
        SZEDFT: '',
        SZEDDT: 0,
        SZDRIN: '',
        SZEDDL: 0,
        SZEDSP: 'N',
        SZPNID: '',
        SZTNAC: tnac,
        SZAN8: an8,
        SZALKY: '',
        SZTAX: '',
        SZALPH: nvl(getMapVal(w, 'NAME1'), '') + nvl(getMapVal(w, 'NAME2'), ''),
        SZDC: nvl(getMapVal(w, 'NAME_KANA'), ''),
        SZMCU: '10000',
        SZSIC: '',
        SZLNGP: '',
        SZAT1: 'V2',
        SZCM: '',
        SZTAXC: '',
        SZAT2: 'N',
        SZAT3: 'N',
        SZAT4: 'N',
        SZATR: 'N',
        SZAT5: 'N',
        SZATP: 'Y',
        SZATPR: 'N',
        SZAB3: '',
        SZATE: 'N',
        SZSBLI: '',
        SZEFTB: 0,
        SZAN81: 0,
        SZAN82: 0,
        SZAN83: 0,
        SZAN84: 0,
        SZAN86: 0,
        SZAN85: 0,
        SZAC01: 'MZ',
        SZAC02: '', SZAC03: '', SZAC04: '', SZAC05: '',
        SZAC06: '', SZAC07: '', SZAC08: '', SZAC09: '', SZAC10: '',
        SZAC11: '', SZAC12: '', SZAC13: '', SZAC14: '', SZAC15: '',
        SZAC16: '', SZAC17: '', SZAC18: '', SZAC19: '', SZAC20: '',
        SZAC21: '', SZAC22: '', SZAC23: '', SZAC24: '', SZAC25: '',
        SZAC26: '', SZAC27: '', SZAC28: '', SZAC29: '', SZAC30: '',
        SZGLBA: '',
        SZPTI: 0,
        SZPDI: 0,
        SZMSGA: '',
        SZRMK: '',
        SZTXCT: '',
        SZTX2: '',
        SZALP1: nvl(getMapVal(w, 'NAME_KANA'), ''),
        SZURCD: '',
        SZURDT: 0,
        SZURAT: 0,
        SZURAB: 0,
        SZURRF: '',
        SZMLNM: nvl(getMapVal(w, 'NAME1'), ''),
        SZMLN1: nvl(getMapVal(w, 'NAME2'), ''),
        SZADD1: add1,
        SZADD2: add2,
        SZADD3: '',
        SZADD4: '',
        SZADDZ: szAddz,
        SZCTY1: '',
        SZCTR: szCtr,
        SZADDS: szAdds,
        SZCOUN: '',
        SZAR1: '',
        SZPH1: szPh1,
        SZPHT1: szPht1,
        SZAR2: '',
        SZPH2: szPh2,
        SZPHT2: szPht2,
        SZTORG: '',
        SZUSER: 'AUTOINSERT',
        SZPID: 'SEND01_A',
        SZJOBN: 'SEND01_A',
        SZUPMJ: julianDt,
        SZTDAY: 0,
        SZUPMT: timeSec,
        SZPRGF: '',
        SZSCCLTP: '',
        SZPA8: 0,
        SZTICKER: '',
        SZEXCHG: '',
        SZDUNS: '',
        SZCLASS01: '', SZCLASS02: '', SZCLASS03: '', SZCLASS04: '', SZCLASS05: '',
        SZNOE: 0,
        SZGROWTHR: 0,
        SZYEARSTAR: '',
        SZAEMPGP: '',
        SZACTIN: '',
        SZREVRNG: ''
    };

    DbUtil.insert(conn, 'F0101Z2', insMap, true);
}

// ============================================================
// F0030 INSERT（住所別銀行口座マスタ）
// ============================================================
function insertF0030(conn, shinseiId, w, julianDt, timeSec) {

    // 重複チェック：既にINSERT済みの場合はスキップ
    if (DbUtil.getCount(conn, 'F0030', { SHINSEI_ID: shinseiId }) > 0) {
        TALON.getLogger().writeInfo('[execJdeRenket] F0030 既登録のためスキップ SHINSEI_ID=' + shinseiId);
        return;
    }

    var an8 = toLong('6' + nvl(getMapVal(w, 'SUP_CD'), ''));
    var payMethod = nvl(getMapVal(w, 'PAY_METHOD'), '');
    var rln = (payMethod === '4') ? nvl(getMapVal(w, 'DENSAI_USER_NO'), '') : '';
    var ukid = 0;

    var insMap = {
        SHINSEI_ID: shinseiId,
        AYBKTP: 'V',
        AYTNST: nvl(getMapVal(w, 'BANK_CD'), '') + nvl(getMapVal(w, 'BRANCH_CD'), ''),
        AYCBNK: nvl(getMapVal(w, 'ACCT_NO'), ''),
        AYAN8: an8,
        AYDL1X: nvl(getMapVal(w, 'ACCT_NAME_KANA'), ''),
        AYAID: '',
        AYNXTC: 0,
        AYCHKD: '',
        AYCRCD: '',
        AYRLN: rln,
        AYBACS: 0,
        AYRFNM: '',
        AYBAID: '',
        AYMCU: '',
        AYSWFT: '',
        AYADPI: '',
        AYCHKQ: '',
        AYATTQ: '',
        AYDBTQ: '',
        AYALGN: 0,
        AYSDTL: 10,
        AYFLR: 0,
        AYFLP: 0,
        AYCKSV: nvl(getMapVal(w, 'ACCT_TYPE'), ''),
        AYUKID: ukid,
        AYCTR: 'JP',
        AYNXTA: 0,
        AYUPMJ: julianDt,
        AYUPMT: timeSec,
        AYPID: 'SEND01_A',
        AYUSER: 'AUTOINSERT',
        AYJOBN: 'SEND01_A',
        AYIBAN: '',
        AYAN8B: 0
    };

    DbUtil.insert(conn, 'F0030', insMap, true);
}

// ============================================================
// F0401Z1 INSERT（仕入先マスタ）※新規申請のみ
// ============================================================
function insertF0401Z1(conn, shinseiId, w, edbt, julianDt, timeSec) {

    // 重複チェック：既にINSERT済みの場合はスキップ
    if (DbUtil.getCount(conn, 'F0401Z1', { SHINSEI_ID: shinseiId }) > 0) {
        TALON.getLogger().writeInfo('[execJdeRenket] F0401Z1 既登録のためスキップ SHINSEI_ID=' + shinseiId);
        return;
    }

    var an8 = toLong('6' + nvl(getMapVal(w, 'SUP_CD'), ''));
    var payMethod = nvl(getMapVal(w, 'PAY_METHOD'), '');
    var prefCd = nvl(getMapVal(w, 'PREF_CD'), '');
    var isOverseas = (prefCd === '98');

    // 元帳クラス（銀行コードにより分岐）※要確認
    var bankCd = nvl(getMapVal(w, 'BANK_CD'), '');
    var voapc;
    if (bankCd === '0001') {
        voapc = 'MMZ'; // みずほ
    } else if (bankCd === '0005') {
        voapc = 'MMT'; // 三菱
    } else {
        voapc = 'MMS'; // その他
    }

    // 通貨・税率コード
    var vocrrp, vocrca, votxa2, voexr2;
    if (isOverseas) {
        vocrrp = left(nvl(getMapVal(w, 'CURR_CD'), ''), 3);
        vocrca = vocrrp;
        votxa2 = 'JP99';
        voexr2 = 'E';
    } else {
        vocrrp = 'JPY';
        vocrca = 'JPY';
        votxa2 = 'JP10';  // 税率固定10%
        voexr2 = 'V';
    }

    // 支払手段
    var vopyin;
    if (isOverseas) {
        vopyin = 'I';
    } else if (payMethod === '0') {
        vopyin = 'F'; // 振込
    } else if (payMethod === '3') {
        vopyin = 'Q'; // 手形
    } else if (payMethod === '2') {
        vopyin = 'A'; // 自動振込
    } else if (payMethod === '4') {
        vopyin = 'Q'; // でんさい
    } else {
        vopyin = 'F';
    }

    var insMap = {
        SHINSEI_ID: shinseiId,
        VOEDUS: 'SUPPLIER',
        VOEDBT: edbt,
        VOEDTN: '1',
        VOEDLN: 0,
        VOEDCT: '',
        VOTYTN: 'JDESM',
        VOEDFT: '',
        VOEDDT: 0,
        VODRIN: '',
        VOEDDL: 0,
        VOEDSP: 'N',
        VOPNID: '',
        VOTNAC: 'A',
        VOAN8: an8,
        VOAPC: voapc,
        VOMCUP: '',
        VOOBAP: '',
        VOAIDP: '',
        VOKCOP: '',
        VODCAP: 0,
        VODTAP: '',
        VOCRRP: vocrrp,
        VOTXA2: votxa2,
        VOEXR2: voexr2,
        VOHDPY: 'N',
        VOTXA3: '',
        VOEXR3: '',
        VOTAWH: 0,
        VOPCWH: 0,
        VOTRAP: left(nvl(getMapVal(w, 'PAY_TERM_CD'), ''), 3),
        VOSCK: 'N',
        VOPYIN: vopyin,
        VOSNTO: 0,
        VOPLST: 'Y',
        VOAB1: 'P',
        VOFLD: 0,
        VOSQNL: '6',
        VOCRCA: vocrca,
        VOAYPD: 0,
        VOAPPD: 0,
        VOABAM: 0,
        VOABA1: 0,
        VOAPRC: 0,
        VOMINO: 0,
        VOMAXO: 0,
        VOAN8R: 0,
        VOBADT: 'X',
        VOCPGP: '',
        VOORTP: '',
        VOINMG: '',
        VOHOLD: '',
        VOROUT: '',
        VOSTOP: '',
        VOZON: '',
        VOANCR: 0,
        VOCARS: 0,
        VODEL1: '',
        VODEL2: '',
        VOLTDT: 0,
        VOFRTH: '',
        VOINVC: 0,
        VOWUMD: '',
        VOVUMD: '',
        VOPRP5: '',
        VOEDPM: 'P',
        VOEDCI: '',
        VOEDII: '',
        VOEDQD: 0,
        VOEDAD: 0,
        VOEDF1: 'N',
        VOEDF2: '',
        VOVI01: '', VOVI02: '', VOVI03: '', VOVI04: '', VOVI05: '',
        VOMNSC: '1',
        VOATO: 'N',
        VORVNT: 'N',
        VOASN: '',
        VOCRMD: '',
        VOAVCH: 'N',
        VOURCD: '',
        VOURDT: 0,
        VOURAT: 0,
        VOURAB: 0,
        VOURRF: '',
        VOTORG: 'AUTOINSERT',
        VOUSER: 'AUTOINSERT',
        VOPID: 'SEND01_A',
        VOJOBN: 'SEND01_A',
        VOUPMJ: julianDt,
        VOUPMT: timeSec,
        VOTDAY: 0,
        VOATRL: ''
    };

    DbUtil.insert(conn, 'F0401Z1', insMap, true);
}

// ============================================================
// UKIDを採番マスタから取得（F0030用）
// ============================================================
function getNextUkid(conn) {
    var row = DbUtil.selectOne(conn, '採番マスタ', ['UKID'], { 採番区分: 'UKID' }, null);
    if (!row) {
        return 1;
    }
    var current = getMapVal(row, 'UKID');
    var next = current + 2; // 2番置きで採番
    var updMap = { 採番区分: 'UKID', UKID: next };
    updMap = DbUtil.setUpdInitData(updMap);
    DbUtil.update(conn, '採番マスタ', updMap, ['採番区分'], true);
    return next;
}

// ============================================================
// ユーティリティ関数
// ============================================================

function nvl(val, def) {
    return (val === null || val === undefined) ? def : val;
}

function left(str, n) {
    return String(str).substring(0, n);
}

// 全角スペース後ろ埋め（n桁）
function leftPad(str, n) {
    var s = String(str);
    while (s.length < n) { s = s + '\u3000'; }
    return s.substring(0, n);
}

function toLong(str) {
    var n = parseFloat(str);
    return isNaN(n) ? 0 : Math.floor(n);
}

// 郵便番号フォーマット（NNN-NNNN）
function formatZip(zip) {
    var z = String(zip).replace(/-/g, '');
    if (z.length === 7) {
        return z.substring(0, 3) + '-' + z.substring(3);
    }
    return zip;
}

// 日付フォーマット
function formatDate(d, fmt) {
    var y = d.getFullYear();
    var mo = d.getMonth() + 1;
    var dy = d.getDate();
    var h = d.getHours();
    var mi = d.getMinutes();
    var s = d.getSeconds();
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    if (fmt === 'YYYYMMDD') { return y + pad(mo) + pad(dy); }
    if (fmt === 'hhnnss') { return pad(h) + pad(mi) + pad(s); }
    return '';
}

// ジュリアン日付変換（JDE形式: 1YYDDD）
function toJulian(d) {
    var year = d.getFullYear();
    var start = new Date(year, 0, 0);
    var doy = Math.floor((d - start) / (1000 * 60 * 60 * 24));
    var yy = String(year).substring(2);
    var ddd = doy < 10 ? '00' + doy : (doy < 100 ? '0' + doy : '' + doy);
    return parseFloat('1' + yy + ddd);
}
