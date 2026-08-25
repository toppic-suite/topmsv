"use strict";
// Gets executed once HTML is loaded
$(document).ready(function () {
    onLoadOfHTML();
    localStorage.clear();
    //ion type data needs to be preserved because it is recorded only once when the prsm.html opens. 
    //Without this line it is going to break when the user tries to open inspect window again after closing.
    //localStorage.setItem('ionType', ionType); 
});
/**
 * @function onLoadOfHTML
 * @description Gets invoked immediatley after loading html
 */
const onLoadOfHTML = function () {
    // Get the data from local storage 
    let peakAndIntensityList = parsePeakMass('peakAndIntensityList');
    // console.log(peakAndIntensityList);
    let massAndIntensityList = parsePeakMass('massAndIntensityList');

    let precursorMass = parsePrecursorMass("precursorMass");
    if (peakAndIntensityList !== null && massAndIntensityList !== null) {
        setDataToPeakAndIntensity(peakAndIntensityList);
        setDataToMassAndIntensity(massAndIntensityList);
    }
    if (precursorMass) {
        setPrecursorMass(precursorMass);
    }
    /**
     * On Change Event handler. Updates precursor mass with the newly entered value
     */
    domElements.precursorMass.addEventListener("keyup", () => {
        setPrecursorMass(parseFloat(domElements.precursorMass.value));
    });
    /**
     * On Click Event handler. Gets invoked on click of submit button
     * in HTML
     */
    jqueryElements.submit.click(function () {
        let executionObj = new SeqOfExecution();
        executionObj.sequenceOfExecution();
    });


};
/**
 * @function showAllPeaks
 * @description Function to display all peaks of data in table. This handles on click action
 * from html of show all peaks button.
 */
const showAllPeaksInspect = function () {
    let elems = domElements.matchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element = elems[i];
        element.style.display = '';
    }
    elems = domElements.unmatchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element = elems[i];
        element.style.display = '';
    }
    $('div.dataTables_scrollBody').height(400);
};
/**
 * @function showMatchedPeaks
 * @description Function to display only matched peaks in table. This handles on click action
 * from html of show matched peaks button.
 */
const showMatchedPeaksInspect = function () {
    let elems = domElements.matchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element = elems[i];
        element.style.display = "";
    }
    elems = domElements.unmatchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element = elems[i];
        element.style.display = "none";
    }
    $('div.dataTables_scrollBody').height(400);
};
/**
 * @function showNonMatchedPeaks
 * @description Function to display only un matched peaks in table. This handles on click action
 * from html of show un matched peaks button.
 */
const showNonMatchedPeaksInspect = function () {
    let elems = domElements.matchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element = elems[i];
        element.style.display = "none";
    }
    elems = domElements.unmatchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element = elems[i];
        element.style.display = "";
    }
    $('div.dataTables_scrollBody').height(400);
};

 