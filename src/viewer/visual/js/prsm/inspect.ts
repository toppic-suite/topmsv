"use strict";
/**
 * Create the Inspect dropdown items, one per MS2 scan of the PrSM. Each is a
 * link to the visual inspection page, which loads the PrSM and spectrum data
 * itself from ?folder=&prsm_id=&spec_id= (see inspect/js/models/loadPrsm.ts).
 * @param {Array} scanIdList - Contains Scan id numbers
 * @param {Array} specIdList - Contains Spec Id numbers
 * @param {string} folderPath - data_js folder of this PrSM (the page's ?folder=)
 * @param {string} prsmId - id of this PrSM (the page's ?prsm_id=)
 */
function setDropDownItemsForInspectButton(scanIdList: string[], specIdList: string[],
    folderPath: string, prsmId: string): void {
    let dropdown_menu = $(".dropdownscanlist .dropdown-menu");
    let len: number = scanIdList.length;
    for (let i = 0; i < len; i++) {
        let value: string = scanIdList[i];
        let specId: string = specIdList[i];
        let id: string = "scan_" + value;
        let a: HTMLAnchorElement = document.createElement("a");
        a.setAttribute("class", "dropdown-item");
        a.setAttribute("href", "../inspect/spectrum.html?folder=" + folderPath
            + "&prsm_id=" + prsmId + "&spec_id=" + specId);
        a.setAttribute("target", "_blank");
        a.setAttribute("id", id);
        a.setAttribute("value", value);
        a.setAttribute("specid", specId);
        a.innerHTML = "Scan " + value;
        dropdown_menu.append(a);
    }
}
