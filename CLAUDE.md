# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run build:client        # 5 tsc passes: spectra lib (+.d.ts) -> js/common | viewer lib variants (tsconfig.viewer.json)
                            # | spectra pages (tsconfig.spectra.json, src/spectra -> public/common/js) | viewer pages
                            # (tsconfig.viewerpages.json, src/viewer -> public/topmsv/{visual,inspect}/js) | home page
npm run typecheck:server    # tsc --project tsconfig.server.json (noEmit)
npm start                   # ts-node server.ts -> http://localhost:3000
DATA_DIR=/path PORT=8080 npm start
npm run convert -- --sqlite f.sqlite --prsm p.xml --proteoform q.xml [--fasta db.fasta] --out outdir
```

ALL client JS is generated: `public/common/js/`, `public/topmsv/{visual,inspect}/js/`
and `types/` (library `.d.ts` used by the page-script passes) are gitignored —
after a fresh clone `npm install` and `build:client` are **both required**
(browser libraries are served straight from node_modules, see below); re-run
`build:client` after edits under `src/common/`, `src/spectra/`, `src/viewer/`
or `src/client/`. Server code runs via ts-node (no emit). Node >= 24 required
(`node:sqlite`). There is no test suite; verification = the converter
validation loop below plus loading pages in a browser.

## What this app is

A web tool for visualizing TopFD (spectral deconvolution) + TopPIC (database
search) output. Users upload a TopFD `.sqlite`, the TopPIC prsm/proteoform
XMLs, and optionally the search FASTA. Nothing derived is stored on disk: a
dataset directory holds only the uploaded inputs + `meta.json`; every data
file the vendored TopMSV viewer consumes is generated on the fly.

### URL / data flow

```
/                          public/index.html + public/common/js/home.js (from src/client/home.ts)
/api/datasets              upload (multer) -> data/<id>/ -> ensureIndexes + getDatasetSource
                           (validates + warms the cache; no files are generated;
                           ensureIndexes also switches the sqlite copy to
                           journal_mode=DELETE — TopFD writes WAL, and a stale
                           -shm makes read-only opens fail with SQLITE_CANTOPEN)
/d/<id>/topmsv/...         static viewer (public/topmsv, shared by all datasets)
/d/<id>/toppic_*_cutoff/data_js/*     ALL generated ON THE FLY (src/server/prsmSource.ts:
                                      per-dataset LRU cache of fully assembled PrsmData)
/d/<id>/topfd/ms{1,2}_json/spectrum<N>.js  generated ON THE FLY from sqlite (src/server/spectrumJs.ts)
/d/<id>/spectra.html + /d/<id>/api/*  raw-spectra browser + its sqlite JSON API
/vendor/* and /d/<id>/vendor/*        browser libraries served straight from
                                      node_modules (src/server/vendor.ts)
```

The topmsv viewer's own relative paths (`../../toppic_prsm_cutoff/data_js`,
`../../topfd/ms1_json/`, `../data/` prefix that cancels out) resolve correctly
under `/d/<id>/topmsv/` — that is the whole mounting trick; do not "fix" those
paths in the viewer.

### The converter (src/server/convert/) — a port of TopPIC's own generator

Ported from toppic-suite (`src/visual/*`, `src/prsm/*`, `src/ms/*`; clone
github.com/toppic-suite/toppic-suite if you need to consult the C++). The
payload builders in `builder.ts` are shared by the dynamic endpoints and the
`npm run convert` CLI (which writes static trees purely as the validation
harness) — never let the two drift apart. Key invariants, validated
byte-for-byte against a TopPIC-generated `_html` reference tree:

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
  **Booleans (`exist_n_ion`, `exist_c_ion`, `n_acetylation`) must be written
  as "0"/"1"** — the viewer compares them with `== 0` / `== 1`, and
  "true"/"false" silently breaks the matched-ion annotation in sequence views.
- **proteoform_cutoff tree** = prsm-XML records filtered to clusters present in
  the proteoform XML (TopPIC generates it from the full PrSM set, not from the
  one-per-cluster proteoform file).

Known, accepted divergences from TopPIC output: envelope pairs with near-tied
EnvCNN scores can be numbered/ordered differently (msalign order isn't stored
in the sqlite), and a handful of ppm values differ by ±0.01 (sqlite stores the
theoretical envelope mass, msalign stored the experimental one). Both verified
semantically equivalent with a normalizing comparator. Also: e/p-values and
protein/proteoform cluster ids are **run statistics from the input XML** — a
reference tree generated by a different TopPIC run/version will differ in
them (and in the e-value-sorted orderings they drive) no matter what the
converter does; only compare those against the XML that actually produced
the reference.

### Validation loop (use it after touching the converter)

`ref_data/` has the example inputs; the byte-level ground-truth `_html` tree
was removed from the repo — obtain a TopPIC-generated `*_html` directory for
the same run to re-run this.

1. Build a synthetic FASTA from the reference residue arrays (script pattern:
   read `.../data_js/prsms/prsmN.js`, join `annotation.residue[].acid`).
2. `npm run convert` against the inputs with that FASTA.
3. `diff -rq` against the reference `data_js` trees, then a semantic
   comparator that treats peak lists as value-sets with peak ids remapped
   (and, for a reference from a different TopPIC run, masks p/e-values and
   cluster/protein ids — see above).

Dynamic-endpoint check: CLI output and the served files must stay
byte-identical (`curl` each path, `cmp` against the CLI tree).

### Viewer specifics (public/topmsv, public/common/js)

- `public/topmsv/` is the TopMSV viewer TopPIC ships with its HTML output
  (script-tag globals, no modules, load order in HTML matters). Only the
  HTML is committed: the page scripts under `visual/js` and `inspect/js`
  are compiled from `src/viewer/` (tsconfig.viewerpages.json), and the
  shared library loads from `../../js/common/...` (compiled from
  `src/common`, resolves under both `/` and `/d/<id>/` because both fall
  through to the same `express.static(public)`), nav-bar/common CSS from
  `../../css/`, vendor libs from `../../vendor/...`. Local patches vs
  upstream TopMSV:
  removed TopMG cards, fixed `ms.html`'s `common/types/` -> `common/util/`
  paths, removed the Chrome-only alert, added the missing `folder` param in
  `proteoform.js`'s single-PrSM link, added a Raw Spectra nav link, fixed
  `getBpCoordinates` so the N-terminal cleavage bracket (break point 0) is
  anchored before the first residue (upstream bug), and dropped a dead
  `proteoform/proteoform.js` script tag.
- `public/spectra/spectra.html` + `public/common/js` (generated from `src/spectra/`,
  tsconfig.spectra.json) are the raw-spectra browser (from the reference
  Express viewer): `api.js` uses dataset-relative `api/...` URLs and
  auto-loads (no file picker); `viewer.js`'s open flow runs as an IIFE on
  load. `src/spectra` mixes `.ts` and plain `.js` (allowJs passthrough for
  the files that never had TS sources); `globals.d.ts` declares `$.trim`,
  which current @types/jquery dropped.
- ALL browser libraries (spectra.html and the topmsv viewer) are served
  under `/vendor/*` **straight from node_modules** by `src/server/vendor.ts`
  (a URL-prefix -> node_modules-dir table; nothing is copied under `public/`);
  versions are managed in package.json. Hard ceilings: jquery ^3 ($.trim
  etc. removed in 4), datatables.net ^1 (2.x breaking), `bootstrap4` = npm
  alias for bootstrap@^4 + popper.js ^1 (the viewer markup is Bootstrap 4 —
  spectra.html uses the separate Bootstrap 5 copy at `vendor/bootstrap/`),
  fontawesome ^5 (icon class names). d3 is ^7: all drawing code (src/common
  and the viewer copies under public/topmsv, .ts AND the .js that actually
  runs) was migrated off the v5-only d3.event/d3.mouse globals to the
  v6+ listener signature (`.on("x", function(event, d))`, `d3.pointer`) —
  keep new d3 event handlers in that style.
- `src/common/` is the single source for the shared visualization library
  used by BOTH apps, compiled to `public/common/js/common` in two passes:
  the root `tsconfig.json` (include `./src/common/*/*` — exactly one
  directory level; deeper files are silently not compiled) builds the
  spectra-browser set, and `tsconfig.viewer.json` builds the TopMSV viewer's
  variants of the five deliberately-divergent files from
  `src/common/{spectrum_view,prsm_view}/viewer/` into
  `public/common/js/common/<module>/viewer/` (same global class names — safe only
  because they compile as separate programs and no page loads both sets;
  spectra versions do panel-header hover annotations + base-intensity lines,
  viewer versions do floating tooltips). `allowJs` is on: the untyped
  `parse_json/*.js` and `save_image/{save_image,util}.js` modules pass
  through to the output. `util/viewer_globals.d.ts` declares the page-script
  globals (SeqOfExecution etc.) that `draw_table.ts` and the viewer
  `add_shift.ts` reference.

## Reference material (untracked, gitignored)

`ref_data/` holds example inputs (st_1.sqlite 103MB + TopPIC XMLs) — upload
these on the home page to try the tool. `sqlite3` CLI is not installed;
inspect `.sqlite` files with `node:sqlite`.
