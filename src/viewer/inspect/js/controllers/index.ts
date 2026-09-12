"use strict";
// Gets executed once HTML is loaded
$(document).ready(function (): void {
    onLoadOfHTML();
});
/**
 * @function onLoadOfHTML
 * @description Gets invoked immediatley after loading html
 */
const onLoadOfHTML = function (): void {
    setPrecursorMass(100);
    // Opened from a PrSM page (?folder=&prsm_id=[&spec_id=]): load that PrSM's
    // spectrum and sequence data into the inputs. Otherwise the page starts
    // empty with the default b/y ions.
    let params = new URLSearchParams(window.location.search);
    let folder: string | null = params.get("folder");
    let prsmId: string | null = params.get("prsm_id");
    if (folder && prsmId) {
        loadPrsmForInspect(folder, prsmId, params.get("spec_id"));
    }
    else {
        setIonCheckbox(null);
    }
    
    let massErrorthVal: number = 0.1;
    let ppmErrorthVal: number = 15;
    /**
     * set All the common fixed PTM's to Fixed Ptm dropdown menu
     */
    setFixedPtmListToUI(COMMON_FIXED_PTM_LIST);
    /**
     * Set Error Threshhold value to default {massErrorthVal}
     */
    setMassErrorValue(massErrorthVal);
    /**
     * On Change Event handler. Changes the thresholds values from
     * from {massErrorthVal} to {ppmErrorthVal}
     */
    jqueryElements.errorDropdown.change(() => {
        let errorType: string | number | string[] | undefined = jqueryElements.errorDropdown.val();
        if (errorType === "masserror") {
            jqueryElements.errorValue.val(massErrorthVal);
            jqueryElements.errorUnit.html("Da&nbsp;&nbsp;");
        }
        else {
            jqueryElements.errorValue.val(ppmErrorthVal);
            jqueryElements.errorUnit.html("ppm&nbsp;&nbsp;");
        }
    });
    /**
     * On Change Event handler. Updates precursor mass with the newly entered value
     */
     domElements.precursorMass.addEventListener("keyup", () => {
        setPrecursorMass(parseFloat(domElements.precursorMass.value));
    })
    /**
     * On Click Event handler. Gets invoked on click of submit button
     * in HTML
     */
     jqueryElements.submit.click(function () {
        let errorVal: number = 0;
        let errorType: string | number | string[] | undefined = jqueryElements.errorDropdown.val();
        let val:  string | number | string[] | undefined = jqueryElements.errorValue.val();
        if (typeof(val) == "string") {
            if (errorType === "masserror") {
                errorVal = parseFloat(val.trim());
                massErrorthVal = errorVal;
            }
            else {
                errorVal = parseFloat(val.trim());
                ppmErrorthVal = errorVal;
            }
        }
        let executionObj: SeqOfExecution = new SeqOfExecution();
        //instead of passing precursor mass as argument, get the value inside the sequenceofexecution.js
        //because precursor mass may become different from initial value from prsm
        //after the user edited the precursor mass value
        if (typeof(errorType) == "string") {
            executionObj.sequenceOfExecution(errorType, errorVal, "");
        }
        else{
            console.error("ERROR: invalid errorType");
        }
        // domElements.totalSeqMass.style.display = "block";
        // domElements.massVariation.style.display = "block";
    });
    /**
     * On Click action to hide and show the table of calculate theoretical
     * masses with matched and unmatched masses
     */
    jqueryElements.hideTable.click(function () {
        let text_val: string = jqueryElements.hideTable.html().trim();
        if (text_val === "Hide Table") {
            jqueryElements.hideTable.html("Show Table");
            jqueryElements.monoMassTableContainer.hide();
        }
        if (text_val === "Show Table") {
            jqueryElements.hideTable.html("Hide Table");
            jqueryElements.monoMassTableContainer.show();
        }
    });
};
/**
 * @function showAllPeaks
 * @description Function to display all peaks of data in table. This handles on click action
 * from html of show all peaks button.
 */
const showAllPeaksInspect = function (): void {
    let elems: HTMLCollectionOf<Element> = domElements.matchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element: HTMLElement = <HTMLElement>elems[i];
        element.style.display = '';
    }
    elems = domElements.unmatchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element: HTMLElement = <HTMLElement>elems[i];
        element.style.display = '';
    }
    $('div.dataTables_scrollBody').height(400);
};
/**
 * @function showMatchedPeaks
 * @description Function to display only matched peaks in table. This handles on click action
 * from html of show matched peaks button.
 */
const showMatchedPeaksInspect  = function (): void {
    let elems: HTMLCollectionOf<Element> = domElements.matchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element: HTMLElement = <HTMLElement>elems[i];
        element.style.display = "";
    }
    elems = domElements.unmatchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element: HTMLElement = <HTMLElement>elems[i];
        element.style.display = "none";
    }
    $('div.dataTables_scrollBody').height(400);
};
/**
 * @function showNonMatchedPeaks
 * @description Function to display only un matched peaks in table. This handles on click action
 * from html of show un matched peaks button.
 */
const showNonMatchedPeaksInspect  = function (): void {
    let elems: HTMLCollectionOf<Element> = domElements.matchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element: HTMLElement = <HTMLElement>elems[i];
        element.style.display = "none";
    }
    elems = domElements.unmatchedPeaks;
    for (let i = 0; elems.length > i; i++) {
        let element: HTMLElement = <HTMLElement>elems[i];
        element.style.display = "";
    }
    $('div.dataTables_scrollBody').height(400);
};

/**
 * @function setVariablePTM
 * @description unused function
 */
/*
const setVariablePTMListInspect  = function (protVarPtmsList: MassShift[], variablePtmsList: MassShift[]): void {
    for (let i = 0; i < protVarPtmsList.length; i++) {
        for (let j = 0; j < protVarPtmsList[i].posList.length; j++) {
            let temp = { "name": protVarPtmsList[i].name, "posList": [protVarPtmsList[i].posList[j]], "mono_mass": parseFloat(protVarPtmsList[i].mono_mass), "type": "Protein variable" };
            VAR_PTM_LIST.push(temp);
        }
    }
    for (let i = 0; i < variablePtmsList.length; i++) {
        for (let j = 0; j < variablePtmsList[i].posList.length; j++) {
            let temp = { "name": variablePtmsList[i].name, "posList": [variablePtmsList[i].posList[j]], "mono_mass": parseFloat(variablePtmsList[i].mono_mass), "type": "non-Protein variable" };
            VAR_PTM_LIST.push(temp);
        }
    }
};*/
