# Build the Windows release zip

Package TopMSV for Windows as `topmsv-win-<version>.zip`, where `<version>`
is the `version` field of `package.json` (e.g. `topmsv-win-1.9.0.1.zip`).
The zip holds a `TopMSV` folder with the source tree and a bundled Node.js
in `TopMSV/node`, which `start_server.bat` puts on the PATH; the first run
of the script installs the dependencies and builds the browser scripts.

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

Remove the development-only files:

```bash
cd TopMSV
rm CLAUDE.md
rm ARCHITECTURE.md
rm -rf skills
cd ..
```

Zip the folder, naming the file after the version in `package.json`:

```bash
VERSION=$(node -p "require('./TopMSV/package.json').version")
zip -qr "topmsv-win-$VERSION.zip" TopMSV
ls -l "topmsv-win-$VERSION.zip"
```

Remove the packaged folder, leaving only the zip file in `release`:

```bash
rm -rf TopMSV
```

Notes:

- To ship a different Node.js version, change `v24.21.0` in the download
  URL and in the folder name; TopMSV requires Node.js 24 or newer.
- The clone keeps the `.git` directory, so the zip contains the full
  history; run `rm -rf TopMSV/.git` before zipping to leave it out.
- `start_server.bat` is checked out with CRLF line endings
  (`.gitattributes`), as Windows needs.
