// Dataset conversion driver: TopPIC prsm/proteoform XML + TopFD sqlite
// (+ optional FASTA) -> the data_js file trees consumed by the TopMSV viewer.

import * as fs from 'fs';
import * as path from 'path';
import { PROTON_MASS, DEFAULT_PARAMETERS, MatchingParameters } from './constants';
import { parsePrsmXmlFile, PrsmRec } from './toppicXml';
import { parseFasta, resolveProteinSeq, FastaEntry } from './fasta';
import { buildProteoformContext, matchPrsm } from './annotate';
import {
  PrsmData, SpectrumHeaderInfo, buildPrsm, buildPrsmBrief, buildProtein,
  buildCompatibleProteoform, cmpEValueIncProtInc,
} from './builder';
import { MsDataDb } from './msdata';

function writeDataJs(filePath: string, payload: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, 'prsm_data =\n' + JSON.stringify(payload, null, 4) + '\n');
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

/** Generate one data_js tree (e.g. toppic_prsm_cutoff/data_js) from one XML. */
export function generateDataJsTree(
  data: PrsmData[],
  outDir: string,
  onProgress?: (msg: string) => void,
): void {
  const progress = onProgress ?? (() => undefined);

  // Per-prsm files (data_js/prsms/prsm<N>.js) are not written here: they are
  // generated dynamically by the server (src/server/prsmSource.ts).

  // prsms.js (all prsms, brief, in input order)
  writeDataJs(path.join(outDir, 'prsms.js'),
              { prsms: { prsm: data.map(buildPrsmBrief) } });

  // proteoformN.js: prsms grouped by cluster id (across proteins)
  const clusterIds = [...new Set(data.map((d) => d.prsm.proteoClusterId))].sort((a, b) => a - b);
  for (const cid of clusterIds) {
    const clusterPrsms = data.filter((d) => d.prsm.proteoClusterId === cid);
    writeDataJs(path.join(outDir, 'proteoforms', `proteoform${cid}.js`),
                { compatible_proteoform: buildCompatibleProteoform(clusterPrsms, true, true) });
  }
  progress(`wrote ${clusterIds.length} proteoform files`);

  // proteinN.js: prsms grouped by protein id
  const protIds = [...new Set(data.map((d) => d.prsm.protId))].sort((a, b) => a - b);
  for (const pid of protIds) {
    const protPrsms = data.filter((d) => d.prsm.protId === pid);
    writeDataJs(path.join(outDir, 'proteins', `protein${pid}.js`),
                { protein: buildProtein(protPrsms, pid, true, false) });
  }
  progress(`wrote ${protIds.length} protein files`);

  // proteins.js: proteins ordered by their best PrSM (e-value, then name)
  const bestByProt = protIds.map((pid) => {
    const protPrsms = data.filter((d) => d.prsm.protId === pid);
    const best = [...protPrsms].sort(cmpEValueIncProtInc)[0];
    return { pid, best, protPrsms };
  });
  bestByProt.sort((a, b) => cmpEValueIncProtInc(a.best, b.best));
  writeDataJs(path.join(outDir, 'proteins.js'), {
    protein_list: {
      proteins: {
        protein: bestByProt.map((e) => buildProtein(e.protPrsms, e.pid, false, false)),
      },
    },
  });
  progress('wrote proteins.js');
}

export interface ConvertOptions {
  sqlitePath: string;
  prsmXmlPath: string;
  proteoformXmlPath: string;
  fastaPath?: string | null;
  outDir: string; // dataset root; trees are written to <outDir>/<cutoff>/data_js
  parameters?: Partial<MatchingParameters>;
  onProgress?: (msg: string) => void;
}

export function convertDataset(opts: ConvertOptions): void {
  const para: MatchingParameters = { ...DEFAULT_PARAMETERS, ...(opts.parameters ?? {}) };
  const progress = opts.onProgress ?? (() => undefined);
  const db = new MsDataDb(opts.sqlitePath);
  try {
    const fasta = opts.fastaPath ? parseFasta(fs.readFileSync(opts.fastaPath, 'utf8')) : null;

    progress(`parsing ${path.basename(opts.prsmXmlPath)}`);
    const prsms = parsePrsmXmlFile(fs.readFileSync(opts.prsmXmlPath, 'utf8'));
    progress(`matching ${prsms.length} PrSMs`);
    const data = assemblePrsmData(prsms, db, fasta, para);
    generateDataJsTree(data, path.join(opts.outDir, 'toppic_prsm_cutoff', 'data_js'), progress);

    // The proteoform-cutoff tree shows every PrSM whose proteoform passes the
    // proteoform-level FDR cutoff; the proteoform XML defines that cluster set.
    progress(`parsing ${path.basename(opts.proteoformXmlPath)}`);
    const proteoformPrsms = parsePrsmXmlFile(fs.readFileSync(opts.proteoformXmlPath, 'utf8'));
    const passingClusters = new Set(proteoformPrsms.map((p) => p.proteoClusterId));
    const proteoformData = data.filter((d) => passingClusters.has(d.prsm.proteoClusterId));
    progress(`proteoform cutoff keeps ${proteoformData.length} PrSMs in ${passingClusters.size} proteoforms`);
    generateDataJsTree(proteoformData,
                       path.join(opts.outDir, 'toppic_proteoform_cutoff', 'data_js'), progress);
  } finally {
    db.close();
  }
}
