// Reader for TopPIC PrSM result XML files (st_1_ms2_toppic_prsm.xml /
// st_1_ms2_toppic_proteoform.xml). The files contain only elements with text
// content and no attributes, so a small dedicated parser is used; raw text is
// preserved so that values TopPIC printed with toString(double) can be copied
// into the output verbatim.

import { XMLParser } from 'fast-xml-parser';

export type AlterTypeName = 'Fixed' | 'Protein variable' | 'Variable' | 'Unexpected';

export interface AlterationRec {
  leftBp: number;        // proteoform-region-local break point positions
  rightBp: number;
  typeName: AlterTypeName;
  mass: number;
  massRaw: string;       // 10-decimal string exactly as in the XML
  ptmAbbr: string;       // mod_residue ptm abbreviation ("No PTM" when none)
  ptmUnimod: string;
}

export interface MassShiftRec {
  leftBp: number;
  rightBp: number;
  shift: number;
  shiftRaw: string;
  alterations: AlterationRec[];
}

export interface PrsmRec {
  fileName: string;
  prsmId: number;
  spectrumId: number;
  spectrumScan: number;
  spectrumNumber: number;
  oriPrecMass: number;
  adjustedPrecMass: number;
  matchPeakNum: number;
  matchFragNum: number;
  fdr: number;
  proteoformFdr: number;
  fracFeatureInte: number;
  seqName: string;
  seqDesc: string;
  protModName: string;
  startPos: number;
  endPos: number;
  proteoClusterId: number;
  protId: number;
  unexpectedPtmNum: number;
  matchSeq: string;
  dbSeq: string;
  massShifts: MassShiftRec[];
  pValue: number;
  eValue: number;
}

function asArray<T>(x: T | T[] | undefined): T[] {
  if (x === undefined || x === null) return [];
  return Array.isArray(x) ? x : [x];
}

// Port of ExpectedValue::init(): p/e values are recomputed from the stored
// components in full double precision (the XML's derived p_value / e_value
// elements are rounded and can differ in the last digit).
function computeExpectedValues(ev: any): { pValue: number; eValue: number } {
  if (!ev) return { pValue: NaN, eValue: NaN };
  const oneProtProb = Number(ev.one_protein_probability);
  const testNum = Number(ev.test_number);
  const adjustFactor = Number(ev.adjust_factor);
  if (!isFinite(oneProtProb) || !isFinite(testNum) || !isFinite(adjustFactor)) {
    return { pValue: Number(ev.p_value ?? NaN), eValue: Number(ev.e_value ?? NaN) };
  }
  const eValue = oneProtProb * testNum * adjustFactor;
  let pValue: number;
  const MAX_DOUBLE = 1e300;
  if (oneProtProb >= 1 || testNum === MAX_DOUBLE) {
    pValue = 1.0;
  } else {
    const n = Math.max(testNum * adjustFactor, 1.0);
    pValue = n * oneProtProb
      - ((n * (n - 1)) / 2) * oneProtProb * oneProtProb
      + ((n * (n - 1) * (n - 2)) / 6) * Math.pow(oneProtProb, 3);
    if (pValue > 1.0) pValue = 1.0;
  }
  return { pValue, eValue };
}

export function parsePrsmXmlFile(xmlText: string): PrsmRec[] {
  const parser = new XMLParser({
    isArray: (name) => name === 'prsm' || name === 'mass_shift' || name === 'alteration',
    parseTagValue: false, // keep everything as raw strings
    trimValues: true,
  });
  const doc = parser.parse(xmlText);
  const list = doc.prsm_list;
  if (!list) throw new Error('Not a TopPIC prsm XML file: missing <prsm_list>');
  const out: PrsmRec[] = [];
  for (const p of asArray<any>(list.prsm)) {
    const prot = p.proteoform;
    const massShifts: MassShiftRec[] = [];
    if (prot.mass_shift_list) {
      for (const ms of asArray<any>(prot.mass_shift_list.mass_shift)) {
        const alterations: AlterationRec[] = [];
        for (const alt of asArray<any>(ms.alteration_list?.alteration)) {
          alterations.push({
            leftBp: Number(alt.left_bp_pos),
            rightBp: Number(alt.right_bp_pos),
            typeName: String(alt.alter_type.name) as AlterTypeName,
            mass: Number(alt.mass),
            massRaw: String(alt.mass),
            ptmAbbr: String(alt.mod?.mod_residue?.ptm?.abbreviation ?? 'No PTM'),
            ptmUnimod: String(alt.mod?.mod_residue?.ptm?.unimod ?? '-1'),
          });
        }
        massShifts.push({
          leftBp: Number(ms.left_bp_pos),
          rightBp: Number(ms.right_bp_pos),
          shift: Number(ms.shift),
          shiftRaw: String(ms.shift),
          alterations,
        });
      }
    }
    out.push({
      fileName: String(p.file_name),
      prsmId: Number(p.prsm_id),
      spectrumId: Number(p.spectrum_id),
      spectrumScan: Number(p.spectrum_scan),
      spectrumNumber: Number(p.spectrum_number),
      oriPrecMass: Number(p.ori_prec_mass),
      adjustedPrecMass: Number(p.adjusted_prec_mass),
      matchPeakNum: Number(p.match_peak_num),
      matchFragNum: Number(p.match_fragment_num),
      fdr: Number(p.fdr),
      proteoformFdr: Number(p.proteoform_fdr),
      fracFeatureInte: Number(p.frac_feature_inte),
      seqName: String(prot.fasta_seq.seq_name),
      seqDesc: prot.fasta_seq.seq_desc === undefined ? '' : String(prot.fasta_seq.seq_desc),
      protModName: String(prot.prot_mod.name),
      startPos: Number(prot.start_pos),
      endPos: Number(prot.end_pos),
      proteoClusterId: Number(prot.proteo_cluster_id),
      protId: Number(prot.prot_id),
      unexpectedPtmNum: Number(prot.unexpected_ptm_num),
      matchSeq: String(prot.proteo_match_seq),
      dbSeq: String(prot.proteo_db_seq),
      massShifts,
      ...computeExpectedValues(p.extreme_value),
    });
  }
  return out;
}
