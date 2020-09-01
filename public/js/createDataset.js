(function () {
    'use strict';

    var file = document.querySelector('#dbfile');
    var envfile1 = document.querySelector('#envfile1');
    // var envfile2 = document.querySelector('#envfile2');
    var project = document.getElementById('projectName');
    // var email = document.getElementById('emailAddress');
    var description = document.getElementById('description');
    var pub = document.getElementById('public');
    //console.log(pub.checked);
    var dbfilename = document.getElementById('dbfilename');
    var envfilename1 = document.getElementById('envfilename1');
    // var envfilename2 = document.getElementById('envfilename2');
    //var choosename = document.getElementById('dbfilename');
    var upload = document.querySelector('#uploadbutton');
    var progress = document.querySelector('#dbbar');
    var xhr = new XMLHttpRequest();

    upload.addEventListener('click', uploadFile, false);
    file.addEventListener('change', chooseFile, false);
    envfile1.addEventListener('change', chooseEnvFile1, false);
    // envfile2.addEventListener('change', chooseEnvFile2, false);

    function chooseFile(event) {
        dbfilename.innerHTML = file.files[0].name;
    }
    function chooseEnvFile1(event) {
        envfilename1.innerHTML = envfile1.files[0].name;
    }
    function chooseEnvFile2(event) {
        envfilename2.innerHTML = envfile2.files[0].name;
    }

    /**
     * @return {boolean}
     */
    function ValidateEmail(inputText)
    {
        var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if(inputText.match(mailformat))
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    // 点击上传
    function uploadFile(event) {
        //console.log(ValidateEmail(email.value));
        if (project.value === '' || file.files[0] === undefined) {
            alert("Please fill in all information above!");
        }else if(!file.files[0].name.match(/.(mzML)$/i)){
            alert('Please upload a mzML file!');
        }else if(envfile1.files[0] !== undefined && !envfile1.files[0].name.match(/.(env)$/i)){
            alert('Please upload an env file for envelopes!');
            /*}else if(envfile2.files[0] !== undefined && !envfile2.files[0].name.match(/.(env)$/i)){
                alert('Please upload an env file for ms2!');*/
            /*}else if (!ValidateEmail(email.value)){
                alert("You have entered an invalid email address!")*/
        } else {
            var formData = new FormData();
            formData.append('dbfile', file.files[0]);
            formData.append('envfile1', envfile1.files[0]);
            // formData.append('envfile2', envfile2.files[0]);
            formData.append('projectname', project.value);
            // formData.append('emailaddress', email.value);
            formData.append('description', description.value);
            formData.append('public', pub.checked);
            formData.append('eid', $('#selectExperiment').val());
            xhr.onload = uploadSuccess;
            xhr.upload.onprogress = setProgress;
            xhr.open('post', '/upload', true);
            xhr.send(formData);
        }
    }

    // 成功上传
    function uploadSuccess(event) {
        if (xhr.readyState === 4) {
            setTimeout(function(){ if(!alert("Data uploaded successfully!\nPlease check your email inbox for more information!"))window.location.href='/projectTab';}, 100)
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
$( document ).ready(function() {
    console.log( "ready!" );
    if($('#selectProject').val() === null) {
        alert("Please create a project first!");
    } else {
        $.ajax({
            url:"getExperimentList?pid=" + $('#selectProject').val(),
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
            url:"getExperimentList?pid=" + $('#selectProject').val(),
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
    })

    $('#createButton').click(function () {
        var result = confirm("Are you sure that you want to create this dataset?");
        if (result) {
            if (!$('#selectExperiment').val()) {
                alert("Please select a valid experiment first!");
            }
            $.ajax({
                url:"newDataset?dname=" + $('#dataset_Name').val() + "&eid=" + $('#selectExperiment').val() + "&description=" + $('#description').val(),
                type: "post",
                success: function (res) {
                    alert('Your dataset has been created.');
                    window.location.href = '/projectTab';
                }
            });
        }
    });
});