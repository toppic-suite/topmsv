// Dataset conversion driver: the TopPIC sqlite (TopFD results +
// identification tables + search database) -> the data_js file trees
// consumed by the TopMSV viewer.

import * as fs from 'fs';
import * as path from 'path';
import { PROTON_MASS, DEFAULT_PARAMETERS, MatchingParameters } from './constants';
import { PrsmRec } from './prsmRecord';
import { dbHasIdentifications, readPrsms, readPassingClusters, readFastaEntries } from './toppicSqlite';
import { resolveProteinSeq, FastaEntry } from './fasta';
import { buildProteoformContext, matchPrsm } from './annotate';
import {
  PrsmData, SpectrumHeaderInfo, buildPrsmFilePayload, buildPrsmsIndexPayload,
  buildProteoformFilePayload, buildProteinFilePayload, buildProteinsIndexPayload,
  serializeDataJs,
} from './builder';
import { MsDataDb } from './msdata';

function writeDataJs(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, serializeDataJs(payload));
}

function derivePrecursorCharge(oriPrecMass: number, targetMz: number): number {
  if (targetMz > 0) {
    const z = Math.round(oriPrecMass / (targetMz - PROTON_MASS));
    if (z >= 1) return z;
  }
  return 1;
}

/** Assemble PrsmData (matching + headers) for every record of one XML file. */
export function assemblePrsmData(
  prsms: PrsmRec[],
  db: MsDataDb,
  fasta: Map<string, FastaEntry> | null,
  para: MatchingParameters,
): PrsmData[] {
  const out: PrsmData[] = [];
  for (const prsm of prsms) {
    const fullSeq = resolveProteinSeq(fasta, prsm.seqName, prsm.protModName,
                                      prsm.startPos, prsm.dbSeq);
    const ctx = buildProteoformContext(prsm, fullSeq);

    // spectrum set: spectrum_number consecutive MS2 spectra starting at spectrum_id
    const specIds: number[] = [];
    for (let k = 0; k < Math.max(1, prsm.spectrumNumber); k++) {
      specIds.push(prsm.spectrumId + k);
    }
    const headers: SpectrumHeaderInfo[] = [];
    const spectra = [];
    for (const specId of specIds) {
      const row = db.getMs2Spectrum(specId);
      if (!row) throw new Error(`MS2 spectrum id ${specId} (prsm ${prsm.prsmId}) not found in sqlite file`);
      const ms1Id = row.ms1_id ?? -1;
      headers.push({
        specId,
        scan: row.scan,
        ms1Id,
        ms1Scan: ms1Id >= 0 ? (db.getMs1Scan(ms1Id) ?? -1) : -1,
        precursorCharge: derivePrecursorCharge(prsm.oriPrecMass, row.target_mz),
      });
      spectra.push({
        specId,
        deconvPeaks: db.getMs2DeconvPeaks(specId),
        nIonType: row.n_ion_type || 'B',
        cIonType: row.c_ion_type || 'Y',
      });
    }
    const matches = matchPrsm(prsm, ctx, spectra, para);
    out.push({ prsm, ctx, fullSeq, headers, matches });
  }
  return out;
}

/**
 * Generate one data_js tree (e.g. toppic_prsm_cutoff/data_js) from one XML.
 * Only used by the CLI for validation against TopPIC's own output; at runtime
 * every one of these files is generated dynamically (src/server/prsmSource.ts)
 * from the same payload builders.
 */
export function generateDataJsTree(
  data: PrsmData[],
  outDir: string,
  onProgress?: (msg: string) => void,
): void {
  const progress = onProgress ?? (() => undefined);

  for (const d of data) {
    writeDataJs(path.join(outDir, 'prsms', `prsm${d.prsm.prsmId}.js`), buildPrsmFilePayload(d));
  }
  progress(`wrote ${data.length} prsm files`);

  writeDataJs(path.join(outDir, 'prsms.js'), buildPrsmsIndexPayload(data));

  const clusterIds = [...new Set(data.map((d) => d.prsm.proteoClusterId))].sort((a, b) => a - b);
  for (const cid of clusterIds) {
    const clusterPrsms = data.filter((d) => d.prsm.proteoClusterId === cid);
    writeDataJs(path.join(outDir, 'proteoforms', `proteoform${cid}.js`),
                buildProteoformFilePayload(clusterPrsms));
  }
  progress(`wrote ${clusterIds.length} proteoform files`);

  const protIds = [...new Set(data.map((d) => d.prsm.protId))].sort((a, b) => a - b);
  for (const pid of protIds) {
    const protPrsms = data.filter((d) => d.prsm.protId === pid);
    writeDataJs(path.join(outDir, 'proteins', `protein${pid}.js`),
                buildProteinFilePayload(protPrsms, pid));
  }
  progress(`wrote ${protIds.length} protein files`);

  writeDataJs(path.join(outDir, 'proteins.js'), buildProteinsIndexPayload(data));
  progress('wrote proteins.js');
}

/**
 * Read and match every PrSM of an open sqlite. Returns null when the file
 * has no identification tables.
 */
export function loadIdentifications(
  db: MsDataDb,
  fileName: string,
  para: MatchingParameters,
): { all: PrsmData[]; passingClusters: Set<number> } | null {
  const raw = db.raw();
  if (!dbHasIdentifications(raw)) return null;
  const prsms = readPrsms(raw, fileName);
  const fasta = readFastaEntries(raw, prsms.map((p) => p.seqName));
  const all = assemblePrsmData(prsms, db, fasta.size > 0 ? fasta : null, para);
  return { all, passingClusters: readPassingClusters(raw) };
}

export interface ConvertOptions {
  sqlitePath: string;
  outDir: string; // dataset root; trees are written to <outDir>/<cutoff>/data_js
  parameters?: Partial<MatchingParameters>;
  onProgress?: (msg: string) => void;
}

export function convertDataset(opts: ConvertOptions): void {
  const para: MatchingParameters = { ...DEFAULT_PARAMETERS, ...(opts.parameters ?? {}) };
  const progress = opts.onProgress ?? (() => undefined);
  const db = new MsDataDb(opts.sqlitePath);
  try {
    progress(`reading identifications from ${path.basename(opts.sqlitePath)}`);
    const loaded = loadIdentifications(db, path.basename(opts.sqlitePath), para);
    if (!loaded) throw new Error('the sqlite file has no identification tables (prsm, proteoform, prsm_mass_shift)');
    const { all: data, passingClusters } = loaded;
    progress(`matched ${data.length} PrSMs`);
    generateDataJsTree(data, path.join(opts.outDir, 'toppic_prsm_cutoff', 'data_js'), progress);

    // The proteoform-cutoff tree shows every PrSM whose proteoform passes the
    // proteoform-level FDR cutoff; the proteoform table defines that cluster set.
    const proteoformData = data.filter((d) => passingClusters.has(d.prsm.proteoClusterId));
    progress(`proteoform cutoff keeps ${proteoformData.length} PrSMs in ${passingClusters.size} proteoforms`);
    generateDataJsTree(proteoformData,
                       path.join(opts.outDir, 'toppic_proteoform_cutoff', 'data_js'), progress);
  } finally {
    db.close();
  }
}
