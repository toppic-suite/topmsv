// Protein sequences of the search database (the sqlite's fasta_seq table,
// keyed by the name TopPIC stores as protein_name).

export interface FastaEntry {
  name: string;
  desc: string;
  seq: string;
}

/**
 * Resolve the full protein sequence for a PrSM. When the database entry is
 * available the exact sequence is returned. Otherwise the sequence is
 * reconstructed from the matched sub-sequence: an initial M is prepended for
 * N-terminal-methionine-excision (NME) proteoforms, and any other unknown
 * leading residues are filled with "X". Residues after the matched region are
 * unknown without the database, so the protein is treated as ending at the
 * proteoform end.
 */
export function resolveProteinSeq(
  fasta: Map<string, FastaEntry> | null,
  seqName: string,
  protModName: string,
  startPos: number,
  dbSeq: string,
): string {
  if (fasta) {
    const entry = fasta.get(seqName);
    if (entry && entry.seq.length >= startPos + dbSeq.length) return entry.seq;
  }
  let prefix = '';
  if (startPos > 0) {
    if (protModName.startsWith('NME') && startPos === 1) {
      prefix = 'M';
    } else {
      prefix = 'M' + 'X'.repeat(startPos - 1);
    }
  }
  return prefix + dbSeq;
}
