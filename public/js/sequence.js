function inspect(scanID) {
    $.ajax({
        url:"peaklist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID,
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
            window.localStorage.setItem('scan', scanID);
            $.ajax({
                url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID,
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
                        url:"seqQuery?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID,
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
                            window.open('/resources/topview/inspect/spectrum.html', '_self');
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

function preprocessSeq(seq) {
    var firstDotIndex = seq.indexOf('.');
    var lastDotIndex = seq.lastIndexOf('.');
    seq = seq.slice(firstDotIndex+1,lastDotIndex);
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
    seq = seq.replace(/\[[A-z]*\]/g, '');
    return seq;
    //console.log(seq);
}