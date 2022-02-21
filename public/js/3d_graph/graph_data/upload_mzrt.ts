class UploadMzrt{
  constructor(){}
  static deleteFile(): void {
    let result: boolean = confirm("Are you sure that you want to delete mzrt data?");
    if (result) {
      let projectDir: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#projectDir");
      let projectCode: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#projectCode");

      if (!projectDir) {
        console.error("project directory information cannot be found");
        return;
      }
      if (!projectCode) {
        console.error("project code information cannot be found");
        return;
      }

      $.ajax({
        url:"deleteMzrt?projectDir=" + projectDir.value+ "&projectCode=" + projectCode.value,
        type: "get",
        // dataType: 'json',
        success: function (res) {
          alert('Your previous mzrt data has been removed.');
          location.reload();
        }
      });
    }
  }

  
  static uploadFile(): void {
    let mzrtFile: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#mzrtFile');
    let mzrtProgress: HTMLDivElement | null = document.querySelector<HTMLDivElement>('#mzrtProgressbar');
    let projectDir: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#projectDir");
    let projectCode: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#projectCode");
    let projectName: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#projectName");
    let email: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#email");

    let xhr: XMLHttpRequest = new XMLHttpRequest();

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
    
    if(mzrtFile.files[0] === undefined) {
      alert("Please choose a mzrt file first!");
      return;
    } else if (!mzrtFile.files[0].name.match(/.(csv)$/i)) {
      alert('Please upload a csv file!');
      return;
    }
    let formData: FormData = new FormData();

    formData.append('mzrtFile', mzrtFile.files[0]);
    formData.append('projectDir', projectDir.value);
    formData.append('projectCode', projectCode.value);
    formData.append('projectName', projectName.value);
    formData.append('email', email.value);

    xhr.upload.onprogress = mzrtSetProgress;

    xhr.onload = mzrtUploadSuccess;
    xhr.open('post', '/mzrt', true);
    xhr.send(formData);

    function mzrtUploadSuccess(): void {
      if (xhr.readyState === 4) {
        alert("Upload successfully!");
        window.location.replace("/projects");
      }
    }

    function mzrtSetProgress(event: ProgressEvent) {
      if (event.lengthComputable) {
        let complete: number = Math.trunc(event.loaded / event.total * 100);
        if (mzrtProgress) {
          mzrtProgress.style.width = complete + '%';
          mzrtProgress.innerHTML = complete + '%';
          if (complete == 100) {
            mzrtProgress.innerHTML = 'Done!';
          }
        } else {
          console.error("no progress bar on the page");
        }
      }
    }
  }


  static main = (): void => {
    let mzrtUpload = document.querySelector<HTMLButtonElement>("#mzrtUpload");
    let deleteMzrt = document.querySelector<HTMLButtonElement>("#deleteMzrt");
    if (mzrtUpload) {
      mzrtUpload.addEventListener("click", UploadMzrt.uploadFile, false);
    } else {
      console.error("mzrt upload button doesn't exist");
    }
    if (deleteMzrt) {
      deleteMzrt.addEventListener("click", UploadMzrt.deleteFile, false);
    } else {
      console.error("mzrt delete button doesn't exist");
    }
  }
}