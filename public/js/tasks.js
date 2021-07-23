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
} else {
    $('#signIn').text('Log out');
    $('#signIn').attr('href', '/logout');
}
//check if files have been modified
/*(function checkStatusUpdate(){
    let tasks = document.getElementsByClassName("taskId");
    let projects = document.getElementsByClassName("projectCode");
    let fileNames = [];

    for (let i = 0; i < tasks.length; i++) {
        let file = projects[i].innerHTML + "_" + tasks[i].innerHTML + "_log.txt";
        fileNames.push(file);
    }
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", "checkFileStatus?fileName=" + fileNames.toString(), true);

    xhttp.onload = () => {
        if (xhttp.status == 200 && xhttp.readyState == 4) {
            let data = xhttp.response;
            if (data == "true") {
                location.reload();
            }
        }     
    }
    xhttp.send();
})();*/
