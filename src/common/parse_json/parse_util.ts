/**
 * Helpers shared by the data_js parsers (parse_prsm / parse_protein /
 * parse_proteoform): list normalization and the break points, PTMs and mass
 * shifts of one PrSM record (see util/data_js_types.ts for the shapes).
 */

/** Normalize an xml2json-collapsed value (element or list, or absent) to a list. */
function getJsonList<T>(item: OneOrMany<T> | null | undefined): T[] {
  if (item == null) {
    return [];
  }
  return Array.isArray(item) ? item : [item];
}

/**
 * TopPIC writes e-values, FDRs, feature intensities and precursor masses as
 * formatted strings ("2.02e-05", "N/A", "5845.8100") and the pages show them
 * verbatim through toString() / template strings, while the Prsm model types
 * them as numbers. Keep the string so the display does not change (parseFloat
 * would turn "N/A" into NaN and drop trailing zeros).
 */
function asDisplayNumber(formatted: string): number {
  return formatted as unknown as number;
}

/**
 * Get the cleavage positions (break points with at least one matched ion)
 * from the prsm data.
 * @param prsm - complete prsm record
 * @param _firstPos - unused, kept for the callers
 */
function json2BreakPoints(prsm: DataJsPrsm, _firstPos?: number): BreakPoints[] {
  let breakPoints: BreakPoints[] = [];
  let dataBps: DataJsCleavage[] = getJsonList(prsm.annotated_protein.annotation.cleavage);
  for (let dataBp of dataBps) {
    if (Number(dataBp.exist_n_ion) === 0 && Number(dataBp.exist_c_ion) === 0) {
      continue;
    }
    let bp: BreakPoints = {
      position: dataBp.position,
      existNIon: Number(dataBp.exist_n_ion) === 1,
      existCIon: Number(dataBp.exist_c_ion) === 1,
      anno: "",
      masses: [],
    };
    if (dataBp.matched_peaks != null) {
      for (let dataMass of getJsonList(dataBp.matched_peaks.matched_peak)) {
        let mass = {
          ionType: dataMass.ion_type,
          ionDispPos: parseInt(dataMass.ion_display_position),
          charge: parseInt(dataMass.peak_charge),
        };
        bp.masses.push(mass);
        if (bp.anno != "") {
          bp.anno = bp.anno + " ";
        }
        bp.anno = bp.anno + mass.ionType + mass.ionDispPos + " " + mass.charge + "+";
      }
    }
    breakPoints.push(bp);
  }
  return breakPoints;
}

function getAminoAcidSequence(formFirstPos: number, formLastPos: number, residues: DataJsResidue[]): string {
  let sequence = "";
  for (let i = formFirstPos; i <= formLastPos; i++) {
    sequence = sequence + residues[i].acid;
  }
  return sequence;
}

/**
 * Get the occurrences of the fixed, protein-variable and variable PTMs
 * @param prsm - complete prsm record
 * @returns [fixed, protein variable, variable] mass shift lists
 */
function json2Ptms(prsm: DataJsPrsm): [MassShift[], MassShift[], MassShift[]] {
  let fixedPtmList: MassShift[] = [];
  let protVarPtmList: MassShift[] = [];
  let varPtmList: MassShift[] = [];
  for (let dataPtm of getJsonList(prsm.annotated_protein.annotation.ptm)) {
    if (dataPtm.ptm_type != "Fixed" && dataPtm.ptm_type != "Protein variable"
        && dataPtm.ptm_type != "Variable") {
      continue;
    }
    for (let occurence of getJsonList(dataPtm.occurence)) {
      let ptm = new Mod(occurence.anno, parseFloat(dataPtm.ptm.mono_mass), dataPtm.ptm.abbreviation);
      let massShift = new MassShift(parseInt(occurence.left_pos), parseInt(occurence.right_pos),
        ptm.getShift(), dataPtm.ptm_type, ptm.getName(), ptm);
      if (dataPtm.ptm_type == "Fixed") {
        fixedPtmList.push(massShift);
      }
      else if (dataPtm.ptm_type == "Protein variable") {
        protVarPtmList.push(massShift);
      }
      else {
        varPtmList.push(massShift);
      }
    }
  }
  return [fixedPtmList, protVarPtmList, varPtmList];
}

/**
 * Get the unexpected mass shifts (positions of the background color and the
 * shift value)
 * @param prsm - complete prsm record
 */
function json2MassShifts(prsm: DataJsPrsm): MassShift[] {
  let massShifts: MassShift[] = [];
  for (let dataShift of getJsonList(prsm.annotated_protein.annotation.mass_shift)) {
    if (dataShift.shift_type == "unexpected" && Number(dataShift.right_position) !== 0) {
      massShifts.push(new MassShift(parseInt(dataShift.left_position), parseInt(dataShift.right_position),
        parseFloat(dataShift.shift), dataShift.shift_type, dataShift.anno));
    }
    else if (Number(dataShift.right_position) === 0) {
      console.error("Mass shift right position is 0!", dataShift);
    }
  }
  return massShifts;
}
