"""Build table-definition / inferred-relation docs from DB bridge result CSVs (structure only, no row data)."""
import csv
import re
import sys
from collections import defaultdict

res_dir, out_dir = sys.argv[1], sys.argv[2]


def read(name):
    with open(f"{res_dir}/{name}.csv", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


counts = {}
for n in ("q002", "q003", "q004"):
    for r in read(n):
        counts[r["table_name"]] = int(r["row_count"])

tables = {}
for n in ("q006", "q007", "q008"):
    for r in read(n):
        cols = []
        for part in r["cols"].split(" | "):
            toks = part.split(" ")
            name, typ = toks[0], toks[1]
            cols.append({"name": name, "type": typ, "nn": "NN" in toks[2:], "pk": "PK" in toks[2:]})
        tables[r["table_name"]] = cols

EXCLUDE = re.compile(
    r"(_\d{6,8}$|_\d{6,8}_|TEST|_BK|BK$|_OLD$|_YY$|_ZSW$|ZSW|_TMP$|TMP$|^SAMPLE_|^sysdiagrams$|_WORK$|^W_|_W_|^W2_|_W2_|_HIST$|^TLN_H_|^TLN_R_|^DUMMY_|^BLOCK\d|^KM\d|_A20\d\d$|\d{8}|_IKO|^IKO_)",
    re.I)
main = sorted(t for t in tables if not EXCLUDE.search(t))
excluded = sorted(set(tables) - set(main))


def group(t):
    m = re.match(r"^([A-Za-z]+)_", t)
    return m.group(1) if m else re.sub(r"\d+$", "", t) or t


GENERIC = {"INS_DT", "INS_USER", "UPD_DT", "UPD_USER", "INSERT_DT", "UPDATE_DT", "DEL_FLG", "ID", "NO", "SEQ", "SEQNO"}
pk = {t: [c["name"] for c in tables[t] if c["pk"]] for t in main}
colset = {t: {c["name"] for c in tables[t]} for t in main}
relations = []
for a in main:
    p = pk[a]
    if not p or any(x.upper() in GENERIC for x in p):
        continue
    for b in main:
        if a == b or not set(p) <= colset[b]:
            continue
        # skip if b is just a sibling sharing the same full PK (history/clone) — keep but mark
        same_pk = set(pk[b]) == set(p)
        relations.append((a, b, ",".join(p), "same-PK" if same_pk else ("multi-col" if len(p) > 1 else "single-col")))

with open(f"{out_dir}/テーブル定義.md", "w", encoding="utf-8") as f:
    f.write("# TALON DB テーブル定義(主要テーブル)\n\n")
    f.write(f"- 取得日: 2026-10-27 / DB: TALON (SQL Server 2019)\n- 全 {len(tables)} テーブル中、主要 {len(main)} テーブルを掲載(バックアップ・テスト・WORK・履歴系は除外)\n")
    f.write("- 構造情報のみ(実データなし)。件数は取得時点の概数。\n- FK制約はDB上に未定義。関係は `関係推定.md` を参照。\n\n")
    by = defaultdict(list)
    for t in main:
        by[group(t)].append(t)
    for g in sorted(by):
        f.write(f"## {g} ({len(by[g])}テーブル)\n\n")
        for t in by[g]:
            f.write(f"### {t}  (概数 {counts.get(t, '?')} 行)\n\n| # | 列名 | 型 | NULL | PK |\n|---|---|---|---|---|\n")
            for i, c in enumerate(tables[t], 1):
                f.write(f"| {i} | {c['name']} | {c['type']} | {'NOT NULL' if c['nn'] else ''} | {'●' if c['pk'] else ''} |\n")
            f.write("\n")

with open(f"{out_dir}/関係推定.md", "w", encoding="utf-8") as f:
    f.write("# テーブル関係の推定(列名ベース)\n\n")
    f.write("FK制約が未定義のため、「Aの主キー列をすべて含むテーブルB」を B→A の参照候補として機械推定したもの。\n")
    f.write("種別: multi-col=複合PKが全一致で信頼度高 / single-col=単一列PKで偶然一致の可能性あり / same-PK=同一PK(明細・履歴・複製の可能性)\n\n")
    f.write("| 親候補(PK保持) | 子候補(列を含む) | 結合列 | 種別 |\n|---|---|---|---|\n")
    for a, b, p, k in relations:
        f.write(f"| {a} | {b} | {p} | {k} |\n")

with open(f"{out_dir}/除外テーブル.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(excluded))

stat = defaultdict(int)
for r in relations:
    stat[r[3]] += 1
print("tables", len(tables), "main", len(main), "excluded", len(excluded))
print("no_pk_main", sum(1 for t in main if not pk[t]))
print("relations", dict(stat))
print("groups", {g: len([t for t in main if group(t) == g]) for g in sorted({group(t) for t in main})})


# ---- Mermaid ER (multi-col relations only), one diagram per family ----
FAMILIES = [
    (r"^NP_", "NP_日報系"), (r"^(SIYO|SHOYOURYO)", "SIYO_仕様書系"), (r"^WFS_", "WFS_ワークフロー系"),
    (r"^RS_", "RS_クレーム異常系"), (r"^SHK_", "SHK_出荷系"), (r"^COM_", "COM_共通系"),
    (r"^TLN_", "TLN_TALON基盤系"), (r"^(KOUTEI|KOTEI)", "KOUTEI_工程系"), (r"^KAKO", "KAKO_加工系"),
]


def family(t):
    for pat, name in FAMILIES:
        if re.match(pat, t):
            return name
    return "OTHER_その他"


def eid(t):
    return re.sub(r"\W", "_", t)


strong = [(a, b, p) for a, b, p, k in relations if k == "multi-col"]
fams = defaultdict(list)
cross = []
for a, b, p in strong:
    (fams[family(a)] if family(a) == family(b) else cross).append((a, b, p))

fkcols = defaultdict(set)
for a, b, p in strong:
    fkcols[b].update(p.split(","))


def entity(t):
    lines = [f"    {eid(t)} {{"]
    shown = set()
    for c in tables[t]:
        isfk = c["name"] in fkcols[t]
        if c["pk"] or isfk:
            key = "PK,FK" if c["pk"] and isfk else ("PK" if c["pk"] else "FK")
            lines.append(f"        {re.sub(r'[(].*[)]', '', c['type'])} {eid(c['name'])} {key}")
            shown.add(c["name"])
    lines.append("    }")
    return "\n".join(lines)


with open(f"{out_dir}/ER図_Mermaid.md", "w", encoding="utf-8") as f:
    f.write("# TALON DB ER図(信頼度の高い関係のみ)\n\n")
    f.write("- 対象: 複合PKが全一致した関係(multi-col)のみ。FK制約はDB未定義のため、列名からの機械推定。\n")
    f.write("- 表記: `親 ||--o{ 子`。属性は PK と、関係に使われる FK 列のみ表示(全列は `テーブル定義.md`)。\n")
    f.write("- 単一列PKの推定(single-col)は偶然一致が多いため、実コードとの突き合わせ後に追加する。\n\n")
    f.write(f"| 系統 | 関係数 | テーブル数 |\n|---|---|---|\n")
    for name in sorted(fams):
        ts = {x for a, b, p in fams[name] for x in (a, b)}
        f.write(f"| {name} | {len(fams[name])} | {len(ts)} |\n")
    f.write(f"| (系統間) | {len(cross)} | - |\n\n")
    for name in sorted(fams):
        ts = sorted({x for a, b, p in fams[name] for x in (a, b)})
        f.write(f"## {name}\n\n```mermaid\nerDiagram\n")
        for a, b, p in fams[name]:
            f.write(f'    {eid(a)} ||--o{{ {eid(b)} : "{p.replace(",", "+")}"\n')
        for t in ts:
            f.write(entity(t) + "\n")
        f.write("```\n\n")
    if cross:
        f.write("## 系統間の関係\n\n| 親(系統) | 子(系統) | 結合列 |\n|---|---|---|\n")
        for a, b, p in cross:
            f.write(f"| {a} ({family(a).split('_')[0]}) | {b} ({family(b).split('_')[0]}) | {p} |\n")
print("ER families", {n: len(v) for n, v in fams.items()}, "cross", len(cross))
