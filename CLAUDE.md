# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run build:client        # clean:client (drops types/lib + every generated js dir) then 5 tsc passes:
                            # shared lib (+.d.ts) -> js/common | spectra pages (tsconfig.spectra.json,
                            # src/spectra -> public/common/js) | viewer pages (tsconfig.viewerpages.json,
                            # src/viewer -> public/topmsv/{visual,inspect}/js) | home page | MS1 3D view
                            # (tsconfig.ms1_3d.json, src/ms1_3d -> public/common/js/ms1_3d, ES modules)
npm run typecheck:server    # tsc --project tsconfig.server.json (noEmit)
npm start                   # ts-node server.ts -> http://localhost:3000
DATA_DIR=/path PORT=8080 npm start
npm start -- --view-only        # hides upload panel + Delete buttons, POST/DELETE /api/datasets -> 403 (src/server/config.ts)
npm run convert -- --sqlite f.sqlite --out outdir
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
search) output. Users upload ONE sqlite file: TopFD writes the spectra
(`ms{1,2}_*` tables) and, in newer versions, the MS1 3D peak tables
(multi-resolution CONFIG + PEAKS<n>); TopPIC appends its identifications
(`prsm`, `prsm_mass_shift`, `proteoform`, `prsm_protein_match`) and the
search database (`fasta_seq`) to the same file. The upload inspects the
tables (`meta.hasIdentifications`, `meta.hasFasta`, `meta.has3d`); a nav
item whose data the file lacks is rendered disabled, and without
identification tables every `data_js` request 404s. The old separate
XML/FASTA uploads are not supported. Nothing derived is stored on disk: a
dataset directory holds only `ms.sqlite` + `meta.json`; every data file the
vendored TopMSV viewer consumes is generated on the fly.

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
/d/<id>/spectra/spectra.html + /d/<id>/api/*  raw-spectra browser + its sqlite JSON API
/d/<id>/ms1_3d/ms1_3d.html + /d/<id>/api/3d/*  MS1 3D view over the sqlite's 3D peak tables
                                      (config | peaks?level&minMz&maxMz&minRt&maxRt&maxPeaks&cutoff | scans)
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
harness) — never let the two drift apart. `toppicSqlite.ts` reads the
identification tables TopPIC writes (`prsm_sql_writer.cpp`): the `prsm`
table is the PrSM-level cutoff set in TSV column layout (`first_residue` /
`last_residue` 1-based, `scans` space-separated, `e_value` as stored, no
p-value), `prsm_mass_shift` holds every shift of those PrSMs with
0-based region-local break points, mass, TopPIC alteration type name and
annotation (PTM abbreviation, or the signed 4-decimal value of an
unexpected shift), `proteoform` (one row per proteoform) defines the
proteoform-level cutoff, and `fasta_seq` gives the full protein sequences.
Protein ids are assigned by first appearance (the tables store names).
Key invariants, validated byte-for-byte against a TopPIC-generated `_html`
reference tree when the inputs were the XML files:

- **Coordinates**: mass-shift break-point positions are proteoform-region-local
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
  precision); the e-value is the sqlite's `e_value`, the p-value is unknown
  (written as "N/A").
- **Serialization** (builder.ts + format.ts): C++ formatting ports
  (`toString(double)` = sci-10dp when |v|<1 else fixed-10dp, 2-digit
  exponents; `evalueToString`; `fixedToString`), exact field order from the
  C++ writers, and xml2json's collapse convention (one-element list -> object,
  empty element -> null). The viewer's `parse_util.js` DEPENDS on the collapse
  (its `.length > 1` check breaks on 1-element arrays) — always keep it.
  **Booleans (`exist_n_ion`, `exist_c_ion`, `n_acetylation`) must be written
  as "0"/"1"** — the viewer compares them with `== 0` / `== 1`, and
  "true"/"false" silently breaks the matched-ion annotation in sequence views.
- **proteoform_cutoff tree** = `prsm` rows filtered to the `proteoform_id`s
  present in the `proteoform` table (TopPIC generates it from the full PrSM
  set, not from the one-per-proteoform rows).

Known, accepted divergences from TopPIC output: envelope pairs with near-tied
EnvCNN scores can be numbered/ordered differently (msalign order isn't stored
in the sqlite), and a handful of ppm values differ by ±0.01 (sqlite stores the
theoretical envelope mass, msalign stored the experimental one). Both verified
semantically equivalent with a normalizing comparator. MS1
`spectrum<N>.js` emits ALL `ms1_env` rows while TopPIC's own writer emits
only precursor-window envelopes — reviewed and accepted (a few extra circles
in the precursor popup), do not "fix" it. Its envelopes also carry a
`ref_mass` field (reference-isotope mass, present only when the sqlite
`ms{1,2}_env` table has that column) that TopPIC's writer does not emit —
the PrSM peak table's Ref m/z column is derived from it. Also: e-values and
proteoform ids are **run statistics from the TopPIC run** and protein ids
are assigned by the reader — a reference tree generated by a different
TopPIC run/version will differ in them (and in the e-value-sorted orderings
they drive) no matter what the converter does; only compare those against
the run that actually produced the reference.

### Validation loop (use it after touching the converter)

`test_data/st_1.sqlite` is the example input (gitignored); the byte-level
ground-truth `_html` tree was removed from the repo — obtain a
TopPIC-generated `*_html` directory for the same run to re-run this.

1. `npm run convert -- --sqlite test_data/st_1.sqlite --out outdir`
   (the search database comes from the sqlite's `fasta_seq` table).
2. `diff -rq` against the reference `data_js` trees, then a semantic
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
  `proteoform.js`'s single-PrSM link, fixed
  `getBpCoordinates` so the N-terminal cleavage bracket (break point 0) is
  anchored before the first residue (upstream bug), dropped a dead
  `proteoform/proteoform.js` script tag, reduced the upstream 100px
  fixed-navbar top margins/paddings to a 24px content gap
  (`visual/css/{proteins,prsm,ms}.css`, `inspect/css/inspect.css` — the
  injected nav bar is in normal flow), and `proteins.html`/`ms.html` accept
  `?data=<name>` as shorthand for `?folder=../../<name>/data_js`.
- The shared nav bar (`src/common/topmsv_nav_bar/nav_bar.ts` +
  `public/common/css/topmsv_nav_bar.css`) is injected into
  `<div id="nav-bar">` on every page, links Protein/Spectrum Identifications
  straight to `proteins.html?data=toppic_proteoform_cutoff` /
  `ms.html?data=toppic_prsm_cutoff`, and highlights the item matching
  `location.pathname` (amber `.active` class).
- `public/spectra/spectra.html` + `public/common/js` (generated from `src/spectra/`,
  tsconfig.spectra.json) are the raw-spectra browser (from the reference
  Express viewer): `api.js` uses dataset-relative `api/...` URLs and
  auto-loads (no file picker); `viewer.js`'s open flow runs as an IIFE on
  load. `src/spectra` is plain `.js` (allowJs passthrough): `viewer.js`
  (panels), `api.js`, `views/massTableView.js`, `models/spectrumData.js`.
  It has no sequence-matching code of its own: the MS2 panel's Inspect
  button opens `topmsv/inspect/spectrum.html?spec_id=<id>`, which loads the
  spectrum itself.
- The MS1 3D view (`public/ms1_3d/ms1_3d.html`, `src/ms1_3d/*.ts`) is a
  port of the TopMSV server's `3d_graph` code onto three.js ^0.186 as ES
  modules: `three` and `three/addons/` resolve through the page's import
  map to `/vendor/three/...`; `graph.ts` is the scene (grid plane, one
  pre-allocated line per peak, ticks as sprites, 2D top-down mode),
  `interaction.ts` pan/zoom/scan highlight, `data.ts` the `/api/3d/`
  client and the resolution-level choice, `page.ts` the controls.
  RETENTIONTIME in the 3D tables is milliseconds; the API and the page
  use minutes.
- ALL browser libraries (spectra.html and the topmsv viewer) are served
  under `/vendor/*` **straight from node_modules** by `src/server/vendor.ts`
  (a URL-prefix -> node_modules-dir table; nothing is copied under `public/`);
  versions are managed in package.json. Hard ceilings: jquery ^3 ($.trim
  etc. removed in 4), datatables.net ^1 (2.x breaking), fontawesome ^5 (icon
  class names). Everything is Bootstrap 5: the viewer pages were migrated
  from Bootstrap 4 (`data-bs-*` attributes, `btn-close`, `form-check`,
  `float-end`, `visually-hidden`) and load `bootstrap.bundle.min.js`
  (Popper included); jQuery `.modal()` calls keep working via Bootstrap 5's
  jQuery interop — use `data-bs-*` in any new markup. Bootstrap 5 dropped
  `position: absolute` from `.tooltip`, which every floating hover box
  (peak/envelope/fragment-mass tooltips, break-point annotation, save-image
  name popup) relies on for its inline left/top — `div.tooltip` in
  `public/common/css/common.css` supplies it; keep that rule. d3 is ^7: all drawing code (src/common
  and the viewer copies under public/topmsv, .ts AND the .js that actually
  runs) was migrated off the v5-only d3.event/d3.mouse globals to the
  v6+ listener signature (`.on("x", function(event, d))`, `d3.pointer`) —
  keep new d3 event handlers in that style.
- `src/common/` is the single source for the shared visualization library
  used by BOTH apps, compiled to `public/common/js/common` by the root
  `tsconfig.json` in one pass (include `./src/common/*/*` — exactly one
  directory level; deeper files are silently not compiled). Every page loads
  the same `spectrum_view/` scripts; page differences are options on
  `SpectrumViewParameters`: `setAnnoElementId(id)` routes hover text to an
  element instead of the default floating tooltip, `setThinEnvelopes(false)`
  draws every envelope in the window instead of thinning by display level
  (the raw-spectra browser sets both per panel in `src/spectra/viewer.js`),
  and `SpectrumView.addBaseInte()` adds the red base-intensity lines. The
  `envelopeclick` CustomEvent is dispatched on every page; only the spectra
  browser listens. `allowJs` is on: the untyped
  `parse_json/*.js` and `save_image/{save_image,util}.js` modules pass
  through to the output. `util/viewer_globals.d.ts` declares the page-script
  globals (SeqOfExecution etc.) that `draw_table.ts` and the viewer
  `add_shift.ts` reference.

## Reference material (untracked, gitignored)

`test_data/st_1.sqlite` is the example input (TopFD spectra + MS1 3D
tables + TopPIC identifications + fasta_seq) — upload it on the home page
to try the tool. `sqlite3` CLI is not installed; inspect `.sqlite` files
with `node:sqlite`.
