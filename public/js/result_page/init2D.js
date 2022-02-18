"use strict";
let peakList1_g;
let envList1_g;
let graph1_g;
let temp_peakList1_g;
let peakList2_g;
let envList2_g;
let graph2_g;
let temp_peakList2_g;
let rtInteGraph;
let config;
const calcDistrubution = new MolecularFormulae();
function init2D(scan, configFromResultViz) {
    let projectDir = document.querySelector("#projectDir");
    if (!projectDir) {
        console.error("project directory information cannot be found");
        return;
    }
    const topview_2d = new DataGetter(projectDir.value);
    let nextScan;
    config = configFromResultViz;
    topview_2d.findNextLevelOneScan(scan)
        .then(function (response) {
        nextScan = parseInt(response.data); // next scan level one
        return topview_2d.getScanLevel(scan); // current scan
    }).then(function (response) {
        //document.getElementById("scanID1").innerText = scan;
        //console.log("scan level response:", response.data);
        if (response.data === 0) { //invalid result
            throw new Error("invalid scan level!");
        }
        else if (response.data === 1) { // scan level 1
            $("#scanID1").text(scan);
            if (nextScan - scan === 1) { // if there are scan level 2 for this scan
                // console.log("Scan Level 1, nextScan - scan === 1");
                $('#scanLevelTwoInfo').show();
                $("#tabs").show();
                $("#noScanLevelTwo").hide();
                topview_2d.getScanLevelTwoList(scan)
                    .then(function (response) {
                    $("#tabs").tabs();
                    $("#tabs li").remove();
                    $("#tabs").tabs("destroy");
                    response.data.forEach(function (item) {
                        let scanTwoNum = item.scanID;
                        let rt = item.rt;
                        $("#tabs ul").append('<li><a href="#spectrum2"' + ' id=' + scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scan + ')">' + item.prec_mz.toFixed(config.floatDigit) + '</a></li>');
                    });
                    $("#tabs").tabs();
                    let nextScanTab = document.getElementById(nextScan.toString());
                    if (nextScanTab) {
                        nextScanTab.click(); // show next scan which is the first scan of scan level 2    
                    }
                }).catch(function (error) {
                    console.log(error);
                });
            }
            else { // if there is no scan level 2
                // console.log("Scan Level 1, nextScan - scan !== 1")
                $("#noScanLevelTwo").show();
                $("#tabs").hide();
                $('#scanLevelTwoInfo').hide();
                topview_2d.getRT(scan, rtInteGraph);
                topview_2d.getPeakList(scan)
                    .then(function (response) {
                    peakList1_g = response.data;
                    showEnvTable(scan.toString()); // update envtable even if there is no scan level 2
                    temp_peakList1_g = JSON.parse(JSON.stringify(peakList1_g));
                    let scanId1 = document.querySelector("#scanID1");
                    if (scanId1) {
                        scanId1.innerText = scan.toString();
                    }
                    if ($('#envStatus').val() === "1") {
                        return topview_2d.getEnvTable(scan);
                    }
                    else {
                        return null;
                    }
                }).then(function (response) {
                    let peaks = [];
                    let modfiablePeaks = [];
                    let envelopes = [];
                    if (response) {
                        let envtable = response.data;
                        if (envtable != 0) {
                            for (let i = 0; i < peakList1_g.length; i++) {
                                let peakObj = new Peak(i.toString(), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].intensity));
                                let modPeakObj = new Peak(i.toString(), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].intensity));
                                peaks.push(peakObj);
                                modfiablePeaks.push(modPeakObj);
                            }
                            envtable.forEach((env) => {
                                let envObj = new Envelope(parseFloat(env.mono_mass), parseInt(env.charge));
                                let env_peaks = calcDistrubution.emass(parseFloat(env.mono_mass), parseInt(env.charge), modfiablePeaks);
                                for (let j = 0; j < env_peaks.length; j++) {
                                    let peak = new Peak(j.toString(), env_peaks[j].getPos(), env_peaks[j].getMonoMz(), env_peaks[j].getIntensity());
                                    envObj.addPeaks(peak);
                                }
                                envelopes.push(envObj);
                            });
                            let ions = [];
                            let spectrumDataPeaks = new SpectrumFunction();
                            let spectrumDataEnvs = new SpectrumFunction();
                            spectrumDataPeaks.assignLevelPeaks(peaks);
                            spectrumDataEnvs.assignLevelEnvs(envelopes);
                            //@ts-ignore variable from another file in global namespace
                            spGraph = new SpectrumView("spectrum1", peaks);
                            //@ts-ignore variable from another file in global namespace
                            spGraph.addRawSpectrumAnno(envelopes, ions);
                            //spGraph.para.updateMzRange(prec_mz);
                            //@ts-ignore variable from another file in global namespace
                            spGraph.redraw();
                        }
                    }
                    else {
                        for (let i = 0; i < peakList1_g.length; i++) {
                            let peakObj = new Peak(i.toString(), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].intensity));
                            peaks.push(peakObj);
                        }
                        let spectrumDataPeaks = new SpectrumFunction();
                        spectrumDataPeaks.assignLevelPeaks(peaks);
                        //@ts-ignore variable from another file in global namespace
                        spGraph = new SpectrumView("spectrum1", peaks);
                        //spGraph.para.updateMzRange(prec_mz);
                        //@ts-ignore variable from another file in global namespace
                        spGraph.redraw();
                    }
                }).catch(function (error) {
                    console.log(error);
                });
            }
        }
        else { // scan level 2
            let scanLevelOne;
            $("#tabs").show();
            $("#noScanLevelTwo").hide();
            $("#scanLevelTwoInfo").show();
            topview_2d.getRelatedScan1(scan)
                .then(function (response) {
                scanLevelOne = response.data;
                $("#scanID1").text(scanLevelOne);
                return topview_2d.getScanLevelTwoList(scanLevelOne);
            }).then(function (response) {
                $("#tabs").tabs();
                $("#tabs li").remove();
                $("#tabs").tabs("destroy");
                response.data.forEach(function (item) {
                    let scanTwoNum = item.scanID;
                    let rt = item.rt;
                    $("#tabs ul").append('<li><a href="#spectrum2"' + ' id=' + scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scanLevelOne + ')">' + item.prec_mz.toFixed(config.floatDigit) + '</a></li>');
                });
                $("#tabs").tabs();
                let scanTab = document.getElementById(scan.toString());
                if (scanTab) {
                    scanTab.click();
                }
            }).catch(function (error) {
                console.log(error);
            });
        }
    })
        .catch(error => {
        console.log(error);
    });
}
function loadPeakList1(scanID, prec_mz, mz_low = -1, mz_high = -1) {
    if (scanID !== '0') {
        let projectDir = document.querySelector("#projectDir");
        if (!projectDir) {
            console.error("project directory information cannot be found");
            return;
        }
        const topview_2d = new DataGetter(projectDir.value);
        topview_2d.getPeakList(scanID)
            .then(function (response) {
            topview_2d.getRT(scanID, rtInteGraph);
            peakList1_g = response.data;
            temp_peakList1_g = JSON.parse(JSON.stringify(peakList1_g));
            let scanIdElem = document.getElementById("scanID1");
            if (scanIdElem) {
                scanIdElem.innerText = scanID.toString();
            }
            if ($('#envStatus').val() === "1") {
                return topview_2d.getEnvTable(scanID);
            }
            else {
                return null;
            }
        }).then(function (response) {
            let peaks = [];
            let modfiablePeaks = [];
            let envelopes = [];
            if (response && response.data.length > 0) {
                let envtable = response.data;
                if (envtable != 0) {
                    for (let i = 0; i < peakList1_g.length; i++) {
                        let peakObj = new Peak(i.toString(), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].intensity));
                        let modPeakObj = new Peak(i.toString(), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].intensity));
                        peaks.push(peakObj);
                        modfiablePeaks.push(modPeakObj);
                    }
                    envtable.forEach((env) => {
                        let envObj = new Envelope(parseFloat(env.mono_mass), parseInt(env.charge));
                        let env_peaks = calcDistrubution.emass(parseFloat(env.mono_mass), parseInt(env.charge), modfiablePeaks);
                        for (let j = 0; j < env_peaks.length; j++) {
                            let peak = new Peak(env.envelope_id, env_peaks[j].getPos(), env_peaks[j].getMonoMz(), env_peaks[j].getIntensity());
                            envObj.addPeaks(peak);
                        }
                        envelopes.push(envObj);
                    });
                    let ions = [];
                    let spectrum = new Spectrum("0", scanID.toString(), 1, peaks, null, envelopes, [], [], -1, -1, parseFloat(prec_mz), mz_low, mz_high);
                    let spectrumDataPeaks = new SpectrumFunction();
                    let spectrumDataEnvs = new SpectrumFunction();
                    spectrumDataPeaks.assignLevelPeaks(spectrum.getPeaks());
                    spectrumDataEnvs.assignLevelEnvs(spectrum.getEnvs());
                    //@ts-ignore variable from another file in global namespace
                    spGraph = new SpectrumView("spectrum1", spectrum.getPeaks());
                    //@ts-ignore variable from another file in global namespace
                    spGraph.addRawSpectrumAnno(spectrum.getEnvs(), ions);
                    //@ts-ignore variable from another file in global namespace
                    spGraph.getPara().updateMzRange(spectrum.getPrecMz());
                    //@ts-ignore variable from another file in global namespace
                    spGraph.getPara().setHighlight(spectrum);
                    //@ts-ignore variable from another file in global namespace
                    spGraph.redraw();
                    //@ts-ignore variable from another file in global namespace
                    graph1_g = spGraph;
                }
            }
            else {
                for (let i = 0; i < peakList1_g.length; i++) {
                    let peakObj = new Peak(i.toString(), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].mz), parseFloat(peakList1_g[i].intensity));
                    peaks.push(peakObj);
                }
                let spectrum = new Spectrum("0", scanID.toString(), 1, peaks, null, [], [], [], -1, -1, parseFloat(prec_mz), mz_low, mz_high);
                let spectrumDataPeaks = new SpectrumFunction();
                spectrumDataPeaks.assignLevelPeaks(spectrum.getPeaks());
                //@ts-ignore variable from another file in global namespace
                spGraph = new SpectrumView("spectrum1", spectrum.getPeaks());
                //@ts-ignore variable from another file in global namespace
                spGraph.getPara().updateMzRange(spectrum.getPrecMz());
                //@ts-ignore variable from another file in global namespace
                spGraph.getPara().setHighlight(spectrum);
                //@ts-ignore variable from another file in global namespace
                spGraph.redraw();
                //@ts-ignore variable from another file in global namespace
                graph1_g = spGraph;
            }
        })
            .catch(function (error) {
            console.log(error);
        });
    }
    else {
        alert("NULL");
    }
}
function loadPeakList2(scanID, prec_mz, prec_charge, prec_inte, rt, levelOneScan, mz_low = -1, mz_high = -1) {
    if (scanID !== '0') {
        let projectDir = document.querySelector("#projectDir");
        if (!projectDir) {
            console.error("project directory information cannot be found");
            return;
        }
        const topview_2d = new DataGetter(projectDir.value);
        // show envelope table for MS2
        showEnvTable(scanID);
        $("#switch").text('MS1');
        axios.get('/peaklist', {
            params: {
                projectDir: projectDir.value,
                scanID: scanID
            }
        }).then(function (response) {
            peakList2_g = response.data;
            temp_peakList2_g = JSON.parse(JSON.stringify(peakList2_g));
            if ($('#envStatus').val() === "1") {
                return topview_2d.getEnvTable(scanID);
            }
            else {
                return null;
            }
        }).then(function (response) {
            let peaks = [];
            let modifiablePeaks = [];
            let envelopes = [];
            if (response && response.data.length > 0) {
                let envtable = response.data;
                if (envtable != 0) {
                    for (let i = 0; i < peakList2_g.length; i++) {
                        let peakObj = new Peak(i.toString(), parseFloat(peakList2_g[i].mz), parseFloat(peakList2_g[i].mz), parseFloat(peakList2_g[i].intensity));
                        let modPeakObj = new Peak(i.toString(), parseFloat(peakList2_g[i].mz), parseFloat(peakList2_g[i].mz), parseFloat(peakList2_g[i].intensity));
                        peaks.push(peakObj);
                        modifiablePeaks.push(modPeakObj);
                    }
                    envtable.forEach(env => {
                        let envObj = new Envelope(parseFloat(env.mono_mass), parseInt(env.charge));
                        let env_peaks = calcDistrubution.emass(parseFloat(env.mono_mass), parseInt(env.charge), modifiablePeaks);
                        for (let j = 0; j < env_peaks.length; j++) {
                            let peak = new Peak(env.envelope_id, env_peaks[j].getPos(), env_peaks[j].getMonoMz(), env_peaks[j].getIntensity());
                            envObj.addPeaks(peak);
                        }
                        envelopes.push(envObj);
                    });
                    let ions = [];
                    let spectrumDataPeaks = new SpectrumFunction();
                    let spectrumDataEnvs = new SpectrumFunction();
                    spectrumDataPeaks.assignLevelPeaks(peaks);
                    spectrumDataEnvs.assignLevelEnvs(envelopes);
                    //@ts-ignore variable from another file in global namespace
                    spGraph = new SpectrumView("spectrum2", peaks);
                    //@ts-ignore variable from another file in global namespace
                    spGraph.addRawSpectrumAnno(envelopes, ions);
                    //spGraph.para.updateMzRange(prec_mz);
                    //@ts-ignore variable from another file in global namespace
                    spGraph.redraw();
                    //@ts-ignore variable from another file in global namespace
                    graph2_g = spGraph;
                }
            }
            else {
                for (let i = 0; i < peakList2_g.length; i++) {
                    let peakObj = new Peak(i.toString(), parseFloat(peakList2_g[i].mz), parseFloat(peakList2_g[i].mz), parseFloat(peakList2_g[i].intensity));
                    peaks.push(peakObj);
                }
                let spectrumDataPeaks = new SpectrumFunction();
                spectrumDataPeaks.assignLevelPeaks(peaks);
                //@ts-ignore variable from another file in global namespace
                spGraph = new SpectrumView("spectrum2", peaks);
                //spGraph.para.updateMzRange(prec_mz);
                //@ts-ignore variable from another file in global namespace
                spGraph.redraw();
                //@ts-ignore variable from another file in global namespace
                graph2_g = spGraph;
            }
            let scan2Elem = document.getElementById("scanID2");
            let precMzElem = document.getElementById("prec_mz");
            let precChargeElem = document.getElementById("prec_charge");
            let precInteElem = document.getElementById("prec_inte");
            let rtElem = document.getElementById("rt");
            if (scan2Elem) {
                scan2Elem.innerHTML = scanID;
            }
            else {
                console.error("there is no scanID2 element on the page");
            }
            if (precMzElem) {
                precMzElem.innerHTML = parseFloat(prec_mz).toFixed(config.floatDigit);
            }
            else {
                console.error("there is no prec_mz element on the page");
            }
            if (precChargeElem) {
                precChargeElem.innerHTML = prec_charge;
            }
            else {
                console.error("there is no prec_charge element on the page");
            }
            if (precInteElem) {
                precInteElem.innerHTML = parseFloat(prec_inte).toExponential(config.scientificDigit);
            }
            else {
                console.error("there is no prec_inte element on the page");
            }
            if (rtElem) {
                rtElem.innerHTML = parseFloat(rt).toFixed(config.floatDigit) + " (min)";
            }
            else {
                console.error("there is no rt element on the page");
            }
            loadPeakList1(levelOneScan, prec_mz);
            /*document.getElementById("scanID2").innerHTML = scanID;
            document.getElementById("prec_mz").innerHTML = prec_mz.toFixed(config.floatDigit);
            document.getElementById("prec_charge").innerHTML = prec_charge;
            document.getElementById("prec_inte").innerHTML = prec_inte.toExponential(2);
            document.getElementById("rt").innerHTML = rt.toFixed(4);
      
            document.getElementById("prec_inte").innerHTML = prec_inte.toExponential(config.scientificDigit);
            document.getElementById("rt").innerHTML = rt.toFixed(config.floatDigit) + " (min)";
      
            loadPeakList1(levelOneScan, prec_mz, mz_low, mz_high);
            loadPeakList1(levelOneScan, prec_mz);*/
        }).catch(function (error) {
            console.log(error);
        });
    }
    else {
        alert("NULL");
    }
}
