"use strict";
function onclickTopView(e: JQuery.ClickEvent<HTMLElement, null, HTMLElement, HTMLElement>, prsmObj:Prsm): void {
    let topviewBtn: HTMLElement = <HTMLElement> e.currentTarget;
    if (!topviewBtn) {
        console.error("ERROR: invalid event target");
        return;
    }
    let specID: string | null = topviewBtn.getAttribute('specid');
    let ms2Spec: Spectrum[] | null = prsmObj.getMs2Spectra();

    if (!ms2Spec) {
        console.error("ERROR: ms2 spectrum is empty");
        return;
    }
    let currentSpec: Spectrum | undefined = ms2Spec.find((spectrum): Spectrum | undefined=> {
        if (spectrum.getSpectrumId() == specID) {
            return spectrum;
        }
    })

    if (!currentSpec) {
        console.error("ERROR: ms2 spectrum is empty");
        return;
    }

    let massAndIntensityList: string[] = [];
    let peakAndIntensityList: string[] = getDataFromPRSMtoSpectralView(currentSpec, specID);
    
    let ionList: string[] = [];

    currentSpec.getNTerminalIon().forEach(ion => {
        ionList.push(ion.getName());
    })
    currentSpec.getCTerminalIon().forEach(ion => {
        ionList.push(ion.getName());
    })
    //console.log(ionList);
    massAndIntensityList = getMassAndIntensityData(currentSpec);
    //console.log(prsmGraph.data.proteoform);
    let proteoform = prsmObj.getProteoform();
    let sequence: string  = proteoform.getSeq();
    //remove skipped residue
    sequence = sequence.slice(proteoform.getFirstPos());
    sequence = sequence.slice(0, proteoform.getLastPos() + 1 - proteoform.getFirstPos());
    
    let fixedPtmList: MassShift[] = proteoform.getFixedPtm();
    //prsmGraph.data.proteoform.compMassShiftList();//recalculate mass shifts
    let unknownMassShiftList: MassShift[] = proteoform.getUnknownMassShiftAndVarPtm();
    let precursorMass: string = currentSpec.getPrecMass().toString();
    // Stores all the data in the variables respectively
    window.localStorage.setItem('peakAndIntensityList', JSON.stringify(peakAndIntensityList));
    window.localStorage.setItem('massAndIntensityList', JSON.stringify(massAndIntensityList));
    window.localStorage.setItem('ionType', ionList.toString());
    window.localStorage.setItem('sequence', JSON.stringify(sequence));
    window.localStorage.setItem('fixedPtmList', JSON.stringify(fixedPtmList));
    window.localStorage.setItem('protVarPtmsList', JSON.stringify([]));
    window.localStorage.setItem('variablePtmsList', JSON.stringify([]));
    window.localStorage.setItem('unknownMassShiftList', JSON.stringify(unknownMassShiftList));
    window.localStorage.setItem('precursorMass', JSON.stringify(precursorMass));
    window.open("../inspect/spectrum.html");
}
/**
 * Get the peaklist from respective spectrum.js to set the data for inspect page
 * @param {object} ms2_data - json object with complete data spectrum for corresponding scan Id
 */
function getDataFromPRSMtoSpectralView(ms2Spec: Spectrum, specID: string | null): string[] {
  let peakAndIntensity: string[] = [];

  if (!specID) {
    console.error("ERROR: spectrum id is invalid");
    return peakAndIntensity;
  }

  ms2Spec.getPeaks().forEach(peak => {
    let tempObj: string = peak.getMonoMz().toString()+ " " + peak.getIntensity().toString();
    peakAndIntensity.push(tempObj);
  })
  return peakAndIntensity;
}
/**
 * Get the masslist from respective prsm.js to set the data for inspect page
 * @param {Integer} specId - Contians spec Id to get the data of corrsponding mass list
 */
function getMassAndIntensityData(ms2Spec: Spectrum): string[] {
  let massAndIntensityList: string[] = [];

  ms2Spec.getEnvs().forEach(env => {
    let tempObj: string = env.getMonoMass().toString() + " " + env.getIntensity().toString() + " " + env.getCharge().toString();
    massAndIntensityList.push(tempObj);
  })
  return massAndIntensityList;
}
/**
 * Create HTML dropdown buttons based on the scan list
 * @param {Array} scanIdList - Contains Scan id numbers
 * @param {Array} specIdList - Contains Spec Id numbers
 */
function setDropDownItemsForInspectButton(scanIdList: string[], specIdList: string[]): void {
    let dropdown_menu = $(".dropdownscanlist .dropdown-menu");
    let len: number = scanIdList.length;
    for (let i = 0; i < len; i++) {
        let value: string = scanIdList[i];
        let specId: string = specIdList[i];
        let id: string = "scan_" + value;
        let a: HTMLAnchorElement = document.createElement("a");
        a.setAttribute("class", "dropdown-item");
        a.setAttribute("href", "#!");
        a.setAttribute("id", id);
        a.setAttribute("value", value);
        a.setAttribute("specid", specId);
        a.innerHTML = "Scan " + value;
        dropdown_menu.append(a);
    }
}
/**
 * Onclick function, invoked on click of the inspect scn button
 */
function onClickToInspect(prsmObj: Prsm): void {
    $(".dropdownscanlist .dropdown-item ").click(function (e) {
        onclickTopView(e, prsmObj);
    });
}
