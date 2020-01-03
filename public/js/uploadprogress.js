(function () {
    'use strict';

    var file = document.querySelector('#dbfile');
    var envfile1 = document.querySelector('#envfile1');
    // var envfile2 = document.querySelector('#envfile2');
    var project = document.getElementById('projectName');
    var email = document.getElementById('emailAddress');
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
        if (project.value === '' || email.value ==='' || file.files[0] === undefined) {
            alert("Please fill in all information above!");
        }else if(!file.files[0].name.match(/.(mzML)$/i)){
            alert('Please upload a mzML file!');
        }else if(envfile1.files[0] !== undefined && !envfile1.files[0].name.match(/.(env)$/i)){
            alert('Please upload an env file for envelopes!');
        /*}else if(envfile2.files[0] !== undefined && !envfile2.files[0].name.match(/.(env)$/i)){
            alert('Please upload an env file for ms2!');*/
        }else if (!ValidateEmail(email.value)){
            alert("You have entered an invalid email address!")
        } else {
            var formData = new FormData();
            formData.append('dbfile', file.files[0]);
            formData.append('envfile1', envfile1.files[0]);
            // formData.append('envfile2', envfile2.files[0]);
            formData.append('projectname', project.value);
            formData.append('emailaddress', email.value);

            xhr.onload = uploadSuccess;
            xhr.upload.onprogress = setProgress;
            xhr.open('post', '/upload', true);
            xhr.send(formData);
        }
    }

    // 成功上传
    function uploadSuccess(event) {
        if (xhr.readyState === 4) {
            setTimeout(function(){ if(!alert("Data uploaded successfully!\nPlease check your email inbox for more information!"))window.location.reload();}, 100)
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

/*
$('#uploadbutton').on('click', function (){
    $('#dbfile').click();
    $('#dbbar').text('0%');
    $('#dbbar').width('0%');
});

$('#dbfile').on('change', function(){
    var formData = new FormData();
    formData.append('dbfile', file.files[0]);
    formData.append('projectname', project.value);
    formData.append('emailaddress', email.value);
    $.ajax({
        url: '/upload',
        type: 'POST',
        data: formData,
        cache: false,
        processData: false,
        contentType: false,
        success: function(data){
            console.log('upload successful!\n' + data);
        },
        xhr: function() {
            // create an XMLHttpRequest
            var xhr = new XMLHttpRequest();
            // listen to the 'progress' event
            xhr.upload.addEventListener('progress', function(evt) {
                if (evt.lengthComputable) {
                    /!*var complete = Number.parseInt(evt.loaded / evt.total * 100);
                    progress.style.width = complete + '%';
                    progress.innerHTML = complete + '%';*!/
                    // calculate the percentage of upload completed
                    var percentComplete = evt.loaded / evt.total;
                    percentComplete = parseInt(percentComplete * 100);
                    // update the Bootstrap progress bar with the new percentage
                    $('#dbbar').text(percentComplete + '%');
                    $('#dbbar').width(percentComplete + '%');
                    // once the upload reaches 100%, set the progress bar text to done
                    if (percentComplete === 100) {
                        $('#dbbar').html('Done');
                    }
                }
            }, false);
            return xhr;
        }
    });
/!*
    if (files.length > 0){
        // create a FormData object which will be sent as the data payload in the
        // AJAX request
        var formData = new FormData();
        // loop through all the selected files and add them to the formData object
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            // add the files to formData object for the data payload
            formData.append('uploads[]', file, file.name);
        }
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data){
                console.log('upload successful!\n' + data);
            },
            xhr: function() {
                // create an XMLHttpRequest
                var xhr = new XMLHttpRequest();
                // listen to the 'progress' event
                xhr.upload.addEventListener('progress', function(evt) {
                    if (evt.lengthComputable) {
                        // calculate the percentage of upload completed
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);
                        // update the Bootstrap progress bar with the new percentage
                        $('.progress-bar').text(percentComplete + '%');
                        $('.progress-bar').width(percentComplete + '%');
                        // once the upload reaches 100%, set the progress bar text to done
                        if (percentComplete === 100) {
                            $('.progress-bar').html('Done');
                        }
                    }
                }, false);
                return xhr;
            }
        });
    }
*!/
});*/
