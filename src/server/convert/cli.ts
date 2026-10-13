// Command-line entry point for the converter (mainly for testing):
//   npm run convert -- --sqlite f_toppic.sqlite --topfd-sqlite f.sqlite --out outdir
// (--sqlite: the TopPIC or TopMG file, --topfd-sqlite: the TopFD file it was
// searched with, read together as src/server/sqliteFiles.ts describes)

import { convertDataset } from './convert';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf('--' + name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const sqlitePath = getArg('sqlite');
const topfdSqlitePath = getArg('topfd-sqlite');
const outDir = getArg('out');

if (!sqlitePath || !topfdSqlitePath || !outDir) {
  console.error('usage: convert --sqlite <TopPIC or TopMG file> --topfd-sqlite <TopFD file> --out <dir>');
  process.exit(1);
}

convertDataset({ sqlitePath, topfdSqlitePath, outDir, onProgress: (m) => console.log(m) });
console.log('done');
