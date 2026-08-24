"use strict";
//let backGroundColorList_g = [];
class SeqOfExecution {
    /**
    * Function executes all the functionalities one by one and displays all the
    * needed contant on to HTML.
    * @param {string} errorType - This gives which type of error needed to be
    * considered when matched peaks are to be considered.
    * @param {float} errorVal - This gives the user entered threshhold value to
    * be considered when calculating matched peaks.
    * @param {char} removeAcid - This gives the acid up on which the fixed ptm
    * mass has to be removed when "X" is clicked at fixed ptms.
    */
    sequenceOfExecution() {
        /**
        * unbind all the actions previously binded else each action will be
        * binded multiple times.
        */
        let modifiablePeakData = []; //will change value if shared peak
        let spectrumGraphObj = {};
        let monoMassGraphObj = {};
        let precursorMass = getPrecursorMass();
        let ms2GraphList = [];
        if (!precursorMass) {
            console.error("Error: precursor mass is invalid");
            return;
        }
        /* show submit button for precursor mass and add event handler*/
        jqueryElements.precursorMassSubmit.show();
        setPrecursorMassEventHandler();
        /* Hide everything when page launched before data is computed*/
        $("#" + Constants.SVGDOWNLOADID).hide();
        $("#" + Constants.SPECTRUMGRAPHID).hide();
        $("#" + Constants.GRAPHDOWNLOAD).hide();
        $("#" + Constants.PEAKCOUNTID).hide();
        $("#" + Constants.MONOMASSGRAPHID).hide();
        /* Get all the Mass List data entered by the user.*/
        let monoMassList = getMassListFromUI();
        let monoMassListLen = monoMassList.length;
        /* Get all the peak list data entered by the user */
        modifiablePeakData = getPeakListFromUI();
        let peakList = getPeakListFromUI();
        let matchedUnMatchedPeaks = [];
        let envelopeList;
        let n_TerminusList = [];
        let c_TerminusList = [];
        /* create spectrum object*/
        let spectrum = new Spectrum("", "", 2, peakList, [], [], n_TerminusList, c_TerminusList, precursorMass);
        /* Get all the matched peaks for all the n terminus fragmented ions selected.*/
        let matchedPeakList = [];
        let calcMatchedPeaks = new CalcMatchedPeaks();
        /* Get combined list of both matched and unmatched peaks to write to table*/
        matchedUnMatchedPeaks = calcMatchedPeaks.getMatchedAndUnMatchedList(monoMassList, matchedPeakList);
        //add matchedUnmatchedPeaks as decovPeaks in spectrum object
        let decovPeaksList = [];
        matchedUnMatchedPeaks.forEach((peak) => {
            let mz = parseFloat((peak.mass / peak.charge + 1.007276466879).toFixed(4));
            let peakObj = new Peak(peak.peakId, peak.mass, mz, peak.intensity, peak.mass, peak.charge);
            decovPeaksList.push(peakObj);
            if (peak.matchedInd == "Y") {
                let ionObj = new Ion(peak.ion, peak.ion.slice(0, 1), "", -1, peak.massError, peak.PPMerror);
                matchedPeakPairList.push(new MatchedPeakEnvelopePair(peak.thMass, peakObj, ionObj));
            }
        });
        spectrum.setDeconvPeaks(decovPeaksList);
        /**
         * calculate envelope distribution and draw spectrum graph
         */
        if (spectrum.getPeaks().length !== 0) {
            let calcMatchedPeaks = new CalcMatchedPeaks();
            envelopeList = calcMatchedPeaks.getDistribution(modifiablePeakData, matchedUnMatchedPeaks);
            spectrum.setEnvs(envelopeList);
            /**
             * Display the graph formed
             */
            $("#" + Constants.SPECTRUMGRAPHID).show();
            /**
             * Call generateCorrespondingGraph which calls addSpectrum function in invokeSpectrum file to draw graph
             */
            let spectrumDataPeaks = new SpectrumFunction();
            let spectrumDataEnvs = new SpectrumFunction();
            spectrumDataPeaks.assignLevelPeaks(spectrum.getPeaks());
            spectrumDataEnvs.assignLevelEnvs(spectrum.getEnvs());
            let ionList = getIonsSpectrumGraph(matchedPeakList, spectrum.getEnvs());
            spectrumGraphObj = new SpectrumView(Constants.SPECTRUMGRAPHID, spectrum.getPeaks());
            spectrumGraphObj.addRawSpectrumAnno(spectrum.getEnvs(), ionList);
            // console.log("envPeakList:", spectrumGraphObj.envPeakList);
            spectrumGraphObj.redraw();
            //ms2GraphList.push(spectrumGraphObj);
        }

        console.log("submit button clicked");
    }

    tmp_other () {
        $("#monoMasstitle").show();
        let ions = getIonsMassGraph(matchedPeakList);
        let monoMassPeakList = [];
        for (let i = 0; i < monoMassList.length; i++) {
            let monoMass = monoMassList[i].getMonoMass();
            if (monoMass) {
                let peak = new Peak(monoMassList[i].getId(), monoMass, monoMass, monoMassList[i].getIntensity());
                monoMassPeakList.push(peak);
            }
        }
        let spectrumDataMonoPeaks = new SpectrumFunction();
        spectrumDataMonoPeaks.assignLevelPeaks(monoMassPeakList);
        monoMassGraphObj = new SpectrumView(Constants.MONOMASSGRAPHID, monoMassPeakList);
        // monoMassGraphObj.para.errorThreshold = 0.06;
        monoMassGraphObj.addMonoMassSpectrumAnno(ions, proteoformObj, nIonType, cIonType);
        monoMassGraphObj.getPara().setMonoMassGraph(true);
        monoMassGraphObj.redraw();
        /**
         * add download for mono mass and spectrum graph
         */
        let saveSpectrumObj = new SaveSpectrum([spectrumGraphObj], [monoMassGraphObj]);
        saveSpectrumObj.main();
        /* create a nav bar and a tab for ms2 graph and mono mass graph */
        clearMs2NavElement(Constants.GRAPHTABNAV);
        createMs2NavElementInspect(0, Constants.GRAPHTABDIV, Constants.GRAPHTABNAV, "");
        addCheckboxTabInspect(Constants.GRAPHTABNAV);
        addEventNavBar(monoMassGraphObj);
        /*add event handlers for spectrum graph buttons*/
        $("#ms2_graph_show_btn").click(function () {
            if ($.trim($(this).text()) === 'Show Spectrum') {
                $("#ms2_graph_show_btn").text('Hide Spectrum');
                let helpBtn = document.getElementById("ms2_graph_help_btn");
                let saveBtn = document.getElementById("ms2_graph_save_btn");
                let svgDiv = document.getElementById("ms2_svg_div");
                if (!helpBtn || !saveBtn || !svgDiv) {
                    console.error("ERROR: invalid button ID or SVG div ID");
                    return;
                }
                helpBtn.style.display = "block";
                saveBtn.style.display = "block";
                svgDiv.style.display = "block";
            }
            else {
                $("#ms2_graph_show_btn").text('Show Spectrum');
                let helpBtn = document.getElementById("ms2_graph_help_btn");
                let saveBtn = document.getElementById("ms2_graph_save_btn");
                let svgDiv = document.getElementById("ms2_svg_div");
                if (!helpBtn || !saveBtn || !svgDiv) {
                    console.error("ERROR: invalid button ID or SVG div ID");
                    return;
                }
                helpBtn.style.display = "none";
                saveBtn.style.display = "none";
                svgDiv.style.display = "none";
            }
        });
        // MS2 graph help button 
        $("#ms2_graph_help_btn").click(function () {
            // @ts-ignore
            $("#ms2_graph_help_popup_window").draggable({
                appendTo: "body"
            });
        });
        this.setBootStarpropertiesforFragmentIons();
    }
    /**
     * Sets the properties of bootstrap table
     */
    setBootStarpropertiesforFragmentIons() {
        //to be correctly sorted, column type should be num for each ion column
        //this code will work regardless of number of ions selected
        let columnCnt = 0;
        let columnTypes = [];
        $("#selectedIonTableContainer .th-sm").each(function () {
            columnCnt++;
        });
        for (let i = 0; i < columnCnt; i++) {
            let type = null;
            if (i != 1) {
                type = { "type": "num" };
            }
            columnTypes.push(type);
        }
        //@ts-ignore
        $("#selectedIonTableContainer").DataTable({
            "scrollY": Constants.TABLEHEIGHT,
            "scrollCollapse": true,
            "paging": false,
            "bSortClasses": false,
            "searching": false,
            "bInfo": false,
            "columns": columnTypes
        });
    }
}
