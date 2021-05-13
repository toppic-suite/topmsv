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