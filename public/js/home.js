function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    console.log("ca", ca);
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
if(getCookie('token')===''){
    
} else {
    $('#signIn').text('Log out');
    $('#signIn').attr('href', '/logout');
}
function callAuthentication(e) {//when user clicks sign in button
    e.preventDefault();
    if(getCookie('token')===''){
        let shouldAuthenticate = document.getElementById("auth-value").textContent;
        if (shouldAuthenticate == "true") {
            window.location = window.location.href + "auth/google";
        }else if (shouldAuthenticate == "false") {
            window.location = window.location.href + "auth/skip";
        }
    } else {
        window.location = window.location.href + "logout";
    }
}
$(document).ready(() => {
    //check browser
    let vendor = navigator.vendor.split(" ")[0];
	if(vendor.trim() != "Google") {
		alert("This application is written for Chrome browser only. Graphs will not show correctly in other browsers");
    }
}) 