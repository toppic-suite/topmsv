// Dynamic generation of data_js/prsms/prsm<N>.js files. Instead of writing
// one static file per PrSM at conversion time, the parsed dataset inputs are
// cached per dataset and a single PrSM record is matched and serialized on
// request (a few milliseconds each).

import * as fs from 'fs';
import * as path from 'path';
import { parsePrsmXmlFile, PrsmRec } from './convert/toppicXml';
import { parseFasta, FastaEntry } from './convert/fasta';
import { MsDataDb } from './convert/msdata';
import { assemblePrsmData } from './convert/convert';
import { buildPrsm } from './convert/builder';
import { DEFAULT_PARAMETERS } from './convert/constants';
import { datasetDir } from './datasets';

interface DatasetPrsmSource {
  byId: Map<number, PrsmRec>;
  passingClusters: Set<number>;
  fasta: Map<string, FastaEntry> | null;
  db: MsDataDb;
}

const cache = new Map<string, DatasetPrsmSource>();
const MAX_CACHED = 2;

function getSource(ds: string): DatasetPrsmSource | null {
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
  const source: DatasetPrsmSource = {
    byId: new Map(prsms.map((p) => [p.prsmId, p])),
    passingClusters: new Set(proteoformPrsms.map((p) => p.proteoClusterId)),
    fasta: fs.existsSync(fastaPath) ? parseFasta(fs.readFileSync(fastaPath, 'utf8')) : null,
    db: new MsDataDb(sqlitePath),
  };
  cache.set(ds, source);
  if (cache.size > MAX_CACHED) {
    const oldest = cache.keys().next().value as string;
    const old = cache.get(oldest);
    cache.delete(oldest);
    try { old?.db.close(); } catch { /* ignore */ }
  }
  return source;
}

/** Build the prsm<N>.js text for one PrSM, or null if it does not exist. */
export function buildPrsmJs(ds: string, cutoff: string, prsmId: number): string | null {
  const source = getSource(ds);
  if (!source) return null;
  const rec = source.byId.get(prsmId);
  if (!rec) return null;
  if (cutoff === 'toppic_proteoform_cutoff' && !source.passingClusters.has(rec.proteoClusterId)) {
    return null; // this PrSM's proteoform did not pass the proteoform-level cutoff
  }
  const [data] = assemblePrsmData([rec], source.db, source.fasta, DEFAULT_PARAMETERS);
  return 'prsm_data =\n' + JSON.stringify({ prsm: buildPrsm(data, true) }, null, 4) + '\n';
}

export function invalidatePrsmSource(ds: string): void {
  const source = cache.get(ds);
  if (source) {
    cache.delete(ds);
    try { source.db.close(); } catch { /* ignore */ }
  }
}
