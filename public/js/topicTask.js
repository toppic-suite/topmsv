(function () {
    'use strict';

    var fastaFile = document.querySelector('#Protein_Database_Fasta');
    var lcmsFeatureFile = document.querySelector('#LCMS_Feature');
    var fiexedPTMFile = document.querySelector('#Fixed_PTMs');
    var ptmShiftFile = document.querySelector('#PTMs_Shifts');
    var projectCode = document.getElementById('projectCode');
    var threadNum = document.getElementById('threadNum');
    console.log(projectCode.value);
    // var dbfilename = document.getElementById('dbfilename');
    // var envfilename1 = document.getElementById('envfilename1');
    var upload = document.querySelector('#submitButton');
    var progress = document.querySelector('#progressbar');
    var xhr = new XMLHttpRequest();

    upload.addEventListener('click', uploadFile, false);
    // file.addEventListener('change', chooseFile, false);
    // envfile1.addEventListener('change', chooseEnvFile1, false);
    // envfile2.addEventListener('change', chooseEnvFile2, false);

    // 点击上传
    function uploadFile(event) {
        console.log("uploadFile");
        //console.log(ValidateEmail(email.value));
        if (fastaFile.files[0] === undefined) {
            alert("Please choose a fasta database!");
        }else if(!fastaFile.files[0].name.match(/.(fasta)$/i)){
            alert('Please upload a fasta file for protein database!');
        }else if(lcmsFeatureFile.files[0] !== undefined && !lcmsFeatureFile.files[0].name.match(/.(txt)$/i)){
            alert('Please upload a txt file for feature file!');
        }else if(fiexedPTMFile.files[0] !== undefined && !fiexedPTMFile.files[0].name.match(/.(txt)$/i)){
            alert('Please upload a txt file for fixed ptm file!');
        }else if (ptmShiftFile.files[0] !== undefined && !ptmShiftFile.files[0].name.match(/.(txt)$/i)){
            alert("Please upload a txt file for shift ptm file!")
        } else {
            var formData = new FormData();
            formData.append('fastaFile', fastaFile.files[0]);
            formData.append('lcmsFeatureFile', lcmsFeatureFile.files[0]);
            formData.append('fiexedPTMFile', fiexedPTMFile.files[0]);
            formData.append('ptmShiftFile', ptmShiftFile.files[0]);
            formData.append('projectCode', projectCode.value);
            formData.append('threadNum', threadNum.value);
            console.log(formData);
            xhr.onload = uploadSuccess;
            xhr.upload.onprogress = setProgress;
            xhr.open('post', '/toppicTask', true);
            xhr.send(formData);
        }
    }

    // 成功上传
    function uploadSuccess(event) {
        if (xhr.readyState === 4) {
            setTimeout(function(){ if(!alert("Data uploaded successfully!\nPlease wait for processing!"))window.location.href ='/';}, 100)
        }
    }

    // 进度条
    function setProgress(event) {
        if (event.lengthComputable) {
            var complete = Number.parseInt(event.loaded / event.total * 100);
            progress.style.width = complete + '%';
            progress.innerHTML = complete + '%';
            if (complete == 100) {
                progress.innerHTML = 'Done!';
            }
        }
    }
})();