"use strict";
class UploadMzrt {
    constructor() { }
    static deleteFile() {
        let result = confirm("Are you sure that you want to delete mzrt data?");
        if (result) {
            let projectDir = document.querySelector("#projectDir");
            let projectCode = document.querySelector("#projectCode");
            if (!projectDir) {
                console.error("project directory information cannot be found");
                return;
            }
            if (!projectCode) {
                console.error("project code information cannot be found");
                return;
            }
            $.ajax({
                url: "deleteMzrt?projectDir=" + projectDir.value + "&projectCode=" + projectCode.value,
                type: "get",
                // dataType: 'json',
                success: function (res) {
                    alert('Your previous mzrt data has been removed.');
                    location.reload();
                }
            });
        }
    }
    static uploadFile() {
        let mzrtFile = document.querySelector('#mzrtFile');
        let mzrtProgress = document.querySelector('#mzrtProgressbar');
        let projectDir = document.querySelector("#projectDir");
        let projectCode = document.querySelector("#projectCode");
        let projectName = document.querySelector("#projectName");
        let email = document.querySelector("#email");
        let xhr = new XMLHttpRequest();
        if (!projectDir) {
            console.error("project directory information cannot be found");
            return;
        }
        if (!projectCode) {
            console.error("project code information cannot be found");
            return;
        }
        if (!projectName) {
            console.error("project directory information cannot be found");
            return;
        }
        if (!email) {
            console.error("project code information cannot be found");
            return;
        }
        if (!mzrtFile || !mzrtFile.files) {
            console.error("feature file cannot be saved");
            return;
        }
        if (mzrtFile.files[0] === undefined) {
            alert("Please choose a mzrt file first!");
            return;
        }
        else if (!mzrtFile.files[0].name.match(/.(csv)$/i)) {
            alert('Please upload a csv file!');
            return;
        }
        let formData = new FormData();
        formData.append('mzrtFile', mzrtFile.files[0]);
        formData.append('projectDir', projectDir.value);
        formData.append('projectCode', projectCode.value);
        formData.append('projectName', projectName.value);
        formData.append('email', email.value);
        xhr.upload.onprogress = mzrtSetProgress;
        xhr.onload = mzrtUploadSuccess;
        xhr.open('post', '/mzrt', true);
        xhr.send(formData);
        function mzrtUploadSuccess() {
            if (xhr.readyState === 4) {
                alert("Upload successfully!");
                window.location.replace("/projects");
            }
        }
        function mzrtSetProgress(event) {
            if (event.lengthComputable) {
                let complete = Math.trunc(event.loaded / event.total * 100);
                if (mzrtProgress) {
                    mzrtProgress.style.width = complete + '%';
                    mzrtProgress.innerHTML = complete + '%';
                    if (complete == 100) {
                        mzrtProgress.innerHTML = 'Done!';
                    }
                }
                else {
                    console.error("no progress bar on the page");
                }
            }
        }
    }
}
UploadMzrt.main = () => {
    let mzrtUpload = document.querySelector("#mzrtUpload");
    let deleteMzrt = document.querySelector("#deleteMzrt");
    if (mzrtUpload) {
        mzrtUpload.addEventListener("click", UploadMzrt.uploadFile, false);
    }
    else {
        console.error("mzrt upload button doesn't exist");
    }
    if (deleteMzrt) {
        deleteMzrt.addEventListener("click", UploadMzrt.deleteFile, false);
    }
    else {
        console.error("mzrt delete button doesn't exist");
    }
};
