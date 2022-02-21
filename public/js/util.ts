function getCookie(cname: string): string {
  let name: string = cname + "=";
  let decodedCookie: string = decodeURIComponent(document.cookie);
  let ca: string[] = decodedCookie.split(';');
  for(let i: number = 0; i <ca.length; i++) {
    let c: string = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

// Upload success
function uploadSuccess(xhr: XMLHttpRequest): void {
  if (xhr.readyState === 4) {
    alert("Data uploaded successfully!\nPlease wait for processing!");
    //setTimeout(function(){window.location.reload();}, 100)
    window.location.replace("/projects");
  }
}

// progress bar
function setProgress(progress: HTMLDivElement | null, event: ProgressEvent): void {
  if (event.lengthComputable) {
    let complete: number = Math.trunc(event.loaded / event.total * 100);
    if (progress) {
      progress.style.width = complete + '%';
      progress.innerHTML = complete + '%';
      if (complete == 100) {
        progress.innerHTML = 'Done!';
      }
    } else {
      console.error("no progress bar on the page");
    }
  }
}

function cleanInfo(): void {
  $("#scanID2").empty();
  $("#prec_mz").empty();
  $("#prec_charge").empty();
  $("#prec_inte").empty();
  $("#rt").empty();
  //$("#tabs").empty();
  $("#spectrum2").empty();
  $("#tabList").empty();
}