# TopMSV

A web-based tool for visualizing the output of the spectral deconvolution tool
**TopFD** and the database search tool **TopPIC**. A dataset is a single
sqlite file: TopFD writes the deconvoluted spectra into it and, with recent
versions, the MS1 3D peak tables; TopPIC appends its identifications and the
search database to the same file. The file is uploaded through the browser
and the server generates everything the viewer pages need on the fly: the
interactive protein, proteoform, proteoform-spectrum-match (PrSM) and
spectrum views, a raw-spectra browser, a visual inspection calculator and an
MS1 3D view.

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

Options are given through environment variables and one command-line flag:

```
DATA_DIR=/path/to/data PORT=8080 npm start
npm start -- view-only
```

`DATA_DIR` is the directory where uploaded datasets are stored (default:
`data/` in the repository) and `PORT` is the port the server listens on
(default: 3000); either can be set independently. `view-only` runs a
read-only server for sharing existing datasets: the upload panel and the
Delete buttons are not shown and the server refuses uploads and deletions.
The version of the tool is shown next to the title on the home page and in
the server's startup line.

## Upload a dataset

Open http://localhost:3000 using a web browser and fill in the **Upload a
dataset** form:

1. Optionally enter a dataset name (it defaults to the sqlite file name).
2. Select the sqlite file written by TopFD and TopPIC — see the next section.
3. Click **Upload**. The file is checked and the dataset appears in the
   **Datasets** table with its protein, proteoform, PrSM and scan counts and
   the links to its pages: **Identifications** opens the protein list,
   **Spectra** the raw-spectra browser and **MS1 3D** the 3D view. A link is
   shown only when the file holds the data it needs. **Delete** removes a
   dataset permanently.

Nothing is converted on disk: the dataset directory keeps the uploaded
sqlite file and a small `meta.json`, and all viewer data is generated on
the fly from the sqlite file.

## Input file

One sqlite file per dataset. What the pages can show depends on which
tables it contains:

| Tables | Written by | Enables |
|---|---|---|
| `ms1_*`, `ms2_*` (spectra, deconvoluted envelopes) | TopFD | Spectra browser, Visual Inspection (always present) |
| `prsm`, `prsm_mass_shift`, `proteoform` | TopPIC (results written into the TopFD file) | Protein / Spectrum Identifications pages |
| `fasta_seq` (the search database) | TopPIC | Full protein sequences in the identification views; without it the parts of a protein outside the identified proteoform are reconstructed heuristically (an `M` for NME proteoforms, `X` placeholders otherwise) |
| `CONFIG`, `PEAKS0` … `PEAKS<n>` (multi-resolution MS1 peaks) | recent TopFD versions | MS1 3D view |

## Pages

Every dataset page carries a navigation bar with these entries (an entry
whose data the file lacks is disabled):

- **Protein Identifications** / **Spectrum Identifications** — the TopMSV
  views of the proteins, proteoforms and PrSMs, with the annotated sequence,
  the matched fragment ions and the spectrum of each PrSM.
- **Visual Inspection** — a calculator that matches a pasted (or loaded)
  mass list against a protein sequence with chosen ion types, PTMs and mass
  tolerance; the PrSM page and the spectra browser link into it with the
  spectrum on display.
- **Spectra** — a browser of all MS1 and MS2 scans with peak lists, the
  deconvoluted envelopes (circles over the peaks, clickable to select the
  envelope in the mass list) and linked navigation between an MS1 scan and
  its fragmentation scans.
- **MS1 3D** — an interactive m/z × retention time × intensity view of the
  MS1 peaks (pan, zoom, intensity cutoff, scan highlighting, image export).

## Example dataset

An example archive is available at
https://toppic.org/software/topmsv/example_data/topmsv_data.zip. 

See [ARCHITECTURE.md](ARCHITECTURE.md) for an introduction of the design,
the webpages and the project layout.

## License

Apache 2.0. 
