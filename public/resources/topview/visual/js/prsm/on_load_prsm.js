var ms1Graph;
var ms2SpecList = [];
var ms2GraphList = [];
var ms2MonoGraphList = [];
var matchedPairList = [];
var ms2PopupGraph;
var prsmGraph;
var popupPrsmGraph;

/**
 * This function waits till all the HTML tags are loaded.
 * Invokes functions to loads the complete prsm page and visualization
 */
 $(document).ready(function(){
	var x = location.href;
	let l_split = x.split(/[?#]+/)[1];
	let path_and_value = l_split.split("&");
	let folder_path = path_and_value[0].split("=")[1];
	// get the prsm Id number by splitting url with "?" and "=" 
	let prsm_seq_num = path_and_value[1].split("=")[1];
	let prsm_data_script= document.createElement('script');
	// get the prsm Id number by splitting url with "?","=","#"
	let prsm_data_file_name = "../data/"+folder_path+"/prsms/prsm" + prsm_seq_num+".js";
	prsm_data_script.type= 'text/javascript';
	prsm_data_script.src= prsm_data_file_name;
	// Add data file to the script tag in the html
	let head= document.getElementsByTagName('head')[0];
	head.appendChild(prsm_data_script);

	// Wait till the data is losded before calling any functions
	prsm_data_script.onload = function () {
        // Loading prsm.js after data is loaded to fix no data issue in Data table
        let prsm_script = document.createElement('script');
        prsm_script.type= 'text/javascript';
        prsm_script.src = "js/prsm/prsm.js" ;

        // Append scrip tags to the head tag
        head.appendChild(prsm_script);
        
        // Build Urls to naviga back to proteoform page, proteins page and all protein page
        BuildUrl(folder_path);

        // Get the information of the PRSM to the HTML
        loadDatafromJson2Html();
        
        // Detting prsm data from prsm_data variable. prsm_data is a global variable from the prsm data file
        let prot = prsm_data.prsm.annotated_protein;
        let prsm = prsm_data.prsm;
        let [fixedPtms, protVarPtms, variablePtms] = json2Ptms(prsm);
        let massShifts = json2MassShifts(prsm);
        let sequence = getAminoAcidSequence(0,prot.annotation.residue.length - 1,prot.annotation.residue);
        let breakPoints = json2BreakPoints(prsm, parseInt(prot.annotation.first_residue_position));
        let proteoformObj = new Proteoform(prot.proteoform_id, prot.sequence_name, sequence, 
        prot.annotation.first_residue_position, prot.annotation.last_residue_position, prot.proteoform_mass, massShifts, fixedPtms, protVarPtms, variablePtms)
        let prsmObj = new Prsm(prsm.prsm_id, proteoformObj, "", "", breakPoints,
        prsm.e_value, prsm.fdr);

        // Get occurence ptms in prsmtohtml.js
        occurence_ptm(prsm_data.prsm);

        // Get Unknown Ptms to show in the html in prsmtohtml.js
        getUnknownPtms(prsm_data.prsm);

        // Create peaks data into table content
        createTableElements();

        // Calling function with actions on click of buttons
        addButtonActions();

        // Get all the scanIds
        let scanIds = prsm_data.prsm.ms.ms_header.scans.split(" ");

        // Get all the SpecIds
        let specIds = prsm_data.prsm.ms.ms_header.ids.split(" ");

        // Add Buttong with dropdowns with Scan numbers to navigae to inspect page
        setDropDownItemsForInspectButton(scanIds,specIds);

        // Add all the data and set local storage variables 
        onClickToInspect();

        // Using spectrum graph library
        // Get Ms1 Id to draw MS1 Spectrum
        let ms1SpecId = prsm_data.prsm.ms.ms_header.ms1_ids.split(" ")[0];
        // loadSpectra.js
        let ms1Filename = "../../topfd/ms1_json/spectrum"+ms1SpecId+".js";
        ms1Graph = loadMsOne(ms1Filename, "ms1_svg");

        // Get Ms2 ids to draw MS2 Spectrum
        let ms2SpecIdList = prsm_data.prsm.ms.ms_header.ids.split(" ");
        let ms2FileList = [];
        for (let i = 0; i < ms2SpecIdList.length; i++) {
        let ms2Filename = "../../topfd/ms2_json/spectrum"+ms2SpecIdList[i]+".js";
        ms2FileList.push(ms2Filename);
        }
        [ms2SpecList, ms2GraphList, ms2MonoGraphList] 
        = loadMsTwo(ms2SpecIdList, ms2FileList, proteoformObj, prsmObj,
            "ms2_svg_div", "ms2_graph_nav");
        //getMonoMassDataList(ms2ScanIdList);
    
        // SVG Id for the visualization
        let prsmSvgId = "prsm_svg" ;
        prsmGraph = new PrsmGraph(prsmSvgId, prsmObj);
        prsmGraph.redraw();
        // add prsm graph to popup
        let savePrsmObj = new SavePrsm(prsmGraph);
        savePrsmObj.main();
	}
})