// Minimal FASTA reader. Sequences are keyed by the first whitespace-delimited
// token of the header line (the same name TopPIC stores in <seq_name>).

export interface FastaEntry {
  name: string;
  desc: string;
  seq: string;
}

export function parseFasta(text: string): Map<string, FastaEntry> {
  const map = new Map<string, FastaEntry>();
  let name: string | null = null;
  let desc = '';
  let seqParts: string[] = [];
  const flush = () => {
    if (name !== null) {
      map.set(name, { name, desc, seq: seqParts.join('').toUpperCase() });
    }
  };
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('>')) {
      flush();
      const header = line.slice(1).trim();
      const sp = header.search(/\s/);
      name = sp === -1 ? header : header.slice(0, sp);
      desc = sp === -1 ? '' : header.slice(sp + 1).trim();
      seqParts = [];
    } else if (line.length > 0) {
      seqParts.push(line);
    }
  }
  flush();
  return map;
}

/**
 * Resolve the full protein sequence for a PrSM. When the FASTA database is
 * available the exact sequence is returned. Otherwise the sequence is
 * reconstructed from the matched sub-sequence: an initial M is prepended for
 * N-terminal-methionine-excision (NME) proteoforms, and any other unknown
 * leading residues are filled with "X". Residues after the matched region are
 * unknown without the FASTA, so the protein is treated as ending at the
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
