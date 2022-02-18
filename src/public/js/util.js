"use strict";
function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
// Upload success
function uploadSuccess(xhr) {
    if (xhr.readyState === 4) {
        alert("Data uploaded successfully!\nPlease wait for processing!");
        setTimeout(function () { window.location.reload(); }, 100);
    }
}
// progress bar
function setProgress(progress, event) {
    if (event.lengthComputable) {
        let complete = Math.trunc(event.loaded / event.total * 100);
        if (progress) {
            progress.style.width = complete + '%';
            progress.innerHTML = complete + '%';
            if (complete == 100) {
                progress.innerHTML = 'Done!';
            }
        }
        else {
            console.error("no progress bar on the page");
        }
    }
}
function cleanInfo() {
    $("#scanID2").empty();
    $("#prec_mz").empty();
    $("#prec_charge").empty();
    $("#prec_inte").empty();
    $("#rt").empty();
    //$("#tabs").empty();
    $("#spectrum2").empty();
    $("#tabList").empty();
}
