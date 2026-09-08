"use strict";
/**
 * This function waits till all the HTML tags are loaded.
 * Loads the related proteins.js data file
 */
$(document).ready(function () {
    $(".card-row").css('display', 'none');
    let x: string = location.href;
    // get the folder path by splitting url with "?","=","#"
    let l_split: string[] = x.split(/[?#]+/);
    if (l_split.length != 2) {
        $(".card-row").css('display', 'block');
        $(".card").hover(function () {
            $(this).css('cursor', 'pointer');
        });
        $(".card-body").click(function () {
            let folder: string | undefined = $(this).attr("id");
            let url: string = "proteins.html?folder=../../" + folder + "/data_js";
            window.open(url, "_self");
        });
    }
    else {
        // "data=<name>" is shorthand for "folder=../../<name>/data_js"
        let params: URLSearchParams = new URLSearchParams(l_split[1]);
        let dataName: string | null = params.get("data");
        let folderName: string = (dataName != null)
            ? "../../" + dataName + "/data_js"
            : l_split[1].split("=")[1];
        let finalPath: string = folderName;
        let head: HTMLHeadElement = document.getElementsByTagName('head')[0];
        let script: HTMLScriptElement = document.createElement('script');
        let file_name: string = finalPath + "/proteins.js";
        script.type = 'text/javascript';
        script.src = file_name;
        head.appendChild(script);
        // A dataset uploaded without the TopPIC XMLs has no data_js files
        // (the request 404s): say so instead of leaving the page blank.
        script.onerror = function () {
            let div: Element = document.getElementsByClassName("container")[0];
            let p: HTMLParagraphElement = document.createElement('p');
            p.className = "no-identifications";
            p.innerHTML = 'No identification data: this dataset was uploaded without the TopPIC PrSM and proteoform XML files.';
            div.appendChild(p);
        };
        // Wait till the data is loaded from proteins.js and start executing the code
        script.onload = function () {
            // Function builds the complete HTML
            allProteins(folderName);
        };
    }
});
