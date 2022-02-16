"use strict";
/**
 * Set Mass List on to html
 */
function setDataToMassAndIntensity(massAndIntensityList) {
    jqueryElements.massData.val(massAndIntensityList);
}
/**
 * getlist of Mass,Intensity and charge from UI
 */
function getMassListFromUI() {
    let spectrumDataList = [];
    let lines = [];
    // Read data line by line from the mass and intensity box
    let massData = jqueryElements.massData.val();
    if (typeof (massData) == 'string') {
        lines = massData.split('\n');
        for (var i = 0; i < lines.length; i++) {
            let massAndInte = lines[i].trim();
            if (massAndInte.length !== 0) {
                // Get Mass,intensity and charge either by space seperated or tab seperated
                let massInte = massAndInte.split(/[\s]+/);
                if (massInte[0] !== undefined && massInte[1] !== undefined
                    && !isNaN(parseFloat(massInte[0])) && !isNaN(parseFloat(massInte[1]))) {
                    let spectrumData = new Peak(i.toString(), parseFloat(massInte[0]), -1, parseFloat(massInte[1]), parseFloat(massInte[0]), parseFloat(massInte[2]));
                    if (spectrumData.getPos() && spectrumData.getIntensity()) {
                        spectrumDataList.push(spectrumData);
                    }
                }
            }
        }
    }
    // completeCalData.monomasslist = spectrumDataList;
    return spectrumDataList;
}
