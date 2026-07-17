SELECT
	SIYOSYO_SEQ -- 仕様書連番 PK
	,SIYOSYO_NO -- 仕様書NO
	,HINMOKU_CD -- 品目コード
	,HIN_KAISOU_CD -- 品階層コード
	,HIN_KAISOU_NM
	,RIEKI_CENTER_SEQ -- 利益センタ連番
	,HIN_NM -- 品名
	,SIYOSYO_VER -- 仕様書Ver
	,WORK_SIZE -- ワークサイズ
	,KOJO_NO -- 工場No
	,RIEKI_CENTER_CD -- 利益センタコード 
	,SOUYUKOU_KIKAN -- 総有効期間
	,HYOMEN_SYORI_CD -- 表面処理コード
	,SIYOSYO_MAIN.KIN_TANSHI
	,USER_NM -- ユーザー名(取引先名)
	,SOUSU -- 層数
	,PIN_KAN -- ピン間
	,SEIHIN_CD -- 製品CD
	,SIYOSYO_MAIN.MENTUKESU1 -- 面付数 Pcs/シート
	,SIYOSYO_MAIN.MENTUKESU2 -- シート/PN
	--,CONVERT(NVARCHAR, SIYOSYO_MAIN.MENTUKESU1) + ' Pcs/シート ' + ' x ' + CONVERT(NVARCHAR, SIYOSYO_MAIN.MENTUKESU2) + ' シート/PN ' AS MENTUKESU
	,ULNO -- UL番号 
	,TORISU -- 取数/ ㎡
	,SOU_HIT -- 穴明数
	,MINI_VIA　-- ミニVIA
	,MIN_SIAGE_KEI　-- 最小仕上径
	,NAISOU_LINE_HABA -- 内層ライン幅
	,GAISOU_LINE_HABA -- 外層ライン幅
	,LINE_KANKAKU -- ライン間隔
	,LINE_RANDO --	ラインランド
	,RANDO_KEI -- ランド径
	,SEIHIN_SIZE_TATE -- 製品サイズ 縦
	,SEIHIN_SIZE_TATE_P -- 製品サイズ 縦 交差　+
	,SEIHIN_SIZE_YOKO -- 製品サイズ 横
	,SEIHIN_SIZE_YOKO_P -- 製品サイズ 横 交差　+
	,SIAGE_ATU -- 仕上げ板厚
	,SIAGE_ATU_P -- 仕上げ板厚 交差　+
	,SEIHIN_SIZE_TATE_M -- 製品サイズ 縦 交差　-
	,SEIHIN_SIZE_YOKO_M -- 製品サイズ 横 交差　-
	,SIAGE_ATU_M -- 仕上げ板厚 交差　-
	,SOUKOUSEI_NO -- 層構成No
	,GAISOU -- 外層
	,NAISOU1 -- 内層1
	,NAISOU2 -- 内層2
	,KENSA_KIKAKU --　検査規格
	,GYOUSYU -- 業種
	,IVH_FLG -- IVHフラグ
	,IVH_NAISO_FLG -- IVH内層フラグ
        ,KOKIBANSU
	,IVH_OYA_SIYO_SEQ -- IVH親仕様書連番(HIDDEN)
	,IVH_OYA_SIYO_NO -- IVH親仕様書No(HIDDEN)
	,IVH_OYA_HINMOKU_CD -- IVH親品目コード(HIDDEN)
	,KIZAI_MAKER　-- 基材メーカ(HIDDEN)
	,KIZAI_GRADE　-- 基材グレード(HIDDEN)
	,IVH_KO_HINMOKU_SUU -- IVH子基盤数
	,IKOU_DATA_FLG -- HIDDEN
	,TOUROKU_ID -- HIDDEN
	,TOUROKU_DT -- HIDDEN
	,KOUSIN_ID -- HIDDEN
	,KOUSIN_DT -- HIDDEN
	,SIYOH002 -- 新商品コード
	,SIYOH003 -- 価格
	,SIYOH004 -- リビジョン
FROM
	SIYOSYO_MAIN_WORK SIYOSYO_MAIN
