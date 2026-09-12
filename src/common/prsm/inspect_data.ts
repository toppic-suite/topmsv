/**
 * Inputs of the visual inspection page derived from a parsed PrSM: the
 * spectrum's raw peak list, its deconvoluted mass list, the ion types used,
 * the annotated proteoform sequence with its PTMs, and the precursor mass.
 * Used by inspect/spectrum.html when opened with ?folder=&prsm_id=[&spec_id=].
 */
interface InspectData {
  peakAndIntensityList: string[];   // "mz intensity" per raw peak
  massAndIntensityList: string[];   // "mass intensity charge" per deconvoluted peak
  ionList: string[];                // ion type names, e.g. ["B", "Y"]
  sequence: string;                 // proteoform sequence (first..last residue)
  fixedPtmList: MassShift[];
  protVarPtmsList: MassShift[];
  variablePtmsList: MassShift[];
  unknownMassShiftList: MassShift[];
  precursorMass: string;
}

/**
 * @param prsmObj - parsed PrSM
 * @param specId - MS2 spectrum id to inspect; null = the PrSM's first spectrum
 */
function extractInspectData(prsmObj: Prsm, specId: string | null): InspectData | null {
  let ms2Spec: Spectrum[] | null = prsmObj.getMs2Spectra();
  if (!ms2Spec || ms2Spec.length == 0) {
    console.error("ERROR: ms2 spectrum is empty");
    return null;
  }
  let currentSpec: Spectrum | undefined = specId
    ? ms2Spec.find((spectrum) => spectrum.getSpectrumId() == specId)
    : ms2Spec[0];
  if (!currentSpec) {
    console.error("ERROR: ms2 spectrum " + specId + " is not part of this PrSM");
    return null;
  }

  let peakAndIntensityList: string[] = [];
  currentSpec.getPeaks().forEach(peak => {
    peakAndIntensityList.push(peak.getMonoMz().toString() + " " + peak.getIntensity().toString());
  });

  let massAndIntensityList: string[] = [];
  let decovPeaks: Peak[] | null = currentSpec.getDeconvPeaks();
  if (decovPeaks) {
    decovPeaks.forEach(peak => {
      let monoMass: number | undefined = peak.getMonoMass();
      let charge: number | undefined = peak.getCharge();
      if (monoMass && charge) {
        massAndIntensityList.push(monoMass.toString() + " " + peak.getIntensity().toString() + " " + charge.toString());
      }
      else {
        console.error("Error: invalid mono mass or charge found in a peak");
      }
    });
  }

  let ionList: string[] = [];
  currentSpec.getNTerminalIon().forEach(ion => { ionList.push(ion.getName()); });
  currentSpec.getCTerminalIon().forEach(ion => { ionList.push(ion.getName()); });

  let proteoform = prsmObj.getProteoform();
  let sequence: string = proteoform.getSeq();
  //remove skipped residue
  sequence = sequence.slice(proteoform.getFirstPos());
  sequence = sequence.slice(0, proteoform.getLastPos() + 1 - proteoform.getFirstPos());
  let fixedPtmList: MassShift[] = proteoform.getFixedPtm();
  let unknownMassShiftList: MassShift[] = proteoform.getUnknownMassShift();
  let protVarPtmsList: MassShift[] = proteoform.getProtVarPtm();
  let variablePtmsList: MassShift[] = proteoform.getVarPtm();
  let precursorMass: string = FormatUtil.formatFloat(currentSpec.getPrecMass(), "precMass");

  //if multiple variable ptm is in the same range, convert them to unknown mass shift to prevent incorrect annotation in the inspect page
  let varPtmListTmp: MassShift[] = protVarPtmsList.concat(variablePtmsList);
  let varPtmFiltered: MassShift[] = [];
  let protVarPtmFiltered: MassShift[] = [];

  if (varPtmListTmp.length > 1) {
    varPtmListTmp.sort((x: MassShift, y: MassShift) => {
      return x.getLeftPos() - y.getLeftPos();
    })
    let i: number = 0;
    while (i < varPtmListTmp.length) {
      let k: number = i + 1;
      if (k >= varPtmListTmp.length) {//store data at [i] and finish since there is no more ptm to compare with
        if (varPtmListTmp[i].getType() == ModType.Variable) {
          varPtmFiltered.push(varPtmListTmp[i]);
        }
        else if (varPtmListTmp[i].getType() == ModType.ProteinVariable) {
          protVarPtmFiltered.push(varPtmListTmp[i]);
        }
      }
      else {//search for variable ptm with same range
        let totalShift: number = varPtmListTmp[i].getShift();
        while (varPtmListTmp[i].getLeftPos() == varPtmListTmp[k].getLeftPos() && varPtmListTmp[i].getRightPos() == varPtmListTmp[k].getRightPos()) {
          totalShift = totalShift + varPtmListTmp[k].getShift();
          k++;
          if (k >= varPtmListTmp.length) {
            break;
          }
        }
        if (k > i + 1) {//mulitple variable ptm in the same range
          unknownMassShiftList.push(new MassShift(varPtmListTmp[i].getLeftPos(), varPtmListTmp[i].getRightPos(), totalShift, "Unknown", totalShift.toString()));
        }
        else {
          if (varPtmListTmp[i].getType() == ModType.Variable) {
            varPtmFiltered.push(varPtmListTmp[i]);
          }
          else if (varPtmListTmp[i].getType() == ModType.ProteinVariable) {
            protVarPtmFiltered.push(varPtmListTmp[i]);
          }
        }
      }
      i = k;
    }
  }
  else {
    varPtmFiltered = variablePtmsList;
    protVarPtmFiltered = protVarPtmsList;
  }

  //if some residues are going to be cut off in inspect page, adjust mod pos;
  if (proteoform.getFirstPos() > 0) {
    let shiftPos = (ptm: MassShift, type: string): MassShift => {
      let newL: number = ptm.getLeftPos() - proteoform.getFirstPos();
      let newR: number = ptm.getRightPos() - proteoform.getFirstPos();
      let newPtm = new MassShift(newL, newR, ptm.getShift(), type, ptm.getAnnotation());
      newPtm.setPtmList(ptm.getPtmList());
      return newPtm;
    };
    unknownMassShiftList = unknownMassShiftList.map((ptm) => shiftPos(ptm, "unknown"));
    protVarPtmFiltered = protVarPtmFiltered.map((ptm) => shiftPos(ptm, "Protein variable"));
    varPtmFiltered = varPtmFiltered.map((ptm) => shiftPos(ptm, "Variable"));
  }

  return {
    peakAndIntensityList: peakAndIntensityList,
    massAndIntensityList: massAndIntensityList,
    ionList: ionList,
    sequence: sequence,
    fixedPtmList: fixedPtmList,
    protVarPtmsList: protVarPtmFiltered,
    variablePtmsList: varPtmFiltered,
    unknownMassShiftList: unknownMassShiftList,
    precursorMass: precursorMass,
  };
}
