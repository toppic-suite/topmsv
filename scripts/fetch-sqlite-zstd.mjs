// Download the sqlite-zstd extension (github.com/phiresky/sqlite-zstd,
// release v0.3.5) for this platform into ext/sqlite_zstd/, where TopMSV
// looks for it (src/server/zstd/extension.ts); `npm run fetch-sqlite-zstd`.
// Uses the system tar to unpack (tar on Windows 10+ also reads zip).
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = 'v0.3.5';
// the release's binaries; none for arm64 (Apple Silicon, 64-bit ARM Linux)
const ASSETS = {
  'linux-x64': 'x86_64-unknown-linux-gnu.tar.gz',
  'linux-arm': 'arm-unknown-linux-gnueabihf.tar.gz',
  'darwin-x64': 'x86_64-apple-darwin.tar.gz',
  'win32-x64': 'x86_64-pc-windows-msvc.zip',
};
const key = `${process.platform}-${process.arch}`;
const asset = ASSETS[key];
if (!asset) {
  console.error(`sqlite-zstd ${VERSION} has no release for ${key}: build it from its source `
    + '(https://github.com/phiresky/sqlite-zstd, with Rust: cargo build --release --features build_extension) '
    + 'and set SQLITE_ZSTD_EXTENSION to the library in target/release/');
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'ext', 'sqlite_zstd');
const url = `https://github.com/phiresky/sqlite-zstd/releases/download/${VERSION}/sqlite_zstd-${VERSION}-${asset}`;
mkdirSync(dir, { recursive: true });
const archive = join(dir, asset);
const res = await fetch(url);
if (!res.ok) {
  console.error(`download failed: ${url}: HTTP ${res.status}`);
  process.exit(1);
}
writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
execFileSync('tar', ['-xf', archive, '-C', dir]);
// the archive holds sqlite_zstd-<version>-<target>/{LICENSE, README.md, library}
const sub = join(dir, `sqlite_zstd-${VERSION}-${asset.replace(/\.(tar\.gz|zip)$/, '')}`);
for (const f of readdirSync(sub)) {
  rmSync(join(dir, f), { force: true });
  renameSync(join(sub, f), join(dir, f));
}
rmSync(sub, { recursive: true, force: true });
rmSync(archive, { force: true });
const lib = readdirSync(dir).find((f) => /sqlite_zstd\.(so|dylib|dll)$/.test(f));
console.log(`sqlite-zstd ${VERSION}: ${join(dir, lib)} (${statSync(join(dir, lib)).size} bytes)`);
