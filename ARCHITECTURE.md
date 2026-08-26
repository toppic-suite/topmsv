# TopMSV Viewer — architecture

## What the converter does

The server reproduces TopPIC's own HTML-report generation (ported from
toppic-suite `src/visual`, `src/prsm`, `src/ms`):

- reads deconvoluted MS2 peak lists from the sqlite file (msalign precision),
- rebuilds theoretical B/Y ion ladders from the proteoform annotation,
  including fixed / protein-variable PTMs and unexpected/variable mass shifts,
- matches peaks to ions with TopPIC's tolerance model (10 ppm, 0.01 Da floor,
  ±1.00235 Da isotope variants for masses above 5000 Da) using the same
  two-pointer sweep as TopPIC,
- recomputes p-values/e-values from the stored extreme-value components, and
- serves the `toppic_prsm_cutoff/data_js` and `toppic_proteoform_cutoff/data_js`
  file trees in TopPIC's exact format.

Nothing is materialized on disk: a dataset directory holds only the uploaded
input files. All data_js files (`prsms.js`, `proteins.js` and the per-item
prsm/protein/proteoform files) are generated dynamically from a per-dataset
in-memory cache of the parsed and matched inputs, and the per-scan spectrum
files (`topfd/ms{1,2}_json/spectrum<id>.js`) come straight from the sqlite
file. (`npm run convert` can still write the trees as static files — that is
the validation path used to byte-compare against TopPIC's own output.)

On the example dataset the generated files are byte-identical to TopPIC's own
output for the majority of files; the remaining differences are peak-numbering
permutations of envelopes with near-tied EnvCNN scores (the msalign order is
not recoverable from the sqlite file) and a few ±0.01 ppm last-digit values —
all verified semantically equivalent.


## Pages

- `/` — dataset upload and list.
- `/d/<dataset>/topmsv/...` — the TopMSV visualization (protein list,
  protein, proteoform, PrSM and spectrum views, visual inspection). This is
  the original TopMSV viewer that TopPIC ships with its HTML output, patched
  minimally (broken script paths, dead TopMG cards, browser-check alert,
  a missing URL parameter, extra nav links).
- `/d/<dataset>/spectra.html` — a raw-spectra browser (all MS1/MS2 scans with
  peak lists and envelope annotations, linked navigation between MS1 and its
  fragmentation scans).

## Project layout

```
server.ts                    entry point (ts-node)
src/server/                  Express app, dataset registry, sqlite access
src/server/convert/          TopPIC XML + sqlite -> data_js converter
src/server/vendor.ts         serves all browser libraries (spectra.html +
                             topmsv viewer) under /vendor/* straight from
                             node_modules
src/common/                  TopMSV visualization library, single source for
                             both apps (TypeScript, compiled to public/js/common,
                             loaded as script-tag globals; <module>/viewer/ holds
                             the viewer's variants of the five divergent files)
src/spectra/                 raw-spectra browser page scripts (compiled to
                             public/js)
src/viewer/                  TopMSV viewer page scripts (compiled to
                             public/topmsv/{visual,inspect}/js)
src/client/                  home page TypeScript (compiled to public/js)
public/index.html            home page
public/spectra.html          raw-spectra browser page (scripts generated)
public/topmsv/               TopMSV viewer HTML (visual/, inspect/; all JS
                             generated from src/viewer + src/common)
data/                        uploaded datasets (gitignored)
```

## Example dataset

`ref_data/` (not part of the repository) contains an example: `st_1.sqlite`,
`st_1_ms2_toppic_prsm.xml`, `st_1_ms2_toppic_proteoform.xml`. Upload these
three files on the home page to try the tool.
