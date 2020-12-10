(function () {
    'use strict';

    let file = document.querySelector('#dbfile');
    let txtfile = document.querySelector('#txtfile');
    let envfile1 = document.querySelector('#envfile1');
    // let envfile2 = document.querySelector('#envfile2');
    let project = document.getElementById('projectName');
    // let email = document.getElementById('emailAddress');
    let description = document.getElementById('description');
    let pub = document.getElementById('public');

    let scan_level = document.getElementById('scan_level');
    let prec_mz = document.getElementById('prec_mz');
    let prec_charge = document.getElementById('prec_charge');
    let prec_inte = document.getElementById('prec_inte');

    //console.log(pub.checked);
    let dbfilename = document.getElementById('dbfilename');
    let txtfilename = document.getElementById('txtfilename');
    let envfilename1 = document.getElementById('envfilename1');
    // let envfilename2 = document.getElementById('envfilename2');
    // let choosename = document.getElementById('dbfilename');
    let upload = document.querySelector('#uploadbutton');
    let progress = document.querySelector('#dbbar');
    let xhr = new XMLHttpRequest();

    upload.addEventListener('click', uploadFile, false);
    file.addEventListener('change', chooseFile, false);
    //txtfile.addEventListener('change', chooseTxtFile, false);
    //envfile1.addEventListener('change', chooseEnvFile1, false);
    // envfile2.addEventListener('change', chooseEnvFile2, false);

    function chooseFile(event) {
        dbfilename.innerHTML = file.files[0].name;
    }
    function chooseEnvFile1(event) {
        envfilename1.innerHTML = envfile1.files[0].name;
    }
    function chooseTxtFile(event) {
        txtfilename.innerHTML = txtfile.files[0].name;
    }
    function chooseEnvFile2(event) {
        envfilename2.innerHTML = envfile2.files[0].name;
    }

    /**
     * @return {boolean}
     */
    function ValidateEmail(inputText)
    {
        let mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if(inputText.match(mailformat))
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    // upload file
    function uploadFile(event) {
        //console.log(ValidateEmail(email.value));
        if (project.value === '' || (file.files[0] === undefined && txtfile.files[0] === undefined)) {
            alert("Please fill in all information above!");
        /*}else if(!file.files[0].name.match(/.(mzML)$/i) && file.files !== undefined){
            alert('Please upload a mzML file!');*/
        }else if(envfile1.files[0] !== undefined && !envfile1.files[0].name.match(/.(env)$/i)){
            alert('Please upload an env file for envelopes!');
        /*}else if(envfile2.files[0] !== undefined && !envfile2.files[0].name.match(/.(env)$/i)){
            alert('Please upload an env file for ms2!');*/
        /*}else if (!ValidateEmail(email.value)){
            alert("You have entered an invalid email address!")*/
        } else {
            let formData = new FormData();
            formData.append('dbfile', file.files[0]);
            formData.append('txtfile', txtfile.files[0]);
            formData.append('envfile1', envfile1.files[0]);
            // formData.append('envfile2', envfile2.files[0]);
            formData.append('projectname', project.value);
            // formData.append('emailaddress', email.value);
            formData.append('description', description.value);
            formData.append('public', pub.checked);

            formData.append('scan_level', scan_level.value);
            formData.append('prec_mz', prec_mz.value);
            formData.append('prec_charge', prec_charge.value);
            formData.append('prec_inte', prec_inte.value);

            xhr.onload = uploadSuccess;
            xhr.upload.onprogress = setProgress;
            xhr.open('post', '/upload', true);
            xhr.send(formData);
        }
    }

    // Upload success
    function uploadSuccess(event) {
        if (xhr.readyState === 4) {
            setTimeout(function(){ if(!alert("Data uploaded successfully!\nPlease check your email inbox for more information!"))window.location.reload();}, 100)
        }
    }

    // progress bar
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
})();

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

$( document ).ready(function() {
    if(getCookie('token')===''){
        alert('Please sign in to upload your projects!');
        window.location.href = '/';
    } else {
        $('#signIn').text('Log out');
        $('#signIn').attr('href', '/logout');
        $("body").fadeIn(20);
    }
});

$('#txtMode').click(function () {
    if ($('#txtMode').text() === 'Txt Mode') {
        $('#txtMode_panel').show();
        $('#txtMode').text('mzML Mode');
        $('#mzML_buttons').hide();
    } else {
        $('#txtMode_panel').hide();
        $('#txtMode').text('Txt Mode');
        $('#mzML_buttons').show();
    }
})
