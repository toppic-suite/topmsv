"use strict";
if (getCookie('token') === '') {
}
else {
    $('#signIn').text('Log out');
    $('#signIn').attr('href', '/logout');
}
function callAuthentication(e) {
    e.preventDefault();
    console.log(getCookie('token'));
    if (getCookie('token') === '') {
        let authValue = document.querySelector("#auth-value");
        if (authValue) {
            let shouldAuthenticate = authValue.textContent;
            if (shouldAuthenticate == "true") {
                window.location.href = window.location.href + "auth/google";
            }
            else if (shouldAuthenticate == "false") {
                window.location.href = window.location.href + "auth/skip";
            }
        }
        else {
            window.location.href = window.location.href + "logout";
        }
    }
}
$(document).ready(() => {
    //check browser
    let vendor = navigator.vendor.split(" ")[0];
    if (vendor.trim() != "Google") {
        alert("This application is written for Chrome browser only. Graphs will not show correctly in other browsers");
    }
});
