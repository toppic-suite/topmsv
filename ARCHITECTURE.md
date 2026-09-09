# TopMSV Viewer — architecture

## Introduction

The server generates the data of protein, proteoform, and spectral identifications 
for visualization using webpages with the following functions. 

- reads deconvoluted MS2 peak lists from the sqlite file,
- rebuilds theoretical B/Y ion ladders from the proteoform annotation,
  including fixed / protein-variable PTMs and unexpected/variable mass shifts,
- matches peaks to ions with the mass tolerance model in TopPIC (10 ppm, 0.01 Da floor,
  ±1.00235 Da isotope variants for masses above 5000 Da).
- recomputes p-values/e-values from the stored information of PrSMs

A dataset directory holds the uploaded
input files: the TopFD sqlite file (required), the TopPIC PrSM and proteoform
XML files (optional, uploaded as a pair) and the search FASTA (optional). All
data for visualization are generated dynamically from a per-dataset
in-memory cache of the parsed and matched inputs, and the per-scan spectrum
files come straight from the sqlite
file.

A dataset uploaded without the TopPIC XML files has no identification data:
`meta.json` records `hasIdentifications: false`, every `data_js` request
returns 404, the home page and the nav bar hide the identification links,
and the identification pages show a "no identification data" message. The
raw-spectra browser and the visual inspection page only need the sqlite
file, so they work for every dataset.


## Pages

- `/d/<dataset>/topmsv/...` — visualization webpages for protein list,
  protein, proteoform, PrSM and spectrum views, visual inspection. 
- `/d/<dataset>/spectra/spectra.html` — a raw-spectra browser (all MS1/MS2
  scans with peak lists and envelope annotations, linked navigation between
  MS1 and its fragmentation scans), backed by a per-dataset JSON API under
  `/d/<dataset>/api/...` that queries the sqlite file directly.

### Envelope display in the spectrum panels

The circles drawn over a spectrum are TopFD's theoretical isotopic
envelopes (the `ms1_env_peak` / `ms2_env_peak` tables), not experimental
peaks. Two behaviors of the shared drawing library matter here:

- **Coloring** (`addColorToEnvelopes` in
  `src/common/spectrum_view/spectrum_parameter.ts`): envelopes are colored
  greedily in m/z order so that any two envelopes whose peak ranges come
  within 2 m/z of each other get different colors. The palette has twelve
  colors; the first three (red, orange, blue) are used wherever possible, so
  the extra colors only appear in crowded regions such as overlapping
  precursor charge states.
- **Click-to-select** (`drawEnvelopes` in
  `src/common/topfd_view/topfd_draw_spectrum.ts`): clicking a circle
  dispatches an `envelopeclick` CustomEvent on the enclosing `<svg>` carrying
  the `Envelope` (which stores the TopFD `env_id`) and the clicked peak. The
  raw-spectra browser (`src/spectra/viewer.js`) listens on both spectrum svgs
  and highlights and scrolls to the envelope's row in the matching mass list.
  The drawing library knows nothing about the page layout, so other pages can
  react to the same event differently or ignore it.

## Project layout

```
server.ts                    entry point (run with ts-node, no emit)
src/server/app.ts            Express app wiring all routes together
src/server/datasets.ts       dataset registry (upload storage, meta.json,
                             DATA_DIR resolution)
src/server/routes/           dataset upload/list/delete API (api.ts) and the
                             per-dataset /d/<id>/ routes (dataset.ts)
src/server/prsmSource.ts     per-dataset in-memory cache of parsed and
                             matched PrSM data; serves the data_js files
src/server/spectrumJs.ts     per-scan topfd/ms{1,2}_json/spectrum<N>.js
                             generated straight from the sqlite file
src/server/convert/          TopPIC XML + sqlite -> data_js converter
                             (payload builders shared by the dynamic
                             endpoints and the npm run convert CLI, cli.ts)
src/server/vendor.ts         serves all browser libraries (spectra browser +
                             topmsv viewer) under /vendor/* straight from
                             node_modules
src/common/                  TopMSV visualization library, single source for
                             both apps (TypeScript, compiled to
                             public/common/js/common, loaded as script-tag
                             globals; <module>/viewer/ holds the viewer's
                             variants of the five divergent files;
                             topmsv_nav_bar/ is the shared nav bar)
src/spectra/                 raw-spectra browser page scripts (compiled to
                             public/common/js)
src/viewer/                  TopMSV viewer page scripts (compiled to
                             public/topmsv/{visual,inspect}/js)
src/client/                  home page TypeScript (compiled to
                             public/common/js)
public/index.html            home page
public/spectra/spectra.html  raw-spectra browser page (scripts generated)
public/topmsv/               TopMSV viewer HTML (visual/, inspect/; all JS
                             generated from src/viewer + src/common)
public/common/               shared CSS and images; public/common/js/ holds
                             all generated browser JS (gitignored)
data/                        uploaded datasets (gitignored; override with
                             DATA_DIR)
tsconfig*.json               the five build:client passes (spectra library,
                             viewer library variants, spectra pages, viewer
                             pages, home page) + tsconfig.server.json for
                             npm run typecheck:server
```