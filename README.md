# TopMSV Viewer

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

Both steps are required after a fresh clone: browser libraries are served
straight from `node_modules`, and the compiled `public/common/js/` output is
generated, not committed.

## Run

```
npm start                # http://localhost:3000
DATA_DIR=/path/to/data PORT=8080 npm start
```

The second form sets two optional environment variables: `DATA_DIR` is the
directory where uploaded datasets are stored (default: `data/` in the
repository), and `PORT` is the port number the web server listens on
(default: 3000). Either can be set independently.

Open http://localhost:3000, upload the three files of a dataset, and click
**Identifications** or **Spectra** in the dataset table.

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

See [ARCHITECTURE.md](ARCHITECTURE.md) for an introduction of the design,
the served pages, the project layout and the example dataset.

## License

Apache 2.0. The TopMSV viewer code and the conversion algorithms are derived
from [TopMSV](https://github.com/toppic-suite/topmsv) and
[toppic-suite](https://github.com/toppic-suite/toppic-suite) (Apache 2.0).
