# Build the Windows release zip

Package TopMSV for Windows as `topmsv-win-<version>.zip`, where `<version>`
is the `version` field of `package.json` (e.g. `topmsv-win-2.0.0.0.zip`).
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

- To ship a different Node.js version, change `v24.21.0` in the download
  URL and in the folder name; TopMSV requires Node.js 24 or newer.
- `start_server.bat` and `stop_server.bat` are checked out with CRLF line
  endings (`.gitattributes`), as Windows needs.
