"use strict";
/**
 * This function waits till all the HTML tags are loaded.
 * Loads the related proteins.js data file
 */
$(document).ready(function () {
    $(".card-row").css('display', 'none');
    let x = location.href;
    // get the folder path by splitting url with "?","=","#"
    let l_split = x.split(/[?#]+/);
    if (l_split.length != 2) {
        $(".card-row").css('display', 'block');
        $(".card").hover(function () {
            $(this).css('cursor', 'pointer');
        });
        $(".card-body").click(function () {
            let folder = $(this).attr("id");
            let url = "proteins.html?folder=../../" + folder + "/data_js";
            window.open(url, "_self");
        });
    }
    else {
        let folderName = l_split[1].split("=")[1];
        let finalPath = folderName;
        let head = document.getElementsByTagName('head')[0];
        let script = document.createElement('script');
        let file_name = finalPath + "/proteins.js";
        script.type = 'text/javascript';
        script.src = file_name;
        head.appendChild(script);
        // Wait till the data is loaded from proteins.js and start executing the code
        script.onload = function () {
            // Function builds the complete HTML
            allProteins(folderName);
        };
    }
});
