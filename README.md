# TopMSV Viewer

A web-based tool for visualizing the output of the spectral deconvolution tool
**TopFD** and the database search tool **TopPIC**. Datasets are uploaded through
the browser; the server converts them into the data files consumed by the
TopMSV visualization library and serves the interactive protein , proteoform, 
proteoform-spectrum-match (PrSM), and spectrum views.

## Install

Requires Node.js >= 24 (the server uses the built-in `node:sqlite` module).
An easy way to get it is nvm (Node Version Manager).

**Linux / macOS** — install [nvm](https://github.com/nvm-sh/nvm):

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

then restart the terminal (or `source ~/.bashrc`).

**Windows** — install [nvm-windows](https://github.com/coreybutler/nvm-windows):
download and run `nvm-setup.exe` from its
[latest release](https://github.com/coreybutler/nvm-windows/releases/latest),
then open a new terminal (as administrator for `nvm use`).

With nvm installed, install Node.js 24 (same commands on all platforms):

```
nvm install 24
nvm use 24
node -v                  # should print v24.x.x
```

With Node.js in place, install and build the tool:

```
npm install
npm run build:client     # compile the browser TypeScript (required after a fresh clone)
```

Both steps are required after a fresh clone: browser libraries are served
straight from `node_modules`, and the compiled `public/common/js/` output is
generated, not committed.

## Run

Start the local server at port 3000:

```
npm start                # http://localhost:3000
```

or start the local web server at a specified port (i.e., 8080) and data folder:

```
DATA_DIR=/path/to/data PORT=8080 npm start
```

In the command, we set two optional environment variables: `DATA_DIR` is the
directory where uploaded datasets are stored (default: `data/` in the
repository), and `PORT` is the port number the web server listens on
(default: 3000). Either can be set independently.

## Upload a dataset

An example dataset can be downloaded from
https://toppic.org/software/topmsv/example_data/topmsv_viewer_data.zip.

Open http://localhost:3000 using a web browser and fill in the **Upload a dataset** form:

1. Optionally enter a dataset name (it defaults to the sqlite file name).
2. Select the TopFD output sqlite file — see the table below.
3. Optionally select the two TopPIC result XML files (the PrSM XML and the
   proteoform XML). They must be uploaded together; without them the dataset
   offers only the raw-spectra pages and no identification pages.
4. Optionally select the protein database (FASTA) used for the search.
5. Click **Upload**. The files are validated and the dataset appears in the
   **Datasets** table, where **Identifications** opens the protein list (for
   datasets uploaded with the TopPIC XMLs) and **Spectra** opens the
   raw-spectra browser. **Delete** removes a dataset permanently.

Nothing is converted on disk: the server keeps only the uploaded files and
generates all viewer data on the fly.

## Input files

| Upload field | File | Producer |
|---|---|---|
| TopFD sqlite file | `*.sqlite` / `*.db` (e.g. `st_1.sqlite`) | TopFD (spectra, deconvoluted envelopes) |
| TopPIC PrSM XML (optional, with the proteoform XML) | `*_ms2_toppic_prsm.xml` | TopPIC (PrSMs with spectrum-level FDR cutoff) |
| TopPIC proteoform XML (optional, with the PrSM XML) | `*_ms2_toppic_proteoform.xml` | TopPIC (PrSMs with proteoform-level FDR cutoff) |
| Protein database (optional) | FASTA used for the search | — |

The FASTA file is optional but recommended: the TopPIC XML files contain only
the matched truncated protein sequences, so without the FASTA the amino acids 
in the truncated parts of the identified proteoform are reconstructed heuristically (an `M` for
NME proteoforms, `X` placeholders otherwise). 

See [ARCHITECTURE.md](ARCHITECTURE.md) for an introduction of the design,
the webpages, the project layout and the example dataset.

## License

Apache 2.0. 
