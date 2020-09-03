function getRelatedScan2 (scanID) {
    axios.get('/relatedScan2', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            scanID: scanID
        }
      })
      .then(function (response) {
        getScanLevelTwoList(response,scanID);
      })
      .catch(function (error) {
        console.log(error);
      })
}

function getScanLevel(scanID,nextScan) {
    axios.get('/scanlevel', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanId: scanID
            }
        })
        .then(function (response) {
            if (response === "1") {
                if (nextScan - scanID === 1) {
                    $('#scanLevelTwoInfo').show();
                    $("#tabs").show();
                    $("#noScanLevelTwo").hide();
                    getScanLevelTwoList(scanID, nextScan);
                } else {
                    loadPeakList1(scanID, null);
                    // cleanInfo();
                    $("#noScanLevelTwo").show();
                    $("#tabs").hide();
                    $('#scanLevelTwoInfo').hide();
                }
            }
            else {
                getRelatedScan2(scanID);
            }
        })
        .catch(function(error) {
            console.log(error);
        })
}

// get scanNum by ID
function getScanID(ID) {
    axios.get('/scanID', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            ID: ID
        }
    }).then(function(response) {
        findNextLevelOneScan(response);
    }).catch(function(error) {
        console.log(error);
    })
}

let peakList1_g;
let envList1_g;
let graph1_g;

function loadPeakList1(scanID, prec_mz) {
    const graphFeatures = new GraphFeatures();
    if (scanID !== '0') {
        axios.get('/peaklist', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        }).then(function(response){
            getRT(scanID);
            peakList1_g = JSON.parse(response);
            document.getElementById("scanID1").innerText = scanID;
            return axios.get('/envlist', {
                params: {
                    projectDir: document.getElementById("projectDir").value,
                    scanID: scanID,
                    projectCode: document.getElementById("projectCode").value
                }
            });
        }).then(function(response){
            envList1_g = JSON.parse(response);
            if (envList1_g !== 0){
                graph1_g = addSpectrum("spectrum1", peakList1_g, envList1_g, prec_mz, null, graphFeatures);
            }else {
                graph1_g = addSpectrum("spectrum1", peakList1_g, [], prec_mz, null, graphFeatures);
            }
        }).catch(function(error) {
            console.log(error);
        })
    }else{
        alert("NULL");
    }
}

function getRT(scanNum) {
    axios.get('/getRT', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            scanID: scanNum
        }
    }).then(function(response){
        let rt = parseFloat(response);
        moveLine(rt/60);
        document.getElementById("scan1RT").innerText = (rt/60).toFixed(4);
    }).catch(function(error) {
        console.log(error);
    });
}

function findNextLevelOneScan(scan) {
    axios.get('/findNextLevelOneScan', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            scanID: scan
        }
    }).then(function(response) {
        let nextScan = parseInt(response);
        getScanLevel(scan,nextScan);
    }).catch(function(error) {
        console.log(error);
    })
}

let peakList2_g;
let envList2_g;
let graph2_g;

function loadPeakList2(scanID, prec_mz, prec_charge, prec_inte, rt, levelOneScan) {
    if(scanID !== '0') {
        const graphFeatures = new GraphFeatures();
        // show envelope table for MS2
        showEnvTable(scanID);
        $("#switch").text('MS1');

        axios.get('/peaklist',{
            params:{
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        }).then(function(response) {
            peakList2_g = JSON.parse(response);
            return axios.get('/envlist', {
                params: {
                    projectDir: document.getElementById("projectDir").value,
                    scanID: scanID,
                    projectCode: document.getElementById("projectCode").value
                }
            })
        }).then(function(response) {
            envList2_g = JSON.parse(response);
            if (envList2_g !== 0){
                graph2_g = addSpectrum("spectrum2",peakList2_g, envList2_g,null,null, graphFeatures);
            }else {
                graph2_g = addSpectrum("spectrum2",peakList2_g, [],null,null, graphFeatures);
            }
            document.getElementById("scanID2").innerHTML = scanID;
            document.getElementById("prec_mz").innerHTML = prec_mz.toFixed(4);
            loadPeakList1(levelOneScan, prec_mz);
            document.getElementById("prec_charge").innerHTML = prec_charge;
            document.getElementById("prec_inte").innerHTML = prec_inte.toFixed(4);
            document.getElementById("rt").innerHTML = (rt/60).toFixed(4);
        }).catch(function(error) {
            console.log(error);
        })
    }else{
        alert("NULL");
    }
}

function loadInteSumList() {
    axios.get('/getInteSumList', {
        params: {
            projectDir: document.getElementById("projectDir").value
        }
    }).then(function(response) {
        // console.log("loadInteSumList:", JSON.stringify(response));
        addFigure(JSON.parse(response));
    }).catch(function(error) {
        console.log(error);
    })
}

function prev(scanID) {
    axios.get('/prev', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            scanID: scanID
        }
    }).then(function(response) {
        if(response !== '0'){
            getScanID(response);
        }else {
            alert("NULL");
        }
    }).catch(function(error) {
        console.log(error);
    })
}

function next(scanID) {
    axios.get('/next', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            scanID: scanID
        }
    }).then(function(response) {
        if(response !== '0') {
            getScanID(response);
        }else {
            alert("NULL");
        }
    }).catch(function(error) {
        console.log(error);
    })
}

function cleanInfo() {
    $("#scanID2").empty();
    $("#prec_mz").empty();
    $("#prec_charge").empty();
    $("#prec_inte").empty();
    $("#rt").empty();
    //$("#tabs").empty();
    $("#spectrum2").empty();
    $("#tabList").empty();
}

function getScanLevelTwoList(scanID,target) {
    axios.get('/scanTwoList', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            scanID: scanID
        }
    }).then(function(response) {
        $( "#tabs" ).tabs();
        $("#tabs li").remove();
        $( "#tabs" ).tabs("destroy");
        response.forEach(function (item) {
            var scanTwoNum = item.scanID;
            var rt = item.rt;
            $("#tabs ul").append('<li><a href="#spectrum2"' + ' id='+ scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scanID + ')">'+ item.prec_mz.toFixed(4) + '</a></li>');
        });
        $( "#tabs" ).tabs();
        document.getElementById(target).click();
    }).catch(function(error) {
        console.log(error);
    })
}

function showEnvTable(scan) {
    $('#envScan').text(scan);
    if(scan === $('#scanID1').text()) {
        $('#msType').text('MS1');
    } else {
        $('#msType').text('MS2');
    }
    if($('#envStatus').val() === "0"){
        return;
    }

    $.ajax( {
        url:'seqQuery?projectDir=' + document.getElementById("projectDir").value + "&scanID=" + $('#envScan').text()
            + "&projectCode=" + document.getElementById('projectCode').value,
        type: "get",
        success: function (res) {
            //console.log(res);
            if(res!== '0') {
                let sequence = preprocessSeq(res);
                $('#proteoform').text(sequence);
                window.localStorage.setItem('proteoform', sequence);
            } else {
                $('#proteoform').text('N/A');
                window.localStorage.setItem('proteoform', '');
            }
        }
    });

    $('#envTable').DataTable( {
        destroy: true,
        paging: false,
        searching: false,
        dom: 'Bfrtip',
        scrollY: 370,
        scroller: true,
        altEditor: true,
        select: 'os',
        responsive: true,
        buttons: [
            {
                extend: 'csv',
                text: 'Export CSV',
                className: 'btn',
                filename: 'envelope_data'
            },
            {
                text: 'Add',
                className: 'btn',
                name: 'add'        // do not change name
            },
            {
                extend: 'selected', // Bind to Selected row
                text: 'Update',
                className: 'btn',
                name: 'edit'        // do not change name
            },
            {
                extend: 'selected', // Bind to Selected row
                text: 'Delete',
                className: 'btn',
                name: 'delete'      // do not change name
            },
            {
                text: 'Refresh',
                className: 'btn',
                name: 'refresh'      // do not change name
            },
            {
                extend: 'selected',
                text: 'Jump to',
                className: 'btn',
                name: 'jumpto'
            }
        ],
        "ajax": {
            url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scan,
            dataSrc: '',
            type: "GET"
        },
        "columns": [
            /*{
                data: null,
                defaultContent: '',
                className: 'select-checkbox',
                orderable: false
            },*/
            { "data": "envelope_id", readonly: 'true'},
            { "data": "scan_id", "visible": true, type:"hidden"},
            { "data": "charge", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            // { "data": "mono_mass",type:'number', required: 'true'},
            { "data": "mono_mass",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "intensity",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true', readonly: 'true',"visible": true, type:"hidden"},
            {
                "data": "mono_mz",
                render: function (data, type, row ) {
                    let mono_mz =  (( row.mono_mass / row.charge ) + 1).toFixed(5);
                    row.mono_mz = mono_mz; // set mono_mz value
                    /*if($('#msType').text() === 'MS2'){
                        return `<a href="#spectrum2" onclick="relocSpet2( `+ mono_mz + `)">` + mono_mz + '</a>';
                    } else {
                        return `<a href="#spectrum1" onclick="relocSpet1( `+ mono_mz + `)">` + mono_mz + '</a>';
                    }*/
                    return mono_mz;
                }
                // ,type: "readonly"
                , required: 'true'
            }
        ],
        onAddRow: function(datatable, rowdata, success, error) {
            console.log(rowdata);
            $.ajax({
                // a tipycal url would be / with type='PUT'
                url: "/addrow?projectDir=" + document.getElementById("projectDir").value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        },
        onDeleteRow: function(datatable, rowdata, success, error) {
            console.log(rowdata);
            //rowdata=JSON.stringify(rowdata);
            $.ajax({
                // a tipycal url would be /{id} with type='DELETE'
                url: "/deleterow?projectDir=" + document.getElementById("projectDir").value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        },
        onEditRow: function(datatable, rowdata, success, error) {
            $.ajax({
                // a tipycal url would be /{id} with type='POST'
                url: "/previewEdit?projectDir=" + document.getElementById("projectDir").value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        }
    } );
}

function jumpTo(mono_mz) {
    if($('#msType').text() === 'MS2'){
        relocSpet2(mono_mz);
    } else {
        relocSpet1(mono_mz);
    }
}

function relocSpet1 (mono_mz) {
    const graphFeatures = new GraphFeatures();
    graph1_g.redraw(parseFloat(mono_mz+0.5), graphFeatures);
    //addSpectrum("spectrum1", peakList1_g, envList1_g, mono_mz+0.5,null, graphFeatures);
}

function relocSpet2 (mono_mz) {
    const graphFeatures = new GraphFeatures();
    // console.log("relocSpect2 on", mono_mz+0.5);
    graph2_g.redraw(parseFloat(mono_mz+0.5), graphFeatures);
    //addSpectrum("spectrum2", peakList2_g, envList2_g, mono_mz+0.5,null, graphFeatures);
}

let requestButton = document.getElementById('request');
requestButton.addEventListener('click', function () {
    // $( "#spectrum2" ).empty();
    let requestID = document.getElementById("scanID").value;
    let min = document.getElementById("rangeMin").value;
    let max = document.getElementById("rangeMax").value;
    // console.log(parseInt(requestID));
    if(parseInt(requestID) >= parseInt(min) && parseInt(requestID) <= parseInt(max)) {
        //console.log("Yes");
        findNextLevelOneScan(parseInt(requestID));
        showEnvTable(parseInt(requestID));
        $("#scanID").val("");
    }else {
        //console.log("No");
        alert("Please type in one scanID within range!")
    }

    // getScanLevelTwoList(document.getElementById("scanID").value);
},false)

let prev1 = document.getElementById('prev1');
prev1.addEventListener('click', function () {

    let scanID1 = document.getElementById("scanID1").innerHTML;
    if (scanID1 !== '') {
        prev(document.getElementById("scanID1").innerHTML);
    }
},false)

let next1 = document.getElementById('next1');
next1.addEventListener('click', function () {

    let scanID1 = document.getElementById("scanID1").innerHTML;
    if (scanID1 !== '') {
        next(document.getElementById("scanID1").innerHTML);
    }
},false)

$( document ).ready(function() {
    let min = document.getElementById("rangeMin").value;
    if($('#envStatus').val() === "0"){
        $('#brhr').hide();
        $("#envInfo").hide();
        $('#envFileInfo').hide();
    }
    $('#envFileInfo').hide();
    showEnvTable(min);
    findNextLevelOneScan(min);
    loadInteSumList();

    let scanRef = window.localStorage.getItem('scan');
    if(scanRef) {
        // console.log(scanRef);
        $('#scanID').val(scanRef);
        $('#request').click();
        localStorage.clear();
    }

    let fileName = $('#fileName').val();
    let apix = fileName.substr(fileName.lastIndexOf('.'), fileName.length);
    if(apix === '.txt') {
        $('#rt-sum_panel').hide();

        axios.get('/scanlevel', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: min
            }
        }).then(function(response) {
            if (response === "1") {
                loadPeakList1(min, null);
                $('#scanLevelTwo').hide();
            }
            else {
                $('#scanLevelOne').hide();
                //loadPeakList2(min, )
                getRelatedScan2(min);
            }
        }).catch(function(error){
            console.log(error);
        });
    }
});

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
    let peaklist;
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
        window.localStorage.setItem('proteoform', '');
    } else {
        window.localStorage.setItem('proteoform', $('#proteoform').text());
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
            window.open('/resources/topview/inspect/spectrum.html', '_blank');
            //console.log(res);
        }
    });
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
    } else if (!seqFile.files[0].name.match(/.(csv)$/i)) {
        alert('Please upload a csv file for sequence!');
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

var ms1file = document.querySelector('#MS1_msalign');
var ms2file = document.querySelector('#MS2_msalign');
var upload = document.querySelector('#modalUpload');
var progress = document.querySelector('#progressbar');
var xhr = new XMLHttpRequest();
upload.addEventListener('click', uploadFile, false);

function uploadFile() {
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
    var formData = new FormData();
    formData.append('ms1file', ms1file.files[0]);
    formData.append('ms2file', ms2file.files[0]);
    formData.append('projectDir', document.getElementById('projectDir').value);
    formData.append('projectCode',document.getElementById("projectCode").value);
    formData.append('projectName', document.getElementById("projectName").value);
    formData.append('email', document.getElementById("email").value);
    xhr.onload = uploadSuccess;
    xhr.upload.onprogress = setProgress;
    xhr.open('post', '/msalign', true);
    xhr.send(formData);
}

function uploadSuccess(event) {
    if (xhr.readyState === 4) {
        alert("Upload successfully! Please wait for data processing, you will receive an email when it's done");
        window.location.replace("/projects");
    }
}

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

function preprocessSeq(seq) {
    let firstIsDot = 1;
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
    seq = seq.replace(/\[[A-z]*\]/g, '');
    let firstDotIndex = seq.indexOf('.');
    if(firstDotIndex === -1) {
        firstDotIndex = 0;
        firstIsDot = 0;
    }
    let lastDotIndex = seq.lastIndexOf('.');
    if(lastDotIndex === -1) {
        lastDotIndex = seq.length;
    }
    let firstIndex = seq.indexOf('[');
    let lastIndex = seq.lastIndexOf(']');
    if(firstDotIndex> firstIndex && firstIndex !== -1) {
        firstDotIndex = 0;
        firstIsDot = 0;
    }
    if(lastDotIndex < lastIndex){
        lastDotIndex = seq.length;
    }
    if(firstIsDot){
        seq = seq.slice(firstDotIndex + 1, lastDotIndex);
    } else {
        seq = seq.slice(firstDotIndex,lastDotIndex);
    }
    return seq;
    //console.log(seq);
}

function plus() {
    // var input = $("input[name='mono_mass']");
    // let inputVal = input[input.length-1].value;
    let inputVal = $('#preview_mono_mass').val();
    if(inputVal === "") {inputVal = 0;}
    inputVal = parseFloat(inputVal) + 1.00235;
    inputVal = inputVal.toFixed(5);
    $('#preview_mono_mass').val(inputVal);
    // input[input.length-1].value = inputVal;
    change_mono_mz();
    updatePreview(preview_scanID_g, $('#preview_envelope_id').val(), $('#preview_charge').val(), $('#preview_mono_mass').val());
}

function minus() {
    // var input = $("input[name='mono_mass']");
    // let inputVal = input[input.length-1].value;
    let inputVal = $('#preview_mono_mass').val();
    if(inputVal === "") {inputVal = 0;}
    inputVal = parseFloat(inputVal) - 1.00235;
    inputVal = inputVal.toFixed(5);
    $('#preview_mono_mass').val(inputVal);
    // input[input.length-1].value = inputVal;
    change_mono_mz();
    updatePreview(preview_scanID_g, $('#preview_envelope_id').val(), $('#preview_charge').val(), $('#preview_mono_mass').val());
}

function change_mono_mass() {
    // var input_mz = $("input[id='mono_mz']");
    // let mz = input_mz[input_mz.length-1].value;
    let mz = $('#preview_mono_mz').val();
    if(mz === "") {mz = 0;}
    mz = parseFloat(mz);
    // var chargeInput = $("input[name='Charge']");
    // let charge = chargeInput[chargeInput.length-1].value;
    let charge = $('#preview_charge').val();
    if(charge === "") {charge = 1;}
    charge = parseInt(charge);
    let result = (mz - 1)*charge;
    if(result < 0) result = 0;
    // var input = $("input[name='mono_mass']");
    // input[input.length-1].value = result.toFixed(5);
    $('#preview_mono_mass').val(result.toFixed(5));
    updatePreview(preview_scanID_g, $('#preview_envelope_id').val(), $('#preview_charge').val(), $('#preview_mono_mass').val());
    //console.log(result);
}

function change_mono_mz() {
    // var input_mass = $("input[name='mono_mass']");
    // let mass = input_mass[input_mass.length-1].value;
    let mass = $('#preview_mono_mass').val();
    if(mass === "") {mass = 0;}
    mass = parseFloat(mass);
    // var chargeInput = $("input[name='Charge']");
    // let charge = chargeInput[chargeInput.length-1].value;
    let charge = $('#preview_charge').val();
    if(charge === "") {charge = 1;}
    charge = parseInt(charge);
    let result = (mass/charge) + 1;
    if(result < 0) result = 0;

    // var input = $("input[id='mono_mz']");
    // input[input.length-1].value = result.toFixed(5);
    $('#preview_mono_mz').val(result.toFixed(5));
}

let specPara1_g;
let lockPara1 = false;
let specPara2_g;
let lockPara2 = false;
function refresh() {
    const graphFeatures = new GraphFeatures();
    let msType_old = $('#msType').text();
    let scanID;
    if (msType_old === 'MS1') {
        lockPara1 = true;
        scanID = $('#scanID1').text();
        showEnvTable($("#scanID1").text());
        $("#switch").text('MS2');
    } else {
        lockPara2 = true;
        scanID = $('#scanID2').text();
    }
    $.ajax({
        url:"envlist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID + "&projectCode=" + document.getElementById("projectCode").value,
        type: "get",
        // dataType: 'json',
        success: function (res) {
            if (msType_old === 'MS1') {
                envList1_g = JSON.parse(res);
                if(envList1_g===0) {
                    envList1_g = [];
                }
                graph1_g = addSpectrum('spectrum1', peakList1_g, envList1_g, null, null, graphFeatures);
            } else {
                envList2_g = JSON.parse(res);
                console.log(envList2_g);
                if(envList2_g===0) {
                    envList2_g = [];
                }
                graph2_g = addSpectrum('spectrum2', peakList2_g, envList2_g, null, null, graphFeatures);
            }
        }
    });
}

let peakList_temp;
let envList_temp;
let specPara3_g;
let lockPara_3 = false;
let preview_scanID_g;
let graph_preview1_g;
let graph_preview2_g;
function preview(dataObj) {
    // console.log("dataObj:",dataObj);
    const graphFeatures = new GraphFeatures();
    let envID = dataObj.envelope_id;
    let scanID = dataObj.scan_id;
    preview_scanID_g = scanID;
    let charge = dataObj.charge;
    let intensity = dataObj.intensity;
    let mono_mass = dataObj.mono_mass;
    let mono_mz = parseFloat(dataObj.mono_mz);

    $('#preview_envelope_id').val(envID);
    $('#preview_charge').val(charge);
    $('#preview_mono_mass').val(mono_mass);
    $('#preview_mono_mz').val(mono_mz);
    //addSpectrum('previewSpectrum1', oriPeakList, oriEnvList, mono_mass);
    // addSpectrum("previewSpectrum2", peakList_temp, envList_temp, mono_mass);
    $.ajax({
        url:"previewEdit?projectDir=" + document.getElementById("projectDir").value +
            "&scan_id=" + scanID +
            "&envelope_id=" + envID +
            "&charge=" + charge +
            "&intensity=" + intensity +
            "&mono_mass=" + mono_mass,
        type: "get",
        // dataType: 'json',
        success: function (res) {
            let data = (typeof res === "string") ? JSON.parse(res) : res;
            // console.log("returnList preview", data);
            data.envlist[0].charge = parseInt(data.envlist[0].charge);
            data.envlist[0].mono_mass = parseFloat(data.envlist[0].mono_mass);
            data.envlist[0].env.charge = parseInt(data.envlist[0].env.charge);
            data.envlist[0].env.scan_id = parseInt(data.envlist[0].env.scan_id);
            data.envlist[0].env.envelope_id = parseInt(data.envlist[0].env.envelope_id);
            data.envlist[0].env.mono_mass = parseFloat(data.envlist[0].env.mono_mass);
            data.envlist[0].env.intensity = parseFloat(data.envlist[0].env.intensity);
            peakList_temp = data.peaklist;
            envList_temp = data.envlist;
            // console.log("type: ", typeof mono_mass);
            graph_preview1_g = addSpectrum('previewSpectrum1', data.originalPeakList, data.originalEnvPeaks, data.envlist[0].mono_mass/data.envlist[0].charge + 1,null, graphFeatures);
            graph_preview2_g = addSpectrum("previewSpectrum2", data.originalPeakList, envList_temp, mono_mass/charge + 1,null, graphFeatures);
        }
    });
    $('#previewModal').modal('show');
}

function updatePreview(scanID, envID, charge, mono_mass) {
    const graphFeatures = new GraphFeatures();
    $.ajax({
        url:"previewEdit?projectDir=" + document.getElementById("projectDir").value +
            "&scan_id=" + scanID +
            "&envelope_id=" + envID +
            "&charge=" + charge +
            "&mono_mass=" + mono_mass,
        type: "get",
        // dataType: 'json',
        success: function (res) {
            let data = (typeof res === "string") ? JSON.parse(res) : res;
            console.log("returnList preview update", data);
            data.envlist[0].charge = parseInt(data.envlist[0].charge);
            data.envlist[0].mono_mass = parseFloat(data.envlist[0].mono_mass);
            data.envlist[0].env.charge = parseInt(data.envlist[0].env.charge);
            data.envlist[0].env.scan_id = parseInt(data.envlist[0].env.scan_id);
            data.envlist[0].env.envelope_id = parseInt(data.envlist[0].env.envelope_id);
            data.envlist[0].env.mono_mass = parseFloat(data.envlist[0].env.mono_mass);
            data.envlist[0].env.intensity = parseFloat(data.envlist[0].env.intensity);
            peakList_temp = data.peaklist;
            envList_temp = data.envlist;
            // let graphFeatures = new GraphFeatures();
            // graph_preview1_g.redraw(data.envlist[0].mono_mass + 1, graphFeatures);
            addSpectrum('previewSpectrum1', data.originalPeakList, data.originalEnvPeaks, data.envlist[0].mono_mass /data.envlist[0].charge + 1, null, graphFeatures);
            // graph_preview2_g.redraw(parseFloat(mono_mass) + 1, graphFeatures);
            addSpectrum("previewSpectrum2", data.originalPeakList, envList_temp, parseFloat(mono_mass)/parseInt(charge) + 1, null, graphFeatures);
        }
    });
}

$("#previewSaveBtn").click(function () {
    // var result = confirm("Are you sure that you want to save this change?");
    if (true) {
        //Logic to delete the item
        $.ajax({
            url:"editrow?projectDir=" + document.getElementById("projectDir").value +
                "&scan_id=" + envList_temp[0].env.scan_id +
                "&envelope_id=" + envList_temp[0].env.envelope_id +
                "&charge=" + envList_temp[0].env.charge +
                "&intensity=" + envList_temp[0].env.intensity +
                "&mono_mass=" + envList_temp[0].env.mono_mass,
            type: "get",
            // dataType: 'json',
            success: function (res) {
                alert('Your change has been saved!');
                $('#previewModal').modal('hide');
                refresh();
                $('#envTable').DataTable().ajax.reload();
            }
        });
    }
});
var correspondingSpecParams_g = [];