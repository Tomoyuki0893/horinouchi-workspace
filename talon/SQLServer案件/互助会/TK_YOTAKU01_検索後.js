var conditionMap = TALON.getConditionData();

var TK_NO = conditionMap['TK_NO'];
var SHORI_TUKI = conditionMap['SHORI_TUKI'];

if (TK_NO && SHORI_TUKI) {

    var memberMap = selectOne(
        TALON.getDbConfig(),
        "TK_MEMBER",
        null,
        { TK_NO: TK_NO },
        null
    );

    var yotakuMap = selectOne(
        TALON.getDbConfig(),
        "TK_YOTAKU",
        null,
        {
            TK_NO: TK_NO,
            SHORI_TUKI: SHORI_TUKI
        },
        null
    );

    if (memberMap && yotakuMap) {

        var HON_SHIHARAI = Number(yotakuMap['HON_SHIHARAI_YOTAKUKIN'] || 0);

        var isHonTaikai = String(memberMap['HON_DAKKAI_SEINENGAPI'] || "").trim() !== "";
        var isHaiTaikai = String(memberMap['HAI_DAKKAI_SEINENGAPI'] || "").trim() !== "";

        var honTaikai = Number(String(memberMap['HON_DAKKAI_SEINENGAPI'] || "0").trim());
        var haiTaikai = Number(String(memberMap['HAI_DAKKAI_SEINENGAPI'] || "0").trim());

        var hasHonYotaku = HON_SHIHARAI > 0;

        var hasHai = String(memberMap['HAI_SIMEI'] || "").trim() !== ""
            || String(memberMap['HAI_KANA_SIMEI'] || "").trim() !== "";

        var isHaiAfterHon = isHonTaikai && isHaiTaikai && haiTaikai > honTaikai;

        if (hasHonYotaku && hasHai && isHaiAfterHon) {

            var updateMap = {
                TK_NO: TK_NO,
                SHORI_TUKI: SHORI_TUKI,
                HON_SHIHARAI_YOTAKUKIN: null,
                HAI_SHIHARAI_YOTAKUKIN: HON_SHIHARAI
            };

            updateByMapEx(
                TALON.getDbConfig(),
                "TK_YOTAKU",
                updateMap,
                ["TK_NO", "SHORI_TUKI"],
                false
            );
        }
    }
}