# ciiu-co

The complete Colombian **CIIU Rev. 4 A.C.** classification (Clasificador Único Industrial) as a tiny, dependency-free data package:

- `ciiuDict` — flat `Record<string, string>` mapping all **502 oficial clase codes** to their Spanish descriptions
- `ciiuTree` — the full hierarchy: **section (A–U) → división → grupo → clase**
- `isCiiuCode(code)` — guard for valid 4-digit clase codes

## Install

```bash
pnpm add ciiu-co
```

## Usage

```ts
import { ciiuDict, ciiuTree, isCiiuCode, type CiiuNode } from "ciiu-co";

ciiuDict["0111"]; // "Cultivo de cereales (excepto arroz), legumbres y semillas oleaginosas"
isCiiuCode("4690"); // true — one of the 10 clases missing from DANE's hierarchy service
```

## Data provenance

This package is the canonical, versioned artifact of Colombia's official **CIIU Rev. 4 A.C.** classification, curated by the [ciiu.co](https://ciiu.co) project and validated against DANE's (the national statistics agency) authoritative `clase_service` records.

Why not consume DANE's services directly: their hierarchy and group endpoints are **missing 10 official clases** (`3290`, `3320`, `3520`, `3530`, `3900`, `4690`, `8521`, `8522`, `8523`, `8560`), contain a duplicated division in section P, and a stray code under group `422` — so their tree yields an incomplete, incorrect classification. This dataset corrects all of those against DANE's authoritative clase records, and `npm run check` enforces its integrity (502 entries, set-equal leaves, matching descriptions, sections A–U).

Note: codes like `0010`/`0020` (asalariados/pensionados) used internally by RUES registry data are **not** official CIIU clases and are intentionally excluded.

## Updating the data

The JSON files in this repo are the canonical artifact — edit them directly (e.g. to adopt a new CIIU revision), then:

```bash
npm run check # asserts dict/tree integrity and lexicographic key order
git commit -am "fix(data): …"
npm version patch
npm publish
```

## Related

- [ciiu.co](https://ciiu.co) — the project that curates this dataset
- [ciiu-arl](https://www.npmjs.com/package/ciiu-arl) — companion package with ARL occupational risk levels per CIIU code

## License

ISC. The underlying classification data is published by DANE (Colombia's national statistics agency) as official public information.
