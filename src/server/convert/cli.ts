// Command-line entry point for the converter (mainly for testing):
//   npm run convert -- --sqlite f.sqlite --out outdir

import { convertDataset } from './convert';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf('--' + name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const sqlitePath = getArg('sqlite');
const outDir = getArg('out');

if (!sqlitePath || !outDir) {
  console.error('usage: convert --sqlite <file> --out <dir>');
  process.exit(1);
}

convertDataset({ sqlitePath, outDir, onProgress: (m) => console.log(m) });
console.log('done');
