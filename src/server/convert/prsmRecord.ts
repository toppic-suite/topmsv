// The PrSM record the converter works from (mass shifts positioned with
// proteoform-region-local break points, like TopPIC's own data structures).
// Read from the identification tables of the TopPIC sqlite (toppicSqlite.ts).

export type AlterTypeName = 'Fixed' | 'Protein variable' | 'Variable' | 'Unexpected';

export interface AlterationRec {
  leftBp: number;        // proteoform-region-local break point positions
  rightBp: number;
  typeName: AlterTypeName;
  mass: number;
  massRaw: string;       // 10-decimal string
  ptmAbbr: string;       // PTM abbreviation ("No PTM" for an unexpected shift)
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
  fdr: number;           // -1 when unknown
  proteoformFdr: number; // -1 when unknown
  fracFeatureInte: number;
  seqName: string;
  seqDesc: string;
  protModName: string;
  startPos: number;      // 0-based first residue in the protein
  endPos: number;        // 0-based last residue in the protein
  proteoClusterId: number;
  protId: number;
  unexpectedPtmNum: number;
  matchSeq: string;
  dbSeq: string;
  massShifts: MassShiftRec[];
  pValue: number;        // NaN when unknown
  eValue: number;
}
