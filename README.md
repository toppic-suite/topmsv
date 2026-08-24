# TopMSV for TopPIC

A web-based tool for visualizing the output of the spectral deconvolution tool
**TopFD** and the database search tool **TopPIC**. Datasets are uploaded through
the browser; the server converts them into the data files consumed by the
TopMSV visualization library and serves the interactive protein / proteoform /
PrSM / spectrum views.

## Install

Requires Node.js >= 24 (the server uses the built-in `node:sqlite` module).

```
npm install
npm run build:client     # compile the browser TypeScript (required after a fresh clone)
```

## Run

```
npm start                # http://localhost:3000
DATA_DIR=/path/to/data PORT=8080 npm start
```

Open http://localhost:3000, upload the three files of a dataset, and click
**Identifications** or **Raw spectra** in the dataset table.

## Input files

| Upload field | File | Producer |
|---|---|---|
| TopFD sqlite file | `*.sqlite` / `*.db` (e.g. `st_1.sqlite`) | TopFD (spectra, deconvoluted envelopes) |
| TopPIC PrSM XML | `*_ms2_toppic_prsm.xml` | TopPIC (PrSMs with spectrum-level FDR cutoff) |
| TopPIC proteoform XML | `*_ms2_toppic_proteoform.xml` | TopPIC (proteoform-level FDR cutoff) |
| Protein database (optional) | FASTA used for the search | — |

The FASTA file is optional but recommended: the TopPIC XML files contain only
the matched sub-sequences, so without the FASTA the parts of a protein outside
the identified proteoform region are reconstructed heuristically (an `M` for
NME proteoforms, `X` placeholders otherwise) and the protein is truncated at
the proteoform end.

## What the converter does

At upload time the server reproduces TopPIC's own HTML-report generation
(ported from toppic-suite `src/visual`, `src/prsm`, `src/ms`):

- reads deconvoluted MS2 peak lists from the sqlite file (msalign precision),
- rebuilds theoretical B/Y ion ladders from the proteoform annotation,
  including fixed / protein-variable PTMs and unexpected/variable mass shifts,
- matches peaks to ions with TopPIC's tolerance model (10 ppm, 0.01 Da floor,
  ±1.00235 Da isotope variants for masses above 5000 Da) using the same
  two-pointer sweep as TopPIC,
- recomputes p-values/e-values from the stored extreme-value components, and
- writes the `toppic_prsm_cutoff/data_js` and `toppic_proteoform_cutoff/data_js`
  file trees in TopPIC's exact format.

On the example dataset the generated files are byte-identical to TopPIC's own
output for the majority of files; the remaining differences are peak-numbering
permutations of envelopes with near-tied EnvCNN scores (the msalign order is
not recoverable from the sqlite file) and a few ±0.01 ppm last-digit values —
all verified semantically equivalent.

Per-scan spectrum files (`topfd/ms{1,2}_json/spectrum<id>.js`) and per-PrSM
files (`data_js/prsms/prsm<id>.js`) are generated on the fly from the stored
inputs instead of being materialized (the example dataset would otherwise need
~275 MB of spectrum files plus hundreds of PrSM files).

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
src/common/                  TopMSV visualization library (TypeScript, compiled
                             to public/js/common, loaded as script-tag globals)
src/client/                  home page TypeScript (compiled to public/js)
public/index.html            home page
public/spectra.html + js/    raw-spectra browser
public/topmsv/               TopMSV viewer (visual/, inspect/, common/, vendored libs)
data/                        uploaded datasets (gitignored)
```

## Example dataset

`ref_data/` (not part of the repository) contains an example: `st_1.sqlite`,
`st_1_ms2_toppic_prsm.xml`, `st_1_ms2_toppic_proteoform.xml`. Upload these
three files on the home page to try the tool.

## License

Apache 2.0. The TopMSV viewer code and the conversion algorithms are derived
from [TopMSV](https://github.com/toppic-suite/topmsv) and
[toppic-suite](https://github.com/toppic-suite/toppic-suite) (Apache 2.0).
