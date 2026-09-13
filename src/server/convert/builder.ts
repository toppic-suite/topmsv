// Builds the JSON payloads of TopPIC's data_js files (prsmN.js, proteinN.js,
// proteoformN.js, prsms.js, proteins.js), reproducing the output of
// toppic-suite src/visual/* + the xml2json transform:
//   - every scalar is a string
//   - an element with a single repeated child collapses to an object
//   - an empty element becomes null
// Field order matters: it follows the C++ writers exactly.

import {
  fixedToString, doubleToString, toScientificStr, evalueToString, boolToString, ionSortName,
} from './format';
import { PROTON_MASS, PRECISE_POINT_NUM, DECIMAL_POINT_NUM } from './constants';
import { PrsmRec } from './prsmRecord';
import { ProteoformContext, SpectrumMatch, PeakIonPair } from './annotate';

export interface SpectrumHeaderInfo {
  specId: number;
  scan: number;
  ms1Id: number;
  ms1Scan: number;
  precursorCharge: number;
}

export interface PrsmData {
  prsm: PrsmRec;
  ctx: ProteoformContext;
  fullSeq: string;       // full protein sequence (or fallback reconstruction)
  headers: SpectrumHeaderInfo[]; // one per spectrum in the spectrum set
  matches: SpectrumMatch[];
}

/** collapse a one-element array to its element (xml2json convention) */
function collapse<T>(list: T[]): T | T[] {
  return list.length === 1 ? list[0] : list;
}

function compMz(mass: number, charge: number): number {
  return mass / charge + PROTON_MASS;
}

// ---------------------------------------------------------------- prsm header

function buildPrsmHeader(d: PrsmData): { [k: string]: unknown } {
  const p = d.prsm;
  return {
    prsm_id: String(p.prsmId),
    p_value: isNaN(p.pValue) ? 'N/A' : evalueToString(p.pValue),
    e_value: isNaN(p.eValue) ? 'N/A' : evalueToString(p.eValue),
    fdr: p.fdr >= 0 ? evalueToString(p.fdr) : 'N/A',
    matched_fragment_number: String(Math.trunc(p.matchFragNum)),
    matched_peak_number: String(Math.trunc(p.matchPeakNum)),
  };
}

// ------------------------------------------------------------------ ms header

function buildMsHeader(d: PrsmData): { [k: string]: unknown } {
  const p = d.prsm;
  const header: { [k: string]: unknown } = {
    spectrum_file_name: p.fileName,
    ms1_ids: d.headers.map((h) => String(h.ms1Id)).join(' '),
    ms1_scans: d.headers.map((h) => String(h.ms1Scan)).join(' '),
    ids: d.headers.map((h) => String(h.specId)).join(' '),
    scans: d.headers.map((h) => String(h.scan)).join(' '),
    precursor_mono_mass: fixedToString(p.oriPrecMass, PRECISE_POINT_NUM),
    precursor_charge: String(d.headers[0].precursorCharge),
    precursor_mz: fixedToString(
      compMz(p.oriPrecMass, d.headers[0].precursorCharge), PRECISE_POINT_NUM),
  };
  if (p.fracFeatureInte > 0) {
    header.feature_inte = toScientificStr(p.fracFeatureInte, PRECISE_POINT_NUM);
  }
  return header;
}

function buildMsHeaderBrief(d: PrsmData): { [k: string]: unknown } {
  return {
    ms1_scans: d.headers.map((h) => String(h.ms1Scan)).join(' '),
    scans: d.headers.map((h) => String(h.scan)).join(' '),
  };
}

// --------------------------------------------------------------------- peaks

function buildMatchedIon(pair: PeakIonPair): { [k: string]: unknown } {
  const t = pair.theo;
  const error = pair.extend.variantMass - t.modMass;
  return {
    ion_type: t.ionType,
    match_shift: doubleToString(t.shift),
    theoretical_mass: fixedToString(t.modMass, PRECISE_POINT_NUM),
    ion_position: String(t.pos),
    ion_display_position: String(t.displayPos),
    ion_sort_name: ionSortName(t.ionType, t.displayPos),
    ion_left_position: String(t.pos),
    mass_error: fixedToString(error, PRECISE_POINT_NUM),
    ppm: fixedToString((error * 1000000) / pair.extend.variantMass, PRECISE_POINT_NUM - 2),
  };
}

function buildMsPeaks(d: PrsmData): { [k: string]: unknown } {
  const peaks: { [k: string]: unknown }[] = [];
  for (const match of d.matches) {
    for (const pk of match.deconvPeaks) {
      const el: { [k: string]: unknown } = {
        spec_id: String(pk.specId),
        peak_id: String(pk.peakId),
        monoisotopic_mass: fixedToString(pk.mass, PRECISE_POINT_NUM),
        monoisotopic_mz: fixedToString(compMz(pk.mass, pk.charge), PRECISE_POINT_NUM),
        intensity: fixedToString(pk.intensity, DECIMAL_POINT_NUM),
        charge: String(pk.charge),
      };
      const selected = match.pairs.filter((pr) => pr.extend.peak.peakId === pk.peakId);
      if (selected.length > 0) {
        el.matched_ions_num = String(selected.length);
        el.matched_ions = { matched_ion: collapse(selected.map(buildMatchedIon)) };
      }
      peaks.push(el);
    }
  }
  return { peak: collapse(peaks) };
}

// ---------------------------------------------------------- annotated protein

function buildAnnotation(d: PrsmData): { [k: string]: unknown } {
  const p = d.prsm;
  const protLen = d.fullSeq.length;

  const anno: { [k: string]: unknown } = {
    protein_length: String(protLen),
    first_residue_position: String(p.startPos),
    last_residue_position: String(p.endPos),
    annotated_seq: p.matchSeq,
  };

  // residues
  const residues = [];
  for (let i = 0; i < protLen; i++) {
    residues.push({ position: String(i), acid: d.fullSeq[i] });
  }
  anno.residue = collapse(residues);

  // cleavages: pairs indexed by full-protein break point position
  const nIon: boolean[] = new Array(protLen + 1).fill(false);
  const cIon: boolean[] = new Array(protLen + 1).fill(false);
  const pairsAt: PeakIonPair[][] = Array.from({ length: protLen + 1 }, () => []);
  for (const match of d.matches) {
    for (const pr of match.pairs) {
      const pos = pr.theo.pos + p.startPos;
      if (pos < 0 || pos > protLen) continue;
      pairsAt[pos].push(pr);
      if (pr.theo.isNTerm) nIon[pos] = true;
      else cIon[pos] = true;
    }
  }
  const cleavages = [];
  for (let i = 0; i <= protLen; i++) {
    const mp = pairsAt[i].map((pr) => ({
      ion_type: pr.theo.ionType,
      ion_position: String(pr.theo.pos),
      ion_display_position: String(pr.theo.displayPos),
      spec_id: String(pr.specId),
      peak_id: String(pr.extend.peak.peakId),
      peak_charge: String(pr.extend.peak.charge),
    }));
    cleavages.push({
      position: String(i),
      exist_n_ion: boolToString(nIon[i]),
      exist_c_ion: boolToString(cIon[i]),
      matched_peaks: mp.length === 0 ? null : { matched_peak: collapse(mp) },
    });
  }
  anno.cleavage = collapse(cleavages);

  // PTM groups: fixed, then protein variable, then variable.
  interface PtmGroup {
    typeName: string;
    abbr: string;
    unimod: string;
    mass: number;
    occ: { left: number; right: number; anno: string }[];
  }
  const groups: PtmGroup[] = [];
  const addOcc = (typeName: string, abbr: string, unimod: string, mass: number,
                  left: number, right: number, annoStr: string) => {
    let g = groups.find((x) => x.typeName === typeName && x.abbr === abbr);
    if (!g) {
      g = { typeName, abbr, unimod, mass, occ: [] };
      groups.push(g);
    }
    g.occ.push({ left, right, anno: annoStr });
  };
  const collectPtms = (typeName: 'Fixed' | 'Protein variable') => {
    const shifts = d.prsm.massShifts
      .filter((ms) => ms.alterations.some((a) => a.typeName === typeName))
      .sort((a, b) => a.leftBp - b.leftBp);
    for (const ms of shifts) {
      const alt = ms.alterations[0];
      if (alt.ptmAbbr === 'No PTM') continue;
      const leftDb = ms.leftBp + p.startPos;
      const acid = leftDb < protLen ? d.fullSeq[leftDb] : '';
      addOcc(typeName, alt.ptmAbbr, alt.ptmUnimod, alt.mass, leftDb, leftDb + 1, acid);
    }
  };
  collectPtms('Fixed');
  collectPtms('Protein variable');
  // variable PTMs: occurrences use alteration boundaries, empty anno
  {
    const shifts = d.prsm.massShifts
      .filter((ms) => ms.alterations.some((a) => a.typeName === 'Variable'))
      .sort((a, b) => a.leftBp - b.leftBp);
    for (const ms of shifts) {
      for (const alt of ms.alterations) {
        if (alt.ptmAbbr === 'No PTM') continue;
        addOcc('Variable', alt.ptmAbbr, alt.ptmUnimod, alt.mass,
               alt.leftBp + p.startPos, alt.rightBp + p.startPos, '');
      }
    }
  }
  if (groups.length > 0) {
    anno.ptm = collapse(groups.map((g) => ({
      ptm_type: g.typeName,
      ptm: {
        abbreviation: g.abbr,
        unimod: g.unimod,
        mono_mass: doubleToString(g.mass),
      },
      occurence: collapse(g.occ.map((o) => ({
        left_pos: String(o.left),
        right_pos: String(o.right),
        anno: o.anno,
      }))),
    })));
  }

  // mass shifts: unexpected + variable, sorted by position
  const shiftList = d.prsm.massShifts
    .filter((ms) => ms.alterations.some(
      (a) => a.typeName === 'Unexpected' || a.typeName === 'Variable'))
    .sort((a, b) => a.leftBp - b.leftBp);
  if (shiftList.length > 0) {
    // MassShift::getAnnoStr: unexpected shifts show the signed 4-decimal value,
    // variable PTM shifts show the PTM abbreviations
    anno.mass_shift = collapse(shiftList.map((ms, idx) => {
      const unexpected = ms.alterations.some((a) => a.typeName === 'Unexpected');
      let annoStr: string;
      if (unexpected) {
        annoStr = fixedToString(ms.shift, PRECISE_POINT_NUM);
        if (ms.shift > 0) annoStr = '+' + annoStr;
      } else {
        annoStr = ms.alterations.map((a) => a.ptmAbbr).join(';') + ';';
      }
      return {
        id: String(idx),
        left_position: String(ms.leftBp + p.startPos),
        right_position: String(ms.rightBp + p.startPos),
        shift: ms.shiftRaw,
        anno: annoStr,
        shift_type: unexpected ? 'unexpected' : 'variable ptm',
      };
    }));
  }

  return anno;
}

function buildAnnotatedProtein(d: PrsmData): { [k: string]: unknown } {
  const p = d.prsm;
  return {
    sequence_id: String(p.protId),
    proteoform_id: String(p.proteoClusterId),
    sequence_name: p.seqName,
    sequence_description: p.seqDesc,
    proteoform_mass: fixedToString(p.adjustedPrecMass, PRECISE_POINT_NUM),
    n_acetylation: boolToString(p.protModName.includes('ACETYLATION')),
    unexpected_shift_number: String(p.unexpectedPtmNum),
    annotation: buildAnnotation(d),
  };
}

// -------------------------------------------------------------- entry points

/** Full record for data_js/prsms/prsmN.js (detail = true, add_ms_peaks). */
export function buildPrsm(d: PrsmData, addMsPeaks: boolean): { [k: string]: unknown } {
  const el: { [k: string]: unknown } = buildPrsmHeader(d);
  const ms: { [k: string]: unknown } = { ms_header: buildMsHeader(d) };
  if (addMsPeaks) ms.peaks = buildMsPeaks(d);
  el.ms = ms;
  el.annotated_protein = buildAnnotatedProtein(d);
  return el;
}

/** Brief record used by data_js/prsms.js. */
export function buildPrsmBrief(d: PrsmData): { [k: string]: unknown } {
  return {
    prsm_id: String(d.prsm.prsmId),
    ms: { ms_header: buildMsHeaderBrief(d) },
    annotated_protein: {
      sequence_name: d.prsm.seqName,
      sequence_description: d.prsm.seqDesc,
      annotation: { annotated_seq: d.prsm.matchSeq },
    },
  };
}

/** Prsm::cmpEValueIncProtInc */
export function cmpEValueIncProtInc(a: PrsmData, b: PrsmData): number {
  if (a.prsm.eValue !== b.prsm.eValue) return a.prsm.eValue - b.prsm.eValue;
  return a.prsm.seqName < b.prsm.seqName ? -1 : a.prsm.seqName > b.prsm.seqName ? 1 : 0;
}

/** anno_xml_util::geneXmlForProteoform (compatible_proteoform element). */
export function buildCompatibleProteoform(
  clusterPrsms: PrsmData[], detail: boolean, addMs: boolean,
): { [k: string]: unknown } {
  const sorted = [...clusterPrsms].sort(cmpEValueIncProtInc);
  const first = sorted[0].prsm;
  return {
    sequence_id: String(first.protId),
    sequence_name: first.seqName,
    sequence_description: first.seqDesc,
    proteoform_id: String(first.proteoClusterId),
    prsm_number: String(sorted.length),
    prsm: collapse(sorted.map((d) => (detail ? buildPrsm(d, addMs) : buildPrsmHeader(d)))),
  };
}

// ---------------------------------------------- whole-file payload builders
// Used by both the conversion CLI (static files for validation) and the
// server's dynamic data_js endpoints — keep them as the single source of truth.

export function serializeDataJs(payload: unknown): string {
  return 'prsm_data =\n' + JSON.stringify(payload, null, 4) + '\n';
}

/** data_js/prsms/prsm<N>.js */
export function buildPrsmFilePayload(d: PrsmData): { [k: string]: unknown } {
  return { prsm: buildPrsm(d, true) };
}

/** data_js/prsms.js */
export function buildPrsmsIndexPayload(data: PrsmData[]): { [k: string]: unknown } {
  return { prsms: { prsm: data.map(buildPrsmBrief) } };
}

/** data_js/proteoforms/proteoform<N>.js (clusterPrsms may span proteins) */
export function buildProteoformFilePayload(clusterPrsms: PrsmData[]): { [k: string]: unknown } {
  return { compatible_proteoform: buildCompatibleProteoform(clusterPrsms, true, true) };
}

/** data_js/proteins/protein<N>.js */
export function buildProteinFilePayload(protPrsms: PrsmData[], protId: number): { [k: string]: unknown } {
  return { protein: buildProtein(protPrsms, protId, true, false) };
}

/** data_js/proteins.js: proteins ordered by their best PrSM (e-value, name) */
export function buildProteinsIndexPayload(data: PrsmData[]): { [k: string]: unknown } {
  const protIds = [...new Set(data.map((d) => d.prsm.protId))].sort((a, b) => a - b);
  const bestByProt = protIds.map((pid) => {
    const protPrsms = data.filter((d) => d.prsm.protId === pid);
    const best = [...protPrsms].sort(cmpEValueIncProtInc)[0];
    return { pid, best, protPrsms };
  });
  bestByProt.sort((a, b) => cmpEValueIncProtInc(a.best, b.best));
  return {
    protein_list: {
      proteins: {
        protein: bestByProt.map((e) => buildProtein(e.protPrsms, e.pid, false, false)),
      },
    },
  };
}

/** anno_xml_util::writeProteinToXml / geneXmlForProteinList (protein element). */
export function buildProtein(
  protPrsms: PrsmData[], protId: number, detail: boolean, addMs: boolean,
): { [k: string]: unknown } {
  const clusterIds = [...new Set(protPrsms.map((d) => d.prsm.proteoClusterId))].sort((a, b) => a - b);
  const first = protPrsms[0].prsm;
  return {
    sequence_id: String(protId),
    sequence_name: first.seqName,
    sequence_description: first.seqDesc,
    compatible_proteoform_number: String(clusterIds.length),
    compatible_proteoform: collapse(clusterIds.map((cid) =>
      buildCompatibleProteoform(protPrsms.filter((d) => d.prsm.proteoClusterId === cid),
                                detail, addMs))),
  };
}
