$( document ).ready(function() {
    let requestButton = document.getElementById('request');
    requestButton.addEventListener('click', function () {
        // $( "#spectrum2" ).empty();
        let requestID = document.getElementById("scanID").value;
        let min = document.getElementById("rangeMin").value;
        let max = document.getElementById("rangeMax").value;
        if(parseInt(requestID) >= parseInt(min) && parseInt(requestID) <= parseInt(max)) {
            //console.log("Yes");
            init2D(parseInt(requestID));
            update3D(parseInt(requestID));
            //showEnvTable(parseInt(requestID));
            $("#scanID").val("");
        }else {
            //console.log("No");
            alert("Please type in one scanID within range!")
        }
    },false)

    let resetButton = document.getElementById('resetGraphs');
    resetButton.addEventListener('click', function() {
        //let min = document.getElementById("rangeMin").value;
        //init2D(parseInt(min));
        $("#rtRangeMin").val("");
        $("#rtRangeMax").val("1");

        $("#mzRangeMin").val("");
        $("#mzRangeMax").val("50");
        update3DShowFull();
    })

    let prev1 = document.getElementById('prev1');
    prev1.addEventListener('click', function () {
        let scanID1 = document.getElementById("scanID1").innerHTML;
        if (scanID1 !== '') {
            topview_2d.prev(document.getElementById("scanID1").innerHTML)
                .then((response) => {
                    response = response.data;
                    if(response !== 0){
                        return topview_2d.getScanID(response);
                    }else {
                        alert("NULL");
                    }
                })
                .then((response) => {
                    response = response.data;
                    if(response !== 0){
                        init2D(response);
                        update3D(response);
                    }else {
                        alert("NULL");
                    }
                })
                .catch((error) => {
                    console.log(error);
                })
        }
    },false)

    let next1 = document.getElementById('next1');
    next1.addEventListener('click', function () {
        let scanID1 = document.getElementById("scanID1").innerHTML;
        if (scanID1 !== '') {
            topview_2d.next(document.getElementById("scanID1").innerHTML)
                .then((response) => {
                    response = response.data;
                    if(response !== 0){
                        return topview_2d.getScanID(response);
                    }else {
                        alert("NULL");
                    }
                })
                .then((response) => {
                    response = response.data;
                    if(response !== 0){
                        init2D(response);
                        update3D(response);
                    }else {
                        alert("NULL");
                    }
                })
                .catch((error) => {
                    console.log(error);
                })
        }
    },false)

    $("#scanID").keyup(function(event) {
        if (event.keyCode === 13) {
            $("#request").click();
        }
    });

    $( "#hide" ).click(function() {
        if($("#hide").text() === 'Hide') {
            $("#hide").text('Show');
            $("#datatable").hide();
        }else {
            $("#hide").text('Hide');
            $("#datatable").show();
        }
    });
    $( "#hideFeatureTable" ).click(function() {
        if($("#hideFeatureTable").text() === 'Hide') {
            $("#hideFeatureTable").text('Show');
            $("#featureDataTable").hide();
        }else {
            $("#hideFeatureTable").text('Hide');
            $("#featureDataTable").show();
        }
    });
    $("#switch").click(function () {
        if($("#switch").text() === 'MS1') {
            showEnvTable($("#scanID1").text());
            $("#switch").text('MS2');
        }else {
            showEnvTable($("#scanID2").text());
            $("#switch").text('MS1');
        }
    });

    $("#inspect").click(function () {
        /*let peaklist;
        let masslistID = $('#envScan').text();
        if($("#switch").text() === 'MS1') {
            peaklist = peakList2_g;
        }else {
            peaklist = peakList1_g;
        }
        let peakAndIntensityList = "";
        peaklist.forEach(peak => {
            peakAndIntensityList = peakAndIntensityList + peak.mz + ' ' + peak.intensity+'\n';
        });
        peakAndIntensityList = peakAndIntensityList.slice(0,-1);
        window.localStorage.setItem('peakAndIntensityList', peakAndIntensityList);
        window.localStorage.setItem('scan', masslistID);
        window.localStorage.setItem('scanID', masslistID);
        window.localStorage.setItem('projectCode', document.getElementById('projectCode').value);
        if($('#proteoform').text() === 'N/A') {
            window.localStorage.setItem('sequence', '');
        } else {
            window.localStorage.setItem('sequence', $('#proteoform').text());
        }
        $.ajax({
            url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + masslistID,
            type: "get",
            dataType: 'json',
            success: function (res) {
                let massAndIntensityList = "";
                res.forEach(mass => {
                    massAndIntensityList = massAndIntensityList + mass.mono_mass + ' ' + mass.intensity + ' ' + mass.charge + '\n';
                });
                massAndIntensityList = massAndIntensityList.slice(0, -1);
                window.localStorage.setItem('massAndIntensityList', massAndIntensityList);
                window.localStorage.setItem('ionType', 'Y,B');
                window.localStorage.setItem('precursorMass', $('#prec_mz').text());
                window.open('/resources/topview/inspect/spectrum_no_nav.html', '_blank');
                //console.log(res);
            }
        });*/
        let masslistID = $('#envScan').text();
        inspect(masslistID,masslistID);
    });

    $("#deleteMsalign").click(function () {
        let result = confirm("Are you sure that you want to delete msalign data?");
        if (result) {
            //Logic to delete the item
            $.ajax({
                url:"deleteMsalign?projectDir=" + document.getElementById("projectDir").value+ "&projectCode=" + document.getElementById('projectCode').value,
                type: "get",
                // dataType: 'json',
                success: function (res) {
                    alert('Your previous msalign data has been removed.');
                    location.reload();
                }
            });
        }
    });

    $("#deleteSeq").click(function () {
        let result = confirm("Are you sure that you want to delete sequence data?");
        if (result) {
            $.ajax({
                url:"deleteSeq?projectDir=" + document.getElementById("projectDir").value+ "&projectCode=" + document.getElementById('projectCode').value,
                type: "get",
                // dataType: 'json',
                success: function (res) {
                    alert('Your previous sequence data has been removed.');
                    location.reload();
                }
            });
        }
    });

    $('#uploadSequence').click(function () {
        window.open("seqResults?projectCode=" + document.getElementById("projectCode").value, '_self');
    });

    $("#seqUpload").click(function () {
        let seqFile = document.querySelector('#seqFile');
        let seqProgress = document.querySelector('#seqProgressbar');
        let xhr = new XMLHttpRequest();
        if(seqFile.files[0] === undefined) {
            alert("Please choose a sequence file first!");
            return;
        } else if (!seqFile.files[0].name.match(/.(tsv)$/i)) {
            alert('Please upload a tsv file for sequence!');
            return;
        } else if (!seqFile.files[0].name.includes("single")) {
            alert('Please upload a "*_ms2_toppic_prsm_single.tsv" file for sequence!');
            return;
        }

        let formData = new FormData();
        formData.append('seqFile', seqFile.files[0]);
        formData.append('projectDir', document.getElementById('projectDir').value);
        formData.append('projectCode',document.getElementById("projectCode").value);
        formData.append('projectName', document.getElementById("projectName").value);
        formData.append('email', document.getElementById("email").value);
        xhr.upload.onprogress = seqSetProgress;
        xhr.onload = seqUploadSuccess;
        xhr.open('post', '/sequence', true);
        xhr.send(formData);

        function seqUploadSuccess(event) {
            if (xhr.readyState === 4) {
                alert("Upload successfully!");
                window.location.replace("/projects");
            }
        }

        function seqSetProgress(event) {
            if (event.lengthComputable) {
                let complete = Number.parseInt(event.loaded / event.total * 100);
                seqProgress.style.width = complete + '%';
                seqProgress.innerHTML = complete + '%';
                if (complete == 100) {
                    seqProgress.innerHTML = 'Done!';
                }
            }
        }
    });
    //redraw graph if intensity adjustment checkbox gets checked
    $("#inte-auto-adjust").click(function () {
        if (document.getElementById("inte-auto-adjust").checked) {
            GraphData.drawNoNewData();
        }
    })
    //hide feature annotation on 3D graph
    $("#show-feature-anno").click(function () {
        if (document.getElementById("show-feature-anno").checked) {
            GraphFeature.showFeature();
        } else {
            GraphFeature.hideFeature();
        }
    })
})