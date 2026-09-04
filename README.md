# ciiu-co

The complete Colombian **CIIU Rev. 4 A.C.** classification (Clasificador Único Industrial) plus its **ARL occupational risk classification** — a tiny, dependency-free data package:

- `ciiuDict` — flat `Record<string, string>` mapping all **502 oficial clase codes** to their Spanish descriptions
- `ciiuTree` — the full hierarchy: **section (A–U) → división → grupo → clase**
- `isCiiuCode(code)` — guard for valid 4-digit clase codes
- `riskClassification` — all rows of the Decreto 768 de 2022 table: risk class (1–5) per CIIU code and economic activity
- `getRiskClassification(ciiu)` — risk rows for a given clase code
- Types: `CiiuNode`, `RiskClassification`

## Install

```bash
pnpm add ciiu-co
```

## Usage

```ts
import {
  ciiuDict,
  ciiuTree,
  isCiiuCode,
  riskClassification,
  getRiskClassification,
  type CiiuNode,
  type RiskClassification,
} from "ciiu-co";

ciiuDict["0111"]; // "Cultivo de cereales (excepto arroz), legumbres y semillas oleaginosas"
isCiiuCode("4690"); // true — one of the 10 clases missing from DANE's hierarchy service

getRiskClassification("0111");
// [{ risk: "2", ciiu: "0111", code: "01", description: "Cultivo de cereales …" }, …]
```

### Tree shaking & subpath imports

The package is marked `sideEffects: false`, so bundlers (webpack, Turbopack, Rollup, esbuild) drop datasets you don't use: `import { ciiuDict } from "ciiu-co"` ships only the dict (~35 KB), not the tree or the risk table.

For client bundles that want a dataset without relying on tree shaking — or for plain-Node servers avoiding the root entry's other datasets — each dataset has its own entry:

```ts
import { ciiuDict, isCiiuCode } from "ciiu-co/dict";
import { ciiuTree, type CiiuNode } from "ciiu-co/tree";
import { getRiskClassification, type RiskClassification } from "ciiu-co/arl"; // risk table is the largest payload (~480 KB)
```

The raw JSON files are also exported as deep imports:

```ts
import ciiuDict from "ciiu-co/ciiu-dict.json" with { type: "json" };
```

Available subpaths: `./dict`, `./tree`, `./arl`, `./ciiu-dict.json`, `./ciiu-tree.json`, `./risk-classification.json`.

## Data provenance

This package is the canonical, versioned artifact of Colombia's official **CIIU Rev. 4 A.C.** classification, curated by the [ciiu.co](https://ciiu.co) project and validated against DANE's (the national statistics agency) authoritative `clase_service` records.

Why not consume DANE's services directly: their hierarchy and group endpoints are **missing 10 official clases** (`3290`, `3320`, `3520`, `3530`, `3900`, `4690`, `8521`, `8522`, `8523`, `8560`), contain a duplicated division in section P, and a stray code under group `422` — so their tree yields an incomplete, incorrect classification. This dataset corrects all of those against DANE's authoritative clase records, and `npm run check` enforces its integrity (502 entries, set-equal leaves, matching descriptions, sections A–U).

Note: codes like `0010`/`0020` (asalariados/pensionados) used internally by RUES registry data are **not** official CIIU clases and are intentionally excluded.

### Risk classification (Decreto 768 de 2022)

`risk-classification.json` derives from the table published in **Decreto 768 de 2022** (occupational risk levels by economic activity), scraped from [safetya.co](https://safetya.co/normatividad/decreto-768-de-2022/). The pristine scrape is kept at `data/raw/risk-classification.scrape.json`; the shipped file applies these corrections, each tagged with `decreeCiiu` so provenance stays traceable:

- **`6514` → `6496`**: the decree table lists Capitalización under a legacy code; DANE's official CIIU Rev. 4 A.C. assigns it to clase `6496` (`6514` does not exist).
- **Group-level codes expanded**: the decree classifies some activities at grupo level (`1030`, `3210`, `7110`, `8890`); each row is expanded to its member official clases (`1031`–`1033`, `3211`/`3212`, `7111`/`7112`, `8891`/`8899`).

498 of the 502 clases are covered. Four are absent from the decree table itself (verified against the full published table): `6515` (Seguros de salud), `6523` (Servicios de seguros sociales en riesgos familia), `9810` and `9820` (hogares) — for these, `getRiskClassification` returns `[]`.

`npm run check` cross-validates the risk dataset against the dictionary: every row's `ciiu` must be an official clase, coverage must match the documented exception set, and rows must stay sorted and deduplicated.

## Updating the data

The JSON files in this repo are the canonical artifact — edit them directly (e.g. to adopt a new CIIU revision or a decree update), then:

```bash
npm run check # asserts dict/tree/risk integrity and lexicographic key order
git commit -am "fix(data): …"
npm version patch
npm publish
```

## Related

- [ciiu.co](https://ciiu.co) — the project that curates this dataset
- [ciiu-arl](https://www.npmjs.com/package/ciiu-arl) — the former standalone risk package, merged into ciiu-co v1.1.0 and deprecated

## License

ISC. The underlying classification data is published by DANE (Colombia's national statistics agency) as official public information.
