// Dynamic generation of the data_js files (prsms.js, proteins.js and the
// per-item prsm/protein/proteoform files). Nothing is materialized on disk:
// on first request the dataset's inputs are parsed and every PrSM is matched
// once (about a second for the example dataset); the assembled data is cached
// per dataset (small LRU) and each file is serialized from it on demand.

import * as fs from 'fs';
import * as path from 'path';
import { parsePrsmXmlFile } from './convert/toppicXml';
import { parseFasta } from './convert/fasta';
import { MsDataDb } from './convert/msdata';
import { assemblePrsmData } from './convert/convert';
import {
  PrsmData, buildPrsmFilePayload, buildPrsmsIndexPayload, buildProteoformFilePayload,
  buildProteinFilePayload, buildProteinsIndexPayload, serializeDataJs,
} from './convert/builder';
import { DEFAULT_PARAMETERS } from './convert/constants';
import { datasetDir } from './datasets';

export interface DatasetSource {
  all: PrsmData[];                  // every PrSM of the prsm-level cutoff, in XML order
  byId: Map<number, PrsmData>;
  passingClusters: Set<number>;     // clusters passing the proteoform-level cutoff
}

const cache = new Map<string, DatasetSource>();
const MAX_CACHED = 2;

/**
 * Parse and assemble a dataset (cached). Returns null when the dataset does
 * not exist; throws when its input files are invalid.
 */
export function getDatasetSource(ds: string): DatasetSource | null {
  const cached = cache.get(ds);
  if (cached) {
    cache.delete(ds);
    cache.set(ds, cached); // refresh LRU position
    return cached;
  }
  const dir = datasetDir(ds);
  if (!dir) return null;
  const sqlitePath = path.join(dir, 'ms.sqlite');
  const prsmXmlPath = path.join(dir, 'prsm.xml');
  const proteoformXmlPath = path.join(dir, 'proteoform.xml');
  if (!fs.existsSync(sqlitePath) || !fs.existsSync(prsmXmlPath) || !fs.existsSync(proteoformXmlPath)) {
    return null;
  }
  const prsms = parsePrsmXmlFile(fs.readFileSync(prsmXmlPath, 'utf8'));
  const proteoformPrsms = parsePrsmXmlFile(fs.readFileSync(proteoformXmlPath, 'utf8'));
  const fastaPath = path.join(dir, 'db.fasta');
  const fasta = fs.existsSync(fastaPath) ? parseFasta(fs.readFileSync(fastaPath, 'utf8')) : null;
  const db = new MsDataDb(sqlitePath);
  let all: PrsmData[];
  try {
    all = assemblePrsmData(prsms, db, fasta, DEFAULT_PARAMETERS);
  } finally {
    db.close();
  }
  const source: DatasetSource = {
    all,
    byId: new Map(all.map((d) => [d.prsm.prsmId, d])),
    passingClusters: new Set(proteoformPrsms.map((p) => p.proteoClusterId)),
  };
  cache.set(ds, source);
  if (cache.size > MAX_CACHED) {
    const oldest = cache.keys().next().value as string;
    cache.delete(oldest);
  }
  return source;
}

/** The PrSMs visible in one cutoff tree. */
function cutoffData(source: DatasetSource, cutoff: string): PrsmData[] {
  if (cutoff === 'toppic_proteoform_cutoff') {
    return source.all.filter((d) => source.passingClusters.has(d.prsm.proteoClusterId));
  }
  return source.all;
}

/**
 * Build the text of one data_js file, addressed by its path inside the tree
 * (e.g. "prsms.js", "prsms/prsm17.js", "proteins/protein0.js"). Returns null
 * when the dataset or the addressed item does not exist.
 */
export function buildDataJsFile(ds: string, cutoff: string, relPath: string): string | null {
  const source = getDatasetSource(ds);
  if (!source) return null;
  const data = cutoffData(source, cutoff);

  if (relPath === 'prsms.js') {
    return serializeDataJs(buildPrsmsIndexPayload(data));
  }
  if (relPath === 'proteins.js') {
    return serializeDataJs(buildProteinsIndexPayload(data));
  }
  let m = relPath.match(/^prsms\/prsm(\d+)\.js$/);
  if (m) {
    const d = source.byId.get(Number(m[1]));
    if (!d || !data.includes(d)) return null;
    return serializeDataJs(buildPrsmFilePayload(d));
  }
  m = relPath.match(/^proteoforms\/proteoform(\d+)\.js$/);
  if (m) {
    const cid = Number(m[1]);
    const clusterPrsms = data.filter((d) => d.prsm.proteoClusterId === cid);
    if (clusterPrsms.length === 0) return null;
    return serializeDataJs(buildProteoformFilePayload(clusterPrsms));
  }
  m = relPath.match(/^proteins\/protein(\d+)\.js$/);
  if (m) {
    const pid = Number(m[1]);
    const protPrsms = data.filter((d) => d.prsm.protId === pid);
    if (protPrsms.length === 0) return null;
    return serializeDataJs(buildProteinFilePayload(protPrsms, pid));
  }
  return null;
}

export function invalidatePrsmSource(ds: string): void {
  cache.delete(ds);
}
