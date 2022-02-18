"use strict";
(function () {
    let file = document.querySelector('#dbfile');
    let envfile1 = document.querySelector('#envfile1');
    // var envfile2 = document.querySelector('#envfile2');
    let project = document.querySelector('projectName');
    // var email = document.getElementById('emailAddress');
    let description = document.querySelector('description');
    let pub = document.querySelector('public');
    //console.log(pub.checked);
    let dbfilename = document.querySelector('dbfilename');
    let envfilename1 = document.querySelector('envfilename1');
    // var envfilename2 = document.getElementById('envfilename2');
    //var choosename = document.getElementById('dbfilename');
    let upload = document.querySelector('#uploadbutton');
    let progress = document.querySelector('#dbbar');
    let xhr = new XMLHttpRequest();
    if (upload) {
        upload.addEventListener('click', uploadFile, false);
    }
    else {
        console.error("upload button doesn't exist");
    }
    if (file) {
        file.addEventListener('change', chooseFile, false);
    }
    else {
        console.error("dbfile input element doesn't exist");
    }
    function chooseFile() {
        if (dbfilename) {
            if (file && file.files) {
                dbfilename.innerHTML = file.files[0].name;
            }
            else {
                console.error("no files in files input element");
            }
        }
    }
    /*if (envfile1) {
      envfile1.addEventListener('change', chooseEnvFile1, false);
    } else {
      console.error("envelope file input element doesn't exist");
    }
    // envfile2.addEventListener('change', chooseEnvFile2, false);
    function chooseEnvFile1() {
      if (envfilename1) {
        if (envfile1 && envfile1.files) {
          envfilename1.innerHTML = envfile1.files[0].name;
        } else {
          console.error("no envelope files in files input element");
        }
      }
    }
    function chooseEnvFile2(event) {
      envfilename2.innerHTML = envfile2.files[0].name;
    }*/
    /*function ValidateEmail(inputText) {
      var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if(inputText.match(mailformat)) {
        return true;
      } else {
        return false;
        }
    }*/
    // 点击上传
    function uploadFile() {
        if (!project) {
            console.error("cannot read project information");
            return;
        }
        if (!file || !file.files) {
            console.error("cannot read file information");
            return;
        }
        //console.log(ValidateEmail(email.value));
        if (project.value === '' || file.files[0] === undefined) {
            alert("Please fill in all information above!");
        }
        else if (!file.files[0].name.match(/.(mzML)$/i)) {
            alert('Please upload a mzML file!');
            /*} else if(envfile1.files[0] !== undefined && !envfile1.files[0].name.match(/.(env)$/i)){
                alert('Please upload an env file for envelopes!');
                }else if(envfile2.files[0] !== undefined && !envfile2.files[0].name.match(/.(env)$/i)){
                alert('Please upload an env file for ms2!');*/
            /*}else if (!ValidateEmail(email.value)){
            alert("You have entered an invalid email address!")*/
        }
        else {
            let formData = new FormData();
            formData.append('dbfile', file.files[0]);
            //formData.append('envfile1', envfile1.files[0]);
            // formData.append('envfile2', envfile2.files[0]);
            formData.append('projectname', project.value);
            // formData.append('emailaddress', email.value);
            if (description) {
                formData.append('description', description.value);
            }
            if (pub) {
                formData.append('public', (pub.checked).toString());
            }
            //formData.append('eid', $('#selectExperiment').val());
            xhr.onload = uploadSuccess;
            xhr.upload.onprogress = setProgress;
            xhr.open('post', '/upload', true);
            xhr.send(formData);
        }
    }
    // 成功上传
    function uploadSuccess() {
        if (xhr.readyState === 4) {
            alert("Data uploaded successfully!\nPlease check your email inbox for more information!");
            setTimeout(function () { window.location.href = '/projectTab'; }, 100);
        }
    }
    // 进度条
    function setProgress(event) {
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
})();
$(document).ready(function () {
    console.log("ready!");
    if ($('#selectProject').val() === null) {
        alert("Please create a project first!");
    }
    else {
        $.ajax({
            url: "getExperimentList?pid=" + $('#selectProject').val(),
            type: "get",
            dataType: "JSON",
            success: function (res) {
                $('#selectExperiment').empty();
                for (let i = 0; i < res.length; i++) {
                    let eid = res[i].eid;
                    let ename = res[i].ename;
                    $('#selectExperiment').append($("<option></option>").attr("value", eid).text(ename));
                }
                // console.log("res", res);
            }
        });
    }
    $('#selectProject').on("change", function () {
        $.ajax({
            url: "getExperimentList?pid=" + $('#selectProject').val(),
            type: "get",
            dataType: "JSON",
            success: function (res) {
                $('#selectExperiment').empty();
                for (let i = 0; i < res.length; i++) {
                    let eid = res[i].eid;
                    let ename = res[i].ename;
                    $('#selectExperiment').append($("<option></option>").attr("value", eid).text(ename));
                }
                // console.log("res", res);
            }
        });
    });
    $('#createButton').click(function () {
        var result = confirm("Are you sure that you want to create this dataset?");
        if (result) {
            if (!$('#selectExperiment').val()) {
                alert("Please select a valid experiment first!");
            }
            $.ajax({
                url: "newDataset?dname=" + $('#dataset_Name').val() + "&eid=" + $('#selectExperiment').val() + "&description=" + $('#description').val(),
                type: "post",
                success: function (res) {
                    alert('Your dataset has been created.');
                    window.location.href = '/projectTab';
                }
            });
        }
    });
});
