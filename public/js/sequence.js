function inspect(scanID,scanNum) {
    $.ajax({
        url:"peaklist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanNum,
        type:"get",
        dataType: 'json',
        success: function (res) {
            // res = JSON.parse(res);
            let peakAndIntensityList = "";
            res.forEach(peak => {
                peakAndIntensityList = peakAndIntensityList + peak.mz + ' ' + peak.intensity+'\n';
            });
            peakAndIntensityList = peakAndIntensityList.slice(0,-1);
            window.localStorage.setItem('peakAndIntensityList', peakAndIntensityList);
            window.localStorage.setItem('scan', scanNum);
            window.localStorage.setItem('scanID', scanID);
            window.localStorage.setItem('projectCode', document.getElementById('projectCode').value);
            
            $.ajax({
                url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanNum,
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
                    //console.log(res);
                    $.ajax({
                        url:"seqQuery?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanNum + "&projectCode=" + document.getElementById('projectCode').value,
                        type: "get",
                        success: function (res) {
                            //console.log(res);
                            if(res!== '0') {
                                let sequence = preprocessSeq(res);
                                //remove fdr information
                                sequence = sequence.split(",")[0];
                                window.localStorage.setItem('sequence', sequence);
                            } else {
                                window.localStorage.setItem('sequence', '');
                            }
                            axios.get('/precMZ',{
                                params:{
                                    projectDir: document.getElementById("projectDir").value,
                                    scanID: scanNum
                                }
                            }).then((response)=>{
                                window.localStorage.setItem('precursorMass', parseFloat(response.data));
                                window.open('/resources/topview/inspect/spectrum.html', '_self');
                            }).catch((error) => {
                                console.log(error);
                            })
                        }
                    })
                }
            });
        }
    })
}

function jumpBack(scan) {
    window.localStorage.setItem('scan', scan);
    let url = '/data?id=' + document.getElementById('projectCode').value;
    window.location.replace(url);
}
/*
function preprocessSeq(seq) {
    var firstDotIndex = seq.indexOf('.');
    var lastDotIndex = seq.lastIndexOf('.');
    seq = seq.slice(firstDotIndex+1,lastDotIndex);
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
    seq = seq.replace(/\[[A-z]*\]/g, '');
    return seq;
    //console.log(seq);
}*/
function preprocessSeq(seq) {
    let firstIsDot = 1;
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
    seq = seq.replace(/\[[A-z]*\]/g, '');
    var firstDotIndex = seq.indexOf('.');
    if(firstDotIndex === -1) {
        firstDotIndex = 0;
        firstIsDot = 0;
    }
    var lastDotIndex = seq.lastIndexOf('.');
    if(lastDotIndex === -1) {
        lastDotIndex = seq.length;
    }
    var firstIndex = seq.indexOf('[');
    var lastIndex = seq.lastIndexOf(']');
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