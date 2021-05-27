$( document ).ready(function() {
    let ms1file = document.querySelector('#MS1_msalign');
    let ms2file = document.querySelector('#MS2_msalign');
    let upload = document.querySelector('#modalUpload');
    let progress = document.querySelector('#progressbar');
    let xhr = new XMLHttpRequest();
    upload.addEventListener('click', uploadFile, false);

    function uploadFile() {
        if(ms1file.files[0] === undefined || ms2file.files[0] === undefined) {
            alert("Please choose msalign files for both ms1 and ms2!");
            return;
        } else if (!ms1file.files[0].name.match(/.(msalign)$/i)) {
            alert("Please upload .msalign file for ms1");
            return;
        } else if (!ms2file.files[0].name.match(/.(msalign)$/i)) {
            alert("Please upload .msalign file for ms2");
            return;
        }
        let formData = new FormData();
        formData.append('ms1file', ms1file.files[0]);
        formData.append('ms2file', ms2file.files[0]);
        formData.append('projectDir', document.getElementById('projectDir').value);
        formData.append('projectCode',document.getElementById("projectCode").value);
        formData.append('projectName', document.getElementById("projectName").value);
        formData.append('email', document.getElementById("email").value);
        xhr.onload = uploadSuccess;
        xhr.upload.onprogress = setProgress;
        xhr.open('post', '/msalign', true);
        xhr.send(formData);
    }

    function uploadSuccess(event) {
        if (xhr.readyState === 4) {
            alert("Upload successfully! Please wait for data processing, you will receive an email when it's done");
            window.location.replace("/projects");
        }
    }

    function setProgress(event) {
        if (event.lengthComputable) {
            let complete = Number.parseInt(event.loaded / event.total * 100);
            progress.style.width = complete + '%';
            progress.innerHTML = complete + '%';
            if (complete == 100) {
                progress.innerHTML = 'Done!';
            }
        }
    }
})