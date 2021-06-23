"use strict";
/**
 * Code to set width of the monomass tables and sorting the table based on the first column
 */
$(document).ready(function () {
    //@ts-ignore
    $('#spectrum').dataTable({
        "scrollY": "400px",
        "scrollCollapse": true,
        "paging": false,
        "order": [[1, "asc"]],
        "bSortClasses": false,
        "columns": [
            { "type": "num" },
            { "type": "num" },
            { "type": "num" },
            null,
            { "type": "num" },
            { "type": "num" },
            { "type": "num" },
            null,
            { "type": "num" },
            { "type": "num" },
            { "type": "num" }
        ]
    });
});
/**
 * Function to show only matched peaks on click of matched peaks button
 */
function showMatchedPeaks(): void {
    var elems = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("matched_peak");
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = "";
    }
    elems = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("unmatched_peak");
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = "none";
    }
    //$('div.dataTables_scrollBody').height(400);
}
/**
 * Function to show only unmatched peaks on click of unmatched peaks button
 */
function showNotMatchedPeaks(): void {
    var elems = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("matched_peak");
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = "none";
    }
    elems = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName("unmatched_peak");
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = "";
    }
    //$('div.dataTables_scrollBody').height(400);
}
/**
 * Function to show all peaks on click of All peaks button
 */
function showAllPeaks(): void {
    var elems =  <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName('matched_peak');
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = "";
    }
    elems =  <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName('unmatched_peak');
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = "";
    }
    //$('div.dataTables_scrollBody').height(400);
}
/**
 * This gets invoked on click of annotation in the SVG of sequence at matched positions
 * Function to show only ions matched at a particular position
 * @param {String} ids - contains name of the tag
 */
function showIonPeaks(ids: string): void {
    var elems = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName('matched_peak');
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = 'none';
    }
    elems = <HTMLCollectionOf<HTMLElement>> document.getElementsByClassName('unmatched_peak');
    for (var i = 0; elems.length > i; i++) {
        elems[i].style.display = 'none';
    }
    let elemsTemp = document.getElementsByName(ids);
    for (var j = 0; elemsTemp.length > j; j++) {
        elemsTemp[j].style.display = "";
        //elems[j].style.background  =  "#BEECFF";
    }
}
