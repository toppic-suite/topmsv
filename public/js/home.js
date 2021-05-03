function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
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
    let shouldAuthenticate = document.getElementById("auth-value").textContent;
    if (shouldAuthenticate == "true") {
        window.location = window.location.href + "auth/google";
    }else if (shouldAuthenticate == "false") {
        window.location = window.location.href + "auth/skip";
    }
}