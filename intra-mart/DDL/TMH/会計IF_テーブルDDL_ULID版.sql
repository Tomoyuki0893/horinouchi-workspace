-- ============================================================
-- 会計I/F テーブル定義 DDL (テーブル辞書 J列 名称反映版)
-- Generated from: 会計IF_テーブル_項目定義.xlsx
-- 対象テーブル数: 162 (除外: 1)
-- 既存の同名テーブル(tmh_acif_*)を事前にDROPしてから再作成します
--
-- [改訂] identifier列の採番方式変更 (2026-07-15)
--   画面からのintra-martID(15桁)登録には対応しつつ、
--   pg/PLSQLストアド経由の採番はULIDに統一する方針とし、
--   全identifier列を下記のとおり変更:
--     旧: identifier VARCHAR(20)
--     新: identifier VARCHAR(26) DEFAULT generate_ulid()
--   ※ generate_ulid()は別途DB側に定義済みのファンクションを想定
--   ※ 対象外: tmh_acif_specific_operation (identifier列なし)
-- ============================================================

-- ------------------------------------------------------------
-- 旧命名テーブル(tmh_ka_*)の一括削除
-- DO/PL-pgSQLブロックは実行環境がステートメント単位で区切って
-- 送信するため使えませんでした。代わりに以下の2ステップで:
--
-- [Step 1] まずこのSELECTだけを単独で実行してください
--
-- SELECT 'DROP TABLE IF EXISTS ' || table_name || ' CASCADE;' AS drop_sql
-- FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_name LIKE 'tmh\_ka\_%' ESCAPE '\';
--
-- [Step 2] 結果に表示されたDROP TABLE文をコピーし、
--          新しいクエリとして貼り付けて実行してください
-- ------------------------------------------------------------

-- 部品原価期次累積 (I1TBUHINGENKAKIJIRUISEKI -> tmh_acif_part_cost_cum)
DROP TABLE IF EXISTS tmh_acif_part_cost_cum CASCADE;
CREATE TABLE tmh_acif_part_cost_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    parts_number VARCHAR(10),
    outsource_product_date CHAR(8),
    management_number VARCHAR(11),
    combined_supply_type CHAR(1),
    product_type VARCHAR(30),
    external_sale_type CHAR(1),
    return_type CHAR(1),
    element_unit_price NUMERIC(19,4),
    parts_unit_price NUMERIC(19,4),
    processing_unit_price NUMERIC(19,4),
    element_amount NUMERIC(19,4),
    parts_amount NUMERIC(19,4),
    processing_amount NUMERIC(19,4),
    product_cost_process_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 部品検収実績 (I1TBUHINKENSYUUJISSEKI -> tmh_acif_part_acceptance)
DROP TABLE IF EXISTS tmh_acif_part_acceptance CASCADE;
CREATE TABLE tmh_acif_part_acceptance (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    slip_type CHAR(1) NOT NULL,
    supplier VARCHAR(4) NOT NULL,
    aviation_type CHAR(1),
    shipment_slip VARCHAR(3),
    delivery_destination VARCHAR(5),
    receipt VARCHAR(2) NOT NULL,
    interface_parts_number VARCHAR(12) NOT NULL,
    card_sharp CHAR(1),
    delivery_type CHAR(1),
    order_type CHAR(1),
    kanban_type CHAR(1),
    order_number VARCHAR(5),
    line_number VARCHAR(3),
    object_number VARCHAR(3),
    seat_number NUMERIC(5,0),
    box_number VARCHAR(3),
    delivery_quantity NUMERIC(6,0),
    order_date CHAR(8),
    order_delivery VARCHAR(2),
    order_sequence_delivery VARCHAR(2),
    delivery_date CHAR(8),
    order_sequence VARCHAR(2),
    dummy VARCHAR(2),
    receipt_date CHAR(8),
    supply_date CHAR(8),
    partial_delivery_number CHAR(1),
    external_payment_recipient VARCHAR(5),
    payment_source VARCHAR(4),
    order_result_search_key VARCHAR(8),
    delivery_number VARCHAR(5) NOT NULL,
    page_number VARCHAR(2),
    detail_number CHAR(1),
    report_type CHAR(1),
    payment_destination VARCHAR(4),
    improvement_digit VARCHAR(2),
    proxy_increase_count VARCHAR(3),
    ocr_number VARCHAR(6),
    controller_number VARCHAR(2),
    combined_supply_type CHAR(1),
    combined_use_sequence_number VARCHAR(5),
    sequence_number VARCHAR(5),
    inventory_type CHAR(1),
    business_entity_identifier VARCHAR(2),
    business_aviation_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, slip_type, supplier, receipt, interface_parts_number, delivery_number)
);

-- 部品製品たな卸 (I1TBUHINSEIHINTANAOROSI -> tmh_acif_part_inventory)
DROP TABLE IF EXISTS tmh_acif_part_inventory CASCADE;
CREATE TABLE tmh_acif_part_inventory (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    interface_issue_serial_number VARCHAR(12) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    department_identifier VARCHAR(5),
    inventory_type VARCHAR(2),
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    product_instruction_mark VARCHAR(5),
    shelf_quantity NUMERIC(9,0),
    uninput_type CHAR(1),
    printed_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, interface_issue_serial_number, item_slip_type)
);

-- 部品製品たな卸データ (I1TBUHINSEIHINTANAOROSIDATA -> tmh_acif_part_inventory_line)
DROP TABLE IF EXISTS tmh_acif_part_inventory_line CASCADE;
CREATE TABLE tmh_acif_part_inventory_line (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    interface_issue_serial_number VARCHAR(12) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    department_identifier VARCHAR(5),
    inventory_type VARCHAR(2),
    item_name VARCHAR(45),
    parts_number VARCHAR(10),
    product_instruction_mark VARCHAR(5),
    shelf_quantity NUMERIC(9,0),
    uninput_type CHAR(1),
    printed_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, interface_issue_serial_number, item_slip_type)
);

-- 部品仕入返品 (I1TBUHINSIIREHENPIN -> tmh_acif_part_purchase_returns)
DROP TABLE IF EXISTS tmh_acif_part_purchase_returns CASCADE;
CREATE TABLE tmh_acif_part_purchase_returns (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    issue_serial_number VARCHAR(12) NOT NULL,
    issuance_number VARCHAR(12),
    trading_partner_identifier VARCHAR(4),
    return_reason_type CHAR(1),
    receipt_identifier VARCHAR(2),
    receipt_date CHAR(8),
    parts_number VARCHAR(10),
    category VARCHAR(2),
    quantity NUMERIC(13,3),
    issue_destination VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, issue_serial_number)
);

-- 部品仕入期次累積 (I1TBUHINSIIREKIJIRUISEKI -> tmh_acif_part_purchase_amount_cum)
DROP TABLE IF EXISTS tmh_acif_part_purchase_amount_cum CASCADE;
CREATE TABLE tmh_acif_part_purchase_amount_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    acceptance_date CHAR(8),
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    category VARCHAR(2),
    management_number VARCHAR(11),
    original_trading_partner_identifier VARCHAR(4),
    receipt_identifier VARCHAR(2),
    parts_system_type VARCHAR(2),
    mail_documentation_type CHAR(1),
    product_type VARCHAR(30),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    check_carryover_type CHAR(1),
    toyota_shipment_department VARCHAR(3),
    external_sale_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 部品仕入単価マスタ (I1TBUHINSIIREUNITPRICEMASTER -> tmh_acif_part_purchase_price)
DROP TABLE IF EXISTS tmh_acif_part_purchase_price CASCADE;
CREATE TABLE tmh_acif_part_purchase_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    supplier_identifier VARCHAR(4) NOT NULL,
    issue_destination VARCHAR(5),
    unit_price NUMERIC(19,4),
    retroactive_completed_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, management_number, application_start_date, supplier_identifier)
);

-- 部品仕掛品（外注）現品票期次 (I1TBUHINSIKAKARIGNPNKIJI -> tmh_acif_part_wip_cum)
DROP TABLE IF EXISTS tmh_acif_part_wip_cum CASCADE;
CREATE TABLE tmh_acif_part_wip_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    department_identifier VARCHAR(5) NOT NULL,
    receipt_identifier VARCHAR(2) NOT NULL,
    interface_parts_number VARCHAR(12) NOT NULL,
    address VARCHAR(10) NOT NULL,
    inventory_type VARCHAR(2),
    object_number VARCHAR(3),
    seat_number NUMERIC(5,0),
    sheet_count NUMERIC(3,0),
    item_name VARCHAR(45),
    supplier_identifier VARCHAR(4),
    supplier_aviation_type CHAR(1),
    supplier_name VARCHAR(60),
    half_type CHAR(1),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, item_slip_type, department_identifier, receipt_identifier, interface_parts_number, address)
);

-- 部品仕掛品たな卸 (I1TBUHINSIKAKARIHINTANAOROSI -> tmh_acif_part_wip_inventory)
DROP TABLE IF EXISTS tmh_acif_part_wip_inventory CASCADE;
CREATE TABLE tmh_acif_part_wip_inventory (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    issue_serial_number VARCHAR(12) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    department_identifier VARCHAR(5),
    group_identifier VARCHAR(2),
    receipt_identifier VARCHAR(2),
    address VARCHAR(10),
    inventory_type VARCHAR(2),
    object_number VARCHAR(3),
    product_instruction_mark VARCHAR(5),
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    seat_number NUMERIC(5,0),
    supplier_identifier VARCHAR(4),
    supplier_aviation_type CHAR(1),
    supplier_name VARCHAR(60),
    input_inventory_quantity NUMERIC(9,0),
    shelf_quantity NUMERIC(9,0),
    half_type CHAR(1),
    negative_conversion_type CHAR(1),
    uninput_type CHAR(1),
    maintenance_type VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, issue_serial_number, item_slip_type)
);

-- 部品仕掛品たな卸データ (I1TBUHINSIKAKARITANAOROSIDATA -> tmh_acif_part_wip_inventory_line)
DROP TABLE IF EXISTS tmh_acif_part_wip_inventory_line CASCADE;
CREATE TABLE tmh_acif_part_wip_inventory_line (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    interface_issue_serial_number VARCHAR(12) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    department_identifier VARCHAR(5),
    group_identifier VARCHAR(2),
    receipt_identifier VARCHAR(2),
    address VARCHAR(10),
    inventory_type VARCHAR(2),
    object_number VARCHAR(3),
    product_instruction_mark VARCHAR(5),
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    seat_number NUMERIC(5,0),
    supplier_identifier VARCHAR(4),
    supplier_aviation_type CHAR(1),
    supplier_name VARCHAR(60),
    input_inventory_quantity NUMERIC(9,0),
    shelf_quantity NUMERIC(9,0),
    half_type CHAR(1),
    negative_conversion_type CHAR(1),
    uninput_type CHAR(1),
    maintenance_type VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, interface_issue_serial_number, item_slip_type)
);

-- 部品たな卸金額期次累積 (I1TBUHINTNORSAMTKIJIRUISEKI -> tmh_acif_part_inventory_amount_cum)
DROP TABLE IF EXISTS tmh_acif_part_inventory_amount_cum CASCADE;
CREATE TABLE tmh_acif_part_inventory_amount_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    parts_inventory_details_type CHAR(1),
    item_slip_type CHAR(1),
    department_identifier VARCHAR(5),
    inventory_type VARCHAR(2),
    product_instruction_mark VARCHAR(5),
    parts_number VARCHAR(10),
    group_identifier VARCHAR(2),
    receipt_identifier VARCHAR(2),
    address VARCHAR(10),
    object_number VARCHAR(3),
    seat_number NUMERIC(5,0),
    supplier_aviation_type CHAR(1),
    shelf_quantity NUMERIC(9,0),
    input_inventory_quantity NUMERIC(9,0),
    half_type CHAR(1),
    negative_conversion_type CHAR(1),
    uninput_type CHAR(1),
    maintenance_type VARCHAR(2),
    element_cost_unit_price NUMERIC(19,4),
    element_amount NUMERIC(19,4),
    parts_cost_unit_price NUMERIC(19,4),
    parts_amount NUMERIC(19,4),
    all_process_cost_unit_price NUMERIC(19,4),
    all_process_amount NUMERIC(19,4),
    current_process_cost_unit_price NUMERIC(19,4),
    current_process_amount NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 部品たな卸用科目判定マスタ (I1TBUHINTNORSKMKHANTEIMASTER -> tmh_acif_part_inventory_account_rule)
DROP TABLE IF EXISTS tmh_acif_part_inventory_account_rule CASCADE;
CREATE TABLE tmh_acif_part_inventory_account_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    item_slip_type_name VARCHAR(60),
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, item_slip_type)
);

-- 部品売上外販品数量 (I1TBUHINURIAGEGAIHANHINSURYOU -> tmh_acif_part_external_sales_quantity)
DROP TABLE IF EXISTS tmh_acif_part_external_sales_quantity CASCADE;
CREATE TABLE tmh_acif_part_external_sales_quantity (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    recording_year_month CHAR(6) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    trading_partner_identifier VARCHAR(4) NOT NULL,
    quantity NUMERIC(13,3),
    shipment_current_month_arrival_quantity NUMERIC(13,3),
    shipment_previous_month_arrival_quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, recording_year_month, parts_number, trading_partner_identifier)
);

-- 部品売上原価調整 (I1TBUHINURIAGEGENKACHOUSEI -> tmh_acif_part_cogs_adjustment)
DROP TABLE IF EXISTS tmh_acif_part_cogs_adjustment CASCADE;
CREATE TABLE tmh_acif_part_cogs_adjustment (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    change_plan_number VARCHAR(10) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    product VARCHAR(60),
    type VARCHAR(30),
    car_type VARCHAR(30),
    start_date CHAR(8),
    sub_unit_price NUMERIC(19,4),
    create_year_month CHAR(6),
    process_state CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, change_plan_number, parts_number)
);

-- 部品売上用ＫＤパーツ判定マスタ (I1TBUHINURIAGEKDHANTEIMASTER -> tmh_acif_part_sales_kd_rule)
DROP TABLE IF EXISTS tmh_acif_part_sales_kd_rule CASCADE;
CREATE TABLE tmh_acif_part_sales_kd_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, management_number)
);

-- 部品売上期次累積 (I1TBUHINURIAGEKIJIRUISEKI -> tmh_acif_part_sales_cum)
DROP TABLE IF EXISTS tmh_acif_part_sales_cum CASCADE;
CREATE TABLE tmh_acif_part_sales_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    shipment_date CHAR(8),
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    management_number VARCHAR(11),
    slip_type CHAR(1),
    combined_supply_type CHAR(1),
    product_type VARCHAR(30),
    external_sale_type CHAR(1),
    kd_type CHAR(1),
    return_additional_entry_type CHAR(1),
    partial_delivery_type CHAR(1),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    check_carryover_type CHAR(1),
    destination_identifier VARCHAR(6),
    delivery_plan_date CHAR(8),
    tmc_acceptance_date CHAR(8),
    offset_billing_type CHAR(1),
    product_stock_quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 部品売上用科目判定マスタ (I1TBUHINURIAGEKMKHANTEIMASTER -> tmh_acif_part_sales_account_rule)
DROP TABLE IF EXISTS tmh_acif_part_sales_account_rule CASCADE;
CREATE TABLE tmh_acif_part_sales_account_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    combined_supply_type CHAR(1) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    external_sale_type CHAR(1) NOT NULL,
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    credit_identifier VARCHAR(4),
    credit_name VARCHAR(250),
    credit_burden_department_identifier VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, combined_supply_type, management_number, external_sale_type)
);

-- 部品売上単価マスタ (I1TBUHINURIAGEUNITPRICEMASTER -> tmh_acif_part_sales_price_ref)
DROP TABLE IF EXISTS tmh_acif_part_sales_price_ref CASCADE;
CREATE TABLE tmh_acif_part_sales_price_ref (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    delivery_note_number VARCHAR(5) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    combined_supply_type CHAR(1),
    external_sale_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    unit_price NUMERIC(19,4),
    retroactive_completed_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, management_number, delivery_note_number, application_start_date)
);

-- データ連携制御 (I1TDATARENKEIctrl -> tmh_acif_data_integration_control)
DROP TABLE IF EXISTS tmh_acif_data_integration_control CASCADE;
CREATE TABLE tmh_acif_data_integration_control (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_01 (I1TDATARENKEIctrl_01 -> tmh_acif_item_purchase_interface)
DROP TABLE IF EXISTS tmh_acif_item_purchase_interface CASCADE;
CREATE TABLE tmh_acif_item_purchase_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_02 (I1TDATARENKEIctrl_02 -> tmh_acif_item_issue_interface)
DROP TABLE IF EXISTS tmh_acif_item_issue_interface CASCADE;
CREATE TABLE tmh_acif_item_issue_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_03 (I1TDATARENKEIctrl_03 -> tmh_acif_item_selling_interface)
DROP TABLE IF EXISTS tmh_acif_item_selling_interface CASCADE;
CREATE TABLE tmh_acif_item_selling_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_04 (I1TDATARENKEIctrl_04 -> tmh_acif_item_cogs_interface)
DROP TABLE IF EXISTS tmh_acif_item_cogs_interface CASCADE;
CREATE TABLE tmh_acif_item_cogs_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_05 (I1TDATARENKEIctrl_05 -> tmh_acif_part_purchase_interface)
DROP TABLE IF EXISTS tmh_acif_part_purchase_interface CASCADE;
CREATE TABLE tmh_acif_part_purchase_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_06 (I1TDATARENKEIctrl_06 -> tmh_acif_part_selling_interface)
DROP TABLE IF EXISTS tmh_acif_part_selling_interface CASCADE;
CREATE TABLE tmh_acif_part_selling_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_07 (I1TDATARENKEIctrl_07 -> tmh_acif_part_cogs_interface)
DROP TABLE IF EXISTS tmh_acif_part_cogs_interface CASCADE;
CREATE TABLE tmh_acif_part_cogs_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_08 (I1TDATARENKEIctrl_08 -> tmh_acif_part_manufacturing_cost_interface)
DROP TABLE IF EXISTS tmh_acif_part_manufacturing_cost_interface CASCADE;
CREATE TABLE tmh_acif_part_manufacturing_cost_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_09 (I1TDATARENKEIctrl_09 -> tmh_acif_specific_procurement_purchase_interface)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_purchase_interface CASCADE;
CREATE TABLE tmh_acif_specific_procurement_purchase_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_11 (I1TDATARENKEIctrl_11 -> tmh_acif_employee_payroll_interface)
DROP TABLE IF EXISTS tmh_acif_employee_payroll_interface CASCADE;
CREATE TABLE tmh_acif_employee_payroll_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_12 (I1TDATARENKEIctrl_12 -> tmh_acif_wip_issue_interface)
DROP TABLE IF EXISTS tmh_acif_wip_issue_interface CASCADE;
CREATE TABLE tmh_acif_wip_issue_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_13 (I1TDATARENKEIctrl_13 -> tmh_acif_processing_defect_interface)
DROP TABLE IF EXISTS tmh_acif_processing_defect_interface CASCADE;
CREATE TABLE tmh_acif_processing_defect_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_14 (I1TDATARENKEIctrl_14 -> tmh_acif_specific_effort_interface)
DROP TABLE IF EXISTS tmh_acif_specific_effort_interface CASCADE;
CREATE TABLE tmh_acif_specific_effort_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_50 (I1TDATARENKEIctrl_50 -> tmh_acif_issue_variance_interface)
DROP TABLE IF EXISTS tmh_acif_issue_variance_interface CASCADE;
CREATE TABLE tmh_acif_issue_variance_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_51 (I1TDATARENKEIctrl_51 -> tmh_acif_specific_procurement_inventory_interface)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_inventory_interface CASCADE;
CREATE TABLE tmh_acif_specific_procurement_inventory_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_55 (I1TDATARENKEIctrl_55 -> tmh_acif_item_inventory_interface)
DROP TABLE IF EXISTS tmh_acif_item_inventory_interface CASCADE;
CREATE TABLE tmh_acif_item_inventory_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_60 (I1TDATARENKEIctrl_60 -> tmh_acif_disposition_variance_interface)
DROP TABLE IF EXISTS tmh_acif_disposition_variance_interface CASCADE;
CREATE TABLE tmh_acif_disposition_variance_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_61 (I1TDATARENKEIctrl_61 -> tmh_acif_processing_cost_variance_interface)
DROP TABLE IF EXISTS tmh_acif_processing_cost_variance_interface CASCADE;
CREATE TABLE tmh_acif_processing_cost_variance_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_62 (I1TDATARENKEIctrl_62 -> tmh_acif_department_cost_allocation_interface)
DROP TABLE IF EXISTS tmh_acif_department_cost_allocation_interface CASCADE;
CREATE TABLE tmh_acif_department_cost_allocation_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_63 (I1TDATARENKEIctrl_63 -> tmh_acif_department_cost_transfer_interface)
DROP TABLE IF EXISTS tmh_acif_department_cost_transfer_interface CASCADE;
CREATE TABLE tmh_acif_department_cost_transfer_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_64 (I1TDATARENKEIctrl_64 -> tmh_acif_inventory_variance_journal_interface)
DROP TABLE IF EXISTS tmh_acif_inventory_variance_journal_interface CASCADE;
CREATE TABLE tmh_acif_inventory_variance_journal_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_65 (I1TDATARENKEIctrl_65 -> tmh_acif_wip_variance_journal_interface)
DROP TABLE IF EXISTS tmh_acif_wip_variance_journal_interface CASCADE;
CREATE TABLE tmh_acif_wip_variance_journal_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_66 (I1TDATARENKEIctrl_66 -> tmh_acif_finished_goods_variance_journal_interface)
DROP TABLE IF EXISTS tmh_acif_finished_goods_variance_journal_interface CASCADE;
CREATE TABLE tmh_acif_finished_goods_variance_journal_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_67 (I1TDATARENKEIctrl_67 -> tmh_acif_scrap_variance_journal_interface)
DROP TABLE IF EXISTS tmh_acif_scrap_variance_journal_interface CASCADE;
CREATE TABLE tmh_acif_scrap_variance_journal_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_68 (I1TDATARENKEIctrl_68 -> tmh_acif_valuation_variance_journal_interface)
DROP TABLE IF EXISTS tmh_acif_valuation_variance_journal_interface CASCADE;
CREATE TABLE tmh_acif_valuation_variance_journal_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- データ連携制御_69 (I1TDATARENKEIctrl_69 -> tmh_acif_cost_variance_journal_interface)
DROP TABLE IF EXISTS tmh_acif_cost_variance_journal_interface CASCADE;
CREATE TABLE tmh_acif_cost_variance_journal_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_data_identifier VARCHAR(2) NOT NULL,
    status_type VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_data_identifier)
);

-- （DWH）部品原価期次累積 (I1TDWHBUHINGENKAKIJIRUISEKI -> tmh_acif_part_cost_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_part_cost_cum_dwh CASCADE;
CREATE TABLE tmh_acif_part_cost_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    outsource_product_date CHAR(8),
    management_number VARCHAR(11),
    combined_supply_type CHAR(1),
    product_type VARCHAR(30),
    external_sale_type CHAR(1),
    return_type CHAR(1),
    element_unit_price NUMERIC(19,4),
    parts_unit_price NUMERIC(19,4),
    processing_unit_price NUMERIC(19,4),
    element_amount NUMERIC(19,4),
    parts_amount NUMERIC(19,4),
    processing_amount NUMERIC(19,4),
    product_cost_process_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）部品仕入期次累積 (I1TDWHBUHINSIREKIJIRUISEKI -> tmh_acif_part_purchase_amount_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_part_purchase_amount_cum_dwh CASCADE;
CREATE TABLE tmh_acif_part_purchase_amount_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    acceptance_date CHAR(8),
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    category VARCHAR(2),
    management_number VARCHAR(11),
    original_trading_partner_identifier VARCHAR(4),
    original_trading_partner_name VARCHAR(225),
    receipt_identifier VARCHAR(2),
    parts_system_type VARCHAR(2),
    mail_documentation_type CHAR(1),
    product_type VARCHAR(30),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    check_carryover_type CHAR(1),
    toyota_shipment_department VARCHAR(3),
    external_sale_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）部品製造原価期次累積 (I1TDWHBUHINSIZGENKAKIJIRUISEKI -> tmh_acif_part_manufacturing_cost_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_part_manufacturing_cost_cum_dwh CASCADE;
CREATE TABLE tmh_acif_part_manufacturing_cost_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12),
    cumulative_detail_number VARCHAR(12) NOT NULL,
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    outsource_product_date CHAR(8),
    management_number VARCHAR(11),
    combined_supply_type CHAR(1),
    product_type VARCHAR(30),
    external_sale_type CHAR(1),
    return_type CHAR(1),
    element_unit_price NUMERIC(19,4),
    parts_unit_price NUMERIC(19,4),
    processing_unit_price NUMERIC(19,4),
    element_amount NUMERIC(19,4),
    parts_amount NUMERIC(19,4),
    processing_amount NUMERIC(19,4),
    product_cost_process_type CHAR(1),
    cumulative_data_identifier VARCHAR(2),
    recorded_date CHAR(8),
    system_type CHAR(2),
    slip_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    partner_name VARCHAR(225),
    unit VARCHAR(12),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(30),
    debit_burden_department VARCHAR(5),
    debit_tax_process_identifier VARCHAR(3),
    debit_tax_input_type CHAR(1),
    debit_tax_type CHAR(1),
    credit_identifier VARCHAR(4),
    credit_name VARCHAR(30),
    credit_burden_department VARCHAR(5),
    credit_tax_process_identifier VARCHAR(3),
    credit_tax_input_type CHAR(1),
    credit_main_tax_type CHAR(1),
    issue_serial_number VARCHAR(6),
    journal_entry_interface_create_type CHAR(1),
    outline_identifier VARCHAR(4),
    outline_name VARCHAR(60),
    reversal_shipment_plan_date CHAR(8),
    process_state CHAR(1),
    slip_type_identifier VARCHAR(4),
    interface_journal_number VARCHAR(20),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_detail_number)
);

-- （DWH）部品たな卸金額期次累積 (I1TDWHBUHINTNORSAMTKIJIRISK -> tmh_acif_part_inventory_amount_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_part_inventory_amount_cum_dwh CASCADE;
CREATE TABLE tmh_acif_part_inventory_amount_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    parts_inventory_details_type CHAR(1),
    item_slip_type CHAR(1),
    department_identifier VARCHAR(5),
    inventory_type VARCHAR(2),
    product_instruction_mark VARCHAR(5),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    group_identifier VARCHAR(2),
    receipt_identifier VARCHAR(2),
    address VARCHAR(10),
    object_number VARCHAR(3),
    seat_number NUMERIC(5,0),
    supplier_aviation_type CHAR(1),
    shelf_quantity NUMERIC(9,0),
    input_inventory_quantity NUMERIC(9,0),
    half_type CHAR(1),
    negative_conversion_type CHAR(1),
    uninput_type CHAR(1),
    maintenance_type VARCHAR(2),
    element_cost_unit_price NUMERIC(19,4),
    element_amount NUMERIC(19,4),
    parts_cost_unit_price NUMERIC(19,4),
    parts_amount NUMERIC(19,4),
    all_process_cost_unit_price NUMERIC(19,4),
    all_process_amount NUMERIC(19,4),
    current_process_cost_unit_price NUMERIC(19,4),
    current_process_amount NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）部品売上原価期次累積 (I1TDWHBUHINURGGENKAKIJIRUISEKI -> tmh_acif_part_cogs_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_part_cogs_cum_dwh CASCADE;
CREATE TABLE tmh_acif_part_cogs_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12),
    cumulative_detail_number VARCHAR(12) NOT NULL,
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    outsource_product_date CHAR(8),
    management_number VARCHAR(11),
    combined_supply_type CHAR(1),
    product_type VARCHAR(30),
    external_sale_type CHAR(1),
    return_type CHAR(1),
    element_unit_price NUMERIC(19,4),
    parts_unit_price NUMERIC(19,4),
    processing_unit_price NUMERIC(19,4),
    element_amount NUMERIC(19,4),
    parts_amount NUMERIC(19,4),
    processing_amount NUMERIC(19,4),
    product_cost_process_type CHAR(1),
    cumulative_data_identifier VARCHAR(2),
    recorded_date CHAR(8),
    system_type CHAR(2),
    slip_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    partner_name VARCHAR(225),
    unit VARCHAR(12),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(30),
    debit_burden_department VARCHAR(5),
    debit_tax_process_identifier VARCHAR(3),
    debit_tax_input_type CHAR(1),
    debit_tax_type CHAR(1),
    credit_identifier VARCHAR(4),
    credit_name VARCHAR(30),
    credit_burden_department VARCHAR(5),
    credit_tax_process_identifier VARCHAR(3),
    credit_tax_input_type CHAR(1),
    credit_main_tax_type CHAR(1),
    issue_serial_number VARCHAR(6),
    journal_entry_interface_create_type CHAR(1),
    outline_identifier VARCHAR(4),
    outline_name VARCHAR(60),
    reversal_shipment_plan_date CHAR(8),
    process_state CHAR(1),
    slip_type_identifier VARCHAR(4),
    interface_journal_number VARCHAR(20),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_detail_number)
);

-- （DWH）部品売上期次累積 (I1TDWHBUHINURIAGEKIJIRUISEKI -> tmh_acif_part_sales_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_part_sales_cum_dwh CASCADE;
CREATE TABLE tmh_acif_part_sales_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    shipment_date CHAR(8),
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    management_number VARCHAR(11),
    slip_type CHAR(1),
    combined_supply_type CHAR(1),
    product_type VARCHAR(30),
    external_sale_type CHAR(1),
    kd_type CHAR(1),
    return_additional_entry_type CHAR(1),
    partial_delivery_type CHAR(1),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    check_carryover_type CHAR(1),
    destination_identifier VARCHAR(6),
    delivery_plan_date CHAR(8),
    tmc_acceptance_date CHAR(8),
    offset_billing_type CHAR(1),
    product_stock_quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）加工不良金額期次累積 (I1TDWHKAKOUFURYOUKIJIRUISEKI -> tmh_acif_processing_defect_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_processing_defect_cum_dwh CASCADE;
CREATE TABLE tmh_acif_processing_defect_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    department VARCHAR(5),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    journal_pattern VARCHAR(2),
    journal_pattern_number VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）給与実績期次累積 (I1TDWHKYUUYOJISSEKIKIJIRUISEKI -> tmh_acif_payroll_payment_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_payroll_payment_cum_dwh CASCADE;
CREATE TABLE tmh_acif_payroll_payment_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    salary_bonus_type CHAR(1),
    provision_date CHAR(6),
    estimate_confirmed_type CHAR(1),
    current_month_affiliation_identifier VARCHAR(10),
    previous_month_position_identifier VARCHAR(10),
    employee_type VARCHAR(2),
    supply_deduction_type CHAR(1),
    account_item_identifier VARCHAR(4),
    system_item_identifier VARCHAR(4),
    tax_amount NUMERIC(19,4),
    journal_expense_type CHAR(1),
    red_black_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）納番変換期次累積 (I1TDWHNOUBANHENKANKIJIRISK -> tmh_acif_delivery_number_conversion_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_delivery_number_conversion_cum_dwh CASCADE;
CREATE TABLE tmh_acif_delivery_number_conversion_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    registration_year_month CHAR(6) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    parts_name VARCHAR(135),
    management_number VARCHAR(11) NOT NULL,
    delivery_note_number VARCHAR(5) NOT NULL,
    check_delivery_note_number VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, registration_year_month, parts_number, management_number, delivery_note_number)
);

-- （DWH）照合データ期次累積 (I1TDWHSHOGODATAKIJIRUISEKI -> tmh_acif_reconciliation_line_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_reconciliation_line_cum_dwh CASCADE;
CREATE TABLE tmh_acif_reconciliation_line_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    matching_date CHAR(6) NOT NULL,
    matching_type CHAR(1) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    parts_name VARCHAR(135),
    management_number VARCHAR(11) NOT NULL,
    check_delivery_order_number VARCHAR(5) NOT NULL,
    retroactive_check_delivery_order_number VARCHAR(5),
    slip_type CHAR(1) NOT NULL,
    retroactive_details_type CHAR(1),
    combined_supply_type CHAR(1),
    original_trading_partner_identifier VARCHAR(4),
    original_trading_partner_name VARCHAR(225),
    issue_destination VARCHAR(5),
    accounting_setting_type CHAR(1),
    tmc_configuration_type CHAR(1),
    accounting_cumulative_number VARCHAR(12) NOT NULL,
    accounting_cumulative_data_identifier VARCHAR(2),
    accounting_delivery_order_number VARCHAR(5),
    partial_delivery_type CHAR(1),
    accounting_recorded_date CHAR(8),
    accounting_acceptance_date CHAR(8) NOT NULL,
    accounting_issue_date CHAR(8),
    accounting_entry_scheduled_date CHAR(8),
    accounting_quantity NUMERIC(13,3),
    accounting_unit_price NUMERIC(19,4),
    accounting_amount NUMERIC(19,4),
    tmc_received_date_number VARCHAR(14) NOT NULL,
    tmc_acceptance_date CHAR(8) NOT NULL,
    tmc_quantity NUMERIC(13,3),
    tmc_unit_price NUMERIC(19,4),
    tmc_amount NUMERIC(19,4),
    tmc_retroactive_unit_price NUMERIC(19,4),
    tmc_retroactive_amount NUMERIC(19,4),
    tmc_delivery_order_number VARCHAR(5),
    tmc_debit_credit_type CHAR(1),
    tmc_trading_partner_identifier VARCHAR(4),
    tmc_partial_delivery_type CHAR(1),
    tmc_correction_presence_type CHAR(1),
    tmc_retroactive_presence_type CHAR(1),
    toyota_unit_price NUMERIC(19,4),
    toyota_amount NUMERIC(19,4),
    check_result VARCHAR(2),
    check_carryover_type CHAR(1),
    previous_month_reference_carryover_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, matching_date, matching_type, parts_number, management_number, check_delivery_order_number, slip_type, accounting_cumulative_number, accounting_acceptance_date, tmc_received_date_number, tmc_acceptance_date)
);

-- （DWH）仕掛品出庫期次累積 (I1TDWHSIKAKARISYUKKOKIJIRISK -> tmh_acif_wip_issue_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_wip_issue_cum_dwh CASCADE;
CREATE TABLE tmh_acif_wip_issue_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    issue_date CHAR(8),
    delivery_note_number VARCHAR(5),
    management_number VARCHAR(11),
    issue_destination VARCHAR(5),
    pre_issue_department VARCHAR(5),
    financial_type CHAR(1),
    model_tool_number VARCHAR(105),
    check_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）仕訳情報期次累積 (I1TDWHSIWAKEJOUHOUKIJIRUISEKI -> tmh_acif_journal_entry_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_journal_entry_cum_dwh CASCADE;
CREATE TABLE tmh_acif_journal_entry_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_detail_number VARCHAR(12) NOT NULL,
    cumulative_number VARCHAR(12),
    cumulative_data_identifier VARCHAR(2),
    recorded_date CHAR(8),
    system_type CHAR(2),
    slip_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    partner_name VARCHAR(225),
    unit VARCHAR(12),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    debit_burden_department VARCHAR(5),
    debit_tax_process_identifier VARCHAR(3),
    debit_tax_input_type CHAR(1),
    debit_tax_amount NUMERIC(5,2),
    debit_tax_type CHAR(1),
    debit_budget_identifier VARCHAR(5),
    credit_identifier VARCHAR(4),
    credit_name VARCHAR(250),
    credit_burden_department VARCHAR(5),
    credit_tax_process_identifier VARCHAR(3),
    credit_tax_input_type CHAR(1),
    credit_tax_rate NUMERIC(5,2),
    credit_main_tax_type CHAR(1),
    credit_estimate_identifier VARCHAR(5),
    issue_serial_number VARCHAR(12),
    outline_identifier VARCHAR(4),
    outline_name VARCHAR(60),
    reversal_shipment_plan_date CHAR(8),
    process_state CHAR(1),
    journal_entry_interface_create_type CHAR(1),
    slip_type_identifier VARCHAR(4),
    interface_journal_number VARCHAR(20),
    selected_cost_process_type CHAR(1),
    unit_price_undecided_error_type CHAR(1),
    reunit_matching_type CHAR(1),
    interface_receivable_payable_journal_number VARCHAR(20),
    correct_reason_type CHAR(1),
    correction_reason VARCHAR(150),
    print_order_type CHAR(1),
    previous_quantity NUMERIC(13,3),
    previous_unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_detail_number)
);

-- （DWH）資材原価期次累積 (I1TDWHSIZAIGENKAKIJIRUISEKI -> tmh_acif_item_cogs_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_item_cogs_cum_dwh CASCADE;
CREATE TABLE tmh_acif_item_cogs_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    recorded_date CHAR(8),
    item_select_identifier VARCHAR(10),
    item_select_name VARCHAR(60),
    shipment_date CHAR(8),
    delivery_note_number VARCHAR(5),
    selection_type CHAR(1),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    journal_pattern VARCHAR(2),
    journal_pattern_number VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）資材仕入期次累積 (I1TDWHSIZAISIIREKIJIRUISEKI -> tmh_acif_item_purchase_amount_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_item_purchase_amount_cum_dwh CASCADE;
CREATE TABLE tmh_acif_item_purchase_amount_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    acceptance_date CHAR(8),
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    management_number VARCHAR(11),
    original_trading_partner_identifier VARCHAR(4),
    original_trading_partner_name VARCHAR(225),
    self_supply_type CHAR(1),
    return_type CHAR(1),
    internal_type CHAR(1),
    settlement_type CHAR(1),
    special_order_repair_type CHAR(1),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    via_route_type CHAR(1),
    tmc_inventory_settlement_type CHAR(1),
    diesel_tax_per_liter NUMERIC(7,2),
    model_tool_number VARCHAR(105),
    receipt_warehouse_identifier VARCHAR(2),
    warehousing_date CHAR(8),
    main_cumulative_number VARCHAR(12),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）資材出庫期次累積 (I1TDWHSIZAISYUKKOKIJIRUISEKI -> tmh_acif_item_issue_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_item_issue_cum_dwh CASCADE;
CREATE TABLE tmh_acif_item_issue_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    management_number VARCHAR(11),
    issue_destination VARCHAR(5),
    supply_recipient_identifier VARCHAR(4),
    issue_group CHAR(2),
    secondhand_type CHAR(1),
    settlement_type CHAR(1),
    issue_difference_type CHAR(1),
    financial_type CHAR(1),
    issue_item CHAR(1),
    reacceptance_type CHAR(1),
    reacceptance_return_issue_type CHAR(1),
    model_tool_number VARCHAR(105),
    issue_warehouse_identifier VARCHAR(2),
    issue_date CHAR(8),
    period_number VARCHAR(9),
    employee_name VARCHAR(90),
    unit_price_undecided_error_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）資材たな卸金額期次累積 (I1TDWHSIZAITNORSAMTKIJIRISK -> tmh_acif_item_inventory_amount_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_item_inventory_amount_cum_dwh CASCADE;
CREATE TABLE tmh_acif_item_inventory_amount_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    material_inventory_details_type CHAR(1),
    item_slip_type CHAR(1),
    source_info_type VARCHAR(1),
    department VARCHAR(5),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    warehouse_identifier VARCHAR(2),
    consumable_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）資材売上期次累積 (I1TDWHSIZAIURIAGEKIJIRUISEKI -> tmh_acif_item_sales_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_item_sales_cum_dwh CASCADE;
CREATE TABLE tmh_acif_item_sales_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    shipment_date CHAR(8),
    delivery_note_number VARCHAR(5),
    item_select_identifier VARCHAR(10),
    item_select_name VARCHAR(60),
    journal_pattern VARCHAR(2),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    measurement_category CHAR(1),
    model_tool_number VARCHAR(105),
    car_number VARCHAR(4),
    offset_billing_type CHAR(1),
    request_number VARCHAR(6),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）TMC受信データ期次累積 (I1TDWHTMCJYUSINDATAKIJIRISK -> tmh_acif_tmc_received_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_tmc_received_cum_dwh CASCADE;
CREATE TABLE tmh_acif_tmc_received_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    receive_date_number VARCHAR(14) NOT NULL,
    matching_date CHAR(6),
    received_details_type CHAR(1),
    matching_receivable_payable_type CHAR(1),
    layout_type CHAR(1),
    dt_identifier CHAR(1),
    transfer_number VARCHAR(2),
    card_number VARCHAR(2),
    trading_partner_identifier VARCHAR(4),
    partner_name VARCHAR(225),
    parts_number VARCHAR(10),
    parts_name VARCHAR(135),
    category VARCHAR(2),
    management_number VARCHAR(11),
    delivery_note_number VARCHAR(5),
    debit_credit_type CHAR(1),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    receipt_year CHAR(2),
    receipt_month CHAR(2),
    receipt_date CHAR(8),
    issue_destination VARCHAR(5),
    provisional_settlement_correction_identifier CHAR(1),
    check_group_number VARCHAR(14),
    slip_type CHAR(1),
    check_delivery_order_number VARCHAR(5),
    retroactive_check_delivery_order_number VARCHAR(5),
    tmc_partial_delivery_type CHAR(1),
    correction_existing_type CHAR(1),
    combined_supply_type CHAR(1),
    acceptance_date CHAR(8),
    check_quantity NUMERIC(13,3),
    check_unit_price NUMERIC(19,4),
    check_amount NUMERIC(19,4),
    retroactive_unit_price NUMERIC(19,4),
    retroactive_amount NUMERIC(19,4),
    current_month_retroactive_unit_price NUMERIC(19,4),
    current_month_retroactive_amount NUMERIC(19,4),
    unchecked_type CHAR(1),
    retroactive_details_type CHAR(1),
    carryover_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, receive_date_number)
);

-- （DWH）特調仕入期次累積 (I1TDWHTOKUCHOSIREKIJIRUISEKI -> tmh_acif_specific_procurement_purchase_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_purchase_cum_dwh CASCADE;
CREATE TABLE tmh_acif_specific_procurement_purchase_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    acceptance_date CHAR(8),
    delivery_note_number VARCHAR(5),
    management_number VARCHAR(11),
    internal_type CHAR(1),
    internal_department VARCHAR(5),
    tmc_supply_type CHAR(1),
    requesting_department VARCHAR(5),
    procurement_subject_name VARCHAR(90),
    financial_type CHAR(1),
    hnt_type CHAR(1),
    delivery_date CHAR(8),
    procurement_person_in_charge VARCHAR(15),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）特調たな卸金額期次累積 (I1TDWHTOKUCHOTNORSAMTKIJIRISK -> tmh_acif_specific_procurement_inventory_amount_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_inventory_amount_cum_dwh CASCADE;
CREATE TABLE tmh_acif_specific_procurement_inventory_amount_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11),
    inventory_execution_department VARCHAR(5),
    procurement_subject_name VARCHAR(90),
    acceptance_date CHAR(8),
    burden_department VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- （DWH）特定加工費期次累積 (I1TDWHTOKUTEIKAKOUHIKIJIRISK -> tmh_acif_specific_processing_cost_cum_dwh)
DROP TABLE IF EXISTS tmh_acif_specific_processing_cost_cum_dwh CASCADE;
CREATE TABLE tmh_acif_specific_processing_cost_cum_dwh (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11),
    executing_department VARCHAR(5),
    specific_labor_hours NUMERIC(11,3),
    rate NUMERIC(11,3),
    specific_amount NUMERIC(19,4),
    procurement_subject_name VARCHAR(90),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- エラー情報 (I1TERRORJYOUHOU -> tmh_acif_error)
DROP TABLE IF EXISTS tmh_acif_error CASCADE;
CREATE TABLE tmh_acif_error (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    batch_identifier VARCHAR(60) NOT NULL,
    cumulative_data_identifier VARCHAR(2),
    process_timing CHAR(1),
    process_execution_date CHAR(8),
    pre_carryover_count VARCHAR(10),
    current_occurrence_quantity VARCHAR(10),
    current_processed_quantity VARCHAR(10),
    next_period_carryover_quantity VARCHAR(10),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, batch_identifier)
);

-- エラー情報明細 (I1TERRORJYOUHOUMEISAI -> tmh_acif_error_line)
DROP TABLE IF EXISTS tmh_acif_error_line CASCADE;
CREATE TABLE tmh_acif_error_line (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    batch_identifier VARCHAR(60) NOT NULL,
    error_detail_number VARCHAR(12) NOT NULL,
    cumulative_data_identifier VARCHAR(2),
    system_type CHAR(2),
    process_timing CHAR(1),
    error_identifier CHAR(2),
    error_detail VARCHAR(3000),
    error_control_number VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, batch_identifier, error_detail_number)
);

-- 複数ラインたな卸マスタ (I1TFUKUSUULINETNORSMASTER -> tmh_acif_inventory_line)
DROP TABLE IF EXISTS tmh_acif_inventory_line CASCADE;
CREATE TABLE tmh_acif_inventory_line (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    year_month_period VARCHAR(6) NOT NULL,
    car_type VARCHAR(30) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    line1_department VARCHAR(5),
    line3_department VARCHAR(5),
    line2_department VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, year_month_period, car_type, parts_number)
);

-- 外販用部品仕入単価マスタ (I1TGAIHNBUHINSIREUTPRICEMASTER -> tmh_acif_external_part_purchase_price)
DROP TABLE IF EXISTS tmh_acif_external_part_purchase_price CASCADE;
CREATE TABLE tmh_acif_external_part_purchase_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    supplier_identifier VARCHAR(4) NOT NULL,
    issue_destination VARCHAR(5),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, management_number, application_start_date, supplier_identifier)
);

-- 外販用内製品単価マスタ (I1TGAIHNNAISEIHINUTPRICEMASTER -> tmh_acif_external_manufacturing_item_price)
DROP TABLE IF EXISTS tmh_acif_external_manufacturing_item_price CASCADE;
CREATE TABLE tmh_acif_external_manufacturing_item_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    year_month_period VARCHAR(6) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    order_sequence_code VARCHAR(4) NOT NULL,
    department VARCHAR(5) NOT NULL,
    base_time NUMERIC(8,2),
    material_cost NUMERIC(19,4),
    parts_cost NUMERIC(19,4),
    employment_cost NUMERIC(19,4),
    sub_material_cost NUMERIC(19,4),
    tooling_cost NUMERIC(19,4),
    energy_cost NUMERIC(19,4),
    specific_expense NUMERIC(19,4),
    depreciation NUMERIC(19,4),
    sub_department_cost NUMERIC(19,4),
    total NUMERIC(19,4),
    all_process_cost_fixed NUMERIC(19,4),
    processing_cost_variable NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, year_month_period, parts_number, order_sequence_code, department)
);

-- 現場たな卸データ (I1TGENBATANAOROSIDATA -> tmh_acif_site_inventory_line)
DROP TABLE IF EXISTS tmh_acif_site_inventory_line CASCADE;
CREATE TABLE tmh_acif_site_inventory_line (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    interface_issue_serial_number VARCHAR(12) NOT NULL,
    department_identifier VARCHAR(5),
    item_slip_type CHAR(1) NOT NULL,
    source_info_type VARCHAR(1),
    line_number VARCHAR(2),
    large_shelf_number VARCHAR(3),
    maintenance_type VARCHAR(2),
    shelf_number VARCHAR(10),
    parts_number VARCHAR(10),
    card_quantity VARCHAR(2),
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    unit VARCHAR(12),
    time_omission_type CHAR(1),
    uncollect_type CHAR(1),
    quantity NUMERIC(13,3),
    unsettled_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, interface_issue_serial_number, item_slip_type)
);

-- 現場手持現品票期次 (I1TGENBATEMOCHIGENPINHYOKIJI -> tmh_acif_site_inventory_tag)
DROP TABLE IF EXISTS tmh_acif_site_inventory_tag CASCADE;
CREATE TABLE tmh_acif_site_inventory_tag (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    department_identifier VARCHAR(5) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    source_info_type VARCHAR(1),
    line_number VARCHAR(2),
    large_shelf_number VARCHAR(3),
    maintenance_type VARCHAR(2),
    shelf_number VARCHAR(10) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    card_quantity VARCHAR(2),
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    unit VARCHAR(12),
    time_omission_type CHAR(1),
    unitpricehikiate_type CHAR(1),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, department_identifier, item_slip_type, shelf_number, parts_number)
);

-- 原価計算用科目判定マスタ (I1TGENKAKEISANKMKHNTEIMASTER -> tmh_acif_cost_account_rule)
DROP TABLE IF EXISTS tmh_acif_cost_account_rule CASCADE;
CREATE TABLE tmh_acif_cost_account_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    combined_supply_type CHAR(1) NOT NULL,
    external_sale_type CHAR(1) NOT NULL,
    manufacturing_cost_debit_identifier VARCHAR(4),
    product_cost_debit_name VARCHAR(90),
    product_cost_credit_identifier VARCHAR(4),
    product_cost_credit_name VARCHAR(90),
    sales_cost_debit_identifier VARCHAR(4),
    selected_cost_debit_account_name VARCHAR(90),
    selected_cost_credit_account_identifier VARCHAR(4),
    selected_cost_credit_account_name VARCHAR(90),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, combined_supply_type, external_sale_type)
);

-- 原価仕訳パターンマスタ (I1TGENKASIWAKEPATURNMASTER -> tmh_acif_cost_journal_entry_rule)
DROP TABLE IF EXISTS tmh_acif_cost_journal_entry_rule CASCADE;
CREATE TABLE tmh_acif_cost_journal_entry_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cost_journal_pattern_identifier VARCHAR(2) NOT NULL,
    journal_entry_sequence VARCHAR(2) NOT NULL,
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    credit_identifier VARCHAR(4),
    credit_name VARCHAR(250),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cost_journal_pattern_identifier, journal_entry_sequence)
);

-- １／２・実勘判定マスタ (I1THALFJIKKANHANTEIMASTER -> tmh_acif_actual_cost_class_rule)
DROP TABLE IF EXISTS tmh_acif_actual_cost_class_rule CASCADE;
CREATE TABLE tmh_acif_actual_cost_class_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    actual_period_reduced_item_criteria NUMERIC(8,0),
    half_period_unit_price NUMERIC(9,0),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier)
);

-- 品番マスタ (I1THINBANMASTER -> tmh_acif_part_number)
DROP TABLE IF EXISTS tmh_acif_part_number CASCADE;
CREATE TABLE tmh_acif_part_number (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    item_name VARCHAR(135),
    unit VARCHAR(36),
    cargo_form VARCHAR(12),
    tool_number VARCHAR(60),
    model VARCHAR(105),
    measurement_type CHAR(1),
    untotal_type CHAR(1),
    initial_type CHAR(1),
    surplus_type CHAR(1),
    settlement_type CHAR(1),
    abolish_reservation_type CHAR(1),
    abolish_reservation_date CHAR(8),
    abolish_type CHAR(1),
    abolish_date CHAR(8),
    abolish_reason CHAR(1),
    seat_number NUMERIC(4,0),
    minimum_order_lot NUMERIC(5,0),
    lead_time VARCHAR(2),
    basis_weight NUMERIC(5,0),
    delivery_cycle NUMERIC(5,0),
    self_supply_type CHAR(1),
    non_slip_target_type CHAR(1),
    stockout_follow_type CHAR(1),
    first_expected_month_usage_fee NUMERIC(11,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number)
);

-- wk_品番マスタ (I1THINBANMASTER_TEMP -> tmh_acif_part_number_processing)
DROP TABLE IF EXISTS tmh_acif_part_number_processing CASCADE;
CREATE TABLE tmh_acif_part_number_processing (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20),
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    unit VARCHAR(12),
    cargo_form VARCHAR(12),
    tool_number VARCHAR(60),
    model VARCHAR(105),
    measurement_type CHAR(1),
    untotal_type CHAR(1),
    initial_type CHAR(1),
    surplus_type CHAR(1),
    settlement_type CHAR(1),
    abolish_reservation_type CHAR(1),
    abolish_reservation_date CHAR(8),
    abolish_type CHAR(1),
    abolish_date CHAR(8),
    abolish_reason CHAR(1),
    seat_number NUMERIC(5,0),
    minimum_order_lot NUMERIC(5,0),
    lead_time VARCHAR(2),
    basis_weight NUMERIC(5,0),
    delivery_cycle NUMERIC(5,0),
    self_supply_type CHAR(1),
    non_slip_target_type CHAR(1),
    stockout_follow_type CHAR(1),
    first_expected_month_usage_fee NUMERIC(11,3),
    renewal_type VARCHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 品番仕入先マスタ (I1THINBANSIIRESAKIMASTER -> tmh_acif_part_number_supplier)
DROP TABLE IF EXISTS tmh_acif_part_number_supplier CASCADE;
CREATE TABLE tmh_acif_part_number_supplier (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    supplier_identifier VARCHAR(4) NOT NULL,
    supplier_factory_type CHAR(1),
    internal_type CHAR(1),
    estimated_unit_price NUMERIC(19,4),
    provisional_unit_price_reason CHAR(1),
    abolish_type CHAR(1),
    abolish_date CHAR(8),
    abolish_reason CHAR(1),
    switching_date CHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, supplier_identifier)
);

-- wk_品番仕入先マスタ (I1THINBANSIIRESAKIMASTER_TEMP -> tmh_acif_part_number_supplier_processing)
DROP TABLE IF EXISTS tmh_acif_part_number_supplier_processing CASCADE;
CREATE TABLE tmh_acif_part_number_supplier_processing (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20),
    parts_number VARCHAR(10),
    supplier_identifier VARCHAR(4),
    supplier_factory_type CHAR(1),
    internal_type CHAR(1),
    estimated_unit_price NUMERIC(19,4),
    provisional_unit_price_reason CHAR(1),
    abolish_type CHAR(1),
    abolish_date CHAR(8),
    abolish_reason CHAR(1),
    switching_date CHAR(8),
    renewal_type VARCHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 受信ファイルデータ (I1TIFFILEDATA -> tmh_acif_inbound_batch)
DROP TABLE IF EXISTS tmh_acif_inbound_batch CASCADE;
CREATE TABLE tmh_acif_inbound_batch (
    file_identifier VARCHAR(20) NOT NULL,
    file_name VARCHAR(1000),
    system_type CHAR(2),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_at VARCHAR(30),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (file_identifier)
);

-- 一括オーダー実績 (I1TIKKATSUORDERJISSEKI -> tmh_acif_bulk_order_result)
DROP TABLE IF EXISTS tmh_acif_bulk_order_result CASCADE;
CREATE TABLE tmh_acif_bulk_order_result (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    internal_external_type CHAR(1),
    contract_unit_price NUMERIC(19,4),
    corrected_unit_price NUMERIC(19,4),
    accounts_payable_corrected_unit_price NUMERIC(19,4),
    latest_unit_price NUMERIC(19,4),
    unit_price_correct_type CHAR(1),
    purchase_order_output_type CHAR(1),
    purchase_price_application_type CHAR(1),
    unit_price_record_date CHAR(8),
    acceptance_date CHAR(8),
    acceptance_registration_date CHAR(8),
    reissue_delivery_note_type CHAR(1),
    delivery_number VARCHAR(5),
    delivery_date CHAR(8),
    ocr_number VARCHAR(6),
    acceptance_quantity NUMERIC(13,3),
    unit_price_type CHAR(1),
    recorded_date CHAR(8),
    monthly_closing_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, management_number)
);

-- wk_一括オーダー実績 (I1TIKKATSUORDERJISSEKI_TEMP -> tmh_acif_bulk_order_result_processing)
DROP TABLE IF EXISTS tmh_acif_bulk_order_result_processing CASCADE;
CREATE TABLE tmh_acif_bulk_order_result_processing (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    process_type VARCHAR(1),
    company_identifier VARCHAR(20) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    internal_external_type CHAR(1),
    contract_unit_price NUMERIC(19,4),
    corrected_unit_price NUMERIC(19,4),
    accounts_payable_corrected_unit_price NUMERIC(19,4),
    latest_unit_price NUMERIC(19,4),
    unit_price_correct_type CHAR(1),
    purchase_order_output_type CHAR(1),
    purchase_price_application_type CHAR(1),
    unit_price_record_date CHAR(8),
    acceptance_date CHAR(8),
    acceptance_registration_date CHAR(8),
    reissue_delivery_note_type CHAR(1),
    delivery_number VARCHAR(5),
    delivery_date CHAR(8),
    ocr_number VARCHAR(6),
    acceptance_quantity NUMERIC(13,3),
    unit_price_type CHAR(1),
    recorded_date CHAR(8),
    monthly_closing_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, management_number)
);

-- 人事給与用科目判定マスタ (I1TJINJIKYUYOKMKHANTEIMASTER -> tmh_acif_employee_payroll_account_rule)
DROP TABLE IF EXISTS tmh_acif_employee_payroll_account_rule CASCADE;
CREATE TABLE tmh_acif_employee_payroll_account_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    salary_bonus_type CHAR(1) NOT NULL,
    account_item_identifier VARCHAR(4) NOT NULL,
    employee_type VARCHAR(2) NOT NULL,
    provision_cut_type CHAR(1),
    estimated_expense_type CHAR(1),
    debit_identifier VARCHAR(4),
    debit_burden_department VARCHAR(5),
    debit_tax_process_identifier VARCHAR(3),
    debit_tax_input_type CHAR(1),
    debit_budget_identifier VARCHAR(5),
    credit_identifier VARCHAR(4),
    credit_burden_department VARCHAR(5),
    credit_tax_process_identifier VARCHAR(3),
    credit_tax_input_type CHAR(1),
    credit_estimate_identifier VARCHAR(5),
    journal_expense_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, salary_bonus_type, account_item_identifier, employee_type)
);

-- 会計IFジョブコントロール (I1TKAIKEIIFJOBctrl -> tmh_acif_job_control)
DROP TABLE IF EXISTS tmh_acif_job_control CASCADE;
CREATE TABLE tmh_acif_job_control (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    batch_identifier VARCHAR(60) NOT NULL,
    dostate_flag CHAR(1),
    execution_expense_type CHAR(1),
    do_initial_expense_type CHAR(1),
    process_timing CHAR(1),
    execution_timestamp VARCHAR(30),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, batch_identifier)
);

-- 会計IF期間マスタ (I1TKAIKEIIFKIKANMASTER -> tmh_acif_period)
DROP TABLE IF EXISTS tmh_acif_period CASCADE;
CREATE TABLE tmh_acif_period (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    today_date CHAR(8),
    current_month_date CHAR(6),
    fiscal_period_start_date CHAR(8),
    fiscal_period_end_date CHAR(8),
    previous_period_start_date CHAR(8),
    previous_period_goal_date CHAR(8),
    applicable_period_start_date CHAR(8),
    applicable_period_end_date CHAR(8),
    monthly_processing_status_type CHAR(1),
    period_processing_status_type CHAR(1),
    previous_period_process_type CHAR(1),
    accounting_previous_month_date CHAR(6),
    matching_date CHAR(6),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier)
);

-- 会計IFメールテンプレートマスタ (I1TKAIKEIIFMAILTEMPLATEMASTER -> tmh_acif_email_template)
DROP TABLE IF EXISTS tmh_acif_email_template CASCADE;
CREATE TABLE tmh_acif_email_template (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    mail_identifier VARCHAR(20) NOT NULL,
    sender_address VARCHAR(50),
    recipient_address VARCHAR(100),
    title VARCHAR(250),
    message VARCHAR(250),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, mail_identifier)
);

-- 会計Ｉ／Ｆ入庫ファイル (I1TKAIKEIIFNYUUKOFILE -> tmh_acif_receipt_inbound)
DROP TABLE IF EXISTS tmh_acif_receipt_inbound CASCADE;
CREATE TABLE tmh_acif_receipt_inbound (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    delivery_order_number VARCHAR(5) NOT NULL,
    supplier_identifier VARCHAR(4) NOT NULL,
    receipt_warehouse_identifier VARCHAR(2),
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    unit VARCHAR(12),
    original_supplier_name VARCHAR(105),
    supplier_name VARCHAR(60),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    issue_destination VARCHAR(5),
    leave_order VARCHAR(33),
    issue_item CHAR(1),
    settlement_type CHAR(1),
    reacceptance_type CHAR(1),
    acceptance_date CHAR(8),
    warehousing_date CHAR(8),
    return_type CHAR(1),
    self_supply_type CHAR(1),
    management_number VARCHAR(11),
    special_order_repair_type CHAR(1),
    issue_group CHAR(2),
    secondhand_type CHAR(1),
    correct_type CHAR(1),
    internal_type CHAR(1),
    period_number VARCHAR(9),
    st_number VARCHAR(3),
    supply_recipient_identifier VARCHAR(4),
    employee_identifier VARCHAR(6),
    employee_name VARCHAR(90),
    accounting_issue_number VARCHAR(6),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 会計Ｉ／Ｆ出庫ファイル (I1TKAIKEIIFSYUKKOFILE -> tmh_acif_issue_inbound)
DROP TABLE IF EXISTS tmh_acif_issue_inbound CASCADE;
CREATE TABLE tmh_acif_issue_inbound (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20),
    employee_identifier VARCHAR(6),
    employee_name VARCHAR(90),
    warehouse_identifier VARCHAR(2),
    parts_number VARCHAR(10),
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    unit VARCHAR(12),
    issue_destination VARCHAR(5),
    leave_order VARCHAR(33),
    period_number VARCHAR(9),
    st_number VARCHAR(3),
    leave_quantity NUMERIC(13,3),
    issue_item CHAR(1),
    issue_date CHAR(8),
    issue_group CHAR(2),
    settlement_type CHAR(1),
    secondhand_type CHAR(1),
    reacceptance_type CHAR(1),
    supply_recipient_identifier VARCHAR(4),
    delivery_order_number VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 会計IF運用スケジュールマスタ (I1TKAIKEIIFUNYOUSCHEDULEMASTER -> tmh_acif_operation_schedule)
DROP TABLE IF EXISTS tmh_acif_operation_schedule CASCADE;
CREATE TABLE tmh_acif_operation_schedule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    batch_identifier VARCHAR(60) NOT NULL,
    batch_name VARCHAR(180),
    execution_order VARCHAR(2) NOT NULL,
    execution_order_sequence VARCHAR(2) NOT NULL,
    execution_control_batch_identifier VARCHAR(60),
    execution_control_batch_name VARCHAR(60),
    normal_execution_release_type CHAR(1),
    error_execution_release_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, batch_identifier, execution_order, execution_order_sequence)
);

-- 加工不良金額期次累積 (I1TKAKOUFURYOUKIJIRISKI -> tmh_acif_processing_defect_cum)
DROP TABLE IF EXISTS tmh_acif_processing_defect_cum CASCADE;
CREATE TABLE tmh_acif_processing_defect_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    department VARCHAR(5),
    parts_number VARCHAR(10),
    journal_pattern VARCHAR(2),
    journal_pattern_number VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 加工不良数量 (I1TKAKOUFURYOUSURYOU -> tmh_acif_processing_defect_quantity)
DROP TABLE IF EXISTS tmh_acif_processing_defect_quantity CASCADE;
CREATE TABLE tmh_acif_processing_defect_quantity (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    recorded_date CHAR(8) NOT NULL,
    department VARCHAR(5) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    correction_quantity NUMERIC(13,3),
    current_month_quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, recorded_date, department, parts_number)
);

-- 計量実績 (I1TKEIRYOUJISSEKI -> tmh_acif_measurement_result)
DROP TABLE IF EXISTS tmh_acif_measurement_result CASCADE;
CREATE TABLE tmh_acif_measurement_result (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    delivery_order_number VARCHAR(5) NOT NULL,
    measurement_category CHAR(1),
    measurement_identifier VARCHAR(10),
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    trading_partner_identifier VARCHAR(4),
    partner_name VARCHAR(225),
    handling_company VARCHAR(135),
    receipt_issue_date CHAR(8),
    car_number VARCHAR(4),
    total_weight NUMERIC(5,0),
    empty_weight NUMERIC(5,0),
    net_weight NUMERIC(5,0),
    adjusted_weight NUMERIC(5,0),
    remarks VARCHAR(150),
    arrival_time CHAR(4),
    departure_time CHAR(4),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 計量所マスタ (I1TKEIRYOUJOMASTER -> tmh_acif_measurement_station)
DROP TABLE IF EXISTS tmh_acif_measurement_station CASCADE;
CREATE TABLE tmh_acif_measurement_station (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    measurement_category CHAR(1) NOT NULL,
    measurement_identifier VARCHAR(10) NOT NULL,
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    trading_partner_identifier VARCHAR(4),
    handling_company VARCHAR(135),
    adjusted_weight_expense_type CHAR(1),
    select_box_order NUMERIC(4,0),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, measurement_category, measurement_identifier)
);

-- 軽油取引税マスタ (I1TKEIYUTORIHIKIZEIMASTER -> tmh_acif_diesel_fuel_transaction_tax)
DROP TABLE IF EXISTS tmh_acif_diesel_fuel_transaction_tax CASCADE;
CREATE TABLE tmh_acif_diesel_fuel_transaction_tax (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    diesel_oil_tax NUMERIC(7,2),
    tax_process_identifier_1 CHAR(1),
    tax_process_identifier_2 CHAR(1),
    tax_process_identifier_3 CHAR(1),
    tax_input_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, application_start_date)
);

-- 今回特調たな卸 (I1TKONKAITOKUCHOTANAOROSI -> tmh_acif_specific_procurement_inventory_line)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_inventory_line CASCADE;
CREATE TABLE tmh_acif_specific_procurement_inventory_line (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    interface_issue_serial_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11),
    inventory_execution_department VARCHAR(5),
    procurement_subject_name VARCHAR(90),
    acceptance_date CHAR(8),
    supplier VARCHAR(4),
    inventory_quantity NUMERIC(11,0),
    acceptance_quantity NUMERIC(13,3),
    unit VARCHAR(12),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    burden_department VARCHAR(5),
    inventory_date CHAR(6),
    remarks VARCHAR(150),
    spare VARCHAR(54),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, interface_issue_serial_number)
);

-- 購入部品基準単価マスタ (I1TKOUNYUBUHINUNITPRICEMASTER -> tmh_acif_standard_purchase_price)
DROP TABLE IF EXISTS tmh_acif_standard_purchase_price CASCADE;
CREATE TABLE tmh_acif_standard_purchase_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    unit_price NUMERIC(19,4),
    year_month_period VARCHAR(6) NOT NULL,
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, application_start_date)
);

-- 給与実績期次累積 (I1TKYUUYOJISSEKIKIJIRISKI -> tmh_acif_payroll_payment_cum)
DROP TABLE IF EXISTS tmh_acif_payroll_payment_cum CASCADE;
CREATE TABLE tmh_acif_payroll_payment_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    salary_bonus_type CHAR(1),
    provision_date CHAR(6),
    estimate_confirmed_type CHAR(1),
    current_month_affiliation_identifier VARCHAR(10),
    previous_month_position_identifier VARCHAR(10),
    employee_type VARCHAR(2),
    supply_deduction_type CHAR(1),
    account_item_identifier VARCHAR(4),
    system_item_identifier VARCHAR(4),
    tax_amount NUMERIC(19,4),
    journal_expense_type CHAR(1),
    red_black_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- リスト項目マスタ (I1TLISTKOUMOKUMASTER -> tmh_acif_list_item)
DROP TABLE IF EXISTS tmh_acif_list_item CASCADE;
CREATE TABLE tmh_acif_list_item (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    batch_identifier VARCHAR(60) NOT NULL,
    account_item VARCHAR(3000),
    sort_key VARCHAR(120),
    file_name VARCHAR(250),
    unit_price_error_key VARCHAR(120),
    account_error_key VARCHAR(120),
    error_control_number VARCHAR(2) NOT NULL,
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, batch_identifier, error_control_number)
);

-- 内製品単価マスタ (I1TNAISEIHINUNITPRICEMASTER -> tmh_acif_manufacturing_cost)
DROP TABLE IF EXISTS tmh_acif_manufacturing_cost CASCADE;
CREATE TABLE tmh_acif_manufacturing_cost (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    year_month_period VARCHAR(6) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    order_sequence_code VARCHAR(4) NOT NULL,
    department VARCHAR(5) NOT NULL,
    base_time NUMERIC(8,2),
    material_cost NUMERIC(19,4),
    parts_cost NUMERIC(19,4),
    employment_cost NUMERIC(19,4),
    sub_material_cost NUMERIC(19,4),
    tooling_cost NUMERIC(19,4),
    energy_cost NUMERIC(19,4),
    specific_expense NUMERIC(19,4),
    depreciation NUMERIC(19,4),
    sub_department_cost NUMERIC(19,4),
    total NUMERIC(19,4),
    all_process_cost_fixed NUMERIC(19,4),
    processing_cost_variable NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, year_month_period, parts_number, order_sequence_code, department)
);

-- 納番変換期次累積 (I1TNOUBANHENKANKIJIRUISEKI -> tmh_acif_delivery_number_conversion_cum)
DROP TABLE IF EXISTS tmh_acif_delivery_number_conversion_cum CASCADE;
CREATE TABLE tmh_acif_delivery_number_conversion_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    registration_year_month CHAR(6) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    delivery_note_number VARCHAR(5) NOT NULL,
    check_delivery_note_number VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, registration_year_month, parts_number, management_number, delivery_note_number)
);

-- 会計IFパッケージマスタ (I1TPACKAGEMASTER -> tmh_acif_batch)
DROP TABLE IF EXISTS tmh_acif_batch CASCADE;
CREATE TABLE tmh_acif_batch (
    company_identifier VARCHAR(20) NOT NULL,
    package_identifier VARCHAR(60) NOT NULL,
    package_name VARCHAR(100),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, package_identifier)
);

-- 労務費データ (I1TROUMUHIDATA -> tmh_acif_labor_cost_record)
DROP TABLE IF EXISTS tmh_acif_labor_cost_record CASCADE;
CREATE TABLE tmh_acif_labor_cost_record (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20),
    transfer_process_datetime CHAR(16),
    date_identification_identifier VARCHAR(4),
    additional_update_date CHAR(8),
    salary_bonus_type CHAR(1),
    provision_date CHAR(6),
    estimate_confirmed_type CHAR(1),
    employee_identifier VARCHAR(10),
    current_month_affiliation_identifier VARCHAR(10),
    previous_month_position_identifier VARCHAR(10),
    employee_type VARCHAR(2),
    account_item_identifier VARCHAR(4),
    amount NUMERIC(19,4),
    user_identifier CHAR(6),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 差額調整_鋼鈑精算金 (I1TSAGAKUCHOUSEIKOUHANSEISAN -> tmh_acif_steel_plate_settlement_adjustment)
DROP TABLE IF EXISTS tmh_acif_steel_plate_settlement_adjustment CASCADE;
CREATE TABLE tmh_acif_steel_plate_settlement_adjustment (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    issue_serial_number VARCHAR(12) NOT NULL,
    confirmed_unconfirmed_type CHAR(1),
    issuance_date CHAR(8),
    detail_print_order_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    parts_number VARCHAR(10),
    delivery_note_number VARCHAR(5),
    delivery_date CHAR(8),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    recorded_date CHAR(8),
    warehousing_date CHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, issue_serial_number)
);

-- wk_債権債務Ｉ／Ｆ (I1TSAIKENSAIMUINTERFACE_TEMP -> tmh_acif_receivable_payable_processing)
DROP TABLE IF EXISTS tmh_acif_receivable_payable_processing CASCADE;
CREATE TABLE tmh_acif_receivable_payable_processing (
    company_identifier VARCHAR(20),
    job_date CHAR(8),
    regular_holiday CHAR(8),
    tk_supplier_code VARCHAR(20),
    department_identifier VARCHAR(20),
    account_identifier VARCHAR(20),
    responsibility_department_id_detail VARCHAR(20),
    account_id_detail VARCHAR(20),
    execution_management_id_detail VARCHAR(20),
    consumption_tax_identifier VARCHAR(20),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    consumption_tax NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 製品区分マスタ (I1TSEIHINKUBUNMASTER -> tmh_acif_product_category)
DROP TABLE IF EXISTS tmh_acif_product_category CASCADE;
CREATE TABLE tmh_acif_product_category (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    product_type VARCHAR(30),
    combined_display_type CHAR(1),
    aluminum_type CHAR(1),
    letter_color_identifier VARCHAR(8),
    background_color_identifier VARCHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number)
);

-- 生産実績ＩＦ (I1TSEISANJISSEKIIF -> tmh_acif_production_result_interface)
DROP TABLE IF EXISTS tmh_acif_production_result_interface CASCADE;
CREATE TABLE tmh_acif_production_result_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20),
    dtprocess_date CHAR(8),
    transfer_process_time CHAR(8),
    date_identification_identifier VARCHAR(4),
    recorded_date CHAR(8),
    spare VARCHAR(54),
    product_date CHAR(8),
    combined_supply_type CHAR(1),
    parts_number VARCHAR(10),
    product_type VARCHAR(30),
    pass_item_number NUMERIC(9,0),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 製造原価修正数量確定 (I1TSEIZOUGENKASYUSEISURYOU -> tmh_acif_manufacturing_cost_adjustment_quantity)
DROP TABLE IF EXISTS tmh_acif_manufacturing_cost_adjustment_quantity CASCADE;
CREATE TABLE tmh_acif_manufacturing_cost_adjustment_quantity (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    debit_identifier VARCHAR(4) NOT NULL,
    credit_identifier VARCHAR(4) NOT NULL,
    external_sale_type CHAR(1) NOT NULL,
    combined_supply_type CHAR(1) NOT NULL,
    process_state CHAR(1) NOT NULL,
    quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, application_start_date, parts_number, debit_identifier, credit_identifier, external_sale_type, combined_supply_type, process_state)
);

-- 照合データ期次累積 (I1TSHOGODATAKIJIRUISEKI -> tmh_acif_reconciliation_line_cum)
DROP TABLE IF EXISTS tmh_acif_reconciliation_line_cum CASCADE;
CREATE TABLE tmh_acif_reconciliation_line_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    matching_date CHAR(6) NOT NULL,
    matching_type CHAR(1) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    check_delivery_order_number VARCHAR(5) NOT NULL,
    retroactive_check_delivery_order_number VARCHAR(5),
    slip_type CHAR(1) NOT NULL,
    retroactive_details_type CHAR(1),
    combined_supply_type CHAR(1),
    original_trading_partner_identifier VARCHAR(4),
    issue_destination VARCHAR(5),
    accounting_setting_type CHAR(1),
    tmc_configuration_type CHAR(1),
    accounting_cumulative_number VARCHAR(12) NOT NULL,
    accounting_cumulative_data_identifier VARCHAR(2),
    accounting_delivery_order_number VARCHAR(5),
    partial_delivery_type CHAR(1),
    accounting_recorded_date CHAR(8),
    accounting_acceptance_date CHAR(8) NOT NULL,
    accounting_issue_date CHAR(8),
    accounting_entry_scheduled_date CHAR(8),
    accounting_quantity NUMERIC(13,3),
    accounting_unit_price NUMERIC(19,4),
    accounting_amount NUMERIC(19,4),
    tmc_received_date_number VARCHAR(14) NOT NULL,
    tmc_acceptance_date CHAR(8) NOT NULL,
    tmc_quantity NUMERIC(13,3),
    tmc_unit_price NUMERIC(19,4),
    tmc_amount NUMERIC(19,4),
    tmc_retroactive_unit_price NUMERIC(19,4),
    tmc_retroactive_amount NUMERIC(19,4),
    tmc_delivery_order_number VARCHAR(5),
    tmc_debit_credit_type CHAR(1),
    tmc_trading_partner_identifier VARCHAR(4),
    tmc_partial_delivery_type CHAR(1),
    tmc_correction_presence_type CHAR(1),
    tmc_retroactive_presence_type CHAR(1),
    toyota_unit_price NUMERIC(19,4),
    toyota_amount NUMERIC(19,4),
    check_result VARCHAR(2),
    check_carryover_type CHAR(1),
    previous_month_reference_carryover_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, matching_date, matching_type, parts_number, management_number, check_delivery_order_number, slip_type, accounting_cumulative_number, accounting_acceptance_date, tmc_received_date_number, tmc_acceptance_date)
);

-- 支払遅延利息計算 (I1TSIHARAICHIENRISOKUKEISAN -> tmh_acif_payment_delay_interest)
DROP TABLE IF EXISTS tmh_acif_payment_delay_interest CASCADE;
CREATE TABLE tmh_acif_payment_delay_interest (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_detail_number VARCHAR(12) NOT NULL,
    recorded_date CHAR(8),
    supplier_identifier VARCHAR(4),
    slip_type CHAR(1),
    management_number VARCHAR(11),
    delivery_note_number VARCHAR(5),
    issue_serial_number VARCHAR(6),
    parts_number VARCHAR(10),
    trading_partner_date CHAR(8),
    quantity NUMERIC(13,3),
    purchase_unit_price NUMERIC(19,4),
    purchase_price_amount NUMERIC(19,4),
    cargo_days NUMERIC(5,0),
    annual_rate NUMERIC(5,2),
    subcontract_law_days NUMERIC(3,0),
    interest_amount NUMERIC(19,4),
    payment_date CHAR(8),
    print_order_type CHAR(1),
    warehousing_date CHAR(8),
    acceptance_date CHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_detail_number)
);

-- 仕掛品出庫数量 (I1TSIKAKARIHINSYUKKOSURYO -> tmh_acif_wip_issue_quantity)
DROP TABLE IF EXISTS tmh_acif_wip_issue_quantity CASCADE;
CREATE TABLE tmh_acif_wip_issue_quantity (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    issue_serial_number VARCHAR(12) NOT NULL,
    recorded_date CHAR(8),
    issue_date CHAR(8),
    management_number VARCHAR(11),
    financial_type CHAR(1),
    burden_department VARCHAR(5),
    budget_identifier VARCHAR(5),
    parts_number VARCHAR(10),
    quantity NUMERIC(13,3),
    issue_destination VARCHAR(5),
    pre_issue_department VARCHAR(5),
    check_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, issue_serial_number)
);

-- 仕掛品出庫数量データ (I1TSIKAKARIHINSYUKKOSURYO_DATA -> tmh_acif_wip_issue_quantity_line)
DROP TABLE IF EXISTS tmh_acif_wip_issue_quantity_line CASCADE;
CREATE TABLE tmh_acif_wip_issue_quantity_line (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    recorded_date CHAR(8) NOT NULL,
    issue_date CHAR(8) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    financial_type CHAR(1),
    burden_department VARCHAR(5),
    budget_identifier VARCHAR(5),
    parts_number VARCHAR(10),
    quantity NUMERIC(13,3),
    issue_destination VARCHAR(5),
    pre_issue_department VARCHAR(5),
    check_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 仕掛品出庫期次累積 (I1TSIKAKARISYUKKOKIJIRUISEKI -> tmh_acif_wip_issue_cum)
DROP TABLE IF EXISTS tmh_acif_wip_issue_cum CASCADE;
CREATE TABLE tmh_acif_wip_issue_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    parts_number VARCHAR(10),
    issue_date CHAR(8),
    delivery_note_number VARCHAR(5),
    management_number VARCHAR(11),
    issue_destination VARCHAR(5),
    pre_issue_department VARCHAR(5),
    financial_type CHAR(1),
    model_tool_number VARCHAR(105),
    check_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 下請管理法マスタ (I1TSITAUKEKANRIHOUMASTER -> tmh_acif_subcontract_act)
DROP TABLE IF EXISTS tmh_acif_subcontract_act CASCADE;
CREATE TABLE tmh_acif_subcontract_act (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    annual_rate NUMERIC(5,2),
    cargo_days NUMERIC(5,0),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, application_start_date)
);

-- 仕訳情報期次累積 (I1TSIWAKEJOUHOUKIJIRUISEKI -> tmh_acif_journal_entry_cum)
DROP TABLE IF EXISTS tmh_acif_journal_entry_cum CASCADE;
CREATE TABLE tmh_acif_journal_entry_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_detail_number VARCHAR(12) NOT NULL,
    cumulative_number VARCHAR(12),
    cumulative_data_identifier VARCHAR(2),
    recorded_date CHAR(8),
    system_type CHAR(2),
    slip_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    unit VARCHAR(12),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    debit_identifier VARCHAR(4),
    debit_burden_department VARCHAR(5),
    debit_tax_process_identifier VARCHAR(3),
    debit_tax_input_type CHAR(1),
    debit_tax_amount NUMERIC(5,2),
    debit_tax_type CHAR(1),
    debit_budget_identifier VARCHAR(5),
    credit_identifier VARCHAR(4),
    credit_burden_department VARCHAR(5),
    credit_tax_process_identifier VARCHAR(3),
    credit_tax_input_type CHAR(1),
    credit_tax_rate NUMERIC(5,2),
    credit_main_tax_type CHAR(1),
    credit_estimate_identifier VARCHAR(5),
    issue_serial_number VARCHAR(12),
    outline_identifier VARCHAR(4),
    outline_name VARCHAR(60),
    reversal_shipment_plan_date CHAR(8),
    process_state CHAR(1),
    journal_entry_interface_create_type CHAR(1),
    slip_type_identifier VARCHAR(4),
    interface_journal_number VARCHAR(20),
    selected_cost_process_type CHAR(1),
    unit_price_undecided_error_type CHAR(1),
    reunit_matching_type CHAR(1),
    interface_receivable_payable_journal_number VARCHAR(20),
    correct_reason_type CHAR(1),
    correction_reason VARCHAR(150),
    print_order_type CHAR(1),
    previous_quantity NUMERIC(13,3),
    previous_unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_detail_number)
);

-- 資材売却品基準原価マスタ (I1TSIZAIBIKYAKUUNITPRICEMASTER -> tmh_acif_item_standard_cost)
DROP TABLE IF EXISTS tmh_acif_item_standard_cost CASCADE;
CREATE TABLE tmh_acif_item_standard_cost (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    item_select_identifier VARCHAR(10) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, item_select_identifier, application_start_date)
);

-- 資材売上原価期次累積 (I1TSIZAIGENKAKIJIRUISEKI -> tmh_acif_item_cogs_cum)
DROP TABLE IF EXISTS tmh_acif_item_cogs_cum CASCADE;
CREATE TABLE tmh_acif_item_cogs_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    recorded_date CHAR(8),
    item_select_identifier VARCHAR(10),
    shipment_date CHAR(8),
    delivery_note_number VARCHAR(5),
    selection_type CHAR(1),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    journal_pattern VARCHAR(2),
    journal_pattern_number VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 資材仕入期次累積 (I1TSIZAISIIREKIJIRUISEKI -> tmh_acif_item_purchase_amount_cum)
DROP TABLE IF EXISTS tmh_acif_item_purchase_amount_cum CASCADE;
CREATE TABLE tmh_acif_item_purchase_amount_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    acceptance_date CHAR(8),
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    management_number VARCHAR(11),
    original_trading_partner_identifier VARCHAR(4),
    self_supply_type CHAR(1),
    return_type CHAR(1),
    internal_type CHAR(1),
    settlement_type CHAR(1),
    special_order_repair_type CHAR(1),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    via_route_type CHAR(1),
    tmc_inventory_settlement_type CHAR(1),
    diesel_tax_per_liter NUMERIC(7,2),
    model_tool_number VARCHAR(105),
    receipt_warehouse_identifier VARCHAR(2),
    warehousing_date CHAR(8),
    main_cumulative_number VARCHAR(12),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 資材仕入用科目判定マスタ (I1TSIZAISIIREKMKHANTEIMASTER -> tmh_acif_item_account_rule)
DROP TABLE IF EXISTS tmh_acif_item_account_rule CASCADE;
CREATE TABLE tmh_acif_item_account_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    settlement_type CHAR(1) NOT NULL,
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    debit_burden_department VARCHAR(5),
    credit_identifier VARCHAR(4),
    credit_name VARCHAR(250),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, settlement_type)
);

-- 資材仕入単価マスタ（テンポラリ） (I1TSIZAISIIRETANKAMASTER_TEMP -> tmh_acif_item_purchase_price_processing)
DROP TABLE IF EXISTS tmh_acif_item_purchase_price_processing CASCADE;
CREATE TABLE tmh_acif_item_purchase_price_processing (
    company_identifier VARCHAR(20),
    parts_number VARCHAR(10),
    supplier VARCHAR(4),
    management_number VARCHAR(11),
    application_start_date CHAR(8),
    application_end_date CHAR(8),
    unit_price_correct_type CHAR(1),
    configuration_date CHAR(8),
    unit_price NUMERIC(19,4),
    internal_type CHAR(1),
    self_supply_type CHAR(1),
    renewal_type VARCHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 資材仕入単価マスタ (I1TSIZAISIIREUNITPRICEMASTER -> tmh_acif_item_purchase_price)
DROP TABLE IF EXISTS tmh_acif_item_purchase_price CASCADE;
CREATE TABLE tmh_acif_item_purchase_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    supplier VARCHAR(4) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    unit_price NUMERIC(19,4),
    retroactive_completed_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, management_number, supplier, application_start_date)
);

-- 資材支給品出庫マスタ (I1TSIZAISIKYUHINSYUKKOMASTER -> tmh_acif_item_issue)
DROP TABLE IF EXISTS tmh_acif_item_issue CASCADE;
CREATE TABLE tmh_acif_item_issue (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    receipt_warehouse_identifier VARCHAR(2),
    issue_destination VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number)
);

-- 資材新設連絡書ファイル (I1TSIZAISINSETSURENRAKUFILE -> tmh_acif_item_creation_notice)
DROP TABLE IF EXISTS tmh_acif_item_creation_notice CASCADE;
CREATE TABLE tmh_acif_item_creation_notice (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    supplier_identifier VARCHAR(4) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    reference_number VARCHAR(4) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    procurement_person_in_charge VARCHAR(15),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, supplier_identifier, management_number, reference_number, application_start_date)
);

-- 資材出庫期次累積 (I1TSIZAISYUKKOKIJIRUISEKI -> tmh_acif_item_issue_cum)
DROP TABLE IF EXISTS tmh_acif_item_issue_cum CASCADE;
CREATE TABLE tmh_acif_item_issue_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    management_number VARCHAR(11),
    issue_destination VARCHAR(5),
    supply_recipient_identifier VARCHAR(4),
    issue_group CHAR(2),
    secondhand_type CHAR(1),
    settlement_type CHAR(1),
    issue_difference_type CHAR(1),
    financial_type CHAR(1),
    issue_item CHAR(1),
    reacceptance_type CHAR(1),
    reacceptance_return_issue_type CHAR(1),
    model_tool_number VARCHAR(105),
    issue_warehouse_identifier VARCHAR(2),
    issue_date CHAR(8),
    period_number VARCHAR(9),
    employee_name VARCHAR(90),
    unit_price_undecided_error_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 資材出庫用科目判定マスタ (I1TSIZAISYUKKOKMKHANTEIMASTER -> tmh_acif_item_issue_account_rule)
DROP TABLE IF EXISTS tmh_acif_item_issue_account_rule CASCADE;
CREATE TABLE tmh_acif_item_issue_account_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number)
);

-- 資材出庫単価マスタ (I1TSIZAISYUKKOUNITPRICEMASTER -> tmh_acif_item_issue_price)
DROP TABLE IF EXISTS tmh_acif_item_issue_price CASCADE;
CREATE TABLE tmh_acif_item_issue_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, application_start_date)
);

-- 資材出庫単価マスタ（テンポラリ） (I1TSIZAISYUKKOUNITPRICEMST_TMP -> tmh_acif_item_issue_price_processing)
DROP TABLE IF EXISTS tmh_acif_item_issue_price_processing CASCADE;
CREATE TABLE tmh_acif_item_issue_price_processing (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, application_start_date)
);

-- 資材たな卸金額期次累積 (I1TSIZAITNORSAMTKIJIRUISEKI -> tmh_acif_item_inventory_amount_cum)
DROP TABLE IF EXISTS tmh_acif_item_inventory_amount_cum CASCADE;
CREATE TABLE tmh_acif_item_inventory_amount_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    material_inventory_details_type CHAR(1),
    item_slip_type CHAR(1),
    source_info_type VARCHAR(1),
    department VARCHAR(5),
    parts_number VARCHAR(10),
    warehouse_identifier VARCHAR(2),
    consumable_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 資材たな卸データ (I1TSIZAITNORSDATA -> tmh_acif_item_inventory_line)
DROP TABLE IF EXISTS tmh_acif_item_inventory_line CASCADE;
CREATE TABLE tmh_acif_item_inventory_line (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    material_inventory_details_type CHAR(1) NOT NULL,
    warehouse_identifier VARCHAR(2) NOT NULL,
    department_identifier VARCHAR(5) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    item_slip_type CHAR(1) NOT NULL,
    source_info_type VARCHAR(1),
    quantity NUMERIC(13,3),
    actual_date CHAR(6),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, material_inventory_details_type, warehouse_identifier, department_identifier, parts_number, item_slip_type)
);

-- 資材売上期次累積 (I1TSIZAIURIAGEKIJIRUISEKI -> tmh_acif_item_sales_cum)
DROP TABLE IF EXISTS tmh_acif_item_sales_cum CASCADE;
CREATE TABLE tmh_acif_item_sales_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    shipment_date CHAR(8),
    delivery_note_number VARCHAR(5),
    item_select_identifier VARCHAR(10),
    journal_pattern VARCHAR(2),
    unchecked_type CHAR(1),
    retroactive_exclusion_type CHAR(1),
    measurement_category CHAR(1),
    model_tool_number VARCHAR(105),
    car_number VARCHAR(4),
    offset_billing_type CHAR(1),
    request_number VARCHAR(6),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 資材売上用科目判定マスタ (I1TSIZAIURIAGEKMKHANTEIMASTER -> tmh_acif_item_sales_account_rule)
DROP TABLE IF EXISTS tmh_acif_item_sales_account_rule CASCADE;
CREATE TABLE tmh_acif_item_sales_account_rule (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    credit_identifier VARCHAR(4),
    credit_name VARCHAR(250),
    cost_journal_pattern VARCHAR(2),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number)
);

-- 資材売上単価マスタ（テンポラリ） (I1TSIZAIURIAGETANKAMASTER_TEMP -> tmh_acif_item_sales_price_processing)
DROP TABLE IF EXISTS tmh_acif_item_sales_price_processing CASCADE;
CREATE TABLE tmh_acif_item_sales_price_processing (
    company_identifier VARCHAR(20),
    item_select_identifier VARCHAR(10),
    application_start_date CHAR(8),
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 資材売上単価マスタ (I1TSIZAIURIAGEUNITPRICEMASTER -> tmh_acif_item_sales_price)
DROP TABLE IF EXISTS tmh_acif_item_sales_price CASCADE;
CREATE TABLE tmh_acif_item_sales_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    item_select_identifier VARCHAR(10) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    unit_price NUMERIC(19,4),
    retroactive_completed_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, item_select_identifier, application_start_date)
);

-- 倉庫現品票期次 (I1TSOUKOGENPINHYOUKIJI -> tmh_acif_warehouse_item_label)
DROP TABLE IF EXISTS tmh_acif_warehouse_item_label CASCADE;
CREATE TABLE tmh_acif_warehouse_item_label (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    warehouse_identifier VARCHAR(2) NOT NULL,
    branch_office_identifier CHAR(1),
    shelf_number VARCHAR(10),
    parts_number VARCHAR(10) NOT NULL,
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    unit VARCHAR(12),
    time_omission_type CHAR(1),
    uncollect_type CHAR(1),
    unsettled_type CHAR(1),
    unitpricehikiate_type CHAR(1),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, warehouse_identifier, parts_number)
);

-- 倉庫たな卸データ (I1TSOUKOTANAOROSIDATA -> tmh_acif_warehouse_inventory_line)
DROP TABLE IF EXISTS tmh_acif_warehouse_inventory_line CASCADE;
CREATE TABLE tmh_acif_warehouse_inventory_line (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    warehouse_identifier VARCHAR(2) NOT NULL,
    branch_office_identifier CHAR(1),
    shelf_number VARCHAR(10),
    parts_number VARCHAR(10) NOT NULL,
    item_name VARCHAR(45),
    model_tool_number VARCHAR(105),
    unit VARCHAR(12),
    quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, warehouse_identifier, parts_number)
);

-- 数量管理表集計 (I1TSURYOUKANRIHYOUSYUKEI -> tmh_acif_quantity_summary)
DROP TABLE IF EXISTS tmh_acif_quantity_summary CASCADE;
CREATE TABLE tmh_acif_quantity_summary (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    current_month_date CHAR(6) NOT NULL,
    combined_supply_type CHAR(1) NOT NULL,
    product_type VARCHAR(30) NOT NULL,
    car_type VARCHAR(30),
    product_amount NUMERIC(13,3),
    shipment_quantity NUMERIC(13,3),
    unprocessed_quantity NUMERIC(11,3),
    external_sale_type CHAR(1) NOT NULL,
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, current_month_date, combined_supply_type, product_type, external_sale_type)
);

-- 車種集約マスタ (I1TSYASYUSYUYAKUMASTER -> tmh_acif_vehicle_type_group)
DROP TABLE IF EXISTS tmh_acif_vehicle_type_group CASCADE;
CREATE TABLE tmh_acif_vehicle_type_group (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    product VARCHAR(60),
    car_type VARCHAR(30),
    type VARCHAR(30),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number)
);

-- 消耗品コントロールマスタ (I1TSYOMOUHINctrlMASTER -> tmh_acif_consumable_inventory)
DROP TABLE IF EXISTS tmh_acif_consumable_inventory CASCADE;
CREATE TABLE tmh_acif_consumable_inventory (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    standard_unit_price NUMERIC(8,0),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number)
);

-- 会計IF消費税期間マスタ (I1TSYOUHIZEIKIKANMASTER -> tmh_acif_consumption_tax_period)
DROP TABLE IF EXISTS tmh_acif_consumption_tax_period CASCADE;
CREATE TABLE tmh_acif_consumption_tax_period (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    excise_type CHAR(1) NOT NULL,
    tax_process_identifier VARCHAR(3) NOT NULL,
    tax_process_name VARCHAR(250),
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, excise_type, tax_process_identifier, application_start_date)
);

-- 出荷数量ＩＦ (I1TSYUKKASURYOUIF -> tmh_acif_shipment_quantity_interface)
DROP TABLE IF EXISTS tmh_acif_shipment_quantity_interface CASCADE;
CREATE TABLE tmh_acif_shipment_quantity_interface (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    shipment_date CHAR(8) NOT NULL,
    destination_location_identifier VARCHAR(6),
    combined_supply_type CHAR(1),
    delivery_note_number VARCHAR(5) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    delivery_date CHAR(8),
    management_number VARCHAR(11) NOT NULL,
    product_type VARCHAR(30),
    shipment_quantity NUMERIC(13,3),
    return_additional_entry_type CHAR(1),
    partial_delivery_type CHAR(1),
    product_stock_quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, shipment_date, delivery_note_number, parts_number, management_number)
);

-- wk_出荷数量ＩＦ (I1TSYUKKASURYOUIF_TEMP -> tmh_acif_shipment_quantity_processing)
DROP TABLE IF EXISTS tmh_acif_shipment_quantity_processing CASCADE;
CREATE TABLE tmh_acif_shipment_quantity_processing (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20),
    shipment_date CHAR(8),
    destination_location_identifier VARCHAR(6),
    combined_supply_type CHAR(1),
    delivery_note_number VARCHAR(5),
    parts_number VARCHAR(10),
    delivery_date CHAR(8),
    management_number VARCHAR(11),
    product_type VARCHAR(30),
    shipment_quantity NUMERIC(13,3),
    return_additional_entry_type CHAR(1),
    partial_delivery_type CHAR(1),
    product_stock_quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 部品売上単価マスタ取込ワーク (I1TTMCBUHINURIAGEUTPRICEIMPWK -> tmh_acif_part_sales_price)
DROP TABLE IF EXISTS tmh_acif_part_sales_price CASCADE;
CREATE TABLE tmh_acif_part_sales_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    batch_number VARCHAR(13) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    delivery_note_number VARCHAR(5) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    combined_supply_type CHAR(1),
    external_sale_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, batch_number, parts_number, management_number, delivery_note_number, application_start_date)
);

-- TMC部品売上単価マスタ (I1TTMCBUHINURIAGEUTPRICEMASTER -> tmh_acif_part_tmc_sales_price)
DROP TABLE IF EXISTS tmh_acif_part_tmc_sales_price CASCADE;
CREATE TABLE tmh_acif_part_tmc_sales_price (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    delivery_note_number VARCHAR(5) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    combined_supply_type CHAR(1),
    external_sale_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    unit_price NUMERIC(19,4),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, management_number, delivery_note_number, application_start_date)
);

-- TMC受信データ期次累積 (I1TTMCJYUSINDATAKIJIRUISEKI -> tmh_acif_tmc_received_cum)
DROP TABLE IF EXISTS tmh_acif_tmc_received_cum CASCADE;
CREATE TABLE tmh_acif_tmc_received_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    receive_date_number VARCHAR(14) NOT NULL,
    matching_date CHAR(6),
    received_details_type CHAR(1),
    matching_receivable_payable_type CHAR(1),
    layout_type CHAR(1),
    dt_identifier CHAR(1),
    transfer_number VARCHAR(2),
    card_number VARCHAR(2),
    trading_partner_identifier VARCHAR(4),
    parts_number VARCHAR(10),
    category VARCHAR(2),
    management_number VARCHAR(11),
    delivery_note_number VARCHAR(5),
    debit_credit_type CHAR(1),
    quantity NUMERIC(13,3),
    unit_price NUMERIC(19,4),
    amount NUMERIC(19,4),
    receipt_year CHAR(2),
    receipt_month CHAR(2),
    receipt_date CHAR(8),
    issue_destination VARCHAR(5),
    provisional_settlement_correction_identifier CHAR(1),
    check_group_number VARCHAR(14),
    slip_type CHAR(1),
    check_delivery_order_number VARCHAR(5),
    retroactive_check_delivery_order_number VARCHAR(5),
    tmc_partial_delivery_type CHAR(1),
    correction_existing_type CHAR(1),
    combined_supply_type CHAR(1),
    acceptance_date CHAR(8),
    check_quantity NUMERIC(13,3),
    check_unit_price NUMERIC(19,4),
    check_amount NUMERIC(19,4),
    retroactive_unit_price NUMERIC(19,4),
    retroactive_amount NUMERIC(19,4),
    current_month_retroactive_unit_price NUMERIC(19,4),
    current_month_retroactive_amount NUMERIC(19,4),
    unchecked_type CHAR(1),
    retroactive_details_type CHAR(1),
    carryover_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, receive_date_number)
);

-- 特調データ (I1TTOKUCHODATA -> tmh_acif_specific_procurement)
DROP TABLE IF EXISTS tmh_acif_specific_procurement CASCADE;
CREATE TABLE tmh_acif_specific_procurement (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    interface_issue_serial_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    supply_type CHAR(1),
    occurrence_type CHAR(1),
    requesting_department_code VARCHAR(5),
    client_name VARCHAR(45),
    client_identifier VARCHAR(6),
    procurement_subject_name VARCHAR(90),
    month_count VARCHAR(2),
    content_type CHAR(1),
    content VARCHAR(90),
    refer_number VARCHAR(5),
    internal_department VARCHAR(5),
    preferred_supplier_code VARCHAR(4),
    preferred_manufacturer_name VARCHAR(60),
    delivery_place VARCHAR(30),
    start_year_month CHAR(6),
    requested_delivery_date CHAR(8),
    order_number NUMERIC(13,3),
    order_unit VARCHAR(12),
    estimated_amount NUMERIC(19,4),
    budget_identifier VARCHAR(5),
    provisional_amount_reason CHAR(1),
    burden_department VARCHAR(5),
    financial_type CHAR(1),
    hnt_type CHAR(1),
    inventory_type VARCHAR(2),
    asset_identifier VARCHAR(9),
    asset_name VARCHAR(90),
    asset_registered_quantity NUMERIC(4,0),
    excise_type CHAR(1),
    contract_unit_price NUMERIC(19,4),
    corrected_unit_price NUMERIC(19,4),
    accounts_payable_corrected_unit_price NUMERIC(19,4),
    latest_unit_price NUMERIC(19,4),
    unit_price_type CHAR(1),
    supplier VARCHAR(4),
    manufacturer VARCHAR(75),
    supply_person_in_charge_identifier VARCHAR(6),
    procurement_person_in_charge VARCHAR(15),
    under_review_type CHAR(1),
    unit_price_correct_type CHAR(1),
    purchase_order_output_type CHAR(1),
    purchase_price_application_type CHAR(1),
    secondhand_type CHAR(1),
    special_commercial_type CHAR(1),
    supply_request_start_date CHAR(8),
    reception_date CHAR(8),
    supply_request_completion_date CHAR(8),
    supplier_registration_date CHAR(8),
    usage_change_registration_date CHAR(8),
    unit_price_record_date CHAR(8),
    acceptance_date CHAR(8),
    acceptance_registration_date CHAR(8),
    reissue_delivery_note_type CHAR(1),
    depreciation_start_date CHAR(6),
    planned_depreciation_start_date CHAR(6),
    delivery_number VARCHAR(8),
    delivery_date CHAR(8),
    recorded_date CHAR(8),
    ocr_number VARCHAR(6),
    abolish_date CHAR(8),
    abolish_date_2 CHAR(8),
    abolish_registration_date CHAR(8),
    acceptance_quantity NUMERIC(13,3),
    requesting_department_confirmed_type CHAR(1),
    supply_section_decision_type CHAR(1),
    interruption_type CHAR(1),
    monthly_closing_type CHAR(1),
    management_type CHAR(1),
    electronic_settlement_type CHAR(1),
    management_notification_type CHAR(1),
    application_lower_number NUMERIC(2,0),
    request_scheduled_quantity NUMERIC(2,0),
    inventory_department VARCHAR(5),
    subcontract_target_type CHAR(1),
    terminal_number VARCHAR(8),
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, interface_issue_serial_number, management_number)
);

-- wk_特調データ (I1TTOKUCHODATA_TEMP -> tmh_acif_specific_procurement_processing)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_processing CASCADE;
CREATE TABLE tmh_acif_specific_procurement_processing (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    process_type VARCHAR(1),
    company_identifier VARCHAR(20) NOT NULL,
    interface_issue_serial_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    supply_type CHAR(1),
    occurrence_type CHAR(1),
    requesting_department_code VARCHAR(5),
    client_name VARCHAR(45),
    client_identifier VARCHAR(6),
    procurement_subject_name VARCHAR(90),
    month_count VARCHAR(2),
    content_type CHAR(1),
    content VARCHAR(90),
    refer_number VARCHAR(5),
    internal_department VARCHAR(5),
    preferred_supplier_code VARCHAR(4),
    preferred_manufacturer_name VARCHAR(60),
    delivery_place VARCHAR(30),
    start_year_month CHAR(6),
    requested_delivery_date CHAR(8),
    order_number NUMERIC(13,3),
    order_unit VARCHAR(12),
    estimated_amount NUMERIC(19,4),
    budget_identifier VARCHAR(5),
    provisional_amount_reason CHAR(1),
    burden_department VARCHAR(5),
    financial_type CHAR(1),
    hnt_type CHAR(1),
    inventory_type VARCHAR(2),
    asset_identifier VARCHAR(9),
    asset_name VARCHAR(90),
    asset_registered_quantity NUMERIC(4,0),
    excise_type CHAR(1),
    contract_unit_price NUMERIC(19,4),
    corrected_unit_price NUMERIC(19,4),
    accounts_payable_corrected_unit_price NUMERIC(19,4),
    latest_unit_price NUMERIC(19,4),
    unit_price_type CHAR(1),
    supplier VARCHAR(4),
    manufacturer VARCHAR(75),
    supply_person_in_charge_identifier VARCHAR(6),
    procurement_person_in_charge VARCHAR(15),
    under_review_type CHAR(1),
    unit_price_correct_type CHAR(1),
    purchase_order_output_type CHAR(1),
    purchase_price_application_type CHAR(1),
    secondhand_type CHAR(1),
    special_commercial_type CHAR(1),
    supply_request_start_date CHAR(8),
    reception_date CHAR(8),
    supply_request_completion_date CHAR(8),
    supplier_registration_date CHAR(8),
    usage_change_registration_date CHAR(8),
    unit_price_record_date CHAR(8),
    acceptance_date CHAR(8),
    acceptance_registration_date CHAR(8),
    reissue_delivery_note_type CHAR(1),
    depreciation_start_date CHAR(6),
    planned_depreciation_start_date CHAR(6),
    delivery_number VARCHAR(5),
    delivery_date CHAR(8),
    recorded_date CHAR(8),
    ocr_number VARCHAR(6),
    abolish_date CHAR(8),
    abolish_date_2 CHAR(8),
    abolish_registration_date CHAR(8),
    acceptance_quantity NUMERIC(13,3),
    requesting_department_confirmed_type CHAR(1),
    supply_section_decision_type CHAR(1),
    interruption_type CHAR(1),
    monthly_closing_type CHAR(1),
    management_type CHAR(1),
    electronic_settlement_type CHAR(1),
    management_notification_type CHAR(1),
    application_lower_number NUMERIC(2,0),
    request_scheduled_quantity NUMERIC(2,0),
    inventory_department VARCHAR(5),
    subcontract_target_type CHAR(1),
    terminal_number VARCHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, interface_issue_serial_number, management_number)
);

-- 特調負担部署用科目判定マスタ (I1TTOKUCHOFUTANKMKHANTEIMASTER -> tmh_acif_specific_procurement_cost_burden_department)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_cost_burden_department CASCADE;
CREATE TABLE tmh_acif_specific_procurement_cost_burden_department (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    burden_department_identifier VARCHAR(5) NOT NULL,
    debit_identifier VARCHAR(4),
    debit_name VARCHAR(250),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, burden_department_identifier)
);

-- 特調管理番号用科目判定マスタ (I1TTOKUCHOKANRIKMKHANTEIMASTER -> tmh_acif_specific_procurement_management_number)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_management_number CASCADE;
CREATE TABLE tmh_acif_specific_procurement_management_number (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    tmc_supply_type CHAR(1) NOT NULL,
    management_number_first_digit CHAR(1) NOT NULL,
    financial_type CHAR(1) NOT NULL,
    special_order_external_debit_identifier VARCHAR(4),
    special_order_external_credit_identifier VARCHAR(4),
    special_order_external_credit_name VARCHAR(90),
    special_external_debit_name VARCHAR(90),
    material_issue_debit_identifier VARCHAR(4),
    material_issue_debit_name VARCHAR(30),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, tmc_supply_type, management_number_first_digit, financial_type)
);

-- 特調建仮引渡 (I1TTOKUCHOKENKARIHIKIWATASI -> tmh_acif_specific_procurement_cip_handover)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_cip_handover CASCADE;
CREATE TABLE tmh_acif_specific_procurement_cip_handover (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    system_type CHAR(2) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    cost_type CHAR(1) NOT NULL,
    slip_type CHAR(1) NOT NULL,
    amount NUMERIC(19,4),
    recorded_date CHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, system_type, management_number, cost_type, slip_type)
);

-- 特調検収実績 (I1TTOKUCHOKENSYUUJISSEKI -> tmh_acif_specific_procurement_acceptance)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_acceptance CASCADE;
CREATE TABLE tmh_acif_specific_procurement_acceptance (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    assets_number VARCHAR(9) NOT NULL,
    special_order_repair_type CHAR(1),
    procurement_subject_name VARCHAR(90),
    budget_identifier VARCHAR(5),
    burden_department VARCHAR(5),
    internal_department VARCHAR(5),
    internal_type CHAR(1),
    financial_type CHAR(1),
    hnt_type CHAR(1),
    tmc_supply_type CHAR(1),
    unit_price NUMERIC(19,4),
    supplier VARCHAR(4),
    procurement_person_in_charge VARCHAR(15),
    acceptance_date CHAR(8),
    recorded_date CHAR(8),
    delivery_number VARCHAR(5),
    delivery_date CHAR(8),
    acceptance_quantity NUMERIC(13,3),
    identifier VARCHAR(26) DEFAULT generate_ulid()
);

-- 特調仕入期次累積 (I1TTOKUCHOSIIREKIJIRUISEKI -> tmh_acif_specific_procurement_purchase_cum)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_purchase_cum CASCADE;
CREATE TABLE tmh_acif_specific_procurement_purchase_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    acceptance_date CHAR(8),
    delivery_note_number VARCHAR(5),
    management_number VARCHAR(11),
    internal_type CHAR(1),
    internal_department VARCHAR(5),
    tmc_supply_type CHAR(1),
    requesting_department VARCHAR(5),
    procurement_subject_name VARCHAR(90),
    financial_type CHAR(1),
    hnt_type CHAR(1),
    delivery_date CHAR(8),
    procurement_person_in_charge VARCHAR(15),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 特調資産データ (I1TTOKUCHOSISANDATA -> tmh_acif_specific_procurement_asset)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_asset CASCADE;
CREATE TABLE tmh_acif_specific_procurement_asset (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    issue_serial_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    asset_identifier VARCHAR(9) NOT NULL,
    asset_name VARCHAR(90),
    tmc_asset_identifier VARCHAR(9),
    tmc_asset_name VARCHAR(60),
    indirect_management_type CHAR(1),
    using_department VARCHAR(5),
    division_type CHAR(1),
    separate_slip_type VARCHAR(4),
    statutory_service_years NUMERIC(2,0),
    municipality_location_type VARCHAR(3),
    quantity_change_delete_type CHAR(1),
    acceptance_entry_date CHAR(8),
    standard_location_lock_type CHAR(1),
    terminal_number VARCHAR(8),
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, issue_serial_number, management_number, asset_identifier)
);

-- wk_特調資産データ (I1TTOKUCHOSISANDATA_TEMP -> tmh_acif_specific_procurement_asset_processing)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_asset_processing CASCADE;
CREATE TABLE tmh_acif_specific_procurement_asset_processing (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    process_type VARCHAR(1),
    company_identifier VARCHAR(20) NOT NULL,
    issue_serial_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    asset_identifier VARCHAR(9) NOT NULL,
    asset_name VARCHAR(90),
    tmc_asset_identifier VARCHAR(9),
    tmc_asset_name VARCHAR(60),
    indirect_management_type CHAR(1),
    using_department VARCHAR(5),
    division_type CHAR(1),
    separate_slip_type VARCHAR(4),
    statutory_service_years NUMERIC(2,0),
    municipality_location_type VARCHAR(3),
    quantity_change_delete_type CHAR(1),
    acceptance_entry_date CHAR(8),
    standard_location_lock_type CHAR(1),
    terminal_number VARCHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, issue_serial_number, management_number, asset_identifier)
);

-- 特調消費税区分マスタ (I1TTOKUCHOSYOUHIZEICLASSMASTER -> tmh_acif_specific_procurement_tax_category)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_tax_category CASCADE;
CREATE TABLE tmh_acif_specific_procurement_tax_category (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    excise_type CHAR(1) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    debit_tax_process_identifier VARCHAR(3),
    tax_input_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, excise_type, application_start_date)
);

-- 特調たな卸金額期次累積 (I1TTOKUCHOTNORSAMTKIJIRUISEKI -> tmh_acif_specific_procurement_inventory_amount_cum)
DROP TABLE IF EXISTS tmh_acif_specific_procurement_inventory_amount_cum CASCADE;
CREATE TABLE tmh_acif_specific_procurement_inventory_amount_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11),
    inventory_execution_department VARCHAR(5),
    procurement_subject_name VARCHAR(90),
    acceptance_date CHAR(8),
    burden_department VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 特定加工費期次累積 (I1TTOKUTEIKAKOUHIKIJIRUISEKI -> tmh_acif_specific_processing_cost_cum)
DROP TABLE IF EXISTS tmh_acif_specific_processing_cost_cum CASCADE;
CREATE TABLE tmh_acif_specific_processing_cost_cum (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    cumulative_number VARCHAR(12) NOT NULL,
    management_number VARCHAR(11),
    executing_department VARCHAR(5),
    specific_labor_hours NUMERIC(11,3),
    rate NUMERIC(11,3),
    specific_amount NUMERIC(19,4),
    procurement_subject_name VARCHAR(90),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, cumulative_number)
);

-- 特定工数 (I1TTOKUTEIKOUSUU -> tmh_acif_specific_effort)
DROP TABLE IF EXISTS tmh_acif_specific_effort CASCADE;
CREATE TABLE tmh_acif_specific_effort (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    recorded_date CHAR(8) NOT NULL,
    executing_department VARCHAR(5) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    specific_labor_hours NUMERIC(11,3),
    procurement_subject_name VARCHAR(90),
    specific_labor_hours_error_identifier VARCHAR(20),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, recorded_date, executing_department, management_number)
);

-- 特定レートマスタ (I1TTOKUTEIRATEMASTER -> tmh_acif_specific_rate)
DROP TABLE IF EXISTS tmh_acif_specific_rate CASCADE;
CREATE TABLE tmh_acif_specific_rate (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    executing_department VARCHAR(5) NOT NULL,
    application_start_date CHAR(8) NOT NULL,
    application_end_date CHAR(8),
    configuration_date CHAR(8),
    aw_rate NUMERIC(11,3),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, executing_department, application_start_date)
);

-- 特定作業データ (I1TTOKUTEISAGYOUDATA -> tmh_acif_specific_operation)
DROP TABLE IF EXISTS tmh_acif_specific_operation CASCADE;
CREATE TABLE tmh_acif_specific_operation (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    date CHAR(8) NOT NULL,
    department_identifier VARCHAR(5) NOT NULL,
    management_number VARCHAR(11) NOT NULL,
    work_time NUMERIC(6,2),
    procurement_subject_name VARCHAR(90),
    PRIMARY KEY (company_identifier, date, department_identifier, management_number)
);

-- 部品トヨタ出庫部署マスタ (I1TTOYOTASYUKKOBUSYOMASTER -> tmh_acif_part_tmc_issue_department)
DROP TABLE IF EXISTS tmh_acif_part_tmc_issue_department CASCADE;
CREATE TABLE tmh_acif_part_tmc_issue_department (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    parts_number VARCHAR(10) NOT NULL,
    category VARCHAR(2) NOT NULL,
    supplier_identifier VARCHAR(4) NOT NULL,
    receipt_identifier VARCHAR(2) NOT NULL,
    mail_documentation_type CHAR(1),
    issue_destination VARCHAR(5),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, parts_number, category, supplier_identifier, receipt_identifier)
);

-- 売掛金買掛金日付管理マスタ (I1TURIKAKEKAIKAKEDATEMASTER -> tmh_acif_receivable_payable_date)
DROP TABLE IF EXISTS tmh_acif_receivable_payable_date CASCADE;
CREATE TABLE tmh_acif_receivable_payable_date (
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    recording_year_month CHAR(6) NOT NULL,
    paymentdatedeposit_date CHAR(8),
    summary_list_submission_date CHAR(8),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    identifier_2 VARCHAR(20),
    PRIMARY KEY (company_identifier, recording_year_month)
);

-- 売掛金買掛金訂正票 (I1TURIKAKEKAIKAKETEISEIHYOU -> tmh_acif_receivable_payable_correction_slips)
DROP TABLE IF EXISTS tmh_acif_receivable_payable_correction_slips CASCADE;
CREATE TABLE tmh_acif_receivable_payable_correction_slips (
    created_company_identifier VARCHAR(20),
    created_by VARCHAR(20),
    created_process_identifier VARCHAR(50),
    created_ip_address VARCHAR(20),
    created_at VARCHAR(30),
    updated_company_identifier VARCHAR(20),
    updated_by VARCHAR(20),
    updated_process_identifier VARCHAR(50),
    updated_ip_address VARCHAR(20),
    updated_at VARCHAR(30),
    company_identifier VARCHAR(20) NOT NULL,
    issue_serial_number VARCHAR(12) NOT NULL,
    slip_type CHAR(1),
    confirmed_unconfirmed_type CHAR(1),
    issuance_date CHAR(8),
    material_parts_special_order_type CHAR(1),
    receivable_payable_type CHAR(1),
    trading_partner_identifier VARCHAR(4),
    item_select_identifier VARCHAR(10),
    management_number VARCHAR(11),
    procurement_subject_name VARCHAR(90),
    delivery_note_number VARCHAR(5),
    acceptance_date CHAR(8),
    previous_quantity NUMERIC(13,3),
    previous_unit_price NUMERIC(19,4),
    previous_amount NUMERIC(19,4),
    new_quantity NUMERIC(13,3),
    new_unit_price NUMERIC(19,4),
    new_amount NUMERIC(19,4),
    difference_quantity NUMERIC(13,3),
    difference_unit_price NUMERIC(19,4),
    difference_amount NUMERIC(19,4),
    correct_reason_type CHAR(1),
    correction_reason VARCHAR(150),
    self_supply_type CHAR(1),
    return_type CHAR(1),
    settlement_type CHAR(1),
    special_order_repair_type CHAR(1),
    shipment_date CHAR(8),
    combined_supply_type CHAR(1),
    tmc_acceptance_date CHAR(8),
    product_type VARCHAR(30),
    tmc_delivery_date CHAR(8),
    issue_destination VARCHAR(5),
    warehousing_date CHAR(8),
    issue_date CHAR(8),
    recorded_date CHAR(8),
    receipt_identifier VARCHAR(2),
    cumulative_number VARCHAR(12),
    internal_type CHAR(1),
    identifier VARCHAR(26) DEFAULT generate_ulid(),
    PRIMARY KEY (company_identifier, issue_serial_number)
);
