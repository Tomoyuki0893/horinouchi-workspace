# WFSワークフロー ユーザ管理設計ナレッジ（確定版）

## 前提：TALONの2種類の権限を混同しない

| | TALONログイン権限 | WFS承認権限 |
|---|---|---|
| 管理テーブル | `TLN_M_USER.GROUP_ID` | `WFS_M_USR_GRP_HED/DTL/DEPDTL` |
| 制御対象 | メニュー表示・機能利用 | ワークフロー申請・承認 |
| 管理画面 | TALONユーザーマスタメンテ | WFSユーザーグループメンテ |
| 設計の起点 | ユーザー起点 | **グループ起点** |

**この2つは別物。混同しないこと。**  
既存スキルの `ROLE_CD` / `APP_M_ROLE_GROUP` は TALONログイン権限（GROUP_ID）の話であり、WFSグループとは無関係。

---

## 1. WFSテーブル構造の正しい理解

### 3テーブルの役割

```
WFS_M_USR_GRP_HED（グループ定義）
  ├ WFS_GROUP_ID   グループID（例：課長_稟議）
  └ WFS_GROUP_NM   グループ名称

WFS_M_USR_GRP_DTL（グループ構成の直接定義）
  ├ WFS_GROUP_ID   グループID
  └ ID             所属するユーザーID または 子グループID
    ※ ユーザーIDとグループIDの両方が混在して格納される
    ※ グループのネスト（グループの中にグループ）を表現できる

WFS_M_USR_GRP_DEPDTL（展開済みユーザー一覧）
  ├ WFS_GROUP_ID   グループID
  └ USER_ID        実際のユーザーID（DTLのネストを再帰展開した結果）
    ※ 権限判定・メール送信はこのテーブルのみを参照する
    ※ WFSグループメンテの確定時に自動再展開される
```

### 申請・承認時の権限判定フロー

```sql
-- ① 対象WF・階層・ルートから実施可能グループIDを取得
SELECT USR_GRP_ID
FROM WFS_M_AUTH
WHERE WORK_ID  = :workId
  AND LEVEL_NO = :levelNo
  AND ROUTE_ID = :routeId;

-- ② そのグループに対象ユーザーが所属するか判定
SELECT COUNT(*)
FROM WFS_M_USR_GRP_DEPDTL
WHERE WFS_GROUP_ID = :groupId
  AND USER_ID      = :userId;
```

### 重要な設計思想

- WFSはもともと**グループ起点**の設計になっている
- `DTL` は「人間が定義する構成」、`DEPDTL` は「システムが展開する実体」
- 権限判定は常に `DEPDTL` を参照する。`DTL` は参照しない

---

## 2. ユーザー照会 SQL（DEPDTLを使った軽量クエリ）

### 特定ユーザーの所属グループ一覧を取得

```sql
-- ユーザーIDで検索 → 所属グループ一覧（読み取り専用）
SELECT
    D.WFS_GROUP_ID,
    H.WFS_GROUP_NM
FROM WFS_M_USR_GRP_DEPDTL D
INNER JOIN WFS_M_USR_GRP_HED H
    ON D.WFS_GROUP_ID = H.WFS_GROUP_ID
WHERE D.USER_ID = :userId
ORDER BY H.WFS_GROUP_NM;
```

### グループのメンバー一覧を取得

```sql
-- グループIDで検索 → 所属ユーザー一覧（DEPDTL経由）
SELECT
    D.USER_ID,
    U.USER_NM
FROM WFS_M_USR_GRP_DEPDTL D
INNER JOIN TLN_M_USER U
    ON D.USER_ID = U.USER_ID
WHERE D.WFS_GROUP_ID = :groupId
ORDER BY U.USER_NM;
```

### グループIDに直接登録されているユーザー（DTLの直接メンバーのみ）

```sql
-- DTLから直接ユーザーIDのみ取得（IDがユーザーIDかグループIDかはUSR_GRP_IDで判別）
SELECT
    D.ID        AS USER_ID,
    U.USER_NM
FROM WFS_M_USR_GRP_DTL D
INNER JOIN TLN_M_USER U
    ON D.ID = U.USER_ID
WHERE D.WFS_GROUP_ID = :groupId;
-- ※ グループIDが混在する場合はUSR_GRP_ID = '1'（ユーザー種別）で絞る
```

---

## 3. NGパターン（今回の設計迷走から得た教訓）

### NG① WFS管理用の中間テーブルを新設する

```sql
-- ❌ やってはいけない
CREATE TABLE TLN_M_USER_WFS_GROUP (
  USER_ID      VARCHAR2(50),
  WFS_GROUP_ID VARCHAR2(50),
  MAIL_ADDRESS VARCHAR2(200),
  ...
);
```

**なぜダメか：**
- `WFS_M_USR_GRP_DTL` と役割が完全に重複する
- 二重管理を解消しようとして**三重管理**を作ることになる
- WFSはもともとグループ構成を管理するテーブルを持っている

### NG② TLN_M_USER に WFS関連カラムを追加する

```sql
-- ❌ やってはいけない
ALTER TABLE TLN_M_USER ADD WFS_GROUP_IDS VARCHAR2(500);
```

**なぜダメか：**
- `WFS_M_USR_GRP_DEPDTL` をSELECTすれば同じ情報が取得できる
- TALONバージョンアップ時に影響が出るリスクがある
- TALON標準テーブルへの変更は最小限にとどめる原則に反する

### NG③ WFS権限管理のために統合メンテ画面を大規模新規構築する

**なぜダメか：**
- WFSユーザーグループメンテナンス画面（`WFS_M010`）が既に存在する
- 既存画面の改良で十分対応できる
- 新規構築は車輪の再発明になる

### NG④ 操作とユーザー起点・照会をグループ起点にする（逆パターン）

```
❌ ユーザーを選んでグループを紐づける（操作）
✅ グループを選んでユーザーを追加・削除する（操作）

❌ グループを選んでメンバーを確認する（照会）
✅ ユーザーを選んで所属グループを確認する（照会）
```

**なぜダメか：**
- WFSはグループ起点の設計。操作もグループ起点が自然
- 照会は「この人はどの権限を持っているか」という運用ニーズに合わせる

### NG⑤ ROLE_CD（TALONログイン権限）とWFSグループを混同した設計

```
❌ TLN_M_USER.GROUP_ID をもとにWFSグループを自動マッピングする
```

**なぜダメか：**
- TALONログイン権限（GROUP_ID）とWFS承認権限（WFS_GROUP_ID）は別物
- 「メニューが見える権限」と「ワークフローを承認できる権限」は独立している
- 混同すると、メニュー権限を変えると承認権限も変わるという意図しない挙動になる

---

## 4. 正しい設計の判断フロー

```
WFSユーザー管理で何か作りたくなったら、まず確認する：

Q1: WFS_M_USR_GRP_HED/DTL/DEPDTL で対応できないか？
  → できる場合がほとんど。まずここを疑う。

Q2: ユーザーの所属グループを確認したいだけか？
  → DEPDTL を USER_ID で引くだけ。新規テーブル不要。

Q3: 新規テーブルを作りたくなったら？
  → 既存3テーブルで対応できない理由を明確にしてから検討する。
  → 「管理しやすい」だけでは理由にならない。

Q4: TALONユーザーマスタ（TLN_M_USER）を変更したくなったら？
  → TALON標準テーブルへの変更は原則NG。
  → 同じ情報をWFSテーブルから引けないか先に確認する。
```

---

## 5. グループ設計の基本方針（確定）

| 項目 | 内容 |
|---|---|
| 命名規則 | `役職_WF種別`（例：課長_稟議） |
| グループ総数上限 | 50（`WFS_M_USR_GRP_HED` レコード数で制御） |
| 1ユーザー所属上限 | 10グループ（グループメンテ確定時にカウントチェック） |
| 複数グループ所属 | 認める |
| 操作画面の起点 | グループ起点（グループにユーザーを追加・削除） |
| 照会画面の起点 | ユーザー起点（ユーザーの所属グループ一覧を表示） |
| TALONユーザーマスタ変更 | 行わない |
| 新規テーブル | 作らない |

---

## 6. 変更予約テーブル（WFS_CHANGE_RESERVE）

### 新規テーブルが正当化される唯一のケース

WFSの既存テーブル（DTL/DEPDTL）は「現在有効な構成」しか管理できない。
**変更予約（例：4月1日付で田中さんを課長_稟議に追加）**という概念は
既存テーブルでは表現できないため、予約専用テーブルを新設する。

```
WFS_M_USR_GRP_DTL  → 現在有効な構成のみ（日付概念なし）
WFS_CHANGE_RESERVE → 将来の変更予約を保持（新設・正当化済み）
```

### DDL

```sql
CREATE TABLE WFS_CHANGE_RESERVE (
  RESERVE_ID     VARCHAR2(20)   NOT NULL,  -- 予約ID（採番）
  WFS_GROUP_ID   VARCHAR2(50)   NOT NULL,  -- 対象グループID
  USER_ID        VARCHAR2(50)   NOT NULL,  -- 対象ユーザーID
  CHANGE_TYPE    CHAR(1)        NOT NULL,  -- A=追加 D=削除
  VALID_FROM     DATE           NOT NULL,  -- 有効開始日（この日の朝に適用）
  APPLIED_FLG    CHAR(1)        DEFAULT '0' NOT NULL,
                                           -- 0=未適用 1=適用済 9=取消
  REG_USER_ID    VARCHAR2(50),             -- 登録者ID
  REG_DATE       DATE           DEFAULT SYSDATE NOT NULL,
  UPD_DATE       DATE           DEFAULT SYSDATE NOT NULL,
  CONSTRAINT PK_WFS_CHANGE_RESERVE PRIMARY KEY (RESERVE_ID)
);

-- インデックス（バッチ抽出用）
CREATE INDEX IDX_WFS_RESERVE_DATE
  ON WFS_CHANGE_RESERVE (VALID_FROM, APPLIED_FLG);
```

### APPLIED_FLG の状態遷移

```
0（未適用）
  ↓ VALID_FROM当日の日次バッチ実行
1（適用済）  ← 正常完了
9（取消）    ← 予約取消操作（VALID_FROM前のみ可能）
```

### 日次バッチのロジック（Nashorn JS / TALON）

```javascript
// 当日適用対象の予約を取得
var reserves = TALON.selectList(
  "SELECT RESERVE_ID, WFS_GROUP_ID, USER_ID, CHANGE_TYPE " +
  "FROM WFS_CHANGE_RESERVE " +
  "WHERE VALID_FROM <= TRUNC(SYSDATE) " +
  "  AND APPLIED_FLG = '0' " +
  "ORDER BY VALID_FROM, RESERVE_ID"
);

for (var i = 0; i < reserves.length; i++) {
  var r = reserves[i];

  if (r.CHANGE_TYPE === 'A') {
    // 追加：DTLにINSERT（重複チェックあり）
    var exists = TALON.getCount(
      "SELECT COUNT(*) FROM WFS_M_USR_GRP_DTL " +
      "WHERE WFS_GROUP_ID = '" + r.WFS_GROUP_ID + "' " +
      "  AND ID = '" + r.USER_ID + "'"
    );
    if (exists === 0) {
      var row = {WFS_GROUP_ID: r.WFS_GROUP_ID, ID: r.USER_ID, USR_GRP_KBN: '1'};
      TALON.insertByMapEx("WFS_M_USR_GRP_DTL", row);
    }
  } else if (r.CHANGE_TYPE === 'D') {
    // 削除：DTLからDELETE
    TALON.updateBySQL(
      "DELETE FROM WFS_M_USR_GRP_DTL " +
      "WHERE WFS_GROUP_ID = '" + r.WFS_GROUP_ID + "' " +
      "  AND ID = '" + r.USER_ID + "'"
    );
  }

  // 予約を適用済に更新
  TALON.updateBySQL(
    "UPDATE WFS_CHANGE_RESERVE " +
    "SET APPLIED_FLG = '1', UPD_DATE = SYSDATE " +
    "WHERE RESERVE_ID = '" + r.RESERVE_ID + "'"
  );
}

// DEPDTL を全件再展開（TALONの標準バッチを呼び出す）
// ※ WFSのグループ展開バッチ機能IDを指定して実行
```

### 予約照会 SQL（未適用の予約一覧）

```sql
SELECT
    R.RESERVE_ID,
    R.WFS_GROUP_ID,
    H.WFS_GROUP_NM,
    R.USER_ID,
    U.USER_NM,
    CASE R.CHANGE_TYPE WHEN 'A' THEN '追加' WHEN 'D' THEN '削除' END AS CHANGE_TYPE_NM,
    R.VALID_FROM,
    R.REG_USER_ID,
    R.REG_DATE
FROM WFS_CHANGE_RESERVE R
INNER JOIN WFS_M_USR_GRP_HED H ON R.WFS_GROUP_ID = H.WFS_GROUP_ID
INNER JOIN TLN_M_USER       U ON R.USER_ID       = U.USER_ID
WHERE R.APPLIED_FLG = '0'
ORDER BY R.VALID_FROM, R.WFS_GROUP_ID;
```

### 制約・注意事項

- `VALID_FROM` 当日以降の予約は取消不可（APPLIED_FLG=9への更新を画面でブロック）
- 同一ユーザー・同一グループに矛盾する予約（追加と削除が同日）が入らないよう
  画面側でバリデーションする
- バッチ失敗時は `APPLIED_FLG` が 0 のまま残るため、翌日バッチで再実行される
  （冪等性を持たせること：重複チェックをINSERT前に必ず行う）

### 判断フローへの追記

```
Q5: 変更予約（有効開始日付き）が必要か？
  YES → WFS_CHANGE_RESERVE を使う（新規テーブルが正当化される唯一のケース）
  NO  → WFSグループメンテ画面で即時変更で十分
```
