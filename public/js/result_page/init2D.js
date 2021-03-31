let peakList1_g;
let envList1_g;
let graph1_g;

let peakList2_g;
let envList2_g;
let graph2_g;

let rtInteGraph;

const topview_2d = new Topview2D();
const calcDistrubution = new MolecularFormulae();

function init2D(scan) {
    let nextScan;
    topview_2d.findNextLevelOneScan(scan)
        .then(function(response) {
            nextScan = parseInt(response.data); // next scan level one
            return topview_2d.getScanLevel(scan); // current scan
        })
        .then(function(response) {
            // console.log("scan level response:", response.data);
            if (response.data === 1) { // scan level 1
                if (nextScan - scan === 1) { // if there are scan level 2 for this scan
                    // console.log("Scan Level 1, nextScan - scan === 1");
                    $('#scanLevelTwoInfo').show();
                    $("#tabs").show();
                    $("#noScanLevelTwo").hide();
                    topview_2d.getScanLevelTwoList(scan)
                        .then(function(response) {
                            $( "#tabs" ).tabs();
                            $("#tabs li").remove();
                            $( "#tabs" ).tabs("destroy");
                            response.data.forEach(function (item) {
                                let scanTwoNum = item.scanID;
                                let rt = item.rt;
                                $("#tabs ul").append('<li><a href="#spectrum2"' + ' id='+ scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scan + ')">'+ item.prec_mz.toFixed(4) + '</a></li>');
                            });
                            $( "#tabs" ).tabs();
                            document.getElementById(nextScan).click(); // show next scan which is the first scan of scan level 2
                            
                        })
                        .catch(function(error) {
                            console.log(error);
                        });
                } else { // if there is no scan level 2
                    // console.log("Scan Level 1, nextScan - scan !== 1")
                    showEnvTable(scan); // update envtable even if there is no scan level 2
                    $("#noScanLevelTwo").show();
                    $("#tabs").hide();
                    $('#scanLevelTwoInfo').hide();
                    topview_2d.getRT(scan, rtInteGraph);
                    topview_2d.getPeakList(scan)
                        .then(function(response) {
                            peakList1_g = response.data;
                            document.getElementById("scanID1").innerText = scan;
                            return topview_2d.getEnvTable(scan);
                        })
                        .then(function(response) {
                            let envtable = response.data;
                            let temp_peakList1_g = JSON.parse(JSON.stringify(peakList1_g));
                            envList1_g = calcDistrubution.getEnvDistribution(envtable, temp_peakList1_g);
                            if (envList1_g !== 0 && envList1_g.length !== 0){
                                graph1_g = new SpectrumGraph("spectrum1", peakList1_g, envList1_g,[],null);
                                graph1_g.redraw();
                            }else {
                                graph1_g = new SpectrumGraph("spectrum1", peakList1_g, [],[],null);
                                graph1_g.redraw();
                            }
                        })
                        .catch(function(error) {
                            console.log(error);
                        });
                }
            } else { // scan level 2
                // console.log("scan level 2");
                let scanLevelOne;
                topview_2d.getRelatedScan1(scan)
                    .then(function(response) {
                        scanLevelOne = response.data;
                        return topview_2d.getScanLevelTwoList(scanLevelOne);
                    })
                    .then(function(response){
                        $( "#tabs" ).tabs();
                        $("#tabs li").remove();
                        $( "#tabs" ).tabs("destroy");
                        response.data.forEach(function (item) {
                            let scanTwoNum = item.scanID;
                            let rt = item.rt;
                            $("#tabs ul").append('<li><a href="#spectrum2"' + ' id='+ scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scanLevelOne + ')">'+ item.prec_mz.toFixed(4) + '</a></li>');
                        });
                        $( "#tabs" ).tabs();
                        document.getElementById(scan).click();
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
            }
        })
        .catch(error => {
            console.log(error);
        })
}

function loadPeakList1(scanID, prec_mz) {
    if (scanID !== '0') {
        topview_2d.getPeakList(scanID)
            .then(function(response){
                topview_2d.getRT(scanID, rtInteGraph);
                peakList1_g = response.data;
                document.getElementById("scanID1").innerText = scanID;
                return topview_2d.getEnvTable(scanID);
            })
            .then(function(response){
                let envtable = response.data;
                let temp_peakList1_g = JSON.parse(JSON.stringify(peakList1_g));

                envList1_g = calcDistrubution.getEnvDistribution(envtable, temp_peakList1_g);
                if (envList1_g !== 0 && envList1_g.length !== 0){
                    graph1_g = new SpectrumGraph("spectrum1", peakList1_g, envList1_g,[],null);
                    graph1_g.redraw(prec_mz);
                }else {
                    graph1_g = new SpectrumGraph("spectrum1", peakList1_g, [],[],null);
                    graph1_g.redraw(prec_mz);
                }
            })
            .catch(function(error) {
                console.log(error);
            })
    }else{
        alert("NULL");
    }
}

function loadPeakList2(scanID, prec_mz, prec_charge, prec_inte, rt, levelOneScan) {
    if(scanID !== '0') {
        // show envelope table for MS2
        showEnvTable(scanID);
        $("#switch").text('MS1');

        axios.get('/peaklist',{
            params:{
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        }).then(function(response) {
            peakList2_g = response.data;
            
            return topview_2d.getEnvTable(scanID);
        }).then(function(response) {
            let envtable = response.data;
            let temp_peakList2_g = JSON.parse(JSON.stringify(peakList2_g));
            envList2_g = calcDistrubution.getEnvDistribution(envtable, temp_peakList2_g);
            if (envList2_g !== 0 && envList2_g.length !== 0){
                graph2_g = new SpectrumGraph("spectrum2", peakList2_g, envList2_g,[],null);
                graph2_g.redraw();
            }else {
                graph2_g = new SpectrumGraph("spectrum2", peakList2_g, [],[],null);
                graph2_g.redraw();
            }
            document.getElementById("scanID2").innerHTML = scanID;
            document.getElementById("prec_mz").innerHTML = prec_mz.toFixed(4);
            document.getElementById("prec_charge").innerHTML = prec_charge;
            document.getElementById("prec_inte").innerHTML = prec_inte.toFixed(4);
            document.getElementById("rt").innerHTML = (rt/60).toFixed(4);
            loadPeakList1(levelOneScan, prec_mz);
        }).catch(function(error) {
            console.log(error);
        });
    }else{
        alert("NULL");
    }
}