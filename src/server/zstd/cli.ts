// Command-line entry point of the converter (toppic_test experiment 171):
//   npm run compress -- --sqlite <in.sqlite> --out <out.sqlite> [--level <1-22>]
// compresses a TopFD, TopDIA, TopPIC or TopMG file with sqlite-zstd
// (src/server/zstd/compress.ts). The extension: SQLITE_ZSTD_EXTENSION, or
// `npm run fetch-sqlite-zstd`; its own messages: SQLITE_ZSTD_LOG=info.

import { compressDatabase } from './compress';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf('--' + name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const src = getArg('sqlite');
const out = getArg('out');
const level = Number(getArg('level') ?? 3);
if (!src || !out || !Number.isInteger(level) || level < 1 || level > 22) {
  console.error('usage: compress --sqlite <in.sqlite> --out <out.sqlite> [--level <1-22>, default 3]');
  process.exit(1);
}
try {
  const r = compressDatabase(src, out, { level, onProgress: (m) => console.log(m) });
  const mb = (b: number) => (b / 1e6).toFixed(1);
  for (const c of r.columns) {
    console.log(`  ${c.table}.${c.column}: ${mb(c.raw)} -> ${mb(c.stored)} MB`
      + (c.dict ? ` (dictionary ${(c.dict / 1e3).toFixed(1)} kB)` : ' (stored as is)'));
  }
  console.log(`${src}: ${mb(r.bytes.source)} MB -> ${out}: ${mb(r.bytes.output)} MB `
    + `(${(100 * r.bytes.output / r.bytes.source).toFixed(1)}%); BLOB rows ${r.seconds.blobs.toFixed(1)} s, `
    + `compression ${r.seconds.compress.toFixed(1)} s, VACUUM ${r.seconds.vacuum.toFixed(1)} s`);
} catch (err) {
  console.error('compress failed: ' + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
}
