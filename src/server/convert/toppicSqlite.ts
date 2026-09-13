// Reader for the identification tables TopPIC writes into the TopFD sqlite
// (toppic-suite src/prsm/prsm_sql_writer.cpp, src/seq/fasta_sql_writer.cpp):
//   prsm             one row per PrSM of the PrSM-level cutoff (TSV columns;
//                    first_residue / last_residue are 1-based)
//   prsm_mass_shift  every mass shift of those PrSMs: 0-based region-local
//                    break points, mass, TopPIC alteration type name and the
//                    annotation string (PTM abbreviation, or the signed
//                    4-decimal value of an unexpected shift)
//   proteoform       one row per proteoform of the proteoform-level cutoff
//   fasta_seq        the search database (name, description, sequence)

import { DatabaseSync } from 'node:sqlite';
import { AlterTypeName, MassShiftRec, PrsmRec } from './prsmRecord';
import { FastaEntry } from './fasta';
import { fixedToString } from './format';

const ALTER_TYPES: AlterTypeName[] = ['Fixed', 'Protein variable', 'Variable', 'Unexpected'];

function tableNames(db: DatabaseSync): Set<string> {
  return new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[])
      .map((r) => r.name),
  );
}

/** Whether the sqlite holds TopPIC identifications (prsm + proteoform tables). */
export function dbHasIdentifications(db: DatabaseSync): boolean {
  const t = tableNames(db);
  return t.has('prsm') && t.has('proteoform') && t.has('prsm_mass_shift');
}

/** Whether the sqlite holds the search database (fasta_seq table with rows). */
export function dbHasFasta(db: DatabaseSync): boolean {
  if (!tableNames(db).has('fasta_seq')) return false;
  return (db.prepare('SELECT COUNT(*) AS n FROM fasta_seq').get() as { n: number }).n > 0;
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Every PrSM of the PrSM-level cutoff, in prsm_id order. Protein ids are
 * assigned by first appearance (the sqlite stores protein names only).
 * @param fileName - spectrum file name shown on the PrSM pages
 */
export function readPrsms(db: DatabaseSync, fileName: string): PrsmRec[] {
  const shiftRows = db.prepare(
    'SELECT prsm_id, left_position, right_position, mass, type, annotation FROM prsm_mass_shift ORDER BY prsm_id, shift_index',
  ).all() as any[];
  const shiftsByPrsm = new Map<number, MassShiftRec[]>();
  for (const r of shiftRows) {
    let list = shiftsByPrsm.get(r.prsm_id);
    if (!list) { list = []; shiftsByPrsm.set(r.prsm_id, list); }
    const typeName: AlterTypeName = ALTER_TYPES.includes(r.type) ? r.type : 'Unexpected';
    const mass = Number(r.mass);
    list.push({
      leftBp: Number(r.left_position),
      rightBp: Number(r.right_position),
      shift: mass,
      shiftRaw: fixedToString(mass, 10),
      alterations: [{
        leftBp: Number(r.left_position),
        rightBp: Number(r.right_position),
        typeName,
        mass,
        massRaw: fixedToString(mass, 10),
        ptmAbbr: typeName === 'Unexpected' ? 'No PTM' : String(r.annotation),
        ptmUnimod: '-1',
      }],
    });
  }

  const protIds = new Map<string, number>();
  const rows = db.prepare('SELECT * FROM prsm ORDER BY prsm_id').all() as any[];
  return rows.map((r): PrsmRec => {
    const scans = String(r.scans).trim().split(/\s+/).filter((s) => s !== '');
    let protId = protIds.get(r.protein_name);
    if (protId === undefined) {
      protId = protIds.size;
      protIds.set(r.protein_name, protId);
    }
    return {
      fileName,
      prsmId: Number(r.prsm_id),
      spectrumId: Number(r.spectrum_id),
      spectrumScan: num(scans[0], -1),
      spectrumNumber: Math.max(1, scans.length),
      oriPrecMass: Number(r.precursor_mass),
      adjustedPrecMass: Number(r.adjusted_precursor_mass),
      matchPeakNum: Number(r.matched_peak_num),
      matchFragNum: Number(r.matched_fragment_num),
      fdr: r.spectrum_fdr === null ? -1 : Number(r.spectrum_fdr),
      proteoformFdr: r.proteoform_fdr === null ? -1 : Number(r.proteoform_fdr),
      fracFeatureInte: r.feature_intensity === null ? 0 : Number(r.feature_intensity),
      seqName: String(r.protein_name),
      seqDesc: String(r.protein_description ?? ''),
      protModName: String(r.n_terminal_form),
      startPos: Number(r.first_residue) - 1,
      endPos: Number(r.last_residue) - 1,
      proteoClusterId: Number(r.proteoform_id),
      protId,
      unexpectedPtmNum: Number(r.unexpected_mod_num),
      matchSeq: String(r.proteoform),
      dbSeq: String(r.protein_sequence),
      massShifts: shiftsByPrsm.get(Number(r.prsm_id)) ?? [],
      pValue: NaN,
      eValue: Number(r.e_value),
    };
  });
}

/** Proteoform (cluster) ids passing the proteoform-level cutoff. */
export function readPassingClusters(db: DatabaseSync): Set<number> {
  const rows = db.prepare('SELECT DISTINCT proteoform_id FROM proteoform').all() as { proteoform_id: number }[];
  return new Set(rows.map((r) => Number(r.proteoform_id)));
}

/** The search database entries of the given protein names (from fasta_seq). */
export function readFastaEntries(db: DatabaseSync, names: Iterable<string>): Map<string, FastaEntry> {
  const map = new Map<string, FastaEntry>();
  if (!tableNames(db).has('fasta_seq')) return map;
  const stmt = db.prepare('SELECT name, description, sequence FROM fasta_seq WHERE name = ?');
  for (const name of new Set(names)) {
    const r = stmt.get(name) as { name: string; description: string; sequence: string } | undefined;
    if (r) map.set(r.name, { name: r.name, desc: r.description ?? '', seq: String(r.sequence).toUpperCase() });
  }
  return map;
}
