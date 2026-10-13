# TopMSV — architecture

## Introduction

The server generates the data of protein, proteoform, and spectral
identifications for visualization from the sqlite files of a dataset. It

- reads the deconvoluted MS2 peak lists and the TopPIC identification tables
  (`prsm`, `prsm_mass_shift`, `proteoform`) and search database (`fasta_seq`)
  from those files,
- rebuilds theoretical B/Y ion ladders from the proteoform annotation,
  including fixed / protein-variable PTMs and unexpected/variable mass shifts,
- matches peaks to ions with the mass tolerance model in TopPIC (10 ppm, 0.01 Da floor,
  ±1.00235 Da isotope variants for masses above 5000 Da),
- serializes the result in the JSON-in-JS layout TopPIC's own HTML output
  uses, so the vendored TopMSV viewer pages work unchanged. E-values are the
  ones TopPIC stored; p-values are not available from the sqlite and are
  written as "N/A".

A dataset is one of four kinds (`meta.type`, `datasets.DatasetType`): a
TopFD file alone (`topfd`), TopFD + TopPIC (`topfd_toppic`), TopFD + TopMG
(`topfd_topmg`), a TopDIA file alone (`topdia`). Its directory holds one or
two uploaded sqlite files. `ms.sqlite` is TopFD's or TopDIA's file: the
spectra and, in newer versions, the MS1
3D view's levels (tables `PEAKS<n>`, or in the newest a `LEVEL` column of
`ms1_peak`; `src/server/ms1Peaks.ts` reads both layouts), plus, in files of
older TopPIC and TopMG versions, the identification tables and search
database they appended (`src/server/convert/toppicSqlite.ts` reads them).
`toppic.sqlite` / `topmg.sqlite` is the TopPIC / TopMG file of a two-file
dataset: newer TopPIC and TopMG versions write `<name>_toppic.sqlite` /
`<name>_topmg.sqlite` with the identification tables, the search database
and TopFD's MS/MS envelope tables (`ms2_env`, `ms2_env_peak`, with the
envelopes of TopPIC's post mass matching added), or after toppic
`--mass-calib` every table, corrected. One connection reads both
(`src/server/sqliteFiles.ts`): the TopPIC / TopMG file is the main database
and the TopFD file is attached as `topfd`, so an unqualified table name
resolves to the first file when it has the table and to the TopFD file
otherwise, and
every query of the server stays as it was. Every open of a dataset goes
through `datasets.openDatasetDb` (the cached handle, the identification
loader, the upload checks), and table lists come from both files
(`sqliteFiles.tableNames`).

Any of the files may be compressed by `npm run compress`
(`src/server/zstd/compress.ts`, the converter). It writes the per-spectrum
tables (`ms1_peak`, `ms2_peak`, `ms1_env`, `ms1_env_peak`, `ms2_env`,
`ms2_env_peak`) as `<table>_blob(spec_id, n, one array per column)`. The
codec of each column (`f4` / `f8` / `i1` / `i2` / `i4`, or not stored:
`seq` for ids 0, 1, ... per spectrum, `seqg` per envelope) and the source
column order are in `zstd_blob_columns` (`src/server/zstd/codec.ts`).
Every other table is copied as it is. The sqlite-zstd extension
(`src/server/zstd/extension.ts`) then compresses each BLOB column with a
dictionary of its own; the table becomes a view that decompresses on read.
A connection to a compressed file loads the extension
(`sqliteFiles.openSqlitePair`), and every read of a per-spectrum table goes
through `src/server/spectraStore.ts`: a table resolves as an unqualified
name does (the main file's BLOB or row table, else the TopFD file's), and
BLOB rows are rebuilt into the source rows with the columns and the order
the row form's SQL returns, so every answer is the same for compressed and
uncompressed files. sqlite-zstd reads a dictionary with an unqualified
`select dict from _zstd_dicts where id = ?`, which on one connection finds
the main file's dictionaries only. So the BLOB tables of a compressed
attached TopFD file are read through a connection of their own
(`sqliteFiles.attachedFileDb`); the attached file's other tables are still
read through the pair's connection. All data for
visualization are generated dynamically from a per-dataset in-memory cache
of the read and matched identifications, and the per-scan spectrum files
come straight from the sqlite file.

A sqlite without the TopPIC identification tables has no identification
data: `meta.json` records `hasIdentifications: false`, every `data_js`
request returns 404, the home page omits the identification link, the nav
bar renders the identification items disabled, and the identification
pages show a "no identification data" message. The raw-spectra browser and
the visual inspection page only need the spectra, so they work for every
dataset; the MS1 3D view needs the 3D levels (`has3d`) and its nav
item is disabled otherwise.


## Server

`server.ts` starts the Express app from `src/server/app.ts`. Two settings
come from the environment (`DATA_DIR`, `PORT`) and one from the command line
(`npm start -- --view-only`, parsed in `src/server/config.ts`): in view-only
mode `POST` and `DELETE /api/datasets` answer 403 and the home page hides the
upload panel and the Delete column. The home page and the shared nav bar
read `/api/config`, which reports the version (from `package.json` through
`src/server/version.ts`) and the `--view-only` flag. Uploading (`src/server/routes/api.ts`) takes
one form field per tool, `sqlite` (TopFD's file), `topdia_sqlite`,
`toppic_sqlite` and `topmg_sqlite`; the fields given name the kind
(`{sqlite}`, `{sqlite, toppic_sqlite}`, `{sqlite, topmg_sqlite}`,
`{topdia_sqlite}`; anything else is a 400 listing the four). The spectra
file is stored as `ms.sqlite`, a TopPIC or TopMG file as `toppic.sqlite` or
`topmg.sqlite`. Each file gets per-spectrum indexes on the tables it has
and rollback journaling; `datasets.checkDataset` then requires the files
to resolve every table the pages read; a TopDIA file to look like one and a
TopFD file not to (`looksLikeTopdia`: MS1 and MS/MS spectra, none of the
MS/MS linked to an MS1 spectrum by `ms2_spectrum.ms1_id`); and, for two
files, the TopPIC or TopMG file to belong to the TopFD file (with every
table: the same MS/MS spectrum ids and scans; with the envelope tables
only: every MS/MS envelope of the TopFD file (spec_id, env_id, mono_mass)
present, found by a rowid join or else by spectrum, and no envelope of a
spectrum the TopFD file lacks; read spectrum by spectrum when either file
is compressed); a TopPIC or TopMG file without spectra is
refused alone. A compressed file needs the sqlite-zstd extension: without
it the upload is refused with the message of `loadZstdExtension`, and on a
server started without it the requests of a compressed dataset answer 500
with that message as JSON. For a TopDIA dataset, whose `ms1_id` is -1 for every window,
`/api/ms2-info/:id` reports and `/api/ms2-id-by-ms1/:id` uses the MS1 scan of
the window's cycle, the last MS1 scan before it by scan number
(`src/server/diaLinks.ts`), so the spectra browser's MS1 and MS2 panels
stay linked. The upload records the kind (`meta.type`) and the file names
(`meta.files`), inspects which
tables the files hold (`meta.hasIdentifications`, `hasFasta`, `has3d`),
and, when identifications are present, reads and
matches them once to validate the file and warm the per-dataset cache
(`src/server/prsmSource.ts`). Everything under `/d/<dataset>/` is served by
`src/server/routes/dataset.ts`: the sqlite JSON API, the on-the-fly TopFD
spectrum files and `data_js` identification files, the MS1 3D API and the
shared static pages.

## Pages

- `/` — home page: version, upload form (unless view-only) and the dataset
  list with counts and the links each dataset supports.
- `/d/<dataset>/topmsv/...` — the TopMSV visualization pages: protein list,
  protein, proteoform, PrSM and spectrum views (`visual/`) and the visual
  inspection calculator (`inspect/`).
- `/d/<dataset>/spectra/spectra.html` — a raw-spectra browser (all MS1/MS2
  scans with peak lists and envelope annotations, linked navigation between
  MS1 and its fragmentation scans), backed by a per-dataset JSON API under
  `/d/<dataset>/api/...` that queries the sqlite file directly.
- `/d/<dataset>/ms1_3d/ms1_3d.html` — the MS1 3D view (three.js) over the
  multi-resolution MS1 peak tables, through `/d/<dataset>/api/3d/{config,
  peaks,scans}`; the resolution level is chosen from the requested window.

Every page injects the shared nav bar (`src/common/topmsv_nav_bar/`), which
shows the application version after the "TopMSV" brand (fetched from
`/api/config`, the same source as the home page header), reads the dataset's
`api/meta` and disables the identification entries and the MS1 3D entry when
the file lacks their tables.

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
  `src/common/spectrum_view/draw_spectrum.ts`): clicking a circle
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
derives the lists, sequence, PTMs and precursor mass from it (`folder`
defaults to the prsm cutoff tree, which holds every PrSM). Nothing is
passed between the pages any more (the old localStorage hand-off is gone),
so an inspection URL can be reloaded or bookmarked. The "Load from this
dataset" form at the top does the same on demand: a PrSM ID loads that PrSM
(first spectrum); a Spectrum ID, or an MS2 scan number (resolved through
`../../api/ms2-id-by-scan/<scan>` and checked for an exact match), loads a
bare MS2 spectrum through the dataset JSON API
(`../../api/ms2-info|ms2-peaks|ms2-envs/<id>`) into the peak list, mass
list and ion types, leaving sequence, PTMs and precursor mass alone (the
sqlite stores no MS2 precursor mass); `?spec_id=` or `?scan=` alone does
the same. Every load updates the URL. The raw-spectra browser has no
sequence-matching code of its own: its MS2 panel's Inspect button opens
this page with `?spec_id=` for the spectrum on display. Everything runs
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
server.ts                    entry point (run with ts-node, no emit);
                             parses the --view-only flag
src/server/app.ts            Express app wiring all routes together
src/server/config.ts         server options set from the command line
src/server/version.ts        application version, read from package.json
src/server/datasets.ts       dataset registry (upload storage, meta.json,
                             DATA_DIR resolution, sqlite table inspection)
src/server/routes/           config + dataset upload/list/delete API (api.ts)
                             and the per-dataset /d/<id>/ routes (dataset.ts:
                             sqlite JSON API, MS1 3D API, spectrum and
                             data_js files, static pages)
src/server/prsmSource.ts     per-dataset in-memory cache of parsed and
                             matched PrSM data; serves the data_js files
src/server/spectrumJs.ts     per-scan topfd/ms{1,2}_json/spectrum<N>.js
                             generated straight from the sqlite file
src/server/ms1Peaks.ts       the two layouts of the MS1 peaks (ms1_peak with
                             PEAKS<n> tables, or one ms1_peak with LEVEL):
                             a spectrum's peak query and the MS1 3D data
src/server/spectraStore.ts   every read of the per-spectrum tables, as rows
                             or as the BLOB rows of a compressed file
src/server/zstd/             compressed files: the converter (compress.ts,
                             npm run compress through cli.ts), the arrays'
                             codecs (codec.ts), loading sqlite-zstd
                             (extension.ts)
scripts/fetch-sqlite-zstd.mjs  npm run fetch-sqlite-zstd: downloads the
                             extension into ext/sqlite_zstd/ (gitignored)
src/server/convert/          sqlite -> data_js converter: toppicSqlite.ts
                             reads the TopPIC tables into prsmRecord.ts
                             records, convert.ts/annotate.ts match them,
                             builder.ts/format.ts serialize (payload
                             builders shared by the dynamic endpoints and
                             the npm run convert CLI, cli.ts)
src/server/vendor.ts         serves all browser libraries (spectra browser +
                             topmsv viewer) under /vendor/* straight from
                             node_modules
src/common/                  TopMSV visualization library, single source for
                             both apps (TypeScript, compiled to
                             public/common/js/common in one pass, loaded as
                             script-tag globals; spectrum_view/ is the one
                             spectrum-panel implementation every page uses,
                             configured per page through
                             SpectrumViewParameters options;
                             topmsv_nav_bar/ is the shared nav bar)
src/spectra/                 raw-spectra browser page scripts (plain JS,
                             copied to public/common/js): the MS1/MS2
                             panels, mass lists and the dataset API client
src/ms1_3d/                  MS1 3D view (three.js, ES modules; compiled to
                             public/common/js/ms1_3d)
public/ms1_3d/ms1_3d.html    MS1 3D view page (needs the MS1 3D peak
                             tables in the dataset's sqlite)
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
tsconfig*.json               the five build:client passes (shared library,
                             spectra pages, viewer pages, home page, MS1 3D
                             view) + tsconfig.server.json for npm start and
                             npm run typecheck:server
```