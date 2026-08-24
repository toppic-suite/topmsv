// Command-line entry point for the converter (mainly for testing):
//   npm run convert -- --sqlite f.sqlite --prsm p.xml --proteoform q.xml \
//                      [--fasta db.fasta] --out outdir

import { convertDataset } from './convert';

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf('--' + name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const sqlitePath = getArg('sqlite');
const prsmXmlPath = getArg('prsm');
const proteoformXmlPath = getArg('proteoform');
const fastaPath = getArg('fasta') ?? null;
const outDir = getArg('out');

if (!sqlitePath || !prsmXmlPath || !proteoformXmlPath || !outDir) {
  console.error('usage: convert --sqlite <file> --prsm <xml> --proteoform <xml> [--fasta <fasta>] --out <dir>');
  process.exit(1);
}

convertDataset({
  sqlitePath, prsmXmlPath, proteoformXmlPath, fastaPath, outDir,
  onProgress: (m) => console.log(m),
});
console.log('done');
