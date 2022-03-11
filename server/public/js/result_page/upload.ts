$( document ).ready(function(): void {
  let ms1file: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#MS1_msalign');
  let ms2file: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#MS2_msalign');
  let upload: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>('#modalUpload');
  let progress: HTMLDivElement | null = document.querySelector<HTMLDivElement>('#progressbar');
  let projectDir: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#projectDir');
  let projectCode: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#projectCode');
  let projectName: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#projectName');
  let email: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#email');

  if (!projectCode) {
    console.error("project code text box doesn't exist");
    return;
  }
  if (!projectDir) {
    console.error("project directory text box doesn't exist");
    return;
  }
  if (!projectName) {
    console.error("project name text box doesn't exist");
    return;
  }
  if (!email) {
    console.error("email text box doesn't exist");
    return;
  }
  let xhr: XMLHttpRequest = new XMLHttpRequest();
  if (upload) {
    upload.addEventListener('click', uploadFile, false);
  }

  function uploadFile() {
    if (!ms1file || !ms1file.files) {
      console.error("ms1 file information not available");
      return;
    }
    if (!ms2file || !ms2file.files) {
      console.error("ms2 file information not available");
      return;
    }
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
    let formData: FormData = new FormData();
    formData.append('ms1file', ms1file.files[0]);
    formData.append('ms2file', ms2file.files[0]);
    formData.append('projectDir', projectDir!.value);
    formData.append('projectCode',projectCode!.value);
    formData.append('projectName', projectName!.value);
    formData.append('email', email!.value);
    xhr.onload = uploadSuccess.bind(null, xhr);
    xhr.upload.onprogress = setProgress.bind(null, progress);
    xhr.open('post', '/msalign', true);
    xhr.send(formData);
  }
})