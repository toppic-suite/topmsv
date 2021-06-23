/**
 * Set Precursor mass on html 
 */
function setPrecursorMass(precursorMass: number): void{
    domElements.precursorMass.setAttribute("value", precursorMass.toString());
}
/**
 * get Precursor mass 
 */
function getPrecursorMass(): string | null {
    return domElements.precursorMass.getAttribute("value");
}
function setPrecursorMassEventHandler(): void {
    jqueryElements.precursorMassSubmit.click(function(){
        let precursorMass: string | null = domElements.precursorMass.getAttribute("value");
        let totalMass: string = jqueryElements.totalMass.html();

        if (precursorMass) {
            setMassDifference(parseFloat(precursorMass), parseFloat(totalMass));
        }
        else {
            console.error("ERROR: precursor mass is null");
        }
    })
}
/**
 * Set Total mass on to the html
 * @param {*} totalMass 
 */
function setTotalSeqMass(mass: number): void{
    let totalMass: string = mass.toFixed(4);
    jqueryElements.totalMass.html(totalMass);
    domElements.totalSeqMass.setAttribute("style", 'block');
}

/**
 * Set Mass difference on to the html
 * @param {Float} precursorMass - Contains Precursor mass
 * @param {Float} proteinMass - Contains calculated protein Mass
 */
function setMassDifference(precursorMass: number, proteinMass: number): void{
    let diff: number = precursorMass - proteinMass;
    domElements.massDifference.innerHTML = diff.toFixed(4);
    domElements.massVariation.setAttribute("style", 'block');
}