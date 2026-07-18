# 会計IF 新規CRUD 設計(ビルドシート)

登録・更新・削除フローが無い画面向けに、正典(xlsx物理列/PK)から起こした SQL と入力仕様。

## 作り方(方針)

im-LogicDesigner のフロー本体JSONを手書きでインポート可能に作るのは高リスク(列差・辞書ID・インポート検証不可)。
**確実な手順**: 模範フローを Designer で「名前を付けて保存」→ 対象テーブル/PK/列を本書の SQL・入力項目に差し替え → 検証テナントでテスト。

- 完全CRUDの模範: **加工不良データ入力**(check/new/edit/delete 一式)、**資材差額調整・鋼鈑精算金**。

- SQL は 2-way SQL(`/*param*/'default'`)。監査列(created_*/updated_*)はマッピングで自動設定。

- ルート命名は名前系 `tmh_acif_<name>/{check,new,edit,delete}` に統一推奨。


---


## 部品売上単価

- 対象テーブル: `tmh_acif_parts_sales_unit_price`（部品売上単価マスタ）
- クローン元: 部品仕入単価(new/edit/check)＋加工不良(delete)
- 推奨ルート: `tmh_acif_parts_sales_unit_price/{check,new,edit,delete}`
- 備考: 最優先。姉妹の部品仕入単価がほぼ同型(列は売上側=trading_partner_identifier/combined_supply_type/external_sale_type)。

### 列定義

| 物理列 | 論理 | PK |
|---|---|:-:|
| updated_company_identifier | 更新会社ID |  |
| updated_by | 更新ユーザーID |  |
| updated_process_identifier | 更新プロセスID |  |
| updated_ip_address | 更新IPアドレス |  |
| updated_at | タイムスタンプ値 |  |
| company_identifier | 会社ID | ● |
| parts_number | 部品番号 | ● |
| management_number | 管理番号 | ● |
| delivery_note_number | 納品書番号 | ● |
| application_start_date | 適用開始日 | ● |
| application_end_date | 適用終了日 |  |
| configuration_date | 設定日付 |  |
| combined_supply_type | 合口補給区分 |  |
| external_sale_type | 外販区分 |  |
| trading_partner_identifier | 取引先ID |  |
| unit_price | 単価 |  |
| retroactive_completed_type | 遡り実施済区分 |  |
| identifier | 部品売上単価マスタID |  |

### SQL テンプレート

```sql
-- 登録(new)
INSERT INTO tmh_acif_parts_sales_unit_price (
  updated_company_identifier, updated_by, updated_process_identifier, updated_ip_address, updated_at, company_identifier, parts_number, management_number, delivery_note_number, application_start_date, application_end_date, configuration_date, combined_supply_type, external_sale_type, trading_partner_identifier, unit_price, retroactive_completed_type, identifier
) VALUES (
  /*updated_company_identifier*/'', /*updated_by*/'', /*updated_process_identifier*/'', /*updated_ip_address*/'', /*updated_at*/CURRENT_TIMESTAMP, /*company_identifier*/'', /*parts_number*/'', /*management_number*/'', /*delivery_note_number*/'', /*application_start_date*/'', /*application_end_date*/'', /*configuration_date*/'', /*combined_supply_type*/'', /*external_sale_type*/'', /*trading_partner_identifier*/'', /*unit_price*/'', /*retroactive_completed_type*/'', /*identifier*/''
);

-- 更新(edit)
UPDATE tmh_acif_parts_sales_unit_price SET
  application_end_date = /*application_end_date*/'',
  configuration_date = /*configuration_date*/'',
  combined_supply_type = /*combined_supply_type*/'',
  external_sale_type = /*external_sale_type*/'',
  trading_partner_identifier = /*trading_partner_identifier*/'',
  unit_price = /*unit_price*/'',
  retroactive_completed_type = /*retroactive_completed_type*/'',
  identifier = /*identifier*/'',
  updated_company_identifier = /*updated_company_identifier*/'',
  updated_by = /*updated_by*/'',
  updated_process_identifier = /*updated_process_identifier*/'',
  updated_ip_address = /*updated_ip_address*/'',
  updated_at = /*updated_at*/''
WHERE company_identifier = /*company_identifier*/'' AND parts_number = /*parts_number*/'' AND management_number = /*management_number*/'' AND delivery_note_number = /*delivery_note_number*/'' AND application_start_date = /*application_start_date*/'';

-- 削除(delete)
DELETE FROM tmh_acif_parts_sales_unit_price
WHERE company_identifier = /*company_identifier*/'' AND parts_number = /*parts_number*/'' AND management_number = /*management_number*/'' AND delivery_note_number = /*delivery_note_number*/'' AND application_start_date = /*application_start_date*/'';

-- チェック(存在確認)
SELECT COUNT(*) AS cnt FROM tmh_acif_parts_sales_unit_price
WHERE company_identifier = /*company_identifier*/'' AND parts_number = /*parts_number*/'' AND management_number = /*management_number*/'' AND delivery_note_number = /*delivery_note_number*/'' AND application_start_date = /*application_start_date*/'';
```

### 入力項目(REST入力定義に宣言する)

- キー(PK): ['company_identifier', 'parts_number', 'management_number', 'delivery_note_number', 'application_start_date']
- 業務項目: ['application_end_date', 'configuration_date', 'combined_supply_type', 'external_sale_type', 'trading_partner_identifier', 'unit_price', 'retroactive_completed_type', 'identifier']
- ※監査列(created_*/updated_*)はフロー内でセッション/日時から設定。REST入力には含めない。


---


## 部品売上原価調整

- 対象テーブル: `tmh_acif_parts_sales_cost_adjustments`（部品売上原価調整）
- クローン元: 加工不良(完全CRUD)
- 推奨ルート: `tmh_acif_parts_sales_cost_adjustments/{check,new,edit,delete}`
- 備考: 検索フロー既存。登録/更新/削除を新設。

### 列定義

| 物理列 | 論理 | PK |
|---|---|:-:|
| created_company_identifier | 登録会社ID |  |
| created_by | 登録ユーザーID |  |
| created_process_identifier | 登録プロセスID |  |
| created_ip_address | 登録IPアドレス |  |
| created_at | 登録タイムスタンプ |  |
| updated_company_identifier | 更新会社ID |  |
| updated_by | 更新ユーザーID |  |
| updated_process_identifier | 更新プロセスID |  |
| updated_ip_address | 更新IPアドレス |  |
| updated_at | タイムスタンプ値 |  |
| company_identifier | 会社ID | ● |
| change_plan_number | 変更計画番号 | ● |
| parts_number | 部品番号 | ● |
| product | 商品 |  |
| type | 種別 |  |
| car_type | 車種別 |  |
| start_date | 開始日付 |  |
| sub_unit_price | サブ単価 |  |
| create_year_month | 作成年月 |  |
| process_state | 処理状態 |  |
| identifier | 部品売上原価調整ID |  |

### SQL テンプレート

```sql
-- 登録(new)
INSERT INTO tmh_acif_parts_sales_cost_adjustments (
  created_company_identifier, created_by, created_process_identifier, created_ip_address, created_at, updated_company_identifier, updated_by, updated_process_identifier, updated_ip_address, updated_at, company_identifier, change_plan_number, parts_number, product, type, car_type, start_date, sub_unit_price, create_year_month, process_state, identifier
) VALUES (
  /*created_company_identifier*/'', /*created_by*/'', /*created_process_identifier*/'', /*created_ip_address*/'', /*created_at*/CURRENT_TIMESTAMP, /*updated_company_identifier*/'', /*updated_by*/'', /*updated_process_identifier*/'', /*updated_ip_address*/'', /*updated_at*/CURRENT_TIMESTAMP, /*company_identifier*/'', /*change_plan_number*/'', /*parts_number*/'', /*product*/'', /*type*/'', /*car_type*/'', /*start_date*/'', /*sub_unit_price*/'', /*create_year_month*/'', /*process_state*/'', /*identifier*/''
);

-- 更新(edit)
UPDATE tmh_acif_parts_sales_cost_adjustments SET
  product = /*product*/'',
  type = /*type*/'',
  car_type = /*car_type*/'',
  start_date = /*start_date*/'',
  sub_unit_price = /*sub_unit_price*/'',
  create_year_month = /*create_year_month*/'',
  process_state = /*process_state*/'',
  identifier = /*identifier*/'',
  updated_company_identifier = /*updated_company_identifier*/'',
  updated_by = /*updated_by*/'',
  updated_process_identifier = /*updated_process_identifier*/'',
  updated_ip_address = /*updated_ip_address*/'',
  updated_at = /*updated_at*/''
WHERE company_identifier = /*company_identifier*/'' AND change_plan_number = /*change_plan_number*/'' AND parts_number = /*parts_number*/'';

-- 削除(delete)
DELETE FROM tmh_acif_parts_sales_cost_adjustments
WHERE company_identifier = /*company_identifier*/'' AND change_plan_number = /*change_plan_number*/'' AND parts_number = /*parts_number*/'';

-- チェック(存在確認)
SELECT COUNT(*) AS cnt FROM tmh_acif_parts_sales_cost_adjustments
WHERE company_identifier = /*company_identifier*/'' AND change_plan_number = /*change_plan_number*/'' AND parts_number = /*parts_number*/'';
```

### 入力項目(REST入力定義に宣言する)

- キー(PK): ['company_identifier', 'change_plan_number', 'parts_number']
- 業務項目: ['product', 'type', 'car_type', 'start_date', 'sub_unit_price', 'create_year_month', 'process_state', 'identifier']
- ※監査列(created_*/updated_*)はフロー内でセッション/日時から設定。REST入力には含めない。


---


## 部品仕入返品

- 対象テーブル: `tmh_acif_parts_purchase_returns`（部品仕入返品）
- クローン元: 加工不良(完全CRUD)
- 推奨ルート: `tmh_acif_parts_purchase_returns/{check,new,edit,delete}`
- 備考: 検索フロー既存。

### 列定義

| 物理列 | 論理 | PK |
|---|---|:-:|
| created_company_identifier | 登録会社ID |  |
| created_by | 登録ユーザーID |  |
| created_process_identifier | 登録プロセスID |  |
| created_ip_address | 登録IPアドレス |  |
| created_at | 登録タイムスタンプ |  |
| updated_company_identifier | 更新会社ID |  |
| updated_by | 更新ユーザーID |  |
| updated_process_identifier | 更新プロセスID |  |
| updated_ip_address | 更新IPアドレス |  |
| updated_at | タイムスタンプ値 |  |
| company_identifier | 会社ID | ● |
| issue_serial_number | 発行シリアル番号 | ● |
| issuance_number | 発行番号 |  |
| trading_partner_identifier | 取引先ID |  |
| return_reason_type | 返品理由区分 |  |
| receipt_identifier | 受付ID |  |
| receipt_date | 受付日付 |  |
| parts_number | 部品番号 |  |
| category | 類別 |  |
| quantity | 数量 |  |
| issue_destination | 出庫先 |  |
| identifier | 部品仕入返品ID |  |

### SQL テンプレート

```sql
-- 登録(new)
INSERT INTO tmh_acif_parts_purchase_returns (
  created_company_identifier, created_by, created_process_identifier, created_ip_address, created_at, updated_company_identifier, updated_by, updated_process_identifier, updated_ip_address, updated_at, company_identifier, issue_serial_number, issuance_number, trading_partner_identifier, return_reason_type, receipt_identifier, receipt_date, parts_number, category, quantity, issue_destination, identifier
) VALUES (
  /*created_company_identifier*/'', /*created_by*/'', /*created_process_identifier*/'', /*created_ip_address*/'', /*created_at*/CURRENT_TIMESTAMP, /*updated_company_identifier*/'', /*updated_by*/'', /*updated_process_identifier*/'', /*updated_ip_address*/'', /*updated_at*/CURRENT_TIMESTAMP, /*company_identifier*/'', /*issue_serial_number*/'', /*issuance_number*/'', /*trading_partner_identifier*/'', /*return_reason_type*/'', /*receipt_identifier*/'', /*receipt_date*/'', /*parts_number*/'', /*category*/'', /*quantity*/'', /*issue_destination*/'', /*identifier*/''
);

-- 更新(edit)
UPDATE tmh_acif_parts_purchase_returns SET
  issuance_number = /*issuance_number*/'',
  trading_partner_identifier = /*trading_partner_identifier*/'',
  return_reason_type = /*return_reason_type*/'',
  receipt_identifier = /*receipt_identifier*/'',
  receipt_date = /*receipt_date*/'',
  parts_number = /*parts_number*/'',
  category = /*category*/'',
  quantity = /*quantity*/'',
  issue_destination = /*issue_destination*/'',
  identifier = /*identifier*/'',
  updated_company_identifier = /*updated_company_identifier*/'',
  updated_by = /*updated_by*/'',
  updated_process_identifier = /*updated_process_identifier*/'',
  updated_ip_address = /*updated_ip_address*/'',
  updated_at = /*updated_at*/''
WHERE company_identifier = /*company_identifier*/'' AND issue_serial_number = /*issue_serial_number*/'';

-- 削除(delete)
DELETE FROM tmh_acif_parts_purchase_returns
WHERE company_identifier = /*company_identifier*/'' AND issue_serial_number = /*issue_serial_number*/'';

-- チェック(存在確認)
SELECT COUNT(*) AS cnt FROM tmh_acif_parts_purchase_returns
WHERE company_identifier = /*company_identifier*/'' AND issue_serial_number = /*issue_serial_number*/'';
```

### 入力項目(REST入力定義に宣言する)

- キー(PK): ['company_identifier', 'issue_serial_number']
- 業務項目: ['issuance_number', 'trading_partner_identifier', 'return_reason_type', 'receipt_identifier', 'receipt_date', 'parts_number', 'category', 'quantity', 'issue_destination', 'identifier']
- ※監査列(created_*/updated_*)はフロー内でセッション/日時から設定。REST入力には含めない。


---


## 部品売上外販品数量分割(月次)

- 対象テーブル: `tmh_acif_parts_sales_external_quantities`（部品売上外販品数量）
- クローン元: 加工不良(完全CRUD)
- 推奨ルート: `tmh_acif_parts_sales_external_quantities/{check,new,edit,delete}`
- 備考: フロー無し。月次分割の書込先と想定(要確認)。

### 列定義

| 物理列 | 論理 | PK |
|---|---|:-:|
| created_company_identifier | 登録会社ID |  |
| created_by | 登録ユーザーID |  |
| created_process_identifier | 登録プロセスID |  |
| created_ip_address | 登録IPアドレス |  |
| created_at | 登録タイムスタンプ |  |
| updated_company_identifier | 更新会社ID |  |
| updated_by | 更新ユーザーID |  |
| updated_process_identifier | 更新プロセスID |  |
| updated_ip_address | 更新IPアドレス |  |
| updated_at | タイムスタンプ値 |  |
| company_identifier | 会社ID | ● |
| recording_year_month | 計上年月 | ● |
| parts_number | 部品番号 | ● |
| trading_partner_identifier | 取引先ID | ● |
| quantity | 数量 |  |
| shipment_current_month_arrival_quantity | 出荷当月納入数量 |  |
| shipment_previous_month_arrival_quantity | 出荷前月納入数量 |  |
| identifier | 部品売上外販品数量ID |  |

### SQL テンプレート

```sql
-- 登録(new)
INSERT INTO tmh_acif_parts_sales_external_quantities (
  created_company_identifier, created_by, created_process_identifier, created_ip_address, created_at, updated_company_identifier, updated_by, updated_process_identifier, updated_ip_address, updated_at, company_identifier, recording_year_month, parts_number, trading_partner_identifier, quantity, shipment_current_month_arrival_quantity, shipment_previous_month_arrival_quantity, identifier
) VALUES (
  /*created_company_identifier*/'', /*created_by*/'', /*created_process_identifier*/'', /*created_ip_address*/'', /*created_at*/CURRENT_TIMESTAMP, /*updated_company_identifier*/'', /*updated_by*/'', /*updated_process_identifier*/'', /*updated_ip_address*/'', /*updated_at*/CURRENT_TIMESTAMP, /*company_identifier*/'', /*recording_year_month*/'', /*parts_number*/'', /*trading_partner_identifier*/'', /*quantity*/'', /*shipment_current_month_arrival_quantity*/'', /*shipment_previous_month_arrival_quantity*/'', /*identifier*/''
);

-- 更新(edit)
UPDATE tmh_acif_parts_sales_external_quantities SET
  quantity = /*quantity*/'',
  shipment_current_month_arrival_quantity = /*shipment_current_month_arrival_quantity*/'',
  shipment_previous_month_arrival_quantity = /*shipment_previous_month_arrival_quantity*/'',
  identifier = /*identifier*/'',
  updated_company_identifier = /*updated_company_identifier*/'',
  updated_by = /*updated_by*/'',
  updated_process_identifier = /*updated_process_identifier*/'',
  updated_ip_address = /*updated_ip_address*/'',
  updated_at = /*updated_at*/''
WHERE company_identifier = /*company_identifier*/'' AND recording_year_month = /*recording_year_month*/'' AND parts_number = /*parts_number*/'' AND trading_partner_identifier = /*trading_partner_identifier*/'';

-- 削除(delete)
DELETE FROM tmh_acif_parts_sales_external_quantities
WHERE company_identifier = /*company_identifier*/'' AND recording_year_month = /*recording_year_month*/'' AND parts_number = /*parts_number*/'' AND trading_partner_identifier = /*trading_partner_identifier*/'';

-- チェック(存在確認)
SELECT COUNT(*) AS cnt FROM tmh_acif_parts_sales_external_quantities
WHERE company_identifier = /*company_identifier*/'' AND recording_year_month = /*recording_year_month*/'' AND parts_number = /*parts_number*/'' AND trading_partner_identifier = /*trading_partner_identifier*/'';
```

### 入力項目(REST入力定義に宣言する)

- キー(PK): ['company_identifier', 'recording_year_month', 'parts_number', 'trading_partner_identifier']
- 業務項目: ['quantity', 'shipment_current_month_arrival_quantity', 'shipment_previous_month_arrival_quantity', 'identifier']
- ※監査列(created_*/updated_*)はフロー内でセッション/日時から設定。REST入力には含めない。


---


## 売掛金買掛金訂正

- 対象テーブル: `tmh_acif_receivable_payable_correction_slips`（売掛金買掛金訂正票）
- クローン元: 資材差額(edit/delete)
- 推奨ルート: `tmh_acif_receivable_payable_correction_slips/{edit,delete}`
- 備考: TMC買掛金が登録する同一テーブル。本画面は既存訂正票の更新/削除と想定(要確認)。

### 列定義

| 物理列 | 論理 | PK |
|---|---|:-:|
| created_company_identifier | 登録会社ID |  |
| created_by | 登録ユーザーID |  |
| created_process_identifier | 登録プロセスID |  |
| created_ip_address | 登録IPアドレス |  |
| created_at | 登録タイムスタンプ |  |
| updated_company_identifier | 更新会社ID |  |
| updated_by | 更新ユーザーID |  |
| updated_process_identifier | 更新プロセスID |  |
| updated_ip_address | 更新IPアドレス |  |
| updated_at | タイムスタンプ値 |  |
| company_identifier | 会社ID | ● |
| issue_serial_number | 発行シリアル番号 | ● |
| slip_type | 伝票区分 |  |
| confirmed_unconfirmed_type | 確定未確定区分 |  |
| issuance_date | 発行日付 |  |
| material_parts_special_order_type | 資材部品特調区分 |  |
| receivable_payable_type | 売掛買掛区分 |  |
| trading_partner_identifier | 取引先ID |  |
| item_select_identifier | 品目選択ID |  |
| management_number | 管理番号 |  |
| procurement_subject_name | 調達件名 |  |
| delivery_note_number | 納品書番号 |  |
| acceptance_date | 検収日付 |  |
| previous_quantity | 前回数量 |  |
| previous_unit_price | 前回単価 |  |
| previous_amount | 前回金額 |  |
| new_quantity | 新数量 |  |
| new_unit_price | 新単価 |  |
| new_amount | 新金額 |  |
| difference_quantity | 差異数量 |  |
| difference_unit_price | 差額単価 |  |
| difference_amount | 差額金額 |  |
| correct_reason_type | 訂正理由区分 |  |
| correction_reason | 訂正理由 |  |
| self_supply_type | 自支給区分 |  |
| return_type | 返品区分 |  |
| settlement_type | 精算区分 |  |
| special_order_repair_type | 特調修理区分 |  |
| shipment_date | 出荷日付 |  |
| combined_supply_type | 合口補給区分 |  |
| tmc_acceptance_date | TMC検収日付 |  |
| product_type | 商品区分 |  |
| tmc_delivery_date | TMC納入日付 |  |
| issue_destination | 出庫先 |  |
| warehousing_date | 入庫日付 |  |
| issue_date | 出庫日付 |  |
| recorded_date | 計上日付 |  |
| receipt_identifier | 受付ID |  |
| cumulative_number | 累積番号 |  |
| internal_type | 内製区分 |  |
| identifier | 売掛金買掛金訂正票ID |  |

### SQL テンプレート

```sql
-- 登録(new)
INSERT INTO tmh_acif_receivable_payable_correction_slips (
  created_company_identifier, created_by, created_process_identifier, created_ip_address, created_at, updated_company_identifier, updated_by, updated_process_identifier, updated_ip_address, updated_at, company_identifier, issue_serial_number, slip_type, confirmed_unconfirmed_type, issuance_date, material_parts_special_order_type, receivable_payable_type, trading_partner_identifier, item_select_identifier, management_number, procurement_subject_name, delivery_note_number, acceptance_date, previous_quantity, previous_unit_price, previous_amount, new_quantity, new_unit_price, new_amount, difference_quantity, difference_unit_price, difference_amount, correct_reason_type, correction_reason, self_supply_type, return_type, settlement_type, special_order_repair_type, shipment_date, combined_supply_type, tmc_acceptance_date, product_type, tmc_delivery_date, issue_destination, warehousing_date, issue_date, recorded_date, receipt_identifier, cumulative_number, internal_type, identifier
) VALUES (
  /*created_company_identifier*/'', /*created_by*/'', /*created_process_identifier*/'', /*created_ip_address*/'', /*created_at*/CURRENT_TIMESTAMP, /*updated_company_identifier*/'', /*updated_by*/'', /*updated_process_identifier*/'', /*updated_ip_address*/'', /*updated_at*/CURRENT_TIMESTAMP, /*company_identifier*/'', /*issue_serial_number*/'', /*slip_type*/'', /*confirmed_unconfirmed_type*/'', /*issuance_date*/'', /*material_parts_special_order_type*/'', /*receivable_payable_type*/'', /*trading_partner_identifier*/'', /*item_select_identifier*/'', /*management_number*/'', /*procurement_subject_name*/'', /*delivery_note_number*/'', /*acceptance_date*/'', /*previous_quantity*/'', /*previous_unit_price*/'', /*previous_amount*/'', /*new_quantity*/'', /*new_unit_price*/'', /*new_amount*/'', /*difference_quantity*/'', /*difference_unit_price*/'', /*difference_amount*/'', /*correct_reason_type*/'', /*correction_reason*/'', /*self_supply_type*/'', /*return_type*/'', /*settlement_type*/'', /*special_order_repair_type*/'', /*shipment_date*/'', /*combined_supply_type*/'', /*tmc_acceptance_date*/'', /*product_type*/'', /*tmc_delivery_date*/'', /*issue_destination*/'', /*warehousing_date*/'', /*issue_date*/'', /*recorded_date*/'', /*receipt_identifier*/'', /*cumulative_number*/'', /*internal_type*/'', /*identifier*/''
);

-- 更新(edit)
UPDATE tmh_acif_receivable_payable_correction_slips SET
  slip_type = /*slip_type*/'',
  confirmed_unconfirmed_type = /*confirmed_unconfirmed_type*/'',
  issuance_date = /*issuance_date*/'',
  material_parts_special_order_type = /*material_parts_special_order_type*/'',
  receivable_payable_type = /*receivable_payable_type*/'',
  trading_partner_identifier = /*trading_partner_identifier*/'',
  item_select_identifier = /*item_select_identifier*/'',
  management_number = /*management_number*/'',
  procurement_subject_name = /*procurement_subject_name*/'',
  delivery_note_number = /*delivery_note_number*/'',
  acceptance_date = /*acceptance_date*/'',
  previous_quantity = /*previous_quantity*/'',
  previous_unit_price = /*previous_unit_price*/'',
  previous_amount = /*previous_amount*/'',
  new_quantity = /*new_quantity*/'',
  new_unit_price = /*new_unit_price*/'',
  new_amount = /*new_amount*/'',
  difference_quantity = /*difference_quantity*/'',
  difference_unit_price = /*difference_unit_price*/'',
  difference_amount = /*difference_amount*/'',
  correct_reason_type = /*correct_reason_type*/'',
  correction_reason = /*correction_reason*/'',
  self_supply_type = /*self_supply_type*/'',
  return_type = /*return_type*/'',
  settlement_type = /*settlement_type*/'',
  special_order_repair_type = /*special_order_repair_type*/'',
  shipment_date = /*shipment_date*/'',
  combined_supply_type = /*combined_supply_type*/'',
  tmc_acceptance_date = /*tmc_acceptance_date*/'',
  product_type = /*product_type*/'',
  tmc_delivery_date = /*tmc_delivery_date*/'',
  issue_destination = /*issue_destination*/'',
  warehousing_date = /*warehousing_date*/'',
  issue_date = /*issue_date*/'',
  recorded_date = /*recorded_date*/'',
  receipt_identifier = /*receipt_identifier*/'',
  cumulative_number = /*cumulative_number*/'',
  internal_type = /*internal_type*/'',
  identifier = /*identifier*/'',
  updated_company_identifier = /*updated_company_identifier*/'',
  updated_by = /*updated_by*/'',
  updated_process_identifier = /*updated_process_identifier*/'',
  updated_ip_address = /*updated_ip_address*/'',
  updated_at = /*updated_at*/''
WHERE company_identifier = /*company_identifier*/'' AND issue_serial_number = /*issue_serial_number*/'';

-- 削除(delete)
DELETE FROM tmh_acif_receivable_payable_correction_slips
WHERE company_identifier = /*company_identifier*/'' AND issue_serial_number = /*issue_serial_number*/'';

-- チェック(存在確認)
SELECT COUNT(*) AS cnt FROM tmh_acif_receivable_payable_correction_slips
WHERE company_identifier = /*company_identifier*/'' AND issue_serial_number = /*issue_serial_number*/'';
```

### 入力項目(REST入力定義に宣言する)

- キー(PK): ['company_identifier', 'issue_serial_number']
- 業務項目: ['slip_type', 'confirmed_unconfirmed_type', 'issuance_date', 'material_parts_special_order_type', 'receivable_payable_type', 'trading_partner_identifier', 'item_select_identifier', 'management_number', 'procurement_subject_name', 'delivery_note_number', 'acceptance_date', 'previous_quantity', 'previous_unit_price', 'previous_amount', 'new_quantity', 'new_unit_price', 'new_amount', 'difference_quantity', 'difference_unit_price', 'difference_amount', 'correct_reason_type', 'correction_reason', 'self_supply_type', 'return_type', 'settlement_type', 'special_order_repair_type', 'shipment_date', 'combined_supply_type', 'tmc_acceptance_date', 'product_type', 'tmc_delivery_date', 'issue_destination', 'warehousing_date', 'issue_date', 'recorded_date', 'receipt_identifier', 'cumulative_number', 'internal_type', 'identifier']
- ※監査列(created_*/updated_*)はフロー内でセッション/日時から設定。REST入力には含めない。


---


## 対象テーブル要確認

- **部品買入特調単価**: 対象テーブル不明。買入特調の単価マスタを指すが xlsx で断定できず。要確認。
- **特調たな卸単価未決**: 検索は仕訳累積＋特調たな卸金額累積を参照。未決単価の書込先(UPDATE対象)を確認要。