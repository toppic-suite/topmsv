(function () {
    let file: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#dbfile');
    let txtfile: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#txtfile');
    let envfile1: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#envfile1');
    // let envfile2 = document.querySelector('#envfile2');
    let project: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#projectName');
    // let email = document.getElementById('emailAddress');
    let description: HTMLTextAreaElement | null = document.querySelector<HTMLTextAreaElement>('#description');
    let pub: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#public');

    let scan_level: HTMLInputElement | null  = document.querySelector<HTMLInputElement>('#scan_level');
    let prec_mz: HTMLInputElement | null  = document.querySelector<HTMLInputElement>('#prec_mz');
    let prec_charge: HTMLInputElement | null  = document.querySelector<HTMLInputElement>('#prec_charge');
    let prec_inte: HTMLInputElement | null  = document.querySelector<HTMLInputElement>('#prec_inte');

    //console.log(pub.checked);
    let dbfilename: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>('#dbfilename');
    //let txtfilename = document.getElementById('txtfilename');
    //let envfilename1 = document.getElementById('envfilename1');
    // let envfilename2 = document.getElementById('envfilename2');
    // let choosename = document.getElementById('dbfilename');
    let upload: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>('#uploadbutton');
    let progress: HTMLDivElement | null = document.querySelector<HTMLDivElement>('#dbbar');
    let xhr: XMLHttpRequest = new XMLHttpRequest();

    if (upload) {
      upload.addEventListener('click', uploadFile, false);
    } else {
      console.error("upload button doesn't exist");
    }
    if (file) {
      file.addEventListener('change', chooseFile, false);
    } else {
      console.error("dbfile input element doesn't exist");
    }
    //txtfile.addEventListener('change', chooseTxtFile, false);
    //envfile1.addEventListener('change', chooseEnvFile1, false);
    // envfile2.addEventListener('change', chooseEnvFile2, false);

    function chooseFile(): void {
      if (dbfilename) {
        if (file && file.files) {
          dbfilename.innerHTML = file.files[0].name;
        } else{
          console.error("no files in files input element");
        }
      }
    }

    /*function chooseEnvFile1(event) {
        envfilename1.innerHTML = envfile1.files[0].name;
    }
    function chooseTxtFile(event) {
        txtfilename.innerHTML = txtfile.files[0].name;
    }
    function chooseEnvFile2(event) {
        envfilename2.innerHTML = envfile2.files[0].name;
    }

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
    }*/
    // upload file
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
      //if (project.value === '' || (file.files[0] === undefined && txtfile.files[0] === undefined)) {
      if (project.value === '' || file.files[0] === undefined) {
        alert("Please fill in all information above!");
        /*}else if(!file.files[0].name.match(/.(mzML)$/i) && file.files !== undefined){
            alert('Please upload a mzML file!');*/
        /*}else if(envfile1.files[0] !== undefined && !envfile1.files[0].name.match(/.(env)$/i)){
            alert('Please upload an env file for envelopes!');*/
        /*}else if(envfile2.files[0] !== undefined && !envfile2.files[0].name.match(/.(env)$/i)){
            alert('Please upload an env file for ms2!');*/
        /*}else if (!ValidateEmail(email.value)){
            alert("You have entered an invalid email address!")*/
        } else {
          let formData = new FormData();
          formData.append('dbfile', file.files[0]);
          //formData.append('txtfile', txtfile.files[0]);
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
          if (scan_level) {
            formData.append('scan_level', scan_level.value);
          }
          if (prec_mz) {
            formData.append('prec_mz', prec_mz.value);
          }
          if (prec_charge) {
            formData.append('prec_charge', prec_charge.value);
          }
          if (prec_inte) {
            formData.append('prec_inte', prec_inte.value);
          }
          xhr.onload = uploadSuccess.bind(null, xhr);
          xhr.upload.onprogress = setProgress.bind(null, progress);

          let lastDot: number = file.files[0].name.lastIndexOf('.');
          let ext: string = file.files[0].name.slice(lastDot + 1);

          if (ext == "zip"){
            xhr.open('post', '/uploadMultiple', true);
          }
          else if(ext == "mzML"){
            xhr.open('post', '/upload', true);
          }
          else{
            alert("please upload a zip file or a mzML file!")
          }
          xhr.send(formData);
        }
    }
})();

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
