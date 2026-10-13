// Command-line entry point for the converter (mainly for testing):
//   npm run convert -- --sqlite f.sqlite --out outdir
//   npm run convert -- --sqlite f_toppic.sqlite --topfd-sqlite f.sqlite --out outdir
// (--topfd-sqlite: the TopFD file of a TopPIC file with the MS/MS envelope
// tables only, src/server/sqliteFiles.ts)

import { convertDataset } from './convert';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf('--' + name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const sqlitePath = getArg('sqlite');
const topfdSqlitePath = getArg('topfd-sqlite');
const outDir = getArg('out');

if (!sqlitePath || !outDir) {
  console.error('usage: convert --sqlite <file> [--topfd-sqlite <TopFD file>] --out <dir>');
  process.exit(1);
}

convertDataset({ sqlitePath, topfdSqlitePath, outDir, onProgress: (m) => console.log(m) });
console.log('done');
