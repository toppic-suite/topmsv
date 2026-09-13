"use strict";
$(document).ready(function () {
    //go to the prsm folder and parse ms1 and ms2 spectrum numbers from each prsm
    /*$(".card-row").css('display', 'none');
    let x: string = location.href;
    let l_split: string[] = x.split(/[?#]+/);
    let folderName: string = l_split[1].split("=")[1];
    let head: HTMLHeadElement = document.getElementsByTagName('head')[0];
    let script: HTMLScriptElement = document.createElement('script');
    let file_name: string = folderName + "/prsms.js";
    script.type = 'text/javascript';
    script.src = file_name;
    head.appendChild(script);
    // Wait till the data is loaded from prsms.js and start executing the code
    script.onload = function () {
      // Function builds the complete HTML
      allSpectrum(folderName);
    };*/
    $(".card-row").css('display', 'none');
    $(".search-box").css('display', 'none');
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
            let url: string = "ms.html?folder=../../" + folder + "/data_js";
            window.open(url, "_self");
        });
    }
    else {
        $(".search-box").css('display', 'inline-block');
        // "data=<name>" is shorthand for "folder=../../<name>/data_js"
        let params: URLSearchParams = new URLSearchParams(l_split[1]);
        let dataName: string | null = params.get("data");
        let folderName: string = (dataName != null)
            ? "../../" + dataName + "/data_js"
            : l_split[1].split("=")[1];
        let finalPath: string = folderName;
        let head: HTMLHeadElement = document.getElementsByTagName('head')[0];
        let script: HTMLScriptElement = document.createElement('script');
        let file_name: string = finalPath + "/prsms.js";
        script.type = 'text/javascript';
        script.src = file_name;
        head.appendChild(script);
        // A sqlite without the TopPIC identification tables has no data_js files
        // (the request 404s): say so instead of leaving the page blank.
        script.onerror = function () {
            let div: Element = document.getElementsByClassName("container")[0];
            let p: HTMLParagraphElement = document.createElement('p');
            p.className = "no-identifications";
            p.innerHTML = 'No identification data: the sqlite file of this dataset has no TopPIC identification tables.';
            div.appendChild(p);
        };
        // Wait till the data is loaded from proteins.js and start executing the code
        script.onload = function () {
          // Function builds the complete HTML
          allSpectrum(folderName);
        };
    }
});
