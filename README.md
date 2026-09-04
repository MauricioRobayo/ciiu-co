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

Generated from the static JSON endpoints of [ciiu.co](https://ciiu.co) ([`/api/ciiu-dict.json`](https://ciiu.co/api/ciiu-dict.json), [`/api/ciiu-tree.json`](https://ciiu.co/api/ciiu-tree.json)), which are in turn derived from DANE's official CIIU Rev. 4 A.C. publications.

Why not crawl DANE directly: their hierarchy and group services are **missing 10 official clases** (`3290`, `3320`, `3520`, `3530`, `3900`, `4690`, `8521`, `8522`, `8523`, `8560`), have a duplicated division in section P, and a stray code under group `422`. ciiu.co's tree is patched for all of these, and `npm run build` asserts the fetched dict and tree are mutually consistent (502 entries, set-equal leaves, matching descriptions, sections A–U) before writing anything.

Note: codes like `0010`/`0020` (asalariados/pensionados) used internally by RUES registry data are **not** official CIIU clases and are intentionally excluded.

## Updating the data

```bash
npm run build # fetches from https://www.ciiu.co/api (override with CIIU_BASE_URL)
git diff      # review changes
git commit -am "chore: refresh data"
npm version patch
npm publish
```

## Related

- [ciiu.co](https://ciiu.co) — the site / data source
- [ciiu-arl](https://www.npmjs.com/package/ciiu-arl) — companion package with ARL occupational risk levels per CIIU code

## License

ISC. The underlying classification data is published by DANE (Colombia's national statistics agency) as official public information.
