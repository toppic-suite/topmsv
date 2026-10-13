// The MS1 scan of each MS/MS spectrum of a TopDIA file (toppic_test
// experiment 170). TopDIA deconvolutes the DIA MS/MS windows without their
// MS1 scan, so its ms2_spectrum.ms1_id is -1 for every window, and the
// spectra browser, which links its MS1 and MS2 panels through ms1_id, would
// show no MS/MS spectrum for any MS1 scan. In DIA data an MS1 scan is
// followed by the windows of its cycle, so the MS1 scan of a window is the
// last MS1 scan before it (by scan number); an MS1 scan's MS/MS spectra are
// the windows up to the next MS1 scan. The two API answers that carry the
// link (/api/ms2-info/:id's ms1_id and /api/ms2-id-by-ms1/:id) use these
// links for a dataset of type 'topdia' (src/server/routes/dataset.ts).

import { DatabaseSync } from 'node:sqlite';

export interface DiaLinks {
  ms1IdOfMs2: Map<number, number>;   // MS/MS spectrum id -> its MS1 spectrum id (-1 before the first MS1 scan)
  firstMs2OfMs1: Map<number, number>; // MS1 spectrum id -> the smallest id of its MS/MS spectra
}

const cache = new WeakMap<DatabaseSync, DiaLinks>();

/** The links of a dataset's spectra, computed once per database handle. */
export function diaLinks(db: DatabaseSync): DiaLinks {
  const cached = cache.get(db);
  if (cached) return cached;
  const ms1 = db.prepare('SELECT id, scan FROM ms1_spectrum ORDER BY scan, id').all() as { id: number; scan: number }[];
  const ms2 = db.prepare('SELECT id, scan FROM ms2_spectrum ORDER BY scan, id').all() as { id: number; scan: number }[];
  const links: DiaLinks = { ms1IdOfMs2: new Map(), firstMs2OfMs1: new Map() };
  let k = -1;
  for (const s of ms2) {
    while (k + 1 < ms1.length && ms1[k + 1].scan < s.scan) k++;
    const ms1Id = k >= 0 ? ms1[k].id : -1;
    links.ms1IdOfMs2.set(s.id, ms1Id);
    if (ms1Id >= 0) {
      const first = links.firstMs2OfMs1.get(ms1Id);
      if (first === undefined || s.id < first) links.firstMs2OfMs1.set(ms1Id, s.id);
    }
  }
  cache.set(db, links);
  return links;
}
