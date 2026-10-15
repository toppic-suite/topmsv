# TopMSV

A web-based tool for visualizing the output of the spectral deconvolution tool
**TopFD** (or **TopDIA**) and the database search tools **TopPIC** and
**TopMG**. A dataset is the sqlite files of a run: TopFD's or TopDIA's
`<name>.sqlite` holds the deconvoluted spectra and the MS1 3D peak levels;
TopPIC's `<name>_toppic.sqlite` or TopMG's `<name>_topmg.sqlite` holds the
identifications, the search database and the deconvoluted MS/MS envelopes,
and the server reads from TopFD's file whatever the TopPIC or TopMG file
does not hold. Files written by older versions of these tools are not
supported (see [Input files](#input-files)).
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
the install and build steps once they have been done, and also downloads
the sqlite-zstd extension for compressed sqlite files when it is missing
(see [Compressed sqlite files](#compressed-sqlite-files)). Set `PORT` and
`DATA_DIR` in the terminal beforehand to change the defaults.

To stop the server press Ctrl+C in its terminal. On Windows you can
instead double-click `stop_server.bat`, which stops every TopMSV server
started from its folder, whatever the port (run it as administrator if
the server was started as administrator).

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
2. Choose the **Dataset type** (TopFD only, TopFD + TopPIC, TopFD + TopMG
   or TopDIA only — see the next section) and select its sqlite files: the
   TopFD or TopDIA file and, for TopFD + TopPIC or TopFD + TopMG, the
   TopPIC or TopMG file of the same run. Each file is checked in the
   browser as soon as it is selected, before anything is uploaded: the form
   shows what the file is, or a warning when a file is not what the type
   needs (a TopDIA file for a TopFD type, for example) or the TopPIC or
   TopMG file does not belong to the TopFD file; then **Upload** stays
   disabled. The TopPIC Suite (TopFD, TopDIA, TopPIC, TopMG) is available
   at https://www.toppic.org.
3. Click **Upload**. The files are checked again and the dataset appears in the
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

A dataset is one of four types, chosen on the home page (the upload
fields of the API in parentheses); other combinations are refused:

1. **TopFD only** (`sqlite`): TopFD's `<name>.sqlite`, spectra only.
2. **TopFD + TopPIC** (`sqlite`, `toppic_sqlite`): TopFD's file and TopPIC's
   `<name>_toppic.sqlite`.
3. **TopFD + TopMG** (`sqlite`, `topmg_sqlite`): TopFD's file and TopMG's
   `<name>_topmg.sqlite`.
4. **TopDIA only** (`topdia_sqlite`): TopDIA's `<name>.sqlite`, spectra
   only.

For types 2 and 3, every table is read from the TopPIC or TopMG file when
it has it and from the TopFD file otherwise: the identifications, the
search database and the MS/MS envelopes (TopFD's, plus those TopPIC's post
mass matching added) come from the TopPIC or TopMG file, the spectra,
peaks, MS1 envelopes and MS1 3D levels from the TopFD file. After `toppic
--mass-calib` the TopPIC file holds every table with corrected m/z values,
and the TopFD file adds nothing. The upload checks that the TopPIC or TopMG
file belongs to the TopFD file (it has the TopFD file's MS/MS envelopes, or
with every table its MS/MS spectra); a TopPIC or TopMG file alone is
refused, as it needs its TopFD file. The home page runs the same checks in
the browser when the files are selected. It reads only the parts of the
files it needs, so it is quick even for files of several
GB. For the envelopes it compares TopFD's envelopes at 64 positions with
the TopPIC or TopMG file's, and every envelope only when one of those
differs. With a compressed file (see below) it compares the number of
envelopes of each spectrum, and the server compares the envelopes after
the upload.

Files written by older versions of TopFD, TopDIA, TopPIC and TopMG are
not supported, and the upload refuses them with a message:

- a TopFD or TopDIA file without the `LEVEL` column in `ms1_peak` (TopFD
  2.0 - 2.1 wrote the MS1 3D levels as tables `PEAKS0` … `PEAKS<n>`) or
  without `ms1_id` in `ms2_spectrum`;
- a TopFD file into which an older TopPIC or TopMG version wrote its
  identification tables; and
- a TopPIC or TopMG file of an older version that copied every table of
  such a TopFD file.

Deconvolute and search the spectra again with the current versions.

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
| `CONFIG` and a `LEVEL` column in `ms1_peak` (multi-resolution MS1 peaks) | TopFD, TopDIA | MS1 3D view |

`ms1_peak` is `(LEVEL, spec_id, peak_id, mz, intensity)` with the primary
key `(LEVEL, spec_id, peak_id)`: `LEVEL` is the highest 3D level that keeps
the peak (-1 for a peak outside the 3D map), level k is the peaks with
`LEVEL >= k`, and a peak's retention time is its spectrum's.

## Compressed sqlite files

The sqlite files of finished runs can be made about three times smaller
for TopMSV, without losing anything, with the
[sqlite-zstd](https://github.com/phiresky/sqlite-zstd) extension:

```
npm run fetch-sqlite-zstd     # downloads sqlite-zstd v0.3.5 into ext/sqlite_zstd/
npm run compress -- --sqlite 480_F3_02.sqlite --out 480_F3_02_zstd.sqlite [--level 3]
```

`compress` rewrites a TopFD, TopDIA, TopPIC or TopMG file into a new file.
The peak, envelope and envelope peak tables become one row per spectrum:
each column is an array, compressed with a zstd dictionary of its own.
Every other table is copied as it is. Every value is kept exactly: the
m/z values and intensities that are exact 32-bit floats (TopFD's peaks)
are stored as such, the others as 64-bit floats. For example, 480_F3_02's
TopFD file with the MS1 3D levels goes from 843 MB to 295 MB and its
TopPIC file from 148 MB to 85 MB (most of what remains in the TopPIC file
is the search database, which is copied as it is). The input file is not
changed. The TopPIC Suite tools themselves do not read compressed files,
so keep the originals if a tool will read them again.

The TopPIC Suite writes the same format: its topfd, topdia, toppic and
topmg compress their databases by default (the suite's own converter,
`topzstd`, also compresses the files of earlier versions and with `-d`
decompresses them).

Upload compressed files as you would the originals, in any combination:
TopFD's and TopPIC's file, both compressed or only one of them. The
**Datasets** table marks each compressed file "(compressed)". The server
needs the extension to read them: `ext/sqlite_zstd/` of the repository
(`npm run fetch-sqlite-zstd`; releases for Linux, macOS and Windows on
x86_64, and for 32-bit ARM Linux), or the library file named by the
environment variable `SQLITE_ZSTD_EXTENSION`. On Apple Silicon and 64-bit
ARM Linux, build the extension from its source (with Rust: `cargo build
--release --features build_extension`) and set `SQLITE_ZSTD_EXTENSION` to
the library in `target/release/`. Without it, an upload of a compressed
file is refused with a message that says how to get the extension.

The Windows release zip (`topmsv-win-<version>.zip`, 2.1.0 and later)
already carries the extension in `ext/sqlite_zstd/`, and `start_server.bat`
downloads it into any other copy that lacks it. Its DLL needs the
Microsoft Visual C++ Redistributable (x64), which most Windows PCs
already have; if an upload of a compressed file still fails, install it
from https://aka.ms/vs/17/release/vc_redist.x64.exe and restart the
server.

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
