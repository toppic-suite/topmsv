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
                            let rawSeq = res;
                            if (rawSeq == 0) {//if it was not identified
                                window.localStorage.setItem('sequence', '');
                                window.localStorage.setItem('precursorMass', '');
                                if (document.getElementById('prec_mz')) {
                                    window.localStorage.setItem('precursorMass', $('#prec_mz').text()); 
                                }
                                else {
                                    window.localStorage.setItem('precursorMass', '');
                                }
                                window.open('/resources/topview/inspect/spectrum_no_nav.html', '_self');
                            }
                            else {
                            //get fixed/variable ptm information from tsv file
                            //convert variable ptm to unknown ptm
                                $.ajax({
                                    url:"ptmQuery?projectCode=" + document.getElementById("projectCode").value,
                                    type: "get",
                                    success: function (res) {
                                        let ptmData = JSON.parse(res);
                                        let fixedPtmList = [];
                                        let protVarPtmsList = [];
                                        let variablePtmsList = [];
                                        let unknownMassShiftList = [];
                                        let sequence = preprocessSeq(rawSeq, ptmData, fixedPtmList, unknownMassShiftList);

                                        if (fixedPtmList.length < 1) {//display fixed ptm even when it was not found in the seq
                                            ptmData["fixedPtms"].forEach(fixedPtm => {
                                                let newPtm = new Mod('', fixedPtm.mass, fixedPtm.name);
                                                fixedPtmList.push(new MassShift('', '', newPtm.getShift(), "Fixed", newPtm.getName(), newPtm));                  
                                            })
                                        }
                                        window.localStorage.setItem('sequence', JSON.stringify(sequence));
                                        window.localStorage.setItem('fixedPtmList', JSON.stringify(fixedPtmList));
                                        window.localStorage.setItem('protVarPtmsList', JSON.stringify(protVarPtmsList));
                                        window.localStorage.setItem('variablePtmsList', JSON.stringify(variablePtmsList));
                                        window.localStorage.setItem('unknownMassShiftList', JSON.stringify(unknownMassShiftList));
                                        window.localStorage.setItem('precursorMass', (JSON.parse(rawSeq)).prec_mass);
                                        window.open('/resources/topview/inspect/spectrum_no_nav.html', '_self');
                                    }
                                })
                            }
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
/*function preprocessSeq(seqString) {
    seq = JSON.parse(seqString).seq;
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
    
}*/
function preprocessSeq(seqString, ptmData = [], fixedPtmList = [], unknownMassShiftList = []) {
    seq = JSON.parse(seqString).seq;

    let firstIsDot = 1;
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
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
    //if there is a fixed/variable ptm in the sequence 

    if (ptmData.length == 0 && fixedPtmList.length == 0 && unknownMassShiftList.length == 0) {
        return seq;
    }

    let newSeq ='';

    //keep reading each residue in the sequence
    //if it is '[', read up to ']' and get the ptm inside []
    //if ptm is number, copy the entire [ptm] to the new sequence
    //if it is fixed ptm, skip the entire [ptm]
    //if it is variable ptm, replace the letter inside to mass

    let residuePos = 0; //points to current residue, skips annotation

    while (residuePos < seq.length) {
        if (seq[residuePos] == '[') {
            let isPtmFound = false;
            let start = residuePos;
            let ptmName = '';

            while (seq[residuePos] != ']') {
                ptmName = ptmName + seq[residuePos];
                residuePos++;
            }            
            ptmName = ptmName.replace('[','');
            ptmName = ptmName.replace(']','');

            if (isNaN(parseFloat(ptmName))) {
                ptmData["fixedPtms"].forEach(fixedPtm => {
                    if (fixedPtm.name == ptmName) {
                        isPtmFound = true;
                    }
                })
                if (!isPtmFound) {
                    ptmData["varPtms"].forEach(varPtm => {
                        if (varPtm.name == ptmName) {
                            let newPtm = new Mod(seq[start - 1], varPtm.mass, varPtm.name);
                            unknownMassShiftList.push(new MassShift(newSeq.length - 1, newSeq.length, newPtm.getShift(), "unexpected", newPtm.getShift(), newPtm));     
                            isPtmFound = true;
                        }
                    })
                }
                if (!isPtmFound) {
                    ptmData["commonPtms"].forEach(comPtm => {
                        if (comPtm.name == ptmName) {
                            let newPtm = new Mod(seq[start - 1], comPtm.mass, comPtm.name);
                            unknownMassShiftList.push(new MassShift(newSeq.length - 1, newSeq.length, newPtm.getShift(), "unexpected", newPtm.getShift(), newPtm));    
                            isPtmFound = true;
                        }
                    })
                }if (!isPtmFound) {
                    ptmAnnoData ["ptms"].forEach(annoPtm => {
                        if (annoPtm.name == ptmName) {
                            let newPtm = new Mod(seq[start - 1], annoPtm.mono_mass, annoPtm.name);
                            unknownMassShiftList.push(new MassShift(newSeq.length - 1, newSeq.length, newPtm.getShift(), "unexpected", newPtm.getShift(), newPtm));    
                            isPtmFound = true;
                        }
                    })
                }
            }else{
                unknownMassShiftList.push(new MassShift(newSeq.length - 1, newSeq.length, ptmName, "unexpected", ptmName));    
            }
            residuePos++;//without this, ']' is written
        }
        newSeq = newSeq + seq[residuePos];
        residuePos++;
    }
    return newSeq;
}