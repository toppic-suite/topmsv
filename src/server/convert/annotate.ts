// Port of TopPIC's peak-ion matching pipeline:
//   seq/proteoform.cpp    getSeqSegmentPtrVec
//   seq/bp_spec.cpp       break point (prefix/suffix residue mass) computation
//   prsm/theo_peak_util.cpp
//   ms/factory/extend_ms_factory.cpp
//   prsm/peak_ion_pair_util.cpp (findPairs) + prsm/prsm_algo.cpp (increaseIJ)
// The port must produce exactly the same peak-ion pairs, in the same order,
// as TopPIC's own HTML report generator.

import {
  AA_MASS, ISOTOPE_MASS, ION_TYPE_SHIFT, N_TERM_ION_TYPES, MatchingParameters,
} from './constants';
import { PrsmRec, MassShiftRec } from './prsmRecord';

export interface DeconvPeak {
  specId: number;
  peakId: number;
  mass: number;      // monoisotopic mass, rounded to 6 decimals (msalign precision)
  intensity: number; // rounded to 2 decimals (msalign precision)
  charge: number;
}

export interface TheoPeak {
  ionType: string;     // "B" / "Y" / ...
  isNTerm: boolean;
  pos: number;         // region-local break point index
  displayPos: number;  // N ions: pos; C ions: regionLen - pos
  shift: number;       // segment shift carried by this ion (variable + unexpected)
  modMass: number;     // unmodified break point mass + ion shift + segment shift
}

export interface ExtendPeak {
  peak: DeconvPeak;
  variantMass: number; // mass, or mass +- ISOTOPE_MASS for heavy peaks
  tolerance: number;   // max(minTolerance, base mass * ppo)
}

export interface PeakIonPair {
  specId: number;
  extend: ExtendPeak;
  theo: TheoPeak;
}

export interface ProteoformContext {
  regionSeq: string;          // full-protein sequence sliced to [startPos, endPos]
  regionLen: number;
  residueMasses: number[];    // per-residue mass incl. fixed / protein-variable mods
  totalResidueMass: number;   // sum of residueMasses
  segments: { left: number; right: number; nShift: number; cShift: number }[];
}

/**
 * Build the proteoform context used for theoretical peak generation.
 * Fixed and protein-variable alterations are folded into the residue masses
 * (TopPIC applies them to the residue sequence / N-terminal mod), while
 * variable and unexpected shifts become segment boundaries.
 */
export function buildProteoformContext(prsm: PrsmRec, fullSeq: string): ProteoformContext {
  const { startPos, endPos } = prsm;
  const regionSeq = fullSeq.slice(startPos, endPos + 1);
  const regionLen = regionSeq.length;

  const residueMasses: number[] = new Array(regionLen);
  for (let i = 0; i < regionLen; i++) {
    const m = AA_MASS[regionSeq[i]];
    residueMasses[i] = m === undefined ? 0 : m;
  }

  // Alterations are positioned with region-local break point indices.
  const segmentShifts: { leftBp: number; rightBp: number; mass: number }[] = [];
  for (const ms of prsm.massShifts) {
    for (const alt of ms.alterations) {
      if (alt.typeName === 'Fixed' || alt.typeName === 'Protein variable') {
        // applied to the residue between the break points
        if (alt.leftBp >= 0 && alt.leftBp < regionLen) {
          residueMasses[alt.leftBp] += alt.mass;
        }
      } else {
        segmentShifts.push({ leftBp: alt.leftBp, rightBp: alt.rightBp, mass: alt.mass });
      }
    }
  }
  segmentShifts.sort((a, b) => a.leftBp - b.leftBp);

  let totalResidueMass = 0;
  for (const m of residueMasses) totalResidueMass += m;

  // getSeqSegmentPtrVec
  let massShiftSum = 0;
  for (const s of segmentShifts) massShiftSum += s.mass;
  const segments: ProteoformContext['segments'] = [];
  let nShift = 0;
  let cShift = massShiftSum;
  let left = 0;
  for (const s of segmentShifts) {
    segments.push({ left, right: s.leftBp, nShift, cShift });
    left = s.rightBp;
    nShift += s.mass;
    cShift -= s.mass;
  }
  segments.push({ left, right: regionLen, nShift, cShift });

  return { regionSeq, regionLen, residueMasses, totalResidueMass, segments };
}

/** theo_peak_util::geneProteoformTheoPeak, sorted by modified mass. */
export function geneTheoPeaks(
  ctx: ProteoformContext,
  nIonType: string,
  cIonType: string,
  minMass: number,
): TheoPeak[] {
  const L = ctx.regionLen;
  // prefix residue masses: prm[i] = sum of residues [0, i)
  const prm: number[] = new Array(L + 1);
  prm[0] = 0;
  for (let i = 0; i < L; i++) prm[i + 1] = prm[i] + ctx.residueMasses[i];
  const total = ctx.totalResidueMass;

  const nShiftIon = ION_TYPE_SHIFT[nIonType] ?? 0;
  const cShiftIon = ION_TYPE_SHIFT[cIonType] ?? 0;

  const peaks: TheoPeak[] = [];
  for (const seg of ctx.segments) {
    const maxMass = total + seg.nShift + seg.cShift - minMass;
    for (let i = seg.left; i <= seg.right; i++) {
      const nMass = prm[i] + nShiftIon;
      const nMod = nMass + seg.nShift;
      if (nMod >= minMass && nMod <= maxMass) {
        peaks.push({
          ionType: nIonType, isNTerm: true, pos: i, displayPos: i,
          shift: seg.nShift, modMass: nMod,
        });
      }
    }
    for (let i = seg.left; i <= seg.right; i++) {
      const cMass = total - prm[i] + cShiftIon;
      const cMod = cMass + seg.cShift;
      if (cMod >= minMass && cMod <= maxMass) {
        peaks.push({
          ionType: cIonType, isNTerm: false, pos: i, displayPos: L - i,
          shift: seg.cShift, modMass: cMod,
        });
      }
    }
  }
  peaks.sort((a, b) => a.modMass - b.modMass);
  return peaks;
}

/** extend_ms_factory::geneMsThreePtr */
export function geneExtendPeaks(
  deconvPeaks: DeconvPeak[],
  adjustedPrecMass: number,
  para: MatchingParameters,
): ExtendPeak[] {
  const list: ExtendPeak[] = [];
  for (const pk of deconvPeaks) {
    const offsets = pk.mass <= para.extendMinMass ? [0] : [0, -ISOTOPE_MASS, ISOTOPE_MASS];
    for (const off of offsets) {
      list.push({ peak: pk, variantMass: pk.mass + off, tolerance: 0 });
    }
  }
  const filtered = list.filter(
    (e) => e.variantMass >= para.minMass && e.variantMass <= adjustedPrecMass - para.minMass,
  );
  filtered.sort((a, b) => a.variantMass - b.variantMass);
  for (const e of filtered) {
    const tole = e.peak.mass * para.ppo;
    e.tolerance = tole < para.minTolerance ? para.minTolerance : tole;
  }
  return filtered;
}

/** prsm_algo::increaseIJ */
function increaseIJ(
  i: number, j: number, deviation: number, tolerance: number,
  msMasses: number[], theoMasses: number[],
): boolean {
  if (deviation <= 0) return true;
  if (i >= msMasses.length - 1) return false;
  const nextPos = msMasses[i + 1];
  let jIsCloser: boolean;
  if (j >= theoMasses.length - 1) {
    jIsCloser = true;
  } else {
    jIsCloser = Math.abs(nextPos - theoMasses[j]) < Math.abs(nextPos - theoMasses[j + 1]);
  }
  return Math.abs(nextPos - theoMasses[j]) <= tolerance && jIsCloser;
}

/** peak_ion_pair_util::findPairs (bgn = 0, end = region length, add_tolerance = 0) */
export function findPairs(
  specId: number,
  extendPeaks: ExtendPeak[],
  theoPeaks: TheoPeak[],
): PeakIonPair[] {
  const msMasses = extendPeaks.map((e) => e.variantMass);
  const theoMasses = theoPeaks.map((t) => t.modMass);
  const pairs: PeakIonPair[] = [];
  let i = 0;
  let j = 0;
  while (i < msMasses.length && j < theoMasses.length) {
    const deviation = msMasses[i] - theoMasses[j];
    const err = extendPeaks[i].tolerance;
    if (Math.abs(deviation) <= err) {
      pairs.push({ specId, extend: extendPeaks[i], theo: theoPeaks[j] });
    }
    if (increaseIJ(i, j, deviation, err, msMasses, theoMasses)) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

export interface SpectrumMatch {
  specId: number;
  deconvPeaks: DeconvPeak[];
  pairs: PeakIonPair[];
}

/** Match one PrSM against the deconvoluted spectra of its spectrum set. */
export function matchPrsm(
  prsm: PrsmRec,
  ctx: ProteoformContext,
  spectra: { specId: number; deconvPeaks: DeconvPeak[]; nIonType: string; cIonType: string }[],
  para: MatchingParameters,
): SpectrumMatch[] {
  const out: SpectrumMatch[] = [];
  for (const sp of spectra) {
    const theoPeaks = geneTheoPeaks(ctx, sp.nIonType, sp.cIonType, para.minMass);
    const extendPeaks = geneExtendPeaks(sp.deconvPeaks, prsm.adjustedPrecMass, para);
    const pairs = findPairs(sp.specId, extendPeaks, theoPeaks);
    out.push({ specId: sp.specId, deconvPeaks: sp.deconvPeaks, pairs });
  }
  return out;
}
