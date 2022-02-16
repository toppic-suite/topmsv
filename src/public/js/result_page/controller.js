"use strict";
function toppicOnClick(projectCode) {
    //if a user clicks toppic button, check if topfd already ran
    //if not, display alert
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", "getAllowToppicStatus?projectCode=" + projectCode, true);
    xhttp.send();
    xhttp.onload = () => {
        if (xhttp.status == 200 && xhttp.readyState == 4) {
            let response = JSON.parse(xhttp.response);
            if (response.allowToppic == 0) {
                alert("Please run TopFD before running TopPIC");
            }
            else if (response.allowToppic == 1) {
                let xhttp2 = new XMLHttpRequest();
                console.log("allowToppic is 1");
                xhttp2.open("GET", "toppic?projectCode=" + projectCode, true);
                xhttp2.onload = () => {
                    if (xhttp2.status == 200 && xhttp.readyState == 4) {
                        window.location.replace("toppic?projectCode=" + projectCode);
                    }
                    ;
                };
                xhttp2.send();
            }
            else {
                console.error("ERROR: invalid allowToppic status in projectDB");
            }
        }
    };
}
