function plus() {
    let inputVal = $('#preview_mono_mass').val();
    if(inputVal === "") {inputVal = 0;}
    inputVal = parseFloat(inputVal) + 1.00235;
    inputVal = inputVal.toFixed(5);
    $('#preview_mono_mass').val(inputVal);
    change_mono_mz();
    updatePreview(preview_scanID_g, $('#preview_envelope_id').val(), $('#preview_charge').val(), $('#preview_mono_mass').val());
}

function minus() {
    let inputVal = $('#preview_mono_mass').val();
    if(inputVal === "") {inputVal = 0;}
    inputVal = parseFloat(inputVal) - 1.00235;
    inputVal = inputVal.toFixed(5);
    $('#preview_mono_mass').val(inputVal);
    change_mono_mz();
    updatePreview(preview_scanID_g, $('#preview_envelope_id').val(), $('#preview_charge').val(), $('#preview_mono_mass').val());
}

function change_mono_mass() {
    let mz = $('#preview_mono_mz').val();
    if(mz === "") {mz = 0;}
    mz = parseFloat(mz);
    let charge = $('#preview_charge').val();
    if(charge === "") {charge = 1;}
    charge = parseInt(charge);
    let result = (mz - 1)*charge;
    if(result < 0) result = 0;
    $('#preview_mono_mass').val(result.toFixed(5));
    updatePreview(preview_scanID_g, $('#preview_envelope_id').val(), $('#preview_charge').val(), $('#preview_mono_mass').val());
}

function change_mono_mz() {
    let mass = $('#preview_mono_mass').val();
    if(mass === "") {mass = 0;}
    mass = parseFloat(mass);
    let charge = $('#preview_charge').val();
    if(charge === "") {charge = 1;}
    charge = parseInt(charge);
    let result = (mass/charge) + 1;
    if(result < 0) result = 0;
    $('#preview_mono_mz').val(result.toFixed(5));
}

// let specPara1_g;
// let lockPara1 = false;
// let specPara2_g;
// let lockPara2 = false;
let graphMz1;
let graphMz2;
function refresh(rowdata) {
    let msType_old = $('#msType').text();
    let scanID;
    let scanLevelOneFlag = true;
    if (msType_old === 'MS1') {
        graphMz1 = graph1_g.getPara().winCenterMz;
        scanID = $('#scanID1').text();
        showEnvTable($("#scanID1").text());
        $("#switch").text('MS2');
    } else {
        graphMz2 = graph2_g.getPara().winCenterMz;
        scanID = $('#scanID2').text();
        scanLevelOneFlag = false;
    }

    if (scanLevelOneFlag) {
        let origEnv = graph1_g.getEnvList();
        let newEnv = [];
        for (let i = 0; i < origEnv.length; i++) {
            if (rowdata.envList.length < 1) {
                break;
            } 
            let isDelete = false;
            for (k = 0; k < rowdata.envList.length; k++) {
                let envId = origEnv[i].getPeaks()[0].getId(); 
                if (envId == rowdata.envList[k].envelope_id) {
                    isDelete = true;
                    rowdata.envList = rowdata.envList.splice(k, 1);
                    break;
                }
            }
            if (!isDelete) {
                newEnv.push(origEnv[i]);
            }
        }
        graph1_g.addRawSpectrumAnno(newEnv, []);
        graph1_g.redraw();
    } else {
        let origEnv = graph2_g.getEnvList();
        let newEnv = [];
        for (let i = 0; i < origEnv.length; i++) {
            if (rowdata.envList.length < 1) {
                break;
            } 
            let isDelete = false;
            for (k = 0; k < rowdata.envList.length; k++) {
                let envId = origEnv[i].getPeaks()[0].getId(); 
                if (envId == rowdata.envList[k].envelope_id) {
                    isDelete = true;
                    rowdata.envList = rowdata.envList.splice(k, 1);
                    break;
                }
            }
            if (!isDelete) {
                newEnv.push(origEnv[i]);
            }
        }
        console.log("origEnv", origEnv);
        console.log("newEnv", newEnv);
        console.log("rowdata.envList", rowdata.envList);
        graph2_g.addRawSpectrumAnno(newEnv, []);
        graph2_g.redraw();
    }
}

let peakList_temp;
let envList_temp;
let preview_scanID_g;
let preview_intensitySum_g;
let graph_preview1_g;
let graph_preview2_g;
function preview(dataObj) {
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

    updatePreview(scanID, envID, charge, mono_mass);
    // let previewPeakList;
    // if ($('#msType').text() === 'MS1') {
    //     previewPeakList = peakList1_g;
    //     previewOriginalEnvPeakList = envList1_g;
    // } else if ($('#msType').text() === 'MS2') {
    //     previewPeakList = peakList2_g;
    //     previewOriginalEnvPeakList = envList2_g;
    // }
    // let previewNewEnvPeakList = calcDistrubution.getEnvDistribution([{mono_mass: mono_mass, charge: charge}],previewPeakList);
    // // console.log("preivewNewEnvPeakList:", previewNewEnvPeakList);
    // graph_preview1_g = new SpectrumGraph('previewSpectrum1', previewPeakList, previewOriginalEnvPeakList,[],null);
    // graph_preview1_g.redraw(mono_mz);
    // graph_preview2_g = new SpectrumGraph("previewSpectrum2", previewPeakList, previewNewEnvPeakList,[],null);
    // graph_preview2_g.redraw(mono_mz);

    /* $.ajax({
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
            data.envlist[0].charge = parseInt(data.envlist[0].charge);
            data.envlist[0].mono_mass = parseFloat(data.envlist[0].mono_mass);
            data.envlist[0].env.charge = parseInt(data.envlist[0].env.charge);
            data.envlist[0].env.scan_id = parseInt(data.envlist[0].env.scan_id);
            data.envlist[0].env.envelope_id = parseInt(data.envlist[0].env.envelope_id);
            data.envlist[0].env.mono_mass = parseFloat(data.envlist[0].env.mono_mass);
            data.envlist[0].env.intensity = parseFloat(data.envlist[0].env.intensity);
            peakList_temp = data.peaklist;
            envList_temp = data.envlist;
            graph_preview1_g = new SpectrumGraph('previewSpectrum1', data.originalPeakList, data.originalEnvPeaks,[],null);
            graph_preview1_g.redraw(data.envlist[0].mono_mass/data.envlist[0].charge + 1);
            graph_preview2_g = new SpectrumGraph("previewSpectrum2", data.originalPeakList, envList_temp,[],null);
            graph_preview2_g.redraw(mono_mass/charge + 1);
            // graph_preview1_g = addSpectrum('previewSpectrum1', data.originalPeakList, data.originalEnvPeaks, data.envlist[0].mono_mass/data.envlist[0].charge + 1,null, graphFeatures);
            // graph_preview2_g = addSpectrum("previewSpectrum2", data.originalPeakList, envList_temp, mono_mass/charge + 1,null, graphFeatures);
        }
    }); */
    $('#previewModal').modal('show');
}

function updatePreview(scanID, envID, charge, mono_mass) {
    let previewPeakList;
    if ($('#msType').text() === 'MS1') {
        previewPeakList = peakList1_g;
        previewOriginalEnvPeakList = envList1_g;
    } else if ($('#msType').text() === 'MS2') {
        previewPeakList = peakList2_g;
        previewOriginalEnvPeakList = envList2_g;
    }
    let previewNewEnvPeakList = calcDistrubution.getEnvDistribution([{mono_mass: mono_mass, charge: charge}],previewPeakList);
    graph_preview1_g = new SpectrumGraph('previewSpectrum1', previewPeakList, previewOriginalEnvPeakList,[],null);
    graph_preview1_g.redraw(mono_mass/charge + 1);
    graph_preview2_g = new SpectrumGraph("previewSpectrum2", previewPeakList, previewNewEnvPeakList,[],null);
    graph_preview2_g.redraw(mono_mass/charge + 1);
    let intensitySum = 0;
    if(previewNewEnvPeakList[0].env_peaks) {
        previewNewEnvPeakList[0].env_peaks.forEach(envPeak => {
            intensitySum += envPeak.intensity;
        })
    }
    preview_intensitySum_g = intensitySum;
    
    /* $.ajax({
        url:"previewEdit?projectDir=" + document.getElementById("projectDir").value +
            "&scan_id=" + scanID +
            "&envelope_id=" + envID +
            "&charge=" + charge +
            "&mono_mass=" + mono_mass,
        type: "get",
        // dataType: 'json',
        success: function (res) {
            let data = (typeof res === "string") ? JSON.parse(res) : res;
            // console.log("returnList preview update", data);
            data.envlist[0].charge = parseInt(data.envlist[0].charge);
            data.envlist[0].mono_mass = parseFloat(data.envlist[0].mono_mass);
            data.envlist[0].env.charge = parseInt(data.envlist[0].env.charge);
            data.envlist[0].env.scan_id = parseInt(data.envlist[0].env.scan_id);
            data.envlist[0].env.envelope_id = parseInt(data.envlist[0].env.envelope_id);
            data.envlist[0].env.mono_mass = parseFloat(data.envlist[0].env.mono_mass);
            data.envlist[0].env.intensity = parseFloat(data.envlist[0].env.intensity);
            peakList_temp = data.peaklist;
            envList_temp = data.envlist;
            graph_preview1_g = new SpectrumGraph('previewSpectrum1', data.originalPeakList, data.originalEnvPeaks,[],null);
            graph_preview1_g.redraw(data.envlist[0].mono_mass/data.envlist[0].charge + 1);
            graph_preview2_g = new SpectrumGraph("previewSpectrum2", data.originalPeakList, envList_temp,[],null);
            graph_preview2_g.redraw(parseFloat(mono_mass)/parseInt(charge) + 1);
        }
    }); */
}

$(function() {
    $("#previewSaveBtn").on('click',function () {
        let result = confirm("Are you sure that you want to save this change?");
        if (result) {
            let envID = $('#preview_envelope_id').val();
            let charge = $('#preview_charge').val();
            let intensity = preview_intensitySum_g;
            let mono_mass = $('#preview_mono_mass').val();
            $.ajax({
                url:"editrow?projectDir=" + document.getElementById("projectDir").value +
                    "&scan_id=" + preview_scanID_g +
                    "&envelope_id=" + envID +
                    "&charge=" + charge +
                    "&intensity=" + intensity +
                    "&mono_mass=" + mono_mass,
                type: "get",
                success: function (res) {
                    alert('Your change has been saved!');
                    $('#previewModal').modal('hide');
                    refresh();
                    $('#envTable').DataTable().ajax.reload();
                }
            });
        }
    });
});