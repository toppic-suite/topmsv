# Build the Windows release zip

Package TopMSV for Windows as `topmsv-win-<version>.zip`, where `<version>`
is the `version` field of `package.json` (e.g. `topmsv-win-2.0.0.0.zip`).
The zip holds a `TopMSV` folder with the source tree, a bundled Node.js
in `TopMSV/node`, which `start_server.bat` puts on the PATH, and the
sqlite-zstd extension in `TopMSV/ext/sqlite_zstd`, which the server needs
to read compressed sqlite files; the first run of the script installs the
dependencies and builds the browser scripts.

Needs `git`, `curl`, `unzip`, `zip` and `node` on the machine that builds
the zip. Run these commands from the root of this repository; the `release`
folder created there is listed in `.gitignore`, and the packaged tree is a
fresh clone rather than the working copy, so uncommitted changes are not
packaged:

```bash
mkdir -p release
cd release
git clone https://github.com/liuxiaowen/topmsv_private.git TopMSV
```

Download Node.js for Windows and put it in `TopMSV/node` so that
`TopMSV/node/node.exe` exists (the archive unpacks into a
`node-v24.21.0-win-x64` folder, which is renamed):

```bash
curl -LO https://nodejs.org/dist/v24.21.0/node-v24.21.0-win-x64.zip
unzip -q node-v24.21.0-win-x64.zip
mv node-v24.21.0-win-x64 TopMSV/node
rm node-v24.21.0-win-x64.zip
```

Download the sqlite-zstd extension for Windows and put it in
`TopMSV/ext/sqlite_zstd` so that `TopMSV/ext/sqlite_zstd/sqlite_zstd.dll`
exists, where the server looks for it (`src/server/zstd/extension.ts`;
the layout `npm run fetch-sqlite-zstd` writes; the archive unpacks into a
`sqlite_zstd-v0.3.5-x86_64-pc-windows-msvc` folder with the DLL, its
LICENSE and README.md, which is renamed):

```bash
curl -LO https://github.com/phiresky/sqlite-zstd/releases/download/v0.3.5/sqlite_zstd-v0.3.5-x86_64-pc-windows-msvc.zip
unzip -q sqlite_zstd-v0.3.5-x86_64-pc-windows-msvc.zip
mkdir -p TopMSV/ext
mv sqlite_zstd-v0.3.5-x86_64-pc-windows-msvc TopMSV/ext/sqlite_zstd
rm sqlite_zstd-v0.3.5-x86_64-pc-windows-msvc.zip
```

Remove the development-only files and the `.git` directory, so the zip
carries no repository history:

```bash
cd TopMSV
rm CLAUDE.md
rm ARCHITECTURE.md
rm -rf skills
rm -rf .git
cd ..
```

Zip the folder, naming the file after the version in `package.json`; a zip
left by an earlier build is deleted first, because `zip` adds to an
existing archive instead of replacing it:

```bash
VERSION=$(node -p "require('./TopMSV/package.json').version")
rm -f "topmsv-win-$VERSION.zip"
zip -qr "topmsv-win-$VERSION.zip" TopMSV
ls -l "topmsv-win-$VERSION.zip"
```

Remove the packaged folder, leaving only the zip file in `release`:

```bash
rm -rf TopMSV
```

Notes:

- To package a tag instead of `main`, check it out right after the clone
  (`git -C TopMSV checkout v2.1.0`); `package.json` at the tag names the
  zip. Releases before 2.1.0 do not read compressed files, so their zips
  need no extension.
- To ship a different Node.js version, change `v24.21.0` in the download
  URL and in the folder name; TopMSV requires Node.js 24 or newer.
- The sqlite-zstd version must be the one `scripts/fetch-sqlite-zstd.mjs`
  downloads (`v0.3.5`). Its DLL needs `VCRUNTIME140.dll` of the Microsoft
  Visual C++ Redistributable (x64), which the bundled Node.js does not
  bring (node.exe links the C runtime statically); most Windows PCs
  already have it. `start_server.bat` warns when it is missing, the
  server's error names it (`src/server/zstd/extension.ts`), and the
  README says where to get it.
- `start_server.bat` and `stop_server.bat` are checked out with CRLF line
  endings (`.gitattributes`), as Windows needs.
