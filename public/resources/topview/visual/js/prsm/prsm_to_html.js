"use strict";
/**
 * Create title and navigation urls to "all proteins","protein" and "proteoform" of the prsm
 * @param {String} folderpath - provides folder path to the data and helps in building urls
 */
function BuildUrl(folderpath, prsmObj) {
    let proteoformObj = prsmObj.getProteoform();
    let specIds = [];
    let ms2Spec = prsmObj.getMs2Spectra();
    if (ms2Spec) {
        ms2Spec.forEach(spec => {
            specIds.push(spec.getSpectrumId().toString());
        });
    }
    document.title = "Protein-Spectrum-Match for Spectrum #" + specIds.toString();
    let l_allproteins_url = "proteins.html?folder=" + folderpath;
    document.getElementById("allprotein_url").href = l_allproteins_url;
    document.getElementById("allprotein_url_end").href = l_allproteins_url;
    let l_protein_URL = proteoformObj.getProtName() + " " + proteoformObj.getProtDesc();
    let l_protroform_URL = "Proteoform #" + proteoformObj.getId();
    let proteinUrl = document.getElementById("protien_url");
    let proteinUrlEnd = document.getElementById("protien_url_end");
    let protUrl = document.getElementById("proteoform_url");
    let protUrlEnd = document.getElementById("proteoform_url_end");
    let titleElement = document.getElementById("Protein-Spectrum-Match-Id-SpecId");
    proteinUrl.innerHTML = l_protein_URL;
    proteinUrl.href = "protein.html?folder=" + folderpath + "&protein_Id=" + proteoformObj.getSeqId();
    proteinUrlEnd.innerHTML = l_protein_URL;
    proteinUrlEnd.href = "protein.html?folder=" + folderpath + "&protein_Id=" + proteoformObj.getSeqId();
    protUrl.innerHTML = l_protroform_URL;
    protUrl.href = "proteoform.html?folder=" + folderpath + "&proteoform_Id=" + proteoformObj.getId();
    protUrlEnd.innerHTML = l_protroform_URL;
    protUrlEnd.href = "proteoform.html?folder=" + folderpath + "&proteoform_Id=" + proteoformObj.getId();
    titleElement.innerHTML = "Protein-Spectrum-Match #" + prsmObj.getId() + " for Spectrum #" + specIds.toString();
}
/**
 * Get the data of the prsm from global data variable prsm_data.
 * Build the data into html to show the information about the prsm
 */
function loadDatafromJson2Html(prsmObj) {
    let fileName = document.getElementById("File_name");
    let prsmId = document.getElementById("PrSM_ID");
    let scan = document.getElementById("Scan");
    let precCharge = document.getElementById("Precursor_charge");
    let precMz = document.getElementById("precursor_mz");
    let precMass = document.getElementById("Precursor_mass");
    let protMass = document.getElementById("Proteoform_mass");
    let matchedPeak = document.getElementById("matched_peaks");
    let matchedFrag = document.getElementById("matched_fragment_ions");
    let unexpected = document.getElementById("unexpected_modifications");
    let eVal = document.getElementById("E_value");
    let qVal = document.getElementById("Q_value");
    let proteoformObj = prsmObj.getProteoform();
    let ms2Spectrum = prsmObj.getMs2Spectra();
    if (!ms2Spectrum) {
        console.error("ERROR: invalid ms2 spectrum");
        return;
    }
    if (fileName && prsmId && scan && precCharge && precMz && precMass && protMass && matchedPeak &&
        matchedFrag && unexpected && eVal && qVal) {
        fileName.innerHTML = prsmObj.getfileName();
        prsmId.innerHTML = prsmObj.getId();
        if (ms2Spectrum.length > 1) {
            let scanText = "";
            ms2Spectrum.forEach((spectra) => {
                scanText = scanText + spectra.getScanNum() + " ";
            });
            scan.innerHTML = scanText;
        }
        else {
            scan.innerHTML = ms2Spectrum[0].getScanNum();
        }
        precCharge.innerHTML = ms2Spectrum[0].getPrecCharge().toString();
        precMz.innerHTML = ms2Spectrum[0].getPrecMz().toString();
        precMass.innerHTML = ms2Spectrum[0].getPrecMass().toString();
        protMass.innerHTML = proteoformObj.getMass().toString();
        matchedPeak.innerHTML = prsmObj.getMatchedPeakCount().toString();
        unexpected.innerHTML = prsmObj.getUnexpectedModCount().toString();
        eVal.innerHTML = prsmObj.getEValue().toString();
        qVal.innerHTML = prsmObj.getQValue().toString();
        let ionCnt = prsmObj.getFragIonCount();
        if (ionCnt) {
            matchedFrag.innerHTML = ionCnt.toString();
        }
    }
}
/**
 * Get occurence of "Variable" and "Fixed", convert the data to HTML
 * @param {object} prsm - prsm is the data attribute inside global prsm_data variable
 */
function occurence_ptm(prsmObj) {
    let variable_ptm = "";
    let fixed_ptm = "";
    let fixedPtmCount = 0;
    let varPtmCount = 0;
    prsmObj.getProteoform().getFixedPtm().forEach(ptm => {
        if (fixedPtmCount > 0) {
            //if it is not the first ptm and it is not the only ptm
            fixed_ptm = fixed_ptm + ";";
        }
        fixed_ptm = fixed_ptm + ptm.getAnnotation() + "[" + ptm.getLeftPos().toString() + "]";
        fixedPtmCount++;
    });
    prsmObj.getProteoform().getVarPtm().forEach(ptm => {
        if (varPtmCount > 0) {
            //if it is not the first ptm and it is not the only ptm
            variable_ptm = variable_ptm + ";";
        }
        variable_ptm = variable_ptm + ptm.getAnnotation() + "[" + ptm.getLeftPos().toString() + "]";
        varPtmCount++;
    });
    prsmObj.getProteoform().getProtVarPtm().forEach(ptm => {
        if (varPtmCount > 0) {
            //if it is not the first ptm and it is not the only ptm
            variable_ptm = variable_ptm + ";";
        }
        variable_ptm = variable_ptm + ptm.getAnnotation() + "[" + ptm.getLeftPos().toString() + "]";
    });
    // Add the information of fixed ptms to html at id - ptm_abbreviation
    if (fixed_ptm != "") {
        let div = document.getElementById("ptm_abbreviation");
        let text1 = document.createElement("text");
        let text2 = document.createElement("text");
        text1.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "Fixed PTMs: ";
        text2.innerHTML = fixed_ptm;
        //text2.target = "_blank";
        //@ts-ignore
        text2.style = "color:red";
        if (!div) {
            console.error("ERROR: invalid div id for ptm annotation");
            return;
        }
        div.appendChild(text1);
        div.appendChild(text2);
    }
    // Add the information of varibale ptms to html at id - ptm_abbreviation
    if (variable_ptm != "") {
        let div = document.getElementById("ptm_abbreviation");
        let text1 = document.createElement("text");
        let text2 = document.createElement("text");
        text1.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "Variable PTMs: ";
        text2.innerHTML = variable_ptm;
        //text2.target = "_blank";
        //@ts-ignore
        text2.style = "color:red";
        if (!div) {
            console.error("ERROR: invalid div id for ptm annotation");
            return;
        }
        div.appendChild(text1);
        div.appendChild(text2);
    }
}
/**
 * Get the information about all the unknown ptms
 * @param {object} prsm - prsm is the data attribute inside global prsm_data variable
 */
function getUnknownPtms(prsmObj) {
    let unknownShift = "";
    let shiftCount = 0;
    prsmObj.getProteoform().getUnknownMassShift().forEach(shift => {
        if (shiftCount > 0) {
            //if it is not the first ptm and it is not the only ptm
            unknownShift = unknownShift + ", ";
        }
        //unknownShift = unknownShift + "[" + shift.getAnnotation().toString() + "]";
        unknownShift = unknownShift + shift.getAnnotation().toString();
        shiftCount++;
    });
    // If unexpected modifications exist add them to html at id - ptm_unexpectedmodifications
    if (shiftCount > 0) {
        let val = "Unknown" + "[" + unknownShift + "]";
        let unexpectedModDiv = document.getElementById("ptm_unexpectedmodification");
        if (!unexpectedModDiv) {
            console.error("ERROR: invalid div id for unexpected modificiation");
            return;
        }
        unexpectedModDiv.style.display = "block";
        let div = document.getElementById("ptm_unexpectedmodification");
        let text1 = document.createElement("text");
        let text2 = document.createElement("text");
        text1.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + "Unexpected modifications: "; // Adding space using &nbsp;
        text2.innerHTML = val;
        //text2.target = "_blank";
        //@ts-ignore
        text2.style = "color:red";
        if (!div) {
            console.error("ERROR: invalid div id for ptm annotation");
            return;
        }
        div.appendChild(text1);
        div.appendChild(text2);
    }
}
/**
 * Get all the variable ptms
 * @param {object} prsm - prsm is the data attribute inside global prsm_data variable
 */
function getVariablePtm(ptm) {
    let variable_ptm = "[";
    if (Array.isArray(ptm.occurence)) {
        ptm.occurence.forEach(function (occurence, i) {
            variable_ptm = variable_ptm + occurence.right_pos;
            if (ptm.occurence.length - 1 > i) {
                variable_ptm = variable_ptm + ";";
            }
        });
    }
    else {
        variable_ptm = variable_ptm + ptm.occurence.right_pos;
    }
    variable_ptm = ptm.ptm.abbreviation + variable_ptm;
    return variable_ptm;
}
/**
 * Get all the "Fixed" ptms
 * @param {object} prsm - prsm is the data attribute inside global prsm_data variable
 */
function getFixedPtm(ptm) {
    let fixed_ptm = "[";
    if (Array.isArray(ptm.occurence)) {
        ptm.occurence.forEach(function (occurence, i) {
            fixed_ptm = fixed_ptm + occurence.right_pos;
            if (ptm.occurence.length - 1 > i) {
                fixed_ptm = fixed_ptm + ";";
            }
        });
    }
    else {
        fixed_ptm = fixed_ptm + ptm.occurence.right_pos;
    }
    fixed_ptm = ptm.ptm.abbreviation + fixed_ptm;
    return fixed_ptm;
}
/**
 * Get the cleavage positions from the prsm data
 * @param {object} prsm - json obeject with complete prsm data
 */
function json2BreakPoints(prsm, firstPos) {
    let breakPoints = [];
    let dataBps = prsm.annotated_protein.annotation.cleavage;
    for (let i = 0; i < dataBps.length; i++) {
        let dataBp = dataBps[i];
        if (dataBp.exist_n_ion == 0 && dataBp.exist_c_ion == 0) {
            continue;
        }
        let bp = {};
        bp.position = dataBp.position;
        bp.existNIon = (dataBp.exist_n_ion == 1);
        bp.existCIon = (dataBp.exist_c_ion == 1);
        bp.anno = "";
        bp.masses = [];
        if (dataBp.matched_peaks != null) {
            let dataMasses = [];
            if (dataBp.matched_peaks.matched_peak.length > 1) {
                dataMasses = dataBp.matched_peaks.matched_peak;
            }
            else {
                dataMasses.push(dataBp.matched_peaks.matched_peak);
            }
            for (let j = 0; j < dataMasses.length; j++) {
                let dataMass = dataMasses[j];
                let mass = {};
                // Ion type
                mass.ionType = dataMass.ion_type;
                // Ion Display position
                mass.ionDispPos = parseInt(dataMass.ion_display_position);
                // Ion Charge
                mass.charge = parseInt(dataMass.peak_charge);
                // ion_position
                // mass.ionPos = parseInt(dataMass.ion_position);
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
function getAminoAcidSequence(formFirstPos, formLastPos, residues) {
    let sequence = "";
    for (let i = formFirstPos; i <= formLastPos; i++) {
        sequence = sequence + residues[i].acid;
    }
    return sequence;
}
function getJsonList(item) {
    let valueList = [];
    if (Array.isArray(item)) {
        valueList = item;
    }
    else {
        valueList.push(item);
    }
    return valueList;
}
/**
 * Get occurence of fixed ptm positions
 * @param {object} prsm - json obeject with complete prsm data
 */
function json2Ptms(prsm) {
    let fixedPtmList = [];
    let protVarPtmList = [];
    let varPtmList = [];
    if (!prsm.annotated_protein.annotation.hasOwnProperty("ptm")) {
        return [fixedPtmList, protVarPtmList, varPtmList];
    }
    let dataPtmList = getJsonList(prsm.annotated_protein.annotation.ptm);
    for (let i = 0; i < dataPtmList.length; i++) {
        let dataPtm = dataPtmList[i];
        if (dataPtm.ptm_type == "Fixed" || dataPtm.ptm_type == "Protein variable"
            || dataPtm.ptm_type == "Variable") {
            if (dataPtm.hasOwnProperty("occurence")) {
                let occList = getJsonList(dataPtm.occurence);
                //console.log(occList);
                for (let j = 0; j < occList.length; j++) {
                    let occurence = occList[j];
                    let ptm = new Mod(occurence.anno, parseFloat(dataPtm.ptm.mono_mass), dataPtm.ptm.abbreviation);
                    let massShift = new MassShift(parseInt(occurence.left_pos), parseInt(occurence.right_pos), ptm.getShift(), dataPtm.ptm_type, ptm.getName(), ptm);
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
        }
    }
    return [fixedPtmList, protVarPtmList, varPtmList];
}
/**
 * Get left and right positions of background color and mass shift value
 * @param {object} prsm - json obeject with complete prsm data
 */
function json2MassShifts(prsm) {
    let massShifts = [];
    if (prsm.annotated_protein.annotation.hasOwnProperty('mass_shift')) {
        let dataMassShifts = getJsonList(prsm.annotated_protein.annotation.mass_shift);
        for (let i = 0; i < dataMassShifts.length; i++) {
            let dataShift = dataMassShifts[i];
            if (dataShift.shift_type == "unexpected" && dataShift.right_position != "0") {
                if (isNaN(parseFloat(dataShift.anno))) {
                    //then it is annotated with ptm name
                    let massShift = new MassShift(parseInt(dataShift.left_position), parseInt(dataShift.right_position), parseFloat(dataShift.shift), dataShift.shift_type, dataShift.anno);
                    massShifts.push(massShift);
                }
                else {
                    let massShift = new MassShift(parseInt(dataShift.left_position), parseInt(dataShift.right_position), parseFloat(dataShift.shift), dataShift.shift_type, dataShift.anno);
                    massShifts.push(massShift);
                }
            }
            else if (dataShift.right_position == 0) {
                console.error("Mass shift right position is 0!", dataShift);
            }
        }
    }
    return massShifts;
    /*
    // add protein N-terminal modifications
    if(prsm.annotated_protein.annotation.hasOwnProperty('ptm')) {
      let ptms = getJsonList(prsm.annotated_protein.annotation.ptm);
      for (let i = 0; i < ptms.length; i++) {
        let ptm = ptms[i];
        if(ptm.ptm_type != "Fixed" && ptm.hasOwnProperty("occurence")) {
          let occList = getJsonList(ptm.occurence);
          for (let j = 0; j < occList.length; j++) {
            let shift = {};
            shift.anno = ptm.ptm.abbreviation;
            shift.leftPos = occList[j].left_pos;
            shift.rightPos = occList[j].right_pos;
            massShifts.push(shift);
          }
        }
      }
    }
    let noDupMassShift = [];
    let duplicate = false;
    //remove duplicate mass shifts
    for (let a = 0; a < massShifts.length; a++){
      let massShiftA = massShifts[a];
      for (let b = 0; b < noDupMassShift.length; b++){
        let massShiftB = noDupMassShift[b];
        if (massShiftA.anno == massShiftB.anno){
          if (massShiftA.leftPos == massShiftB.leftPos){
            if (massShiftA.rightPos == massShiftB.rightPos){
              duplicate = true;
            }
          }
        }
      }
      if (!duplicate){
        noDupMassShift.push(massShiftA);
        duplicate = false;
      }
    }
      return noDupMassShift ;
    */
}
