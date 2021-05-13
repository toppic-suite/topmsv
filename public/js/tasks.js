function showTaskStatus(taskData, projectCode) {
    let fileName = projectCode + "_" + taskData + "_log.txt";
    let xhttp = new XMLHttpRequest();
 
    xhttp.open("GET", "getStatusLog?fileName=" + fileName, true);

    xhttp.onload = () => {
        if (xhttp.status == 200 && xhttp.readyState == 4) {
            let log = xhttp.response;
            document.getElementById("task-status-para").innerHTML = log;
            $('#statusModal').modal('show');
        }     
    }
    xhttp.send();
}
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
    alert('Please sign in to check your own tasks!');
    window.location.href = '/';
}