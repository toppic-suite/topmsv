// The checks of the upload form (home.ts), run in the browser on the
// selected files before anything is uploaded (sqlite_reader.ts reads only
// the pages they need). They follow the server's checkDataset
// (src/server/datasets.ts), which checks the uploaded files again in full:
// - the first file is TopFD's or TopDIA's: it has the spectra, the MS1 peaks
//   with their 3D level (ms1_peak.LEVEL) and the MS/MS spectra's links to
//   their MS1 spectrum (ms2_spectrum.ms1_id), which tell a TopDIA file (no
//   MS/MS spectrum linked) from a TopFD file (home.ts compares the tool
//   with the dataset type chosen in the form); older files lack one or both;
// - the second file is TopPIC's or TopMG's, as the dataset type names (the
//   files of the two hold the same identification tables), and belongs to
//   the TopFD file: with every table (toppic --mass-calib) it has
//   the TopFD file's MS/MS spectra (the same ids and scans), else it has
//   TopFD's MS/MS envelopes (spec_id, env_id, mono_mass), which TopPIC and
//   TopMG copy in rowid order: the rows at 64 rowids spread over TopFD's are
//   compared, and only when one differs is every envelope looked for. A
//   compressed file (npm run compress) stores the envelopes compressed,
//   which only the server reads: the number of envelopes of each spectrum
//   is compared instead (TopPIC's at least TopFD's, of TopFD's spectra).

/** The first file of the form. */
interface SpectraFileInfo {
  reader: SqliteFileReader;
  tool: 'TopFD' | 'TopDIA';
  ms1Num: number;
  ms2Scans: Map<number, number>;       // MS/MS spectrum id -> scan
}

/** The second file of the form, which belongs to the first. */
interface SearchFileInfo {
  tool: 'TopPIC' | 'TopMG';
  note: string;                        // how the pairing was checked
}

const IDENTIFICATION_TABLES = ['prsm', 'proteoform', 'prsm_mass_shift'];
const ENVELOPE_SAMPLES = 64;
const OLD_SPECTRA_FILE = 'it was written by an older TopFD or TopDIA version, which TopMSV does not support: '
  + 'deconvolute the spectra again with the current TopFD or TopDIA';

/** The columns of a per-spectrum table: a table's, or those a compressed file records in zstd_blob_columns. */
async function spectrumTableColumns(r: SqliteFileReader, name: string): Promise<string[] | null> {
  const t = await r.table(name);
  if (t) return t.columns;
  const codecs = await r.table('zstd_blob_columns');
  if (!codecs) return null;
  const columns: string[] = [];
  await r.rows(codecs, ['tbl', 'col'], ([tbl, col]) => {
    if (tbl === name) columns.push(String(col));
  });
  return columns.length > 0 ? columns : null;
}

/**
 * Whether a file's spectra are in the current layout: the MS/MS spectra
 * linked to their MS1 spectrum (ms2_spectrum.ms1_id) and the MS1 peaks with
 * their 3D level (ms1_peak.LEVEL).
 */
async function hasCurrentLayout(r: SqliteFileReader, ms2: SqliteTable): Promise<boolean> {
  const ms1Peak = await spectrumTableColumns(r, 'ms1_peak');
  return ms2.columns.some((c) => c.toLowerCase() === 'ms1_id')
    && ms1Peak !== null && ms1Peak.some((c) => c.toLowerCase() === 'level');
}

/**
 * The number of MS/MS envelopes of each spectrum: the rows of ms2_env, or
 * in a compressed file the row count n of each spectrum's BLOB row, which
 * sqlite-zstd keeps uncompressed in the table under the view ms2_env_blob
 * (_ms2_env_blob_zstd). null without MS/MS envelopes.
 */
async function envelopeCounts(r: SqliteFileReader): Promise<Map<number, number> | null> {
  const counts = new Map<number, number>();
  const rows = await r.table('ms2_env');
  if (rows) {
    await r.rows(rows, ['spec_id'], ([spec]) => {
      counts.set(spec as number, (counts.get(spec as number) ?? 0) + 1);
    });
    return counts;
  }
  const blob = (await r.table('_ms2_env_blob_zstd')) ?? (await r.table('ms2_env_blob'));
  if (!blob) return null;
  await r.rows(blob, ['spec_id', 'n'], ([spec, n]) => { counts.set(spec as number, n as number); });
  return counts;
}

/** Inspects the first file of the form; throws an Error naming the problem. */
async function inspectSpectraFile(file: File): Promise<SpectraFileInfo> {
  const r = await SqliteFileReader.open(file);
  const tables = await r.tableNames();
  const identifications = IDENTIFICATION_TABLES.every((t) => tables.has(t));
  const ms1 = await r.table('ms1_spectrum');
  const ms2 = await r.table('ms2_spectrum');
  if (!ms1 || !ms2 || !(await spectrumTableColumns(r, 'ms1_peak'))) {
    throw new Error(identifications
      ? 'it is a TopPIC or TopMG file: choose the dataset type TopFD + TopPIC or TopFD + TopMG, select it as the '
        + 'second file and the TopFD file it was searched with here'
      : 'it is not a TopFD or TopDIA file: it lacks the spectra (the tables ms1_spectrum, ms2_spectrum, ms1_peak)');
  }
  if (!(await hasCurrentLayout(r, ms2))) throw new Error(OLD_SPECTRA_FILE);
  if (identifications) {
    // toppic --mass-calib writes the corrected copy of every table
    throw new Error('it holds identifications (the tables prsm, proteoform, prsm_mass_shift): it is a TopPIC or '
      + 'TopMG file. Choose the dataset type TopFD + TopPIC or TopFD + TopMG, select it as the second file and '
      + 'the TopFD file it was searched with here');
  }
  let ms1Num = 0;
  await r.rows(ms1, ['id'], () => { ms1Num++; });
  const ms2Scans = new Map<number, number>();
  let linked = 0;
  await r.rows(ms2, ['id', 'scan', 'ms1_id'], ([id, scan, ms1Id]) => {
    ms2Scans.set(id as number, scan as number);
    if (typeof ms1Id === 'number' && ms1Id >= 0) linked++;
  });
  // TopDIA deconvolutes the DIA MS/MS windows without their MS1 scan
  const topdia = ms1Num > 0 && ms2Scans.size > 0 && linked === 0;
  return { reader: r, tool: topdia ? 'TopDIA' : 'TopFD', ms1Num, ms2Scans };
}

/**
 * Checks that the second file of the form is a file of the tool the dataset
 * type names (TopPIC or TopMG) and belongs to the TopFD file; throws an
 * Error naming the problem.
 */
async function checkSearchFile(file: File, spectra: SpectraFileInfo, tool: 'TopPIC' | 'TopMG'): Promise<SearchFileInfo> {
  const r = await SqliteFileReader.open(file);
  const tables = await r.tableNames();
  const missing = IDENTIFICATION_TABLES.filter((t) => !tables.has(t));
  if (missing.length > 0) {
    throw new Error(`it is not a ${tool} file: it lacks the identification table${missing.length > 1 ? 's' : ''} `
      + missing.join(', '));
  }
  const mismatch = `the ${tool} file does not belong to the TopFD file: `;

  // toppic --mass-calib: the corrected copy of every table
  const ms2 = await r.table('ms2_spectrum');
  if (ms2) {
    if (!(await hasCurrentLayout(r, ms2))) {
      throw new Error(`it was written by an older ${tool} version, which TopMSV does not support: search the `
        + `spectra again with the current ${tool}`);
    }
    let num = 0;
    let same = 0;
    await r.rows(ms2, ['id', 'scan'], ([id, scan]) => {
      num++;
      if (spectra.ms2Scans.get(id as number) === scan) same++;
    });
    if (num !== spectra.ms2Scans.size || same !== num) {
      throw new Error(mismatch + `${num} and ${spectra.ms2Scans.size} MS/MS spectra, ${same} with the same id and scan`);
    }
    return { tool, note: 'the same MS/MS spectra' };
  }

  const env = await r.table('ms2_env');
  const topfdEnv = await spectra.reader.table('ms2_env');
  if (!env || !topfdEnv) {
    // a compressed file: the number of envelopes of each spectrum
    const counts = await envelopeCounts(r);
    if (!counts) throw new Error(`it lacks the MS/MS envelopes (the table ms2_env) that ${tool} copies from the TopFD file`);
    const topfdCounts = await envelopeCounts(spectra.reader);
    if (!topfdCounts) throw new Error('the TopFD file lacks the MS/MS envelopes (the table ms2_env)');
    let fewer = 0;
    for (const [spec, n] of topfdCounts) if ((counts.get(spec) ?? 0) < n) fewer++;
    if (fewer > 0) {
      throw new Error(mismatch + `${fewer} MS/MS spectra have fewer envelopes in the ${tool} file than in the TopFD file`);
    }
    let foreign = 0;
    for (const [spec, n] of counts) if (!spectra.ms2Scans.has(spec)) foreign += n;
    if (foreign > 0) {
      throw new Error(mismatch + `${foreign} MS/MS envelopes of the ${tool} file belong to no spectrum of the TopFD file`);
    }
    return { tool, note: 'the number of MS/MS envelopes of each spectrum; the server compares the compressed '
      + 'envelopes after the upload' };
  }
  const cols = ['spec_id', 'env_id', 'mono_mass'];
  const last = await spectra.reader.lastRowid(topfdEnv);
  if (last !== null) {
    let sampled = 0;
    let same = 0;
    for (let i = 0; i < ENVELOPE_SAMPLES; i++) {
      const rowid = 1 + Math.round((i * (last - 1)) / (ENVELOPE_SAMPLES - 1));
      const a = await spectra.reader.row(topfdEnv, rowid, cols);
      if (!a) continue;
      sampled++;
      const b = await r.row(env, rowid, cols);
      if (b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) same++;
      else break;
    }
    if (sampled > 0 && same === sampled) return { tool, note: 'the TopFD file\'s MS/MS envelopes' };
  }
  // every envelope, by spectrum
  const keys = new Set<string>();
  let foreign = 0;
  await r.rows(env, cols, ([spec, envId, mono]) => {
    keys.add(spec + ':' + envId + ':' + mono);
    if (!spectra.ms2Scans.has(spec as number)) foreign++;
  });
  let lost = 0;
  await spectra.reader.rows(topfdEnv, cols, ([spec, envId, mono]) => {
    if (!keys.has(spec + ':' + envId + ':' + mono)) lost++;
  });
  if (lost > 0) throw new Error(mismatch + `${lost} MS/MS envelopes of the TopFD file are not in the ${tool} file`);
  if (foreign > 0) {
    throw new Error(mismatch + `${foreign} MS/MS envelopes of the ${tool} file belong to no spectrum of the TopFD file`);
  }
  return { tool, note: 'the TopFD file\'s MS/MS envelopes' };
}
