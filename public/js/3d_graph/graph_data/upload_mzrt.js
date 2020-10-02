class UploadMzrt{
    constructor(){}
    static deleteFile(){
        let result = confirm("Are you sure that you want to delete mzrt data?");
        if (result) {
            $.ajax({
                url:"deleteMzrt?projectDir=" + document.getElementById("projectDir").value+ "&projectCode=" + document.getElementById('projectCode').value,
                type: "get",
                // dataType: 'json',
                success: function (res) {
                    alert('Your previous mzrt data has been removed.');
                    location.reload();
                }
            });
        }
    }
    static uploadFile(){
        let mzrtFile = document.querySelector('#mzrtFile');
        let mzrtProgress = document.querySelector('#mzrtProgressbar');
        let xhr = new XMLHttpRequest();
        if(mzrtFile.files[0] === undefined) {
            alert("Please choose a mzrt file first!");
            return;
        } else if (!mzrtFile.files[0].name.match(/.(csv)$/i)) {
            alert('Please upload a csv file!');
            return;
        }
        let formData = new FormData();
        formData.append('mzrtFile', mzrtFile.files[0]);
        formData.append('projectDir', document.getElementById('projectDir').value);
        formData.append('projectCode', document.getElementById("projectCode").value);
        formData.append('projectName', document.getElementById("projectName").value);
        formData.append('email', document.getElementById("email").value);
        xhr.upload.onprogress = mzrtSetProgress;
        xhr.onload = mzrtUploadSuccess;
        xhr.open('post', '/mzrt', true);
        xhr.send(formData);

        function mzrtUploadSuccess(event) {
            if (xhr.readyState === 4) {
                alert("Upload successfully!");
                window.location.replace("/projects");
            }
        }

        function mzrtSetProgress(event) {
            if (event.lengthComputable) {
                var complete = Number.parseInt(event.loaded / event.total * 100);
                mzrtProgress.style.width = complete + '%';
                mzrtProgress.innerHTML = complete + '%';
                if (complete == 100) {
                    mzrtProgress.innerHTML = 'Done!';
                }
            }
        }
    }
    static main = () => {
        (document.getElementById("mzrtUpload")).addEventListener("click", UploadMzrt.uploadFile, false);
        (document.getElementById("deleteMzrt")).addEventListener("click", UploadMzrt.deleteFile, false);
    }
}