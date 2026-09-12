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
- **Mass lists** (`src/spectra/views/massTableView.js`, rows built in
  `src/spectra/viewer.js`): each spectrum panel has a table of its envelopes
  with mass ID (1-based: TopFD `env_id` + 1, as in the PrSM peak table),
  mono mass, mono m/z, ref m/z, charge, intensity and EnvCNN score.
  Ref m/z is the m/z of the envelope's reference (most abundant) isotope,
  computed as `ref_mass / charge + 1.007276` from the `ref_mass` column that
  newer TopFD versions write to `ms1_env` / `ms2_env`; it is blank for sqlite
  files without that column. Ref m/z is a link that centers the spectrum on
  it; mono m/z is plain text.
- **PrSM peak table Ref m/z** (`src/common/data_table/draw_table.ts`, header
  in `visual/prsm.html`): the same column next to Mono m/z, carrying the
  click-to-center link (Mono m/z is plain text there). The inspect pages
  share the table code but construct `DataTable` with `showRefMz = false`:
  their pasted peaks have no ref mass, so they keep the old layout with the
  link on Mono m/z. The value comes from the `ref_mass` field that
  `src/server/spectrumJs.ts` adds to each envelope of `topfd/ms2_json/
  spectrum<N>.js` when the sqlite has the column; `parse_prsm.js` stores it
  on the `Envelope` and copies the derived m/z onto the deconvoluted `Peak`
  with the same id (deconvoluted peak ids index the envelope list). The cell
  is blank when the ref mass is unknown (older sqlite files).
- **Click-to-select** (`drawEnvelopes` in
  `src/common/topfd_view/topfd_draw_spectrum.ts`): clicking a circle
  dispatches an `envelopeclick` CustomEvent on the enclosing `<svg>` carrying
  the `Envelope` (which stores the TopFD `env_id`) and the clicked peak. The
  raw-spectra browser (`src/spectra/viewer.js`) listens on both spectrum svgs
  and highlights and scrolls to the envelope's row in the matching mass list.
  The drawing library knows nothing about the page layout, so other pages can
  react to the same event differently or ignore it.

### Visual inspection page

`/d/<dataset>/topmsv/inspect/spectrum.html` is a standalone calculator:
the user pastes a raw peak list (m/z, intensity), a deconvoluted mass list
(mass, intensity, charge; extra columns are ignored) and a protein sequence,
picks ion types and an error tolerance, and presses Submit. Opened as
`spectrum.html?folder=<data_js folder>&prsm_id=<id>[&spec_id=<ms2 id>]`
(the PrSM page's Inspect dropdown links there, one item per scan) it fills
those inputs itself: `models/loadPrsm.ts` loads the PrSM json through the
same `ParsePrsm` the PrSM page uses and `src/common/prsm/inspect_data.ts`
derives the lists, sequence, PTMs and precursor mass from it. Nothing is
passed between the pages any more (the old localStorage hand-off is gone),
so an inspection URL can be reloaded or bookmarked. Everything runs
in the browser (`src/viewer/inspect/js/`): `SeqOfExecution` in
`controllers/seqofexecution.ts` parses the inputs, matches the mass list
against the theoretical fragment masses (`models/calcMatchedPeaks.ts`),
draws the annotated sequence, the graphs and the tables. Two behaviors worth
knowing:

- **Matches at position 0 are valid.** `matchedPeakAttributes` fills the
  match fields (ion name, index, position, errors) by checking that they are
  present, not truthy. An intact-protein mass in the list matches the
  full-length Y ion, whose cleavage position is 0, and an exact match has a
  mass error of 0; a truthiness test skipped those fields and left a peak
  flagged as matched without an ion name, which threw in the sequence view
  and left the page blank.
- **Graph tabs follow the inputs.** The "Scan" tab shows the raw spectrum
  built from the Peaks box; the "Mass scan" tab shows the mass graph built
  from the Masses box. When the Peaks box is empty the spectrum graph is
  never drawn, so the page hides the "Scan" tab and opens "Mass scan"
  instead of an empty panel.

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