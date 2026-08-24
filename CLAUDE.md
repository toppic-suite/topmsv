# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run build:client        # tsc (viewer lib -> public/js/common) + tsc -p tsconfig.home.json (home page -> public/js)
npm run typecheck:server    # tsc --project tsconfig.server.json (noEmit)
npm start                   # ts-node server.ts -> http://localhost:3000
DATA_DIR=/path PORT=8080 npm start
npm run convert -- --sqlite f.sqlite --prsm p.xml --proteoform q.xml [--fasta db.fasta] --out outdir
```

`public/js/common/` and `public/js/home.js` are gitignored — `build:client` is
**required after a fresh clone** and after edits under `src/common/` or
`src/client/`. Server code runs via ts-node (no emit). Node >= 24 required
(`node:sqlite`). There is no test suite; verification = the converter
validation loop below plus loading pages in a browser.

## What this app is

A web tool for visualizing TopFD (spectral deconvolution) + TopPIC (database
search) output. Users upload a TopFD `.sqlite`, the TopPIC prsm/proteoform
XMLs, and optionally the search FASTA. The server converts them into the
`data_js` file trees that the vendored TopMSV viewer consumes, then serves the
viewer per dataset.

### URL / data flow

```
/                          public/index.html + public/js/home.js (from src/client/home.ts)
/api/datasets              upload (multer) -> data/<id>/ -> ensureIndexes + convertDataset
/d/<id>/topmsv/...         static viewer (public/topmsv, shared by all datasets)
/d/<id>/toppic_*_cutoff/data_js/...   generated files from data/<id>/...
/d/<id>/topfd/ms{1,2}_json/spectrum<N>.js  generated ON THE FLY from sqlite (src/server/spectrumJs.ts)
/d/<id>/spectra.html + /d/<id>/api/*  raw-spectra browser + its sqlite JSON API
```

The topmsv viewer's own relative paths (`../../toppic_prsm_cutoff/data_js`,
`../../topfd/ms1_json/`, `../data/` prefix that cancels out) resolve correctly
under `/d/<id>/topmsv/` — that is the whole mounting trick; do not "fix" those
paths in the viewer.

### The converter (src/server/convert/) — a port of TopPIC's own generator

Ported from toppic-suite (`src/visual/*`, `src/prsm/*`, `src/ms/*`; clone it
again if you need to consult the C++). Key invariants, all validated against
`ref_html/st_1_html/toppic_prsm_cutoff/data_js` byte-for-byte:

- **Coordinates**: XML `mass_shift` break-point positions are proteoform-region-local
  (add `start_pos` for protein coordinates used in `data_js`).
- **Residue/ion masses**: exact values from toppic-suite base data
  (`constants.ts`); Fixed + Protein-variable alterations fold into residue
  masses, Unexpected + Variable become SeqSegment boundaries (no theo peaks
  strictly inside a shift interval; segment n/c shifts accumulate).
- **Matching** (annotate.ts): extend peaks = mass (+-1.00235 only if mass > 5000),
  filtered to [50, adjusted_prec_mass-50], sorted by mass; tolerance =
  max(0.01, 10ppm x base mass); pairing is TopPIC's greedy two-pointer
  `findPairs`/`increaseIJ` — NOT exhaustive matching; reproducing its
  skip behavior is what makes the matched sets identical.
- **Values**: deconv masses rounded to 6 decimals, intensities to 2 (msalign
  precision); e/p-values recomputed from `extreme_value` components
  (`one_protein_probability * test_number * adjust_factor`), never taken from
  the XML's rounded `e_value` element.
- **Serialization** (builder.ts + format.ts): C++ formatting ports
  (`toString(double)` = sci-10dp when |v|<1 else fixed-10dp, 2-digit
  exponents; `evalueToString`; `fixedToString`), exact field order from the
  C++ writers, and xml2json's collapse convention (one-element list -> object,
  empty element -> null). The viewer's `parse_util.js` DEPENDS on the collapse
  (its `.length > 1` check breaks on 1-element arrays) — always keep it.
- **proteoform_cutoff tree** = prsm-XML records filtered to clusters present in
  the proteoform XML (TopPIC generates it from the full PrSM set, not from the
  54-record proteoform file).

Known, accepted divergences from TopPIC output: envelope pairs with near-tied
EnvCNN scores can be numbered/ordered differently (msalign order isn't stored
in the sqlite), and a handful of ppm values differ by ±0.01 (sqlite stores the
theoretical envelope mass, msalign stored the experimental one). Both verified
semantically equivalent with a normalizing comparator.

### Validation loop (use it after touching the converter)

1. Build a synthetic FASTA from the reference residue arrays (script pattern:
   read `ref_html/.../prsms/prsmN.js`, join `annotation.residue[].acid`).
2. `npm run convert` against `ref_data/` with that FASTA.
3. `diff -rq` against `ref_html/st_1_html/toppic_prsm_cutoff/data_js`
   (expect ~128/236 byte-identical) and run a semantic comparator that
   treats peak lists as value-sets with peak ids remapped.

### Viewer specifics (public/topmsv, public/js)

- `public/topmsv/` is the TopMSV viewer TopPIC ships with its HTML output
  (script-tag globals, no modules, load order in HTML matters; `.ts` sources
  sit next to committed compiled `.js` — the `.js` is what runs). Local
  patches: removed TopMG cards, fixed `ms.html`'s `common/types/` -> `common/util/`
  paths, removed the Chrome-only alert, added the missing `folder` param in
  `proteoform.js`'s single-PrSM link, added Raw Spectra / Home nav links.
  Vendored libraries live in `public/topmsv/node_modules` (committed).
- `public/js` + `public/spectra.html` are the raw-spectra browser (from the
  reference Express viewer): `api.js` uses dataset-relative `api/...` URLs and
  auto-loads (no file picker); `viewer.js`'s open flow runs as an IIFE on load.
- `src/common/` is the shared TypeScript visualization library compiled by the
  root `tsconfig.json` (include is `./src/common/*/*` — exactly one directory
  level; deeper files are silently not compiled).

## Reference material (untracked, gitignored)

`ref_code/` (original Express viewer with its own CLAUDE.md), `ref_data/`
(example inputs: st_1.sqlite 103MB + TopPIC XMLs), `ref_html/st_1_html/`
(TopPIC's actual HTML output = ground truth for the converter; `topfd/` alone
has thousands of files — scope searches). `sqlite3` CLI is not installed;
inspect `.sqlite` files with `node:sqlite`.
