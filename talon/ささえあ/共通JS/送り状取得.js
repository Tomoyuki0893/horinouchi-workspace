
/**
 * 郵便番号から住所情報を取得する（例外処理付き）
 *
 * @param {string} zipcode - 郵便番号（ハイフンあり・なし可）
 * @returns {Object|null} - 正常時: 住所情報オブジェクト / 異常時: null
 */
function zipNo(zipcode) {
    var URL = Java.type('java.net.URL');
    var HttpURLConnection = Java.type('java.net.HttpURLConnection');
    var InputStreamReader = Java.type('java.io.InputStreamReader');
    var BufferedReader = Java.type('java.io.BufferedReader');
    var resultMap = null;

    var con = null;
    var reader = null;

    try {

        zipcode = zipcode.replace(/[‐‑–ー－――\-\s]/g, "");
        var urlString = "https://postcode.teraren.com/postcodes/" + zipcode + ".json";
        var url = new URL(urlString);

        con = url.openConnection();
        con.connect();

        reader = new BufferedReader(new InputStreamReader(con.getInputStream(), 'UTF-8'));
        var buffer = "";
        var line;

        while ((line = reader.readLine()) !== null) {
            buffer += line;
        }

        var obj = JSON.parse(buffer);

        resultMap = {};
        resultMap['address1'] = normalizeAddress(obj.prefecture);
        resultMap['address2'] = normalizeAddress(obj.city);
        resultMap['address3'] = normalizeAddress(obj.suburb);
    } catch (e) {
        // 任意のエラーハンドリング（ログ出力など）
        TALON.addErrorMsg("郵便番号住所取得エラー: " + e.message);
    } finally {
        if (reader !== null) {
            try { reader.close(); } catch (e) { }
        }
        if (con !== null) {
            try {
                var httpCon = Java.cast(con, HttpURLConnection);
                httpCon.disconnect();
            } catch (e) { }
        }
    }

    return resultMap;
}

/**
 * オブジェクト型の住所から、末尾の全角括弧内表現（例：私書箱など）を削除する
 * 
 * @param {*} addressObj 任意型の住所値（Object想定）
 * @returns {string} 括弧内を除去した住所文字列
 */
function normalizeAddress(addressObj) {
    if (addressObj == null) return "";

    // 明示的に文字列へ変換（Javaオブジェクト対応）
    var addressStr = String(addressObj);

    // 末尾の「（〜）」を除去（全角括弧に限定）
    return addressStr.replace(/（[^）]*）$/, '');
}



/**
 * Ship&Co API に対して出荷リクエストを送信する
 * @param {Object} shipmentInfo - 出荷情報（JSONオブジェクト）
 * @returns {Object|null} - 成功時: APIレスポンス / 失敗時: null
 */
function callShipAndCoAPI(shipmentInfo) {
    var HttpClient = Java.type('java.net.http.HttpClient');
    var HttpRequest = Java.type('java.net.http.HttpRequest');
    var HttpResponse = Java.type('java.net.http.HttpResponse');
    var URI = Java.type('java.net.URI');
    var Duration = Java.type('java.time.Duration');

    try {
        var cli = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

        var req = HttpRequest.newBuilder(URI.create('https://api.shipandco.com/v1/shipments'))
            .header("Content-Type", "application/json")
            .header("x-access-token", getShukkaApiKey())
            .timeout(Duration.ofSeconds(20))
            .POST(HttpRequest.BodyPublishers.ofString(JSON.stringify(shipmentInfo)))
            .build();

        var res = cli.send(req, HttpResponse.BodyHandlers.ofString());
        var statusCode = res.statusCode();
        var body = res.body();

        if (statusCode !== 200) {
            TALON.addErrorMsg("Ship&Co API 呼び出し失敗。ステータス: " + statusCode);
            TALON.addErrorMsg("レスポンス: " + body);
            return null;
        }

        TALON.getLogger().writeInfo('[Ship&Co API ステータス番号] ' + statusCode);
        TALON.getLogger().writeInfo('[Ship&Co API 本文] ' + body);

        return JSON.parse(body);

    } catch (e) {
        TALON.addErrorMsg("Ship&Co API 呼び出し中にエラーが発生しました: " + e.message);
        return null;
    }
}


/**
 * 出荷情報を元にShip&Co APIを呼び出して送り状を発行し、
 * PDFを保存・追跡番号を出荷指示に更新する。
 *
 * @param {string} primaryKey - 梱包番号（KONPO_NO）
 * @param {string} invoiceNo - 請求番号（送り状の参照番号）
 * @param {Object} from - 差出人情報（Ship&Co形式）
 * @param {Object} to - 宛先情報（Ship&Co形式）
 * @param {string} company - 配送会社コード（例：yamato）
 * @param {string} service - 配送サービスコード
 * @returns {string|null} - 送り状PDFの保存パス、または失敗時はnull
 */
function sendShipInfo(primaryKey, invoiceNo, from, to, company, service) {
    var lineDataMap = TALON.getTargetData();

    var shipmentInfo = buildShipmentInfo(
        primaryKey,
        invoiceNo,
        from,
        to,
        company,
        service,
        lineDataMap
    );

    var obj = callShipAndCoAPI(shipmentInfo);
    if (!obj || !obj.delivery) {
        return null;
    }

    var url = obj.delivery.label;
    var tracking_numbers = obj.delivery.tracking_numbers;

    TALON.getLogger().writeInfo('[Ship&Co API 取得されたURL] ' + url);
    TALON.getLogger().writeInfo('[tracking_numbers] ' + tracking_numbers);
    TALON.getLogger().writeInfo('[attachPath] ' + attachPath);
    TALON.getLogger().writeInfo('[primaryKey] ' + primaryKey);

    var attachPath = saveShippingLabel(url, company, primaryKey);
    updateShukkaMeisai(tracking_numbers[0], attachPath, primaryKey);

    return attachPath;
}

/**
 * Ship&Co用の出荷データオブジェクトを構築する（ES5 + JSON構造互換）
 *
 * @param {string} primaryKey - 梱包番号
 * @param {string} invoiceNo - 請求番号
 * @param {Object} from - 差出人情報
 * @param {Object} to - 宛先情報
 * @param {string} company - 配送会社コード
 * @param {string} service - サービスコード（"yamato" または "sagawa"）
 * @param {Object} lineDataMap - 画面から取得したラインデータ
 * @returns {Object} - Ship&Co API向け出荷データJSON
 */
function buildShipmentInfo(primaryKey, invoiceNo, from, to, company, service, lineDataMap) {
    var IF_SHUKKA_DT = lineDataMap["IF_SHUKKA_DT"];
    var IF_OKURIJO_TYAKU_DT = lineDataMap["IF_OKURIJO_TYAKU_DT"];

    var TIME = (company === "sagawa") ? lineDataMap["SAGAWA_TIME"] : lineDataMap["YAMATO_TIME"];
    var SEV = (company === "sagawa") ? "sagawa_regular" : lineDataMap["YAMATO_SERVICE"];

    var siyoMapList = getShukkaMeisai(primaryKey);
    var products = extractProductInfo(siyoMapList);

    var shipmentInfo = {
        "parcels": [
            {
                "amount": 1,
                "width": 10,
                "height": 10,
                "depth": 10,
                "weight": 2000
            }
        ],
        "setup": {
            "test": false,
            "carrier": company,
            "service": SEV,
            "pack_amount": 1,
            "ref_number": invoiceNo,
            "date": IF_OKURIJO_TYAKU_DT,
            "shipment_date": IF_SHUKKA_DT,
            "time": TIME
        },
        "products": products,
        "to_address": to,
        "from_address": from,
        "test": false
    };

    if (company === "yamato") {
        shipmentInfo["settings"] = {
            "label": {
                "hide_account": true,
                "extra_page": true
            },
            "print": {
                "size": "PDF_A5",
                "size_fallback": "PDF_A5"
            }
        };
    }

    return shipmentInfo;
}

/**
 * 出荷明細から最大2件の商品情報を抽出する。
 * 3件以上ある場合は2件目を「その他 N 件」とする。
 *
 * @param {Array<Object>} siyoMapList - 出荷明細データのリスト
 * @returns {Array<Object>} - Ship&Co形式のproducts配列
 */
function extractProductInfo(siyoMapList) {
    var result = [
        { "name": "その他", "price": 0, "quantity": 1 },
        { "name": " ", "price": 0, "quantity": 0 }
    ];

    var count = siyoMapList.length - 1;

    for (var i = 0; i < siyoMapList.length; i++) {
        var map = siyoMapList[i];
        var name = map['HINMOKU_NM'];
        var qty = map['KONPO_SUU'];

        if (!name) break;

        if (i === 0) {
            result[0].name = (name.length > 20) ? name : name + "  " + qty;
            result[0].quantity = 10;
        } else if (i === 1) {
            result[1].name = (name.length > 20) ? name : name + "  " + qty;
            result[1].quantity = 10;
        } else {
            result[1].name = "その他 " + count + " 件";
            break;
        }
    }

    return result;
}

/**
 * 出荷指示明細（ロットなし）を取得する
 * @param {string} KONPO_NO - 梱包番号
 * @returns {Array<Object>} - 明細情報のリスト
 */
function getShukkaMeisai(KONPO_NO) {
    var conn = TALON.getDbConfig();

    if (!KONPO_NO) {
        TALON.addErrorMsg("getShukkaMeisai: KONPO_NOが未指定です。");
        return [];
    }

    var whereMap = {
        'KONPO_NO': KONPO_NO
    };

    try {
        return selectList(conn, "SHK_T_SIJI_MEISAI_NON_LOT", null, whereMap, null);
    } catch (e) {
        TALON.addErrorMsg("getShukkaMeisai: 明細取得時にエラーが発生しました - " + e.message);
        return [];
    }
}

/**
 * 出荷指示（SHK_T_SIJI）テーブルの送り状番号・パスを更新する
 *
 * @param {string} OKURIJO_NO - 送り状番号（伝票番号）
 * @param {string} OKURIJO_FILE_PATH - PDFファイルパス
 * @param {string} KONPO_NO - 梱包番号（主キー）
 */
function updateShukkaMeisai(OKURIJO_NO, OKURIJO_FILE_PATH, KONPO_NO) {
    var tableName = "SHK_T_SIJI";
    var conn = TALON.getDbConfig();

    var updateMap = {
        "OKURIJO_NO": OKURIJO_NO,
        "OKURIJO_FILE_PATH": OKURIJO_FILE_PATH,
        "KONPO_NO": KONPO_NO
    };

    var whereKeys = ["KONPO_NO"];

    try {
        updateByMapEx(conn, tableName, updateMap, whereKeys, true);
    } catch (e) {
        TALON.addErrorMsg("updateShukkaMeisai: 更新処理中にエラーが発生しました - " + e.message);
    }
}


/**
 * RITAエレクトロニクス宛のShip&Co用宛先情報を生成する。
 * 画面入力から納入先名（full_name）を取得し、それ以外は固定値を設定。
 *
 * @returns {Object} - Ship&Co API向けの宛先住所情報オブジェクト
 */
function getRITA() {
    var lineDataMap = TALON.getTargetData();
    var IF_NOUNYUSAKI = lineDataMap['IF_NOUNYUSAKI'];

    return {
        "full_name": IF_NOUNYUSAKI,
        "company": "",
        "company_kanji": "",
        "email": "",
        "phone": "0573-56-2151",
        "zip": "509-7602",
        "country": "JP",
        "province": "岐阜県",
        "city": "恵那市",
        "address1": "恵那市",
        "address2": "山岡町馬場山田1465-2"
    }
}

/**
 * 出荷連携処理を行い、出荷データを Ship&Co 連携テーブル（T0000RN_Okurijou_Renkei）に登録する。
 *
 * @param {Object} lineDataMap - 画面から渡されたラインデータ（KONPO_NO, IF_SHUKKA_DT などを含む）
 * @param {string} service - 配送会社コード（"yamato" または "sagawa"）
 */
function shukkaRenkei(lineDataMap, service) {
    var KONPO_NO = lineDataMap['KONPO_NO'];
    var shukkaDate = lineDataMap['IF_SHUKKA_DT'];
    var renkeiList = getShukkaRenkeiList(KONPO_NO);

    for (var i = 0; i < renkeiList.length; i++) {
        var record = renkeiList[i];

        // SHUKKA_SIJI_NO が無いレコードは無視
        if (!record['SHUKKA_SIJI_NO']) {
            continue;
        }

        var renkeiMap = buildRenkeiMap(record, shukkaDate, service);
        var conn = TALON.getOtherDBConn("3");
        var tableName = 'T0000RN_Okurijou_Renkei';
        insertByMapEx(conn, tableName, renkeiMap, true);
    }
}

/**
 * 梱包番号に基づき、出荷指示から連携対象データを取得する。
 *
 * @param {string} konpoNo - 梱包番号（KONPO_NO）
 * @returns {Array<Object>} - 出荷指示に紐づく明細レコードのリスト
 */
function getShukkaRenkeiList(konpoNo) {
    var sql = getBodySql("SUB_OKURIJO_RENKEI");
    sql += " WHERE SHK_T_SIJI.KONPO_NO = '" + konpoNo + "'";
    return TalonDbUtil.select(TALON.getDbConfig(), sql);
}

/**
 * Ship&Co連携テーブルに登録する1レコード分のデータを構築する。
 * 配送会社に応じて、送り状番号に接頭語を付与する（例: "ヤマト 12345"）。
 *
 * @param {Object} map - 出荷指示明細のデータ
 * @param {string} shukkaDate - 出荷日（IF_SHUKKA_DT）
 * @param {string} service - 配送会社コード（"yamato" or "sagawa"）
 * @returns {Object} - Ship&Co連携テーブル用の1レコードマップ
 */
function buildRenkeiMap(map, shukkaDate, service) {
    var now = new java.util.Date();
    var timestamp = new java.sql.Timestamp(now.getTime());

    var okurijouPrefix = (service === "yamato") ? "ヤマト" : "佐川";
    var okurijouNo = okurijouPrefix + " " + map['OKURIJO_NO'];

    return {
        OkurijouNO: okurijouNo,
        JuchuuDenpyouNO: map['JYUCHU_NO'],
        ShukkaShijiNO: map['SHUKKA_SIJI_NO'],
        ItemNM: map['HINMOKU_NM'],
        ItemCD: map['HINMOKU_CD'],
        ShukkaYoteiSuu: map['SHUKKA_YOTEI_SUU'],
        ShukkasakiNM: map['SHUKKA_SAKI_NM'],
        ShukkasakiAddress: map['SHUKKASAKI_ADDRESS'],
        ShukkasakiBusho: map['ShukkasakiBusho'],
        ShukkasakiTantousha: map['ShukkasakiTantousha'],
        ShukkaYMD: shukkaDate,
        UpdateDatetime: timestamp,
        KoushinFLG: '0'
    };
}


/**
 * 出荷先住所情報を構築する（配送会社による分岐対応可）
 *
 * @param {Object} lineDataMap - 出荷先情報を含むデータ
 * @param {string} mode - 出荷元（例: "sagawa", "yamato"）によってfull_nameの補完方法を変更
 * @returns {Object} - Ship&Co形式の住所オブジェクト
 */
function buildShipToAddress(lineDataMap, mode) {
    var obj = {};
    var SHUKKA_SAKI_NM = lineDataMap['SHUKKA_SAKI_NM'];
    var BUSYO = lineDataMap['SHUKKASAKI_TNT_BUSYO'];
    var TANTOU = lineDataMap['SHUKKASAKI_TNT_NM'];

    obj.company = SHUKKA_SAKI_NM;

    if (BUSYO && TANTOU) {
        obj.extra = BUSYO;
        obj.full_name = TANTOU;
    } else if (BUSYO && !TANTOU) {
        obj.full_name = BUSYO;
    } else if (!BUSYO && TANTOU) {
        obj.full_name = TANTOU;
    } else {
        // 差異ポイント：会社名をfull_nameに補完するかどうか
        if (mode === "sagawa") {
            obj.full_name = "";
        } else {
            obj.full_name = "";
        }
    }

    obj.email = "1@gmail.com";
    obj.phone = lineDataMap['SHUKKASAKI_TEL_NO'];
    obj.zip = lineDataMap['SHUKKASAKI_ZIP_NO'];
    obj.country = "JP";

    var identified = zipNo(obj.zip);
    obj.province = identified.address1;
    obj.city = identified.address2;
    obj.address1 = identified.address2;

    var address3 = (lineDataMap['SHUKKASAKI_ADDRESS1'] || "") + (lineDataMap['SHUKKASAKI_ADDRESS2'] || "");
    address3 = address3.replace(identified.address1, "").replace(identified.address2, "");
    obj.address2 = address3;

    return obj;
}

/**
 * 出荷区分（KUBUN）を配送会社に応じて更新する。
 *
 * @param {string} konpoNo - 梱包番号（KONPO_NO）
 * @param {string} service - 配送会社コード（"sagawa" or "yamato"）
 */
function updateShukkaKubun(konpoNo, service) {
    var kubunMap = {
        "sagawa": "4",
        "yamato": "2"
    };

    var kubun = kubunMap[service];
    if (!kubun) {
        TALON.addErrorMsg("不正な配送会社コード: " + service);
        return;
    }

    var sql = "UPDATE SHK_T_SIJI SET KUBUN = '" + kubun + "' WHERE KONPO_NO = '" + konpoNo + "'";
    TalonDbUtil.update(TALON.getDbConfig(), sql);
}

/**
 * 出荷指示情報をもとに、送り状発行・出荷区分更新・連携テーブル登録を行う（配送会社共通化）。
 *
 * @param {Object} lineDataMap - 出荷情報（KONPO_NOや宛先情報などを含む）
 * @param {string} okurijoNo - 発行する送り状番号
 * @param {string} konpoNo - 梱包番号（出荷単位のキー）
 * @param {string} service - 配送会社コード（"yamato" または "sagawa"）
 * @param {string} deliveryServiceCode - Ship&Coサービスコード（"yamato_regular" や "sagawa_regular"）
 */
function setOkurijjoInfo(lineDataMap, okurijoNo, konpoNo, service, deliveryServiceCode) {
    updateShukkaKubun(konpoNo, service);

    var to_address = buildShipToAddress(lineDataMap, service);
    var from_address = getRITA();

    sendShipInfo(konpoNo, okurijoNo, from_address, to_address, service, deliveryServiceCode);
    shukkaRenkei(lineDataMap, service);
}

/**
 * 送り状PDFを指定のパスに保存する。
 * 既存ファイルがある場合は削除して再保存する。
 *
 * @param {string} labelUrl - Ship&Co APIから返却されたPDFのURL
 * @param {string} company - 配送会社コード（例: "sagawa", "yamato"）
 * @param {string} konpoNo - 梱包番号（ファイル名に使用）
 * @returns {string} - 保存したファイルのパス（例: "/SHUKKA_07/invoice/sagawa/000123.pdf"）
 */
function saveShippingLabel(labelUrl, company, konpoNo) {
    var Paths = Java.type('java.nio.file.Paths');
    var Files = Java.type('java.nio.file.Files');

    var attachPath = "/SHUKKA_07/invoice/" + company + "/" + konpoNo + ".pdf";
    var outputPath = Paths.get("D:/talon/THUMBNAIL", attachPath);

    try {
        // 既存ファイルがあれば削除
        if (Files.exists(outputPath)) {
            Files.delete(outputPath);
        }

        // curlでPDFダウンロード
        var processBuilder = new java.lang.ProcessBuilder("curl", labelUrl, "-o", outputPath.toString());
        processBuilder.redirectErrorStream(true); // 標準エラー出力も取得
        processBuilder.start();

    } catch (e) {
        TALON.addErrorMsg("送り状PDF保存中にエラーが発生しました: " + e.message);
    }

    return attachPath;
}

function kanaHalfToFull(str) {
    var kanaMap = {
        'ｶﾞ': 'ガ', 'ｷﾞ': 'ギ', 'ｸﾞ': 'グ', 'ｹﾞ': 'ゲ', 'ｺﾞ': 'ゴ',
        'ｻﾞ': 'ザ', 'ｼﾞ': 'ジ', 'ｽﾞ': 'ズ', 'ｾﾞ': 'ゼ', 'ｿﾞ': 'ゾ',
        'ﾀﾞ': 'ダ', 'ﾁﾞ': 'ヂ', 'ﾂﾞ': 'ヅ', 'ﾃﾞ': 'デ', 'ﾄﾞ': 'ド',
        'ﾊﾞ': 'バ', 'ﾋﾞ': 'ビ', 'ﾌﾞ': 'ブ', 'ﾍﾞ': 'ベ', 'ﾎﾞ': 'ボ',
        'ﾊﾟ': 'パ', 'ﾋﾟ': 'ピ', 'ﾌﾟ': 'プ', 'ﾍﾟ': 'ペ', 'ﾎﾟ': 'ポ',
        'ｳﾞ': 'ヴ', 'ﾜﾞ': 'ヷ', 'ｦﾞ': 'ヺ',
        'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ',
        'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
        'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ',
        'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
        'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ',
        'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
        'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ',
        'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
        'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ',
        'ﾜ': 'ワ', 'ｦ': 'ヲ', 'ﾝ': 'ン',
        'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ',
        'ｯ': 'ッ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ',
        '｡': '。', '､': '、', 'ｰ': 'ー', '｢': '「', '｣': '」', '･': '・'
    };

    var reg = new RegExp('(' + Object.keys(kanaMap).join('|') + ')', 'g');
    return str.replace(reg, function (match) {
        return kanaMap[match];
    }).replace(/ﾞ/g, '゛').replace(/ﾟ/g, '゜');
};

/**
 * 出荷APIキーを取得する。
 * 
 * <p>
 * マスタテーブル 'TLN_M_HANYO_CODE' を検索し、<br>
 * 'SIKIBETU_CODE' が 'SHUKKA_API_KEY'、かつ 'KEY_CODE' が '1' に一致するレコードの 'DSP2' を取得します。<br>
 * 該当レコードが存在しない場合は null を返します。
 * </p>
 *
 * @returns {string|null} 出荷APIキー。見つからない場合は null。
 */
function getShukkaApiKey() {
    var whereMap = {
        'SIKIBETU_CODE': 'SHUKKA_API_KEY',
        'KEY_CODE': '1'
    };

    var result = selectOne(TALON.getDbConfig(), 'TLN_M_HANYO_CODE', null, whereMap, null);
    return result ? result['DSP2'] : null;
}