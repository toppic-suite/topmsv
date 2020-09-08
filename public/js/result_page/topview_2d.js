class Topview2D {
    constructor(scanId) {
        this.scanId = this.scanId;
    }

    findNextLevelOneScan(scan) {
        return axios.get('/findNextLevelOneScan', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scan
            }
        });
    }

    getRelatedScan2 (scanID) {
        return axios.get('/relatedScan2', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        });
    }

    getScanLevel(scanID,nextScan) {
        return axios.get('/scanlevel', {
                params: {
                    projectDir: document.getElementById("projectDir").value,
                    scanId: scanID
                }
        });
    }

    getScanID(ID) {
        return axios.get('/scanID', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                ID: ID
            }
        });
    }

    loadPeakList1(scanID, prec_mz) {
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
            }).catch(function(error) {
                console.log(error);
            })
        }else{
            alert("NULL");
        }
    }

    getRT(scanNum) {
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

    findNextLevelOneScan(scan) {
        return axios.get('/findNextLevelOneScan', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scan
            }
        });
    }

    loadPeakList2(scanID, prec_mz, prec_charge, prec_inte, rt, levelOneScan) {
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
            }).catch(function(error) {
                console.log(error);
            })
        }else{
            alert("NULL");
        }
    }

    loadInteSumList() {
        return axios.get('/getInteSumList', {
            params: {
                projectDir: document.getElementById("projectDir").value
            }
        })
    }

    prev(scanID) {
        return axios.get('/prev', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        });
    }

    next(scanID) {
        return axios.get('/next', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        });
    }

    getScanLevelTwoList(scanID,target) {
        return axios.get('/scanTwoList', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        });
    }
}