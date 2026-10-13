# TopMSV

A web-based tool for visualizing the output of the spectral deconvolution tool
**TopFD** (or **TopDIA**) and the database search tools **TopPIC** and
**TopMG**. A dataset is the sqlite files of a run: TopFD's or TopDIA's
`<name>.sqlite` holds the deconvoluted spectra and, with recent versions,
the MS1 3D peak tables; TopPIC's `<name>_toppic.sqlite` or TopMG's
`<name>_topmg.sqlite` holds the identifications, the search database and
the deconvoluted MS/MS envelopes, and the server reads from TopFD's file
whatever the TopPIC or TopMG file does not hold. (Older TopPIC and TopMG
versions wrote their tables into TopFD's file, which is uploaded alone.)
The files are uploaded through the browser and the server generates everything the viewer pages need on the fly: the
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

On Linux / macOS you can instead run `./start_server.sh`, which installs
the dependencies, builds the browser scripts and then starts the server.
On Windows double-click `start_server.bat`, which does the same but skips
the install and build steps once they have been done. Set `PORT` and
`DATA_DIR` in the terminal beforehand to change the defaults.

Options are given through environment variables and one command-line flag:

```
DATA_DIR=/path/to/data PORT=8080 npm start
npm start -- --view-only
```

`DATA_DIR` is the directory where uploaded datasets are stored (default:
`data/` in the repository) and `PORT` is the port the server listens on
(default: 3000); either can be set independently. `--view-only` runs a
read-only server for sharing existing datasets: the upload panel and the
Delete buttons are not shown and the server refuses uploads and deletions.
The version of the tool is shown next to the title on the home page and in
the server's startup line.

## Upload a dataset

Open http://localhost:3000 using a web browser and fill in the **Upload a
dataset** form:

1. Optionally enter a dataset name (it defaults to the name of the first
   file).
2. Choose the kind of dataset and select its sqlite files — see the next
   section. The TopPIC Suite (TopFD, TopDIA, TopPIC, TopMG) is available at
   https://www.toppic.org.
3. Click **Upload**. The files are checked and the dataset appears in the
   **Datasets** table with its protein, proteoform, PrSM and scan counts and
   the links to its pages: **Identifications** opens the protein list,
   **Spectra** the raw-spectra browser and **MS1 3D** the 3D view. A link is
   shown only when the files hold the data it needs. **Delete** removes a
   dataset permanently.

Nothing is converted on disk: the dataset directory keeps the uploaded
sqlite files (`ms.sqlite`, and `toppic.sqlite` for a TopPIC file) and a
small `meta.json`, and all viewer data is generated on the fly from the
sqlite files.

## Input files

A dataset is one of four kinds, chosen on the upload form (the upload
fields of the API in parentheses); other combinations are refused:

1. **TopFD only** (`sqlite`): TopFD's `<name>.sqlite`, spectra only — or the
   file of an older TopPIC or TopMG version that wrote its identification
   tables into TopFD's file.
2. **TopFD + TopPIC** (`sqlite`, `toppic_sqlite`): TopFD's file and TopPIC's
   `<name>_toppic.sqlite`.
3. **TopFD + TopMG** (`sqlite`, `topmg_sqlite`): TopFD's file and TopMG's
   `<name>_topmg.sqlite`.
4. **TopDIA only** (`topdia_sqlite`): TopDIA's `<name>.sqlite`, spectra
   only.

For kinds 2 and 3, every table is read from the TopPIC or TopMG file when
it has it and from the TopFD file otherwise: the identifications, the
search database and the MS/MS envelopes (TopFD's, plus those TopPIC's post
mass matching added) come from the TopPIC or TopMG file, the spectra,
peaks, MS1 envelopes and MS1 3D levels from the TopFD file. After `toppic
--mass-calib` the TopPIC file holds every table with corrected m/z values,
and the TopFD file adds nothing. The upload checks that the TopPIC or TopMG
file belongs to the TopFD file (it has the TopFD file's MS/MS envelopes, or
with every table its MS/MS spectra); a TopPIC or TopMG file alone is
refused, as it needs its TopFD file.

TopDIA deconvolutes the DIA MS/MS windows without their MS1 scan, so its
file links no MS/MS spectrum to an MS1 spectrum; for a TopDIA dataset the
spectra browser links each window to the MS1 scan of its cycle (the last
MS1 scan before it). The upload refuses a TopDIA file given as a TopFD
file, and a TopFD file given as a TopDIA file (told apart by that link).

What the pages can show depends on which tables the files contain:

| Tables | Written by | Enables |
|---|---|---|
| `ms1_*`, `ms2_*` (spectra, deconvoluted envelopes) | TopFD | Spectra browser, Visual Inspection (always present) |
| `prsm`, `prsm_mass_shift`, `proteoform` | TopPIC | Protein / Spectrum Identifications pages |
| `fasta_seq` (the search database) | TopPIC | Full protein sequences in the identification views; without it the parts of a protein outside the identified proteoform are reconstructed heuristically (an `M` for NME proteoforms, `X` placeholders otherwise) |
| `CONFIG`, `PEAKS0` … `PEAKS<n>` (multi-resolution MS1 peaks) | TopFD 2.0 - 2.1 with `-D` | MS1 3D view |
| `CONFIG` and a `LEVEL` column in `ms1_peak` (the same levels in one MS1 peak table) | newer TopFD with `-D` | MS1 3D view |

Both layouts of the MS1 3D data are read. In the newer one `ms1_peak` is
`(LEVEL, spec_id, peak_id, mz, intensity)` with the primary key `(LEVEL,
spec_id, peak_id)`: `LEVEL` is the highest 3D level that keeps the peak (-1
for a peak outside the 3D map, 0 for every peak without `-D`), level k is
the peaks with `LEVEL >= k`, and a peak's retention time is its spectrum's.
The file is much smaller (480_F3_02 with `-D`: 2.6 GB -> 0.9 GB).

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
