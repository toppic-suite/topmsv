class Topview2D {
    constructor(scanId) {
        this.scanId = this.scanId;
    }

    findNextLevelOneScan(scan) {
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

}