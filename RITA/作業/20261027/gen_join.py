"""Extract real join relations from TLN_M_GENERAL_FUNC_SQL.BODY_SQL (fetched as s0*.csv) and cross-check inferred relations.
Output contains table/column pairs only (no SQL text, no data).  usage: python gen_join.py <results_dir> <out_dir>"""
import csv
import glob
import re
import runpy
import sys
from collections import defaultdict

res_dir, out_dir = sys.argv[1], sys.argv[2]
here = __file__.rsplit("\\", 1)[0].rsplit("/", 1)[0]
g = runpy.run_path(f"{here}/gen_er.py".replace("\\", "/"), run_name="gen_er")  # reuse tables/main/pk/relations
tables, main, pk, relations = g["tables"], g["main"], g["pk"], g["relations"]
family, eid, counts = g["family"], g["eid"], g["counts"]
excluded = set(tables) - set(main)

csv.field_size_limit(10**9)
sqls = []
for fn in sorted(glob.glob(f"{res_dir}/s0*.csv")):
    with open(fn, encoding="utf-8-sig", newline="") as f:
        sqls += [(r["FUNC_ID"], r["FUNC_SEQ"], r["BODY_SQL"]) for r in csv.DictReader(f)]

names = {t.upper(): t for t in tables}
alt = "|".join(re.escape(n) for n in sorted(names, key=len, reverse=True))
TBL = re.compile(r"(?<![\w.])(?:dbo\.)?(" + alt + r")(?!\w)(?:\s+(?:AS\s+)?([A-Za-z_]\w*))?", re.I)
RESERVED = set("WHERE INNER LEFT RIGHT OUTER FULL CROSS JOIN ON GROUP ORDER HAVING UNION SET WITH AS AND OR SELECT FROM UPDATE WHEN THEN ELSE END FOR OPTION WHERE_ ".split())
EQ = re.compile(r"([A-Za-z_]\w*)\.([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\.([A-Za-z_]\w*)")


def clean(s):
    s = re.sub(r"/\*.*?\*/", " ", s, flags=re.S)
    s = re.sub(r"--[^\n]*", " ", s)
    s = re.sub(r"'(?:[^']|'')*'", "''", s)
    return s.replace("[", "").replace("]", "")


edges = defaultdict(lambda: {"funcs": set(), "sqls": 0})  # (tA,tB) -> {(cA,cB): ...}
pair_cols = defaultdict(lambda: defaultdict(lambda: {"funcs": set(), "sqls": 0}))
for fid, seq, body in sqls:
    s = clean(body)
    alias = defaultdict(set)
    for m in TBL.finditer(s):
        if not re.search(r"(FROM|JOIN|,)\s*$", s[max(0, m.start() - 20):m.start()], re.I):
            continue
        t = names[m.group(1).upper()]
        alias[t.upper()].add(t)
        a = m.group(2)
        if a and a.upper() not in RESERVED:
            alias[a.upper()].add(t)
    seen = set()
    for a1, c1, a2, c2 in EQ.findall(s):
        t1s, t2s = alias.get(a1.upper(), ()), alias.get(a2.upper(), ())
        if len(t1s) != 1 or len(t2s) != 1:
            continue
        t1, t2 = next(iter(t1s)), next(iter(t2s))
        if t1 == t2:
            continue
        c1, c2 = c1.upper(), c2.upper()
        if t1 > t2:
            t1, c1, t2, c2 = t2, c2, t1, c1
        key = ((t1, t2), (c1, c2))
        if key in seen:
            continue
        seen.add(key)
        d = pair_cols[(t1, t2)][(c1, c2)]
        d["funcs"].add(fid)
        d["sqls"] += 1

# ---- aggregate per table pair ----
pairs = {}
for (t1, t2), cc in pair_cols.items():
    funcs = set().union(*(v["funcs"] for v in cc.values()))
    pairs[(t1, t2)] = {"cols": {k: len(v["funcs"]) for k, v in cc.items()}, "funcs": len(funcs)}


def colsets(a, b):
    """join columns seen between a and b, oriented as (a_col, b_col)."""
    key = (a, b) if a < b else (b, a)
    if key not in pairs:
        return None
    out = {}
    for (c1, c2), n in pairs[key]["cols"].items():
        out[(c1, c2) if a < b else (c2, c1)] = n
    return out


def verdict(a, b, p):
    cs = colsets(a, b)
    if cs is None:
        return "SQL実績なし", 0
    acols = {x for x, _ in cs}
    n = pairs[(a, b) if a < b else (b, a)]["funcs"]
    pu = {x.upper() for x in p.split(",")}
    if pu <= acols:
        return "全キーで結合(裏づけ)", n
    if pu & acols:
        return "一部キーで結合", n
    return "別の列で結合", n


# ---- cross-check inferred relations ----
rows = []
for a, b, p, k in relations:
    if a in excluded or b in excluded:
        continue
    v, n = verdict(a, b, p)
    rows.append((a, b, p, k, v, n))
inferred_pairs = {(min(a, b), max(a, b)) for a, b, *_ in rows}
summ = defaultdict(lambda: defaultdict(int))
for a, b, p, k, v, n in rows:
    summ[k][v] += 1

# ---- SQL-only relations (not inferred) among main tables ----
added = []
for (t1, t2), d in pairs.items():
    if t1 in excluded or t2 in excluded or (t1, t2) in inferred_pairs:
        continue
    cs = ", ".join(f"{t1}.{c1}={t2}.{c2}({n})" for (c1, c2), n in sorted(d["cols"].items(), key=lambda x: -x[1]))
    added.append((t1, t2, cs, d["funcs"]))
added.sort(key=lambda x: -x[3])

with open(f"{out_dir}/実結合関係.md", "w", encoding="utf-8") as f:
    f.write("# SQL定義から抽出した実結合関係\n\n")
    f.write(f"- 出典: `TLN_M_GENERAL_FUNC_SQL.BODY_SQL` {len(sqls)}件(機能ID {len({s[0] for s in sqls})}件)のJOIN/WHERE等値条件を機械解析\n")
    f.write("- 解析方法: `別名.列 = 別名.列` の等値のみ(別名解決できないもの・サブクエリ内の別名衝突は除外)。UNION等は未精査\n")
    f.write(f"- 抽出できたテーブルペア: {len(pairs)}(うち主要テーブル同士 {sum(1 for (a, b) in pairs if a not in excluded and b not in excluded)})\n\n")
    f.write("## 推定関係の裏づけ結果\n\n| 推定種別 | 全キーで結合(裏づけ) | 一部キーで結合 | 別の列で結合 | SQL実績なし |\n|---|---|---|---|---|\n")
    for k in ("multi-col", "single-col", "same-PK"):
        s = summ[k]
        f.write(f"| {k} | {s['全キーで結合(裏づけ)']} | {s['一部キーで結合']} | {s['別の列で結合']} | {s['SQL実績なし']} |\n")
    f.write("\n## 裏づけられた関係(全キーで結合、機能数順)\n\n| 親(PK保持) | 子 | 結合列 | 推定種別 | 使用機能数 |\n|---|---|---|---|---|\n")
    for a, b, p, k, v, n in sorted(rows, key=lambda r: -r[5]):
        if v.startswith("全キー"):
            f.write(f"| {a} | {b} | {p} | {k} | {n} |\n")
    f.write("\n## SQLで結合されているが、推定に無かった関係(追加候補、機能数順)\n\n")
    f.write("括弧内は、その列対で結合している機能数。PKが一致しない結合(コード値・名称での参照など)を含む。\n\n| テーブルA | テーブルB | 結合列(機能数) | 使用機能数 |\n|---|---|---|---|\n")
    for t1, t2, cs, n in added:
        f.write(f"| {t1} | {t2} | {cs} | {n} |\n")

# ---- reinforced Mermaid ER ----
verd = {(a, b): (v, n) for a, b, p, k, v, n in rows}
fams = defaultdict(list)
cross = []
for a, b, p, k, v, n in rows:
    if k != "multi-col" and not v.startswith("全キー"):
        continue
    ok = v.startswith("全キー")
    item = (a, b, p, ok, n)
    (fams[family(a)] if family(a) == family(b) else cross).append(item)
for t1, t2, cs, n in added:
    if n < 2:
        continue
    # orient parent = table whose PK is fully covered by its join columns
    cc = colsets(t1, t2)
    cov1 = bool(pk[t1]) and {x.upper() for x in pk[t1]} <= {x for x, _ in cc}
    cov2 = bool(pk[t2]) and {x.upper() for x in pk[t2]} <= {y for _, y in cc}
    a, b = (t1, t2) if cov1 or not cov2 else (t2, t1)
    cols = "+".join(sorted({x for x, _ in cc})) if a == t1 else "+".join(sorted({y for _, y in cc}))
    item = (a, b, cols, "sql-only", n)
    (fams[family(a)] if family(a) == family(b) else cross).append(item)

fk = defaultdict(set)
for lst in list(fams.values()) + [cross]:
    for a, b, p, ok, n in lst:
        fk[b].update(p.split(",") if "+" not in p else p.split("+"))


def entity(t):
    out = [f"    {eid(t)} {{"]
    for c in tables[t]:
        isfk = c["name"].upper() in {x.upper() for x in fk[t]}
        if c["pk"] or isfk:
            key = "PK,FK" if c["pk"] and isfk else ("PK" if c["pk"] else "FK")
            out.append(f"        {re.sub(r'[(].*[)]', '', c['type'])} {eid(c['name'])} {key}")
    out.append("    }")
    return "\n".join(out)


def edge(a, b, p, ok, n):
    lab = p.replace(",", "+")
    if ok == "sql-only":
        return f'    {eid(a)} }}o--o{{ {eid(b)} : "{lab} [SQL:{n}]"'
    if ok:
        return f'    {eid(a)} ||--o{{ {eid(b)} : "{lab} [SQL:{n}]"'
    return f'    {eid(a)} ||..o{{ {eid(b)} : "{lab}"'


with open(f"{out_dir}/ER図_実結合補強.md", "w", encoding="utf-8") as f:
    f.write("# TALON DB ER図(SQL定義で裏づけ・補強)\n\n")
    f.write("- 実線 `||--o{`: 推定関係のうち、アプリのSQLで全キー結合が確認できたもの。ラベルの `[SQL:n]` は使用機能数\n")
    f.write("- 点線 `||..o{`: 複合PK一致の推定のみ(SQL実績なし)。実際には未使用の可能性がある\n")
    f.write("- 実線 `}o--o{`: SQLでは結合されているが、PK一致の推定に無かった関係(使用機能2以上のみ)。親子の向きは不明\n")
    f.write("- 属性は PK と関係に使うFK列のみ。全列は `テーブル定義.md` を参照\n\n")
    f.write("| 系統 | 関係数 | うちSQL確認 | テーブル数 |\n|---|---|---|---|\n")
    for name in sorted(fams):
        ts = {x for a, b, *_ in fams[name] for x in (a, b)}
        f.write(f"| {name} | {len(fams[name])} | {sum(1 for i in fams[name] if i[3])} | {len(ts)} |\n")
    f.write(f"| (系統間) | {len(cross)} | {sum(1 for i in cross if i[3])} | - |\n\n")
    for name in sorted(fams):
        ts = sorted({x for a, b, *_ in fams[name] for x in (a, b)})
        f.write(f"## {name}\n\n```mermaid\nerDiagram\n")
        for it in fams[name]:
            f.write(edge(*it) + "\n")
        for t in ts:
            f.write(entity(t) + "\n")
        f.write("```\n\n")
    f.write("## 系統間の関係\n\n| 親 | 子 | 結合列 | 状態 | 使用機能数 |\n|---|---|---|---|---|\n")
    for a, b, p, ok, n in cross:
        st = "SQL確認" if ok is True else ("SQLのみ" if ok == "sql-only" else "推定のみ")
        f.write(f"| {a} | {b} | {p} | {st} | {n} |\n")

print("sqls", len(sqls), "pairs", len(pairs), "added_all", len(added), "added>=2", sum(1 for x in added if x[3] >= 2))
print({k: dict(v) for k, v in summ.items()})
print("fams", {k: (len(v), sum(1 for i in v if i[3])) for k, v in fams.items()}, "cross", len(cross))
