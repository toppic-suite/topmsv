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
input files. All data for visualization are generated dynamically from a per-dataset
in-memory cache of the parsed and matched inputs, and the per-scan spectrum
files come straight from the sqlite
file. 


## Pages

- `/d/<dataset>/topmsv/...` — visualization webpages for protein list,
  protein, proteoform, PrSM and spectrum views, visual inspection. 
- `/d/<dataset>/spectra/spectra.html` — a raw-spectra browser (all MS1/MS2
  scans with peak lists and envelope annotations, linked navigation between
  MS1 and its fragmentation scans), backed by a per-dataset JSON API under

## Project layout

```
server.ts                    entry point (ts-node, no emit)
src/server/                  Express app, dataset registry, sqlite access,
                             on-the-fly data_js/spectrum generation
src/server/routes/           dataset upload/list API and per-dataset routes
src/server/convert/          TopPIC XML + sqlite -> data_js converter
src/server/vendor.ts         serves all browser libraries (spectra browser +
                             topmsv viewer) under /vendor/* straight from
                             node_modules
src/common/                  TopMSV visualization library, single source for
                             both apps (TypeScript, compiled to
                             public/common/js/common, loaded as script-tag
                             globals; <module>/viewer/ holds the viewer's
                             variants of the five divergent files)
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
data/                        uploaded datasets (gitignored)
```

## Example dataset

`ref_data/` (not part of the repository) contains an example: `st_1.sqlite`,
`st_1_ms2_toppic_prsm.xml`, `st_1_ms2_toppic_proteoform.xml`. Upload these
three files on the home page to try the tool.
