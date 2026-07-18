# 会計IF 日付フォーマット修正SQL（SQL REPLACE 方式）

パラメータ `yyyy/MM/dd` を `REPLACE(...,'/','')` で区切り除去し、格納データ `yyyyMMdd` と揃える。
各SQLタスクの本文を下記の修正版に置き換えてください（列側は素のまま＝索引維持）。

**前提**: 対象は `*_date` 等の `yyyyMMdd` 文字列列。もし DATE/timestamp 型の列があればそこは対象外（TO_DATE等で別途対応）。監査列 `*_at` / CURRENT_TIMESTAMP は対象外（自動除外済み）。

---


**対象: 24 フロー / 置換 54 箇所**


## 部品仕入単価マスタ一覧取得  （route: `tmh_acif_parts_purchase_unit_prices`）

- SQL1: 日付バインド 3 箇所を REPLACE 化
```sql
SELECT
    updated_company_identifier
  , updated_by
  , updated_process_identifier
  , updated_ip_address
  , updated_at
  , company_identifier
  , parts_number
  , management_number
  , application_start_date
  , application_end_date
  , TO_CHAR(TO_DATE(configuration_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS configuration_date
  , supplier_identifier
  , issue_destination
  , unit_price
  , retroactive_completed_type
  , identifier
  , TO_CHAR(TO_DATE(application_start_date, 'YYYYMMDD'), 'YYYY/MM/DD') || '~' || TO_CHAR(TO_DATE(application_end_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS application_date
FROM
  tmh_acif_part_purchase_price
WHERE 1=1
/*IF parts_number != null && parts_number != ''*/
  AND parts_number LIKE /*parts_number*/''
/*END*/
/*IF management_number != null && management_number != ''*/
    AND management_number LIKE /*management_number*/''
/*END*/
/*IF application_start_date != null && application_start_date != ''*/
    AND application_start_date <= REPLACE(/*application_start_date*/'', '/', '')
/*END*/
/*IF application_end_date != null && application_end_date != ''*/
    AND application_end_date >= REPLACE(/*application_end_date*/'', '/', '')
/*END*/
/*IF supplier_identifier != null && supplier_identifier != ''*/
    AND supplier_identifier LIKE /*supplier_identifier*/''
/*END*/
/*IF issue_destination != null && issue_destination != ''*/
    AND issue_destination LIKE /*issue_destination*/''
/*END*/
/*IF configuration_date != null && configuration_date != ''*/
    AND configuration_date LIKE REPLACE(/*configuration_date*/'', '/', '')
/*END*/
/*IF unit_price != null*/
    AND unit_price <= /*unit_price*/0
/*END*/
ORDER BY
    company_identifier,
    parts_number,
    management_number,
    application_start_date
```

---

## 部品仕入単価登録  （route: `tmh_acif_parts_purchase_unit_price/new`）

- SQL1: 日付バインド 3 箇所を REPLACE 化
```sql
INSERT INTO tmh_acif_part_purchase_price (

    updated_company_identifier,

    updated_by,

    updated_process_identifier,

    updated_ip_address,

    updated_at,

    company_identifier,

    parts_number,

    management_number,

    application_start_date,

    application_end_date,

    configuration_date,

    supplier_identifier,

    issue_destination,

    unit_price,

    retroactive_completed_type

) VALUES (

    /*updated_company_identifier*/'',

    /*updated_by*/'',

    /*updated_process_identifier*/'',

    /*updated_ip_address*/'',

    /*updated_at*/'',

    /*company_identifier*/'',

    /*parts_number*/'',

    /*management_number*/'',

    REPLACE(/*application_start_date*/'', '/', ''),

    REPLACE(/*application_end_date*/'', '/', ''),

    REPLACE(/*configuration_date*/'', '/', ''),

    /*supplier_identifier*/'',

    /*issue_destination*/'',

    /*unit_price*/0,

    /*retroactive_completed_type*/''

)
```

- SQL2: 日付バインド 2 箇所を REPLACE 化
```sql
UPDATE
    tmh_acif_part_purchase_price
SET
    updated_company_identifier = /*updated_company_identifier*/'',
    updated_by = /*updated_by*/'',
    updated_at = /*updated_at*/'',
    application_end_date = REPLACE(/*application_end_date*/'', '/', '')
WHERE
    company_identifier = /*company_identifier*/''
AND parts_number = /*parts_number*/''
AND management_number = /*management_number*/''
AND supplier_identifier = /*supplier_identifier*/''
AND application_start_date = REPLACE(/*application_start_date*/'', '/', '')
```

---

## 部品仕入単価データ更新  （route: `tmh_acif_parts_purchase_unit_prices/edit`）

- SQL1: 日付バインド 2 箇所を REPLACE 化
```sql
UPDATE
  tmh_acif_part_purchase_price
SET
  configuration_date = REPLACE(/*configuration_date*/'', '/', ''),
  issue_destination = /*issue_destination*/'',
  unit_price = /*unit_price*/0,
  retroactive_completed_type = 0
WHERE
  parts_number = /*parts_number*/''
  AND management_number = /*management_number*/''
  AND application_start_date = REPLACE(/*application_start_date*/'', '/', '')
  AND supplier_identifier = /*supplier_identifier*/''
```

---

## TMC買掛金不照合追加入力データ検索  （route: `01KS4HA2DWS7SGJ8HY1QAN070B/getList`）

- SQL1: 日付バインド 6 箇所を REPLACE 化
```sql
SELECT
    issue_serial_number,
    management_number,
    material_parts_special_order_type,
    correct_reason_type,
    item_select_identifier,
    issue_destination,
    trading_partner_identifier,
    CASE
        WHEN issuance_date IS NULL OR issuance_date = ''
        THEN NULL
        ELSE SUBSTRING(issuance_date, 1, 4) || '/' ||
             SUBSTRING(issuance_date, 5, 2) || '/' ||
             SUBSTRING(issuance_date, 7, 2)
    END AS issuance_date,
    CASE
        WHEN recorded_date IS NULL OR recorded_date = ''
        THEN NULL
        ELSE SUBSTRING(recorded_date, 1, 4) || '/' ||
             SUBSTRING(recorded_date, 5, 2) || '/' ||
             SUBSTRING(recorded_date, 7, 2)
    END AS recorded_date,
    CASE
        WHEN tmc_delivery_date IS NULL OR tmc_delivery_date = ''
        THEN NULL
        ELSE SUBSTRING(tmc_delivery_date, 1, 4) || '/' ||
             SUBSTRING(tmc_delivery_date, 5, 2) || '/' ||
             SUBSTRING(tmc_delivery_date, 7, 2)
    END AS tmc_delivery_date,
    delivery_note_number,
    receipt_identifier
FROM
    tmh_acif_receivable_payable_correction_slips p
/*BEGIN*/
WHERE
    /*IF issue_serial_number != null*/
    p.issue_serial_number LIKE /*issue_serial_number*/''
    /*END*/

    /*IF issuance_date_from != null*/
    AND p.issuance_date >= REPLACE(/*issuance_date_from*/'', '/', '')
    /*END*/

    /*IF issuance_date_to != null*/
    AND p.issuance_date <= REPLACE(/*issuance_date_to*/'', '/', '')
    /*END*/

    /*IF recorded_date_from != null*/
    AND p.recorded_date >= REPLACE(/*recorded_date_from*/'', '/', '')
    /*END*/

    /*IF recorded_date_to != null*/
    AND p.recorded_date <= REPLACE(/*recorded_date_to*/'', '/', '')
    /*END*/

    /*IF material_parts_special_order_type != null*/
    AND p.material_parts_special_order_type = /*material_parts_special_order_type*/''
    /*END*/

    /*IF correct_reason_type != null*/
    AND p.correct_reason_type = /*correct_reason_type*/''
    /*END*/

    /*IF management_number != null*/
    AND p.management_number LIKE /*management_number*/''
    /*END*/

    /*IF item_select_identifier != null*/
    AND p.item_select_identifier LIKE /*item_select_identifier*/''
    /*END*/

    /*IF issue_destination != null*/
    AND p.issue_destination LIKE /*issue_destination*/''
    /*END*/

    /*IF trading_partner_identifier != null*/
    AND p.trading_partner_identifier LIKE /*trading_partner_identifier*/''
    /*END*/

    /*IF tmc_delivery_date_from != null*/
    AND p.tmc_delivery_date >= REPLACE(/*tmc_delivery_date_from*/'', '/', '')
    /*END*/

    /*IF tmc_delivery_date_to != null*/
    AND p.tmc_delivery_date <= REPLACE(/*tmc_delivery_date_to*/'', '/', '')
    /*END*/

    /*IF delivery_note_number != null*/
    AND p.delivery_note_number LIKE /*delivery_note_number*/''
    /*END*/

    /*IF receipt_identifier != null*/
    AND p.receipt_identifier LIKE /*receipt_identifier*/''
    /*END*/
/*END*/
```

---

## TMC売掛金不照合追加入力データチェック  （route: `check/01KVT9AXDDPX6WFKXP9P1VX2QV`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
SELECT
    COUNT(*) AS count
FROM
    tmh_acif_receivable_payable_correction_slips
WHERE
    company_identifier = /*company_id*/''
    AND material_parts_special_order_type = '2'
    AND receivable_payable_type = '1'
    AND trading_partner_identifier = /*partner_id*/''
    AND item_select_identifier = /*parts_number*/''
    AND management_number = /*management_number*/''
    AND delivery_note_number = /*delivery_note_number*/''
    AND shipment_date = REPLACE(/*shukka_date*/'', '/', '')
;
```

---

## TMC買掛金不照合追加入力データ登録  （route: `01JZ9F9D0K3R2P7Y8M4N5Q6T1V/check`）

- SQL1: 日付バインド 3 箇所を REPLACE 化
```sql
INSERT INTO tmh_acif_receivable_payable_correction_slips (
  issue_serial_number,
  issuance_date,
  recorded_date,
  material_parts_special_order_type,
  correct_reason_type,
  item_select_identifier,
  management_number,
  trading_partner_identifier,
  tmc_delivery_date,
  delivery_note_number,
  receipt_identifier,
  issue_destination
)
VALUES (
  /*issue_serial_number*/'',
  REPLACE(/*issuance_date*/'', '/', ''),
  REPLACE(/*recorded_date*/'', '/', ''),
  /*material_parts_special_order_type*/'',
  /*correct_reason_type*/'',
  /*item_select_identifier*/'',
  /*management_number*/'',
  /*trading_partner_identifier*/'',
  REPLACE(/*tmc_delivery_date*/'', '/', ''),
  /*delivery_note_number*/'',
  /*receipt_identifier*/'',
  /*issue_destination*/'',
)
```

---

## 部品売上単価マスタ一覧取得  （route: `01KT6B414B6WSSK30KGDQVE86B/getList`）

- SQL1: 日付バインド 3 箇所を REPLACE 化
```sql
SELECT
    updated_company_identifier
  , updated_by
  , updated_process_identifier
  , updated_ip_address
  , updated_at
  , company_identifier
  , parts_number
  , management_number
  , delivery_note_number
  , application_start_date
  , application_end_date
  , TO_CHAR(TO_DATE(configuration_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS configuration_date
  , combined_supply_type
  , external_sale_type
  , trading_partner_identifier
  , unit_price
  , retroactive_completed_type
  , identifier
  , TO_CHAR(TO_DATE(application_start_date, 'YYYYMMDD'), 'YYYY/MM/DD') || '~' || TO_CHAR(TO_DATE(application_end_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS application_date
FROM
  tmh_acif_parts_sales_unit_price
WHERE 1=1
/*BEGIN*/
/*IF parts_number != null && parts_number != ''*/
  AND parts_number LIKE /*parts_number*/''
/*END*/
/*IF management_number != null && management_number != ''*/
    AND management_number LIKE /*management_number*/''
/*END*/
/*IF delivery_note_number != null && delivery_note_number != ''*/
    AND delivery_note_number LIKE /*delivery_note_number*/''
/*END*/
/*IF application_start_date != null && application_start_date != ''*/
    AND application_start_date <= REPLACE(/*application_start_date*/'', '/', '')
/*END*/
/*IF application_end_date != null && application_end_date != ''*/
    AND application_end_date >= REPLACE(/*application_end_date*/'', '/', '')
/*END*/
/*IF combined_supply_type != null && combined_supply_type != ''*/
    AND combined_supply_type LIKE /*combined_supply_type*/''
/*END*/
/*IF external_sale_type != null && external_sale_type != ''*/
    AND external_sale_type LIKE /*external_sale_type*/''
/*END*/
/*IF trading_partner_identifier != null && trading_partner_identifier != ''*/
    AND trading_partner_identifier LIKE /*trading_partner_identifier*/''
/*END*/
/*IF configuration_date != null && configuration_date != ''*/
    AND configuration_date LIKE REPLACE(/*configuration_date*/'', '/', '')
/*END*/
/*IF unit_price != null*/
    AND unit_price <= /*unit_price*/0
/*END*/
AND company_identifier = /*company_identifier*/''
ORDER BY
    company_identifier,
    parts_number,
    management_number,
    application_start_date
/*END*/
```

---

## 検索データ取得  （route: `01J0Z86M9X4K2Q5R7T8Y3B1CDE/getList`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
SELECT
  *
FROM
  tmh_acif_parts_sales_cost_adjustments p
/*BEGIN*/
WHERE
/*IF change_plan_number != null*/
p.change_plan_number LIKE /*change_plan_number*/''
/*END*/

/*IF parts_number != null*/
AND p.parts_number LIKE /*parts_number*/''
/*END*/

/*IF product != null*/
AND p.product LIKE /*product*/''
/*END*/

/*IF type != null*/
AND p.type LIKE /*type*/''
/*END*/

/*IF start_date != null*/
AND p.start_date LIKE REPLACE(/*start_date*/'', '/', '')
/*END*/

/*IF car_type != null*/
AND p.car_type LIKE /*car_type*/''
/*END*/

/*IF sub_unit_price != null*/
AND p.sub_unit_price > 0
/*END*/
/*END*/
```

---

## 仕掛品出庫入力データ検索  （route: `01J0Z8G6Q4M7W2K9R5T3Y8V1H0/getList`）

- SQL1: 日付バインド 4 箇所を REPLACE 化
```sql
SELECT
  p.*
FROM
  tmh_acif_work_in_progress_issue_quantities p
/*BEGIN*/
WHERE
  /*IF issue_serial_number != null*/
  p.issue_serial_number LIKE /*issue_serial_number*/''
  /*END*/

  /*IF recorded_date_from != null*/
  AND p.recorded_date >= REPLACE(/*recorded_date_from*/'', '/', '')
  /*END*/

  /*IF recorded_date_to != null*/
  AND p.recorded_date <= REPLACE(/*recorded_date_to*/'', '/', '')
  /*END*/

  /*IF issue_date_from != null*/
  AND p.issue_date >= REPLACE(/*issue_date_from*/'', '/', '')
  /*END*/

  /*IF issue_date_to != null*/
  AND p.issue_date <= REPLACE(/*issue_date_to*/'', '/', '')
  /*END*/

  /*IF management_number != null*/
    AND p.management_number LIKE /*management_number*/''
    /*END*/

  /*IF parts_number != null*/
  AND p.parts_number = /*parts_number*/''
  /*END*/

  /*IF quantity != null*/
  AND p.quantity > 0
  /*END*/

  /*IF pre_issue_department != null*/
  AND p.pre_issue_department LIKE /*pre_issue_department*/''
  /*END*/
  
  /*IF issue_destination != null*/
  AND p.issue_destination LIKE /*issue_destination*/''
  /*END*/
/*END*/
```

---

## 仕掛品出庫入力データ更新  （route: `tmh_acif_work_in_progress_issue_quantities/update`）

- SQL1: 日付バインド 2 箇所を REPLACE 化
```sql
UPDATE tmh_acif_work_in_progress_issue_quantities
SET
issue_serial_number = /*issue_serial_number*/0,
recorded_date = REPLACE(/*recording_date*/'', '/', '')
issue_date = REPLACE(/*issue_date*/'', '/', '')
management_number = /*management_number*/0,
parts_number = /*parts_number*/0,
quantity = /*quantity*/0,
pre_issue_department = /*pre_issue_department*/0,
issue_destination = /*issue_destination*/0,
WHERE
  company_id = /*company_id*/''
  AND issue_serial_number = /*issue_serial_number*/''
```

---

## 部品仕入返品一覧取得  （route: `01KV4DC1CTNBN3BD5XYMS4KY6B/getList`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
SELECT
  *
FROM
  tmh_acif_parts_purchase_returns
/*BEGIN*/
WHERE 1=1
/*IF issue_serial_number != null && issue_serial_number != ''*/
  AND issue_serial_number LIKE /*issue_serial_number*/''
/*END*/
/*IF issuance_number != null && issuance_number != ''*/
    AND issuance_number LIKE /*issuance_number*/''
/*END*/
/*IF trading_partner_identifier != null && trading_partner_identifier != ''*/
    AND trading_partner_identifier LIKE /*trading_partner_identifier*/''
/*END*/
/*IF return_reason_type != null*/
    AND return_reason_type = /*return_reason_type*/''
/*END*/
/*IF issue_destination != null && issue_destination != ''*/
    AND issue_destination LIKE /*issue_destination*/''
/*END*/
/*IF receipt_date != null*/
    AND receipt_date >= REPLACE(/*receipt_date*/'', '/', '')
/*END*/
/*IF parts_number != null && parts_number != ''*/
    AND parts_number LIKE /*parts_number*/''
/*END*/
/*IF category != null && category != ''*/
    AND category LIKE /*category*/''
/*END*/
/*IF quantity != null*/
    AND quantity > 0
/*END*/
/*IF company_identifier != null && company_identifier != ''*/
AND company_identifier LIKE /*company_identifier*/''
/*END*/
ORDER BY
    company_identifier,
    issue_serial_number,
    issuance_number,
    parts_number
/*END*/
```

---

## 資材差額調整・鋼鈑精算金入力一覧データ検索  （route: `tmh_acif_price_difference_adjustment_steel_settlements`）

- SQL1: 日付バインド 6 箇所を REPLACE 化
```sql
SELECT
  tmh_acif_steel_plate_settlement_adjustment.company_identifier,
  tmh_acif_steel_plate_settlement_adjustment.issue_serial_number,
  tmh_acif_steel_plate_settlement_adjustment.confirmed_unconfirmed_type,
  TO_CHAR(TO_DATE(tmh_acif_steel_plate_settlement_adjustment.issuance_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS issuance_date,
  tmh_acif_steel_plate_settlement_adjustment.detail_print_order_type,
  tmh_acif_steel_plate_settlement_adjustment.trading_partner_identifier,
  tmh_acif_steel_plate_settlement_adjustment.parts_number,
  tmh_acif_steel_plate_settlement_adjustment.delivery_note_number,
  TO_CHAR(TO_DATE(tmh_acif_steel_plate_settlement_adjustment.delivery_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS delivery_date,
  tmh_acif_steel_plate_settlement_adjustment.quantity,
  tmh_acif_steel_plate_settlement_adjustment.unit_price,
  tmh_acif_steel_plate_settlement_adjustment.amount,
  TO_CHAR(TO_DATE(tmh_acif_steel_plate_settlement_adjustment.recorded_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS recorded_date,
  TO_CHAR(TO_DATE(tmh_acif_steel_plate_settlement_adjustment.warehousing_date, 'YYYYMMDD'), 'YYYY/MM/DD') AS warehousing_date,
  tmh_acif_part_number.item_name
FROM
  tmh_acif_steel_plate_settlement_adjustment
LEFT JOIN
  tmh_acif_part_number
ON
  tmh_acif_steel_plate_settlement_adjustment.parts_number = tmh_acif_part_number.parts_number
WHERE
  1 = 1

  /*IF issue_serial_number != null && issue_serial_number != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.issue_serial_number LIKE /*issue_serial_number*/''
  /*END*/

  /*IF issuance_date_from != null && issuance_date_from != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.issuance_date >= REPLACE(/*issuance_date_from*/'', '/', '')
  /*END*/

  /*IF issuance_date_to != null && issuance_date_to != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.issuance_date <= REPLACE(/*issuance_date_to*/'', '/', '')
  /*END*/

  /*IF trading_partner_identifier != null && trading_partner_identifier != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.trading_partner_identifier LIKE /*trading_partner_identifier*/''
  /*END*/

  /*IF delivery_note_number != null && delivery_note_number != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.delivery_note_number LIKE /*delivery_note_number*/''
  /*END*/

  /*IF parts_number != null && parts_number != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.parts_number LIKE /*parts_number*/''
  /*END*/

  /*IF item_name != null && item_name != ''*/
  AND tmh_acif_part_number.item_name LIKE /*item_name*/''
  /*END*/

  /*IF detail_print_order_type != null && detail_print_order_type != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.detail_print_order_type = /*detail_print_order_type*/''
  /*END*/

  /*IF recorded_date_from != null && recorded_date_from != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.recorded_date >= REPLACE(/*recorded_date_from*/'', '/', '')
  /*END*/

  /*IF recorded_date_to != null && recorded_date_to != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.recorded_date <= REPLACE(/*recorded_date_to*/'', '/', '')
  /*END*/

  /*IF delivery_date_from != null && delivery_date_from != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.delivery_date >= REPLACE(/*delivery_date_from*/'', '/', '')
  /*END*/

  /*IF delivery_date_to != null && delivery_date_to != ''*/
  AND tmh_acif_steel_plate_settlement_adjustment.delivery_date <= REPLACE(/*delivery_date_to*/'', '/', '')
  /*END*/

  /*IF quantity_from != null*/
  AND tmh_acif_steel_plate_settlement_adjustment.quantity >= /*quantity_from*/0
  /*END*/

  /*IF quantity_to != null*/
  AND tmh_acif_steel_plate_settlement_adjustment.quantity <= /*quantity_to*/0
  /*END*/

  /*IF unit_price_from != null*/
  AND tmh_acif_steel_plate_settlement_adjustment.unit_price >= /*unit_price_from*/0
  /*END*/

  /*IF unit_price_to != null*/
  AND tmh_acif_steel_plate_settlement_adjustment.unit_price <= /*unit_price_to*/0
  /*END*/

  /*IF amount_from != null*/
  AND tmh_acif_steel_plate_settlement_adjustment.amount >= /*amount_from*/0
  /*END*/

  /*IF amount_to != null*/
  AND tmh_acif_steel_plate_settlement_adjustment.amount <= /*amount_to*/0
  /*END*/

ORDER BY
  tmh_acif_steel_plate_settlement_adjustment.issue_serial_number
```

---

## 資材差額調整・鋼鈑精算金データチェック  （route: `tmh_acif_price_difference_adjustment_steel_settlements/check`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
SELECT
    COUNT(*) AS count
FROM
    tmh_acif_steel_plate_settlement_adjustment
WHERE
    company_identifier = /*company_identifier*/''
    AND detail_print_order_type = /*detail_print_order_type*/''
    AND trading_partner_identifier = /*trading_partner_identifier*/''
    AND parts_number = /*parts_number*/''
    AND delivery_note_number = /*delivery_note_number*/''
    AND delivery_date = REPLACE(/*delivery_date*/'', '/', '')
;
```

---

## 資材差額調整・鋼鈑精算金入力データ登録  （route: `tmh_acif_price_difference_adjustment_steel_settlements/new`）

- SQL1: 日付バインド 4 箇所を REPLACE 化
```sql
INSERT INTO tmh_acif_steel_plate_settlement_adjustment (
    created_company_identifier,
    created_by,
    created_process_identifier,
    created_ip_address,
    created_at,
    updated_company_identifier,
    updated_by,
    updated_process_identifier,
    updated_ip_address,
    updated_at,
    company_identifier,
    issue_serial_number,
    confirmed_unconfirmed_type,
    issuance_date,
    detail_print_order_type,
    trading_partner_identifier,
    parts_number,
    delivery_note_number,
    delivery_date,
    quantity,
    unit_price,
    amount,
    recorded_date,
    warehousing_date
)
VALUES (
    /*created_company_identifier*/'',
    /*created_by*/'',
    /*created_process_identifier*/'',
    /*created_ip_address*/'',
    /*created_at*/'',
    /*updated_company_identifier*/'',
    /*updated_by*/'',
    /*updated_process_identifier*/'',
    /*updated_ip_address*/'',
    /*updated_at*/'',
    /*company_identifier*/'',
    /*issue_serial_number*/'',
    /*confirmed_unconfirmed_type*/'',
    REPLACE(/*issuance_date*/'', '/', ''),
    /*detail_print_order_type*/'',
    /*trading_partner_identifier*/'',
    /*parts_number*/'',
    /*delivery_note_number*/'',
    REPLACE(/*delivery_date*/'', '/', ''),
    /*quantity*/0,
    /*unit_price*/0,
    /*amount*/0,
    REPLACE(/*recorded_date*/'', '/', ''),
    REPLACE(/*warehousing_date*/'', '/', '')
);
```

---

## 特定工数検索  （route: `get/01KTB0601YF7155PRNGGG66HMW`）

- SQL1: 日付バインド 2 箇所を REPLACE 化
```sql
SELECT
  tmh_acif_specific_labor_hours.company_identifier,
  tmh_acif_specific_labor_hours.identifier,
  TO_CHAR(
    TO_DATE(
      tmh_acif_specific_labor_hours.recorded_date,
      'YYYYMMDD'
    ),
    'YYYY/MM/DD'
  ) AS recorded_date,
  tmh_acif_specific_labor_hours.executing_department,
  tmh_acif_specific_labor_hours.management_number,
  tmh_acif_specific_labor_hours.specific_labor_hours,
  tmh_acif_specific_labor_hours.procurement_subject_name,
  tmh_acif_specific_labor_hours.specific_labor_hours_error_identifier
FROM
  tmh_acif_specific_labor_hours
LEFT JOIN
  tmh_acif_special_order_details
ON
  tmh_acif_specific_labor_hours.company_identifier =
    tmh_acif_special_order_details.company_identifier
  AND tmh_acif_specific_labor_hours.management_number =
    tmh_acif_special_order_details.management_number
WHERE
  1 = 1

  AND (
    tmh_acif_specific_labor_hours.management_number LIKE '1%'
    OR tmh_acif_specific_labor_hours.management_number LIKE '5%'
  )

  AND (
    tmh_acif_special_order_details.financial_type IS NULL
    OR tmh_acif_special_order_details.financial_type NOT IN ('3', '5')
  )

  /*IF recording_date_from != null*/
  AND tmh_acif_specific_labor_hours.recorded_date
    >= REPLACE(/*recording_date_from*/'', '/', '')
  /*END*/

  /*IF recording_date_to != null*/
  AND tmh_acif_specific_labor_hours.recorded_date
    <= REPLACE(/*recording_date_to*/'', '/', '')
  /*END*/

  /*IF executing_department != null*/
  AND tmh_acif_specific_labor_hours.executing_department
    LIKE /*executing_department*/''
  /*END*/

  /*IF management_number != null*/
  AND tmh_acif_specific_labor_hours.management_number
    LIKE /*management_number*/''
  /*END*/

  /*IF tokuteikousuuerror_id != null*/
  AND tmh_acif_specific_labor_hours.specific_labor_hours_error_identifier
    = /*tokuteikousuuerror_id*/''
  /*END*/

  /*IF specificmanhour_from != null*/
  AND tmh_acif_specific_labor_hours.specific_labor_hours
    >= /*specificmanhour_from*/0
  /*END*/

  /*IF specificmanhour_to != null*/
  AND tmh_acif_specific_labor_hours.specific_labor_hours
    <= /*specificmanhour_to*/0
  /*END*/

ORDER BY
  tmh_acif_specific_labor_hours.specific_labor_hours_error_identifier DESC,
  tmh_acif_specific_labor_hours.executing_department ASC,
  tmh_acif_specific_labor_hours.management_number ASC
```

---

## 特定工数削除  （route: `tmh_ka_tokuteikousuu/delete`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
DELETE FROM
  tmh_acif_specific_labor_hours
WHERE
  company_identifier = /*company_identifier*/''
  AND recorded_date = REPLACE(/*recorded_date*/'', '/', '')
  AND executing_department = /*executing_department*/''
  AND management_number = /*management_number*/''
```

---

## 特定工数チェック  （route: `tmh_ka_tokuteikousuu/check`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
SELECT

    COUNT(*) AS count

FROM

    tmh_ka_tokuteikousuu

WHERE

    recording_date = REPLACE(/*recording_date*/'', '/', '')

    AND executing_department = /*executing_department*/''

    AND management_number = /*management_number*/''
```

---

## 特定工数登録  （route: `tmh_ka_tokuteikousuu/new`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
INSERT INTO tmh_acif_specific_labor_hours (
  created_company_identifier,
  created_by,
  created_process_identifier,
  created_ip_address,
  created_at,
  updated_company_identifier,
  updated_by,
  updated_process_identifier,
  updated_ip_address,
  updated_at,
  company_identifier,
  recorded_date,
  executing_department,
  management_number,
  specific_labor_hours,
  procurement_subject_name,
  specific_labor_hours_error_identifier
)
VALUES (
  /*created_company_identifier*/'',
  /*created_by*/'',
  /*created_process_identifier*/'',
  /*created_ip_address*/'',
  /*created_at*/'',
  /*updated_company_identifier*/'',
  /*updated_by*/'',
  /*updated_process_identifier*/'',
  /*updated_ip_address*/'',
  /*updated_at*/'',
  /*company_id*/'',
  REPLACE(/*recording_date*/'', '/', ''),
  /*executing_department*/'',
  /*management_number*/'',
  /*specificmanhour*/0,
  /*procurement_subject_name*/'',
  /*tokuteikousuuerror_id*/''
)
```

---

## 特定工数更新  （route: `tmh_ka_tokuteikousuu/edit`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
UPDATE
  tmh_acif_specific_labor_hours
SET
  specific_labor_hours = /*specificmanhour*/0
WHERE
  recorded_date = REPLACE(/*recording_date*/'', '/', '')
  AND executing_department = /*executing_department*/''
  AND management_number = /*management_number*/''
```

---

## 加工不良データ入力検索  （route: `tmh_acif_processing_defect_quantities`）

- SQL1: 日付バインド 2 箇所を REPLACE 化
```sql
SELECT
  tmh_acif_processing_defect_quantities.company_identifier,
  TO_CHAR(
    TO_DATE(
      tmh_acif_processing_defect_quantities.recorded_date,
      'YYYYMMDD'
    ),
    'YYYY/MM/DD'
  ) AS recorded_date,
  tmh_acif_processing_defect_quantities.parts_number,
  tmh_acif_processing_defect_quantities.department,
  tmh_acif_processing_defect_quantities.correction_quantity,
  tmh_acif_part_number.item_name,
  tmh_acif_processing_defect_quantities.current_month_quantity
FROM
  tmh_acif_processing_defect_quantities
  LEFT JOIN tmh_acif_part_number
  ON tmh_acif_processing_defect_quantities.parts_number = tmh_acif_part_number.parts_number
WHERE
  1 = 1

  /*IF recorded_date_from != null && recorded_date_from != ''*/
  AND tmh_acif_processing_defect_quantities.recorded_date
    >= REPLACE(/*recorded_date_from*/'', '/', '')
  /*END*/

  /*IF recorded_date_to != null && recorded_date_to != ''*/
  AND tmh_acif_processing_defect_quantities.recorded_date
    <= REPLACE(/*recorded_date_to*/'', '/', '')
  /*END*/

  /*IF department != null && department != ''*/
  AND tmh_acif_processing_defect_quantities.department
    LIKE /*department*/''
  /*END*/

  /*IF parts_number != null && parts_number != ''*/
  AND tmh_acif_processing_defect_quantities.parts_number
    LIKE /*parts_number*/''
  /*END*/

  /*IF correction_quantity_from != null*/
  AND tmh_acif_processing_defect_quantities.correction_quantity
    >= /*correction_quantity_from*/0
  /*END*/

  /*IF correction_quantity_to != null*/
  AND tmh_acif_processing_defect_quantities.correction_quantity
    <= /*correction_quantity_to*/0
  /*END*/

  /*IF current_month_quantity_from != null*/
  AND tmh_acif_processing_defect_quantities.current_month_quantity
    >= /*current_month_quantity_from*/0
  /*END*/

  /*IF current_month_quantity_to != null*/
  AND tmh_acif_processing_defect_quantities.current_month_quantity
    <= /*current_month_quantity_to*/0
  /*END*/

ORDER BY
  tmh_acif_processing_defect_quantities.recorded_date,
  tmh_acif_processing_defect_quantities.parts_number
```

---

## 加工不良データ入力削除  （route: `tmh_ka_kakoufuryousuryou/delete`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
DELETE FROM
  tmh_acif_processing_defect_quantities
WHERE
  recorded_date = REPLACE(/*recorded_date*/'', '/', '')
AND department = /*department*/''
AND parts_number = /*parts_number*/''
```

---

## 加工不良データ入力チェック  （route: `tmh_ka_kakoufuryousuryou/check`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
SELECT
    COUNT(*) AS count
FROM
    tmh_ka_kakoufuryousuryou
WHERE
    recording_date = REPLACE(/*recording_date*/'', '/', '')
    AND department = /*department*/''
    AND parts_number = /*parts_number*/''
```

---

## 加工不良データ入力登録  （route: `tmh_ka_kakoufuryousuryou/new`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
INSERT INTO tmh_acif_processing_defect_quantities (
  created_company_identifier,
  created_by,
  created_process_identifier,
  created_ip_address,
  created_at,
  updated_company_identifier,
  updated_by,
  updated_process_identifier,
  updated_ip_address,
  updated_at,
  company_identifier,
  recorded_date,
  department,
  parts_number,
  correction_quantity,
  current_month_quantity
)
VALUES (
  /*created_company_identifier*/'',
  /*created_by*/'',
  /*created_process_identifier*/'',
  /*created_ip_address*/'',
  /*created_at*/'',
  /*updated_company_identifier*/'',
  /*updated_by*/'',
  /*updated_process_identifier*/'',
  /*updated_ip_address*/'',
  /*updated_at*/'',
  /*company_identifier*/'',
  REPLACE(/*recorded_date*/'', '/', ''),
  /*department*/'',
  /*parts_number*/'',
  /*correction_quantity*/0,
  /*current_month_quantity*/0
)
```

---

## 加工不良データ入力更新  （route: `tmh_ka_kakoufuryousuryou/edit`）

- SQL1: 日付バインド 1 箇所を REPLACE 化
```sql
UPDATE tmh_acif_processing_defect_quantities
SET
    correction_quantity = /*correction_quantity*/0,
    current_month_quantity = /*current_month_quantity*/0
WHERE
    company_identifier = /*company_identifier*/''
    AND recorded_date = REPLACE(/*recorded_date*/'', '/', '')
    AND department = /*department*/''
    AND parts_number = /*parts_number*/''
```

---