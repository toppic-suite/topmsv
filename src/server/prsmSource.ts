// Dynamic generation of the data_js files (prsms.js, proteins.js and the
// per-item prsm/protein/proteoform files). Nothing is materialized on disk:
// on first request the identification tables of the dataset's sqlite are
// read and every PrSM is matched once (about a second for the example
// dataset); the assembled data is cached per dataset (small LRU) and each
// file is serialized from it on demand.

import * as fs from 'fs';
import * as path from 'path';
import { MsDataDb } from './convert/msdata';
import { loadIdentifications } from './convert/convert';
import {
  PrsmData, buildPrsmFilePayload, buildPrsmsIndexPayload, buildProteoformFilePayload,
  buildProteinFilePayload, buildProteinsIndexPayload, serializeDataJs,
} from './convert/builder';
import { DEFAULT_PARAMETERS } from './convert/constants';
import { datasetDir, readMeta, MS_DB_FILE } from './datasets';

export interface DatasetSource {
  all: PrsmData[];                  // every PrSM of the prsm-level cutoff, in prsm_id order
  byId: Map<number, PrsmData>;
  passingClusters: Set<number>;     // clusters passing the proteoform-level cutoff
}

const cache = new Map<string, DatasetSource>();
const MAX_CACHED = 2;

/**
 * Read and assemble a dataset's identifications (cached). Returns null when
 * the dataset does not exist or its sqlite has no identification tables
 * (every data_js request then 404s, which the viewer pages report as "no
 * identification data"); throws when the tables are invalid.
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
  const sqlitePath = path.join(dir, MS_DB_FILE);
  if (!fs.existsSync(sqlitePath)) return null;
  const fileName = readMeta(ds)?.name ?? ds;
  const db = new MsDataDb(sqlitePath);
  let loaded: { all: PrsmData[]; passingClusters: Set<number> } | null;
  try {
    loaded = loadIdentifications(db, fileName, DEFAULT_PARAMETERS);
  } finally {
    db.close();
  }
  if (!loaded) return null;
  const source: DatasetSource = {
    all: loaded.all,
    byId: new Map(loaded.all.map((d) => [d.prsm.prsmId, d])),
    passingClusters: loaded.passingClusters,
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
