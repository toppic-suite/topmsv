/**
 * This class contains functions {sequenceOfExecution} and {onClickSequenceOfExecution}.
 * @function {sequenceOfExecution} executes when user clicks submit in th UI.
 * @function {onClickSequenceOfExecution} executes when user enters mass shift 
 * on any amino acid and click "OK" button.
 */
let backGroundColorList_g = []
class SeqOfExecution
{
	constructor(){
		this.onClickMassShift = {};
		this.massShiftList = [];
	}
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
	sequenceOfExecution(errorType,errorVal,removeAcid,precursorMass){
		/**
		 * unbind all the actions previously binded else each action will be 
		 * binded multiple times.
		 */
		$( "#"+Constants.SPECDOWNLOADPNG ).unbind();
		$( "#"+Constants.SPECDOWNLOADSVG ).unbind();
		$( "#"+Constants.SEQDOWNLOADPNG ).unbind();
		$( "#"+Constants.SEQDOWNLOADSVG ).unbind();
		let massShiftList = [];
		let completeShiftList = [];
		let fixedMassShiftList = [];
		let peakDataList = [];
		let modifiablePeakData = [];//will change value if shared peak
		let massErrorthVal = null;
		let matchedPeakList = [];
		let ppmErrorthVal = null;
		let spectrumGraphObj;
		let monoMassGraphObj;
		/**
		 * Hide everything when page launched before data is computed
		 */
		$("#"+Constants.SEQSVGID).hide();
		$("#"+Constants.SVGDOWNLOADID).hide();
		$("#"+Constants.SPECTRUMGRAPHID).hide();
		$("#"+Constants.SPECTRUMDOWNLOADID).hide();
		$("#"+Constants.DIVTABLECONTAINER).hide();
		$("#"+Constants.PEAKCOUNTID).hide();
		
		let sequence = "";
		let massShift_ClassId = "."+ Constants.MASSSHIFT_CLASSID;
		/**
		 * Remove all the mass shift notation on the sequence if exists
		 */
		$(massShift_ClassId).remove();
		/**
		 * Get all the Mass List data entered by the user.
		 */
		let monoMassList = getMassListFromUI();
		
		/**
		 * Get the parsed sequence after removing mass shift list from 
		 * the entered sequence. 
		 * Returns mass list embedded in [] in sequence of user entered sequence.
		 */
		sequence = getSequenceFromUI();
		[sequence, massShiftList] = parseSequenceMassShift(sequence);
		let selectedFixedMassShiftList = getFixedPtmCheckList();
		// console.log("massShiftList:", massShiftList);
		// console.log("selectedFixedMassShiftList:", selectedFixedMassShiftList);
		/** 
		* Get fixed mass selected by user
		*/
		let massShiftObj = new MassShifts(sequence);

		fixedMassShiftList = massShiftObj.getFixedMassShiftList(selectedFixedMassShiftList);
		// console.log("fixedMassShiftList:", fixedMassShiftList);
		massShiftObj.generateMassShiftList(massShiftList, fixedMassShiftList);
		/**
		 * If user removed fixed ptm mass, remove the mass from the list
		 */
		if(removeAcid !== "")
		{
			massShiftObj.removeFixedMassList(removeAcid);
		}
		/**
		 * Check if mass shift is entered by clicking on the acid. If entered 
		 * consider that mass shift and and append to the current mass shift list
		 */
		if(!$.isEmptyObject(this.onClickMassShift))
		{
			let tempPosition = this.onClickMassShift.position;
			let tempMass = this.onClickMassShift.mass;
			massShiftObj.appendtoMassShiftList(tempPosition,tempMass);
		}
		completeShiftList = massShiftObj.massShiftList;
		// console.log("completeShiftList:", completeShiftList);
		/**
		 * Form sequence with mass shift embedded in []
		 */
		// let seqToUI = massShiftObj.formSequence();
		/**
		 * Write back to UI
		 */
		// writeSeqToTextBox(seqToUI);
		/**
		 * Get all the peak list data entered by the user 
		 */
		peakDataList = getPeakListFromUI();
		modifiablePeakData = getPeakListFromUI();
		let monoMassListLen = monoMassList.length;
		let seqln = sequence.length;
		let matchedUnMatchedPeaks = [];
		let distributionList;

		/**
		 * Setting masserror threshold value and ppm error threshhold value
		 */
		if(errorType === Constants.MASSERROR) massErrorthVal = errorVal ;
		else ppmErrorthVal = errorVal ;
		
		let proteoformObj = new Proteoform(sequence, fixedMassShiftList, massShiftList);
		// console.log("residueMasses:",proteoformObj.unexpectedMasses);
		// console.log("getPrefix:",proteoformObj.suffixMasses);
		// let calculatePrefixAndSuffixMassObj = new calculatePrefixAndSuffixMass();
		/**
		 * Get all the n terminus ions selected.
		 */
		let n_TerminusList = getNterminusCheckedList();
		/**
		 * Get all the matched peaks for all the n terminus fragmented ions selected.
		 */
		n_TerminusList.forEach(function(ion){
			let matchedPeaksObj = new MatchedPeaks();
			let prefixMassList = [];
			let matchedPeaks = [];
			let massShift = parseFloat(ion.mass);
			let ionType = ion.ionType;
			/**
			 * Get claculated prefix mass list
			 */
			prefixMassList = proteoformObj.getPrefixMassList(massShift);
			/**
			 * Get matched peak list
			 */
			matchedPeaks = matchedPeaksObj.getMatchedPeakList(prefixMassList,monoMassList,
												sequence,massErrorthVal,ppmErrorthVal,ionType,"prefix");
												
			// console.log("matchedPeaks test:", matchedPeaks);
			/**
			 * copy the matched peaks to a new list for each ion selected
			 */									
			let temp_matchedPeaks =  matchedPeaks.map(x => ({...x}));
			matchedPeakList = matchedPeakList.concat(temp_matchedPeaks);
		})
		/**
		 * Get all the c terminus ions selected
		 */
		let c_TerminusList = getCterminusCheckedList();
		/**
		 * Get all the matched peaks for all the c terminus fragmented ions selected.
		 */
		c_TerminusList.forEach(function(ion){
			let matchedPeaksObj = new MatchedPeaks();
			let suffixMassList = [];
			let matchedPeaks = [];
			let massShift = parseFloat(ion.mass);
			let ionType = ion.ionType;

			/**
			 * Get claculated suffix mass list
			 */
			suffixMassList = proteoformObj.getSuffixMassList(massShift);
			/**
			 * Get matched peak list
			 */															
			matchedPeaks = matchedPeaksObj.getMatchedPeakList(suffixMassList,monoMassList,sequence,massErrorthVal,ppmErrorthVal,ionType,"suffix");
			/**
			 * copy the matched peaks to a new list for each ion selected
			 */												
			let temp_matchedPeaks =  matchedPeaks.map(x => ({...x}));
			matchedPeakList = matchedPeakList.concat(temp_matchedPeaks);													
		})
		// console.log("matchedPeakList:", matchedPeakList);
		let matchedPeaksObj = new MatchedPeaks();
		/**
		 * Get combined list of both matched and unmatched peaks to write to table
		 */
		matchedUnMatchedPeaks = matchedPeaksObj.getMatchedAndUnMatchedList(monoMassList,matchedPeakList);
		// console.log("matchedUnmatchedpeaks:", matchedUnMatchedPeaks);
		/**
		 * Do the below function when peak list data is not empty
		 */
		if(peakDataList.length !== 0)
		{
			let matchedPeaksObj = new MatchedPeaks();

			//distributionList = matchedPeaksObj.getDistribution(peakDataList,sequence,matchedUnMatchedPeaks);
			distributionList = matchedPeaksObj.getDistribution(modifiablePeakData,sequence,matchedUnMatchedPeaks, completeShiftList);
			// console.log("distributionList:", distributionList);
			/**
			 * Display the graph formed
			 */
			$("#"+Constants.SPECTRUMGRAPHID).show();
			$("#"+Constants.MONOMASSGRAPHID).show();
			/**
			 * Call generateCorrespondingGraph which calls addSpectrum function in invokeSpectrum file to draw graph 
			 */
			spectrumGraphObj = new SpectrumGraph(Constants.SPECTRUMGRAPHID, peakDataList, distributionList,[],null);
			// console.log("envPeakList:", spectrumGraphObj.envPeakList);
			spectrumGraphObj.redraw();

			$("#"+Constants.SPECTRUMDOWNLOADID).show();
		}
		/**
		 * Do the below function when Sequence entered is not empty
		 */
		if(seqln !== 0)
		{	
			let breakPointsList = formBreakPoints(matchedPeakList);
			/**
			 *  Draw SVG of Sequence
			 */
			let residues = formResidues(sequence);
			// form fixedPtms
			let formedFixedPtmsList = formFixedPtms(fixedMassShiftList, sequence);
			let formedMassShifts = formMassShifts(massShiftList);
			let prsmDataObj = new PrsmData();
			prsmDataObj.setData(residues, 0, residues.length - 1, formedFixedPtmsList, formedMassShifts, sequence, breakPointsList);
			prsmDataObj.addColor();
			let prsmGraphObj = new PrsmGraph(Constants.SEQSVGID,null,prsmDataObj);
			prsmGraphObj.para.rowLength = 40;
			prsmGraphObj.para.letterWidth = 25;
			prsmGraphObj.redraw();

			$("#"+Constants.SEQSVGID).show();
			$("#"+Constants.SVGDOWNLOADID).show();
			/**
			 * Get total mass and wite to HTML
			 */
			let totalMass = getTotalSeqMass(sequence,completeShiftList);
			setTotalSeqMass(totalMass);
			//Set Mass Difference, precursorMass is a global variable form spectrum.html
			setMassDifference(precursorMass,totalMass);
		}	
		/**
		 * Do the below function when mono mass list entered is not empty
		 */
		if(monoMassListLen !== 0)
		{
			jqueryElements.monoMassTableContainer.show();
			/**
			 * Display All-peaks/matched/non-matched buttons on click of submit
			 */
			// jqueryElements.peakCount.show();
			/**
			 * Create tabe to display the input mass list data and calculated data
			 */
			createMonoMassTable();
			/**
			 * 	Add data to the table
			 */
			addMassDataToTable(matchedUnMatchedPeaks, spectrumGraphObj);
			/**
			 * function to show the count of matched peaks, un matched peaks and All peaks
			 */
			jqueryElements.peakCount.show();
			/**
			 * Bootstrap syntax to keep the table box to 400px height 
			 * and setting properties to the table.
			 */
			this.setBootStarpTableProperties();
			showPeakCounts();
		}
		/**
		 * Local function to set the actions on click of download button in HTML
		 */
		this.download();
		let completeListofMasswithMatchedInd = [];
		/**
		 * Code to form the second table with all the prefix masses with matched 
		 * masses for each ion fragment selected.
		 */
		n_TerminusList.forEach(function(ion){
			let matchedPeaksObj = new MatchedPeaks();
			let prefixMassList = new Array();
			let matchedAndUnMatchedList = new Array();
			let matchedAndUnMatchedListObj = {};
			let massShift = parseFloat(ion.mass);
			let ionType = ion.ionType;
			/**
			 * Get calculated prefix mass 
			 */
			prefixMassList = proteoformObj.getPrefixMassList(massShift);
			prefixMassList.shift();
			prefixMassList.pop();
			/**
			 * Get Matched peaks
			 */
			matchedAndUnMatchedList	= matchedPeaksObj.getMatchedAndUnmatchedPrefixAndSuffixMassList(prefixMassList,
																 monoMassList,massErrorthVal,ppmErrorthVal,"prefix");
			matchedAndUnMatchedListObj = {ionFragment:ionType,massList:matchedAndUnMatchedList};
			/**
			 * Complete list of all the peaks for each ion fragment 
			 */													 
			completeListofMasswithMatchedInd.push(matchedAndUnMatchedListObj);													
		})
		c_TerminusList.forEach(function(ion){
			let matchedPeaksObj = new MatchedPeaks();
			let suffixMassList = new Array();
			let matchedAndUnMatchedList = new Array();
			let matchedAndUnMatchedListObj = {};
			let massShift = parseFloat(ion.mass);
			let ionType = ion.ionType;
			/**
			 * Get calculated prefix mass 
			 */
			suffixMassList = proteoformObj.getSuffixMassList(massShift);
			suffixMassList.shift();
			suffixMassList.pop();
			// console.log("monoMassList:",monoMassList);
			/**
			 * Get Matched peaks
			 */					
			matchedAndUnMatchedList	= matchedPeaksObj.getMatchedAndUnmatchedPrefixAndSuffixMassList(suffixMassList,
																 monoMassList,massErrorthVal,ppmErrorthVal,"suffix");
			matchedAndUnMatchedListObj = {ionFragment:ionType,massList:matchedAndUnMatchedList};
			/**
			 * Complete list of all the peaks for each ion fragment 
			 */	
			completeListofMasswithMatchedInd.push(matchedAndUnMatchedListObj);													
		})
		// console.log("completeListofMasswithMatchedInd:", completeListofMasswithMatchedInd);
		// console.log("monomasslist:", monoMassList);
		/**
		 * Disply the table of masses for all the fragmented ions
		 */
		if(completeListofMasswithMatchedInd.length !== 0)
		{
			$("#"+Constants.H_FRAGMENTEDTABLE).show();
		}
		

		$("#monoMasstitle").show();
		let ions = getIons(matchedPeakList);

		// console.log("prsm graph input", ions);
		monoMassGraphObj = new SpectrumGraph("monoMassGraph",ions, [], ions, proteoformObj);
		monoMassGraphObj.para.showIons = true;
		monoMassGraphObj.para.showEnvelopes = false;
		monoMassGraphObj.para.svgHeight += 80;
		monoMassGraphObj.para.padding.head += 40;
		monoMassGraphObj.para.padding.bottom += 40;
		monoMassGraphObj.para.isMonoMassGraph = true;
		// monoMassGraphObj.para.errorThreshold = 0.06;

		monoMassGraphObj.redraw();

		createTableForSelectedFragmentIons(sequence,completeListofMasswithMatchedInd,monoMassGraphObj);
		this.setBootStarpropertiesforFragmentIons();
	}
	/**
	 * Function executes all the functionalities one by one and displays all the 
	 * needed contant on to HTML on change of mass shift on any acid.
	 * @param {string} errorType - This gives which type of error needed to be 
	 * considered when matched peaks are to be considered.
	 * @param {float} errorVal - This gives the user entered threshhold value to 
	 * be considered when calculating matched peaks.
	 */
	onClickSequenceOfExecution(errorType,errorVal){
		//console.log("This.completeShiftList : ", this.massShiftList);
		/**
		 * unbind all the actions previously binded else each action will be 
		 * binded multiple times.
		 */
		$( "#"+Constants.SPECDOWNLOADPNG ).unbind();
		$( "#"+Constants.SPECDOWNLOADSVG ).unbind();
		$( "#"+Constants.SEQDOWNLOADPNG ).unbind();
		$( "#"+Constants.SEQDOWNLOADSVG ).unbind();
		$( ".rectBGColor").remove();
		let massShiftList = [];
		let sequence = "";
		let massErrorthVal = null;
		let ppmErrorthVal = null;
		let matchedPeakList  = []; 
		let monoMassList = [];
		let peakDataList = [];

		let massShift_ClassId = "."+Constants.MASSSHIFT_CLASSID;
		/**
		 * Remove all the mass shift notation on the sequence if exists
		 */
		$(massShift_ClassId).remove();
		/**
		 * Get all the Mass List data entered by the user.
		 */
		let UIHelperObj = new UIHelper();
		monoMassList = UIHelperObj.getMassListFromUI();
		/**
		 * Get the parsed sequence after removing mass shift list from 
		 * the entered sequence. 
		 * Returns mass list embedded in [] in sequence of user entered sequence.
		 */
		let massShiftObj = new MassShifts();
		[sequence,massShiftList] = massShiftObj.getSequenceFromUI();
		let rectBGColorObj = new rectBGColor(backGroundColorList_g);
		let bgColorList ;
		/**
		 * Check if mass shift is entered by clicking on the acid. If entered 
		 * consider that mass shift and and append to the current mass shift list
		 */
		if(!$.isEmptyObject(this.onClickMassShift))
		{
			let tempPosition = this.onClickMassShift.position;
			let tempMass = this.onClickMassShift.mass;
			let color = this.onClickMassShift.color;
			bgColorList = rectBGColorObj.getMassListToColorBG(tempPosition,color);
			massShiftList = massShiftObj.appendtoMassShiftList(tempPosition,tempMass,massShiftList,color);
		}
		//Add Background color to the massshifted elements
		rectBGColorObj.setBackGroundColorOnMassShift(bgColorList);

		let seqToUI = massShiftObj.formSequence(sequence,massShiftList);
		massShiftObj.writeSeqToTextBox(seqToUI);
		peakDataList = UIHelperObj.getPeakListFromUI();
		modifiablePeakData = UIHelperObj.getPeakListFromUI();//added for modified version of getNormalizedIntensity to adjust envelopes
		let peakListLen = peakDataList.length;
		let monoMassListLen = monoMassList.length;
		let seqln = sequence.length;
		let matchedUnMatchedPeaks = [];
		
		if(peakListLen != 0 && monoMassListLen != 0 && seqln != 0)
		{
			/**
		 	* Setting masserror threshold value and ppm error threshhold value
		 	*/
			if(errorType == Constants.MASSERROR) massErrorthVal = errorVal ;
			else ppmErrorthVal = errorVal ;
			
			let calculatePrefixAndSuffixMassObj = new calculatePrefixAndSuffixMass();
			let iontabledataObj = new iontabledata();
			let n_TerminusList = iontabledataObj.getNterminusCheckedList();
			/**
			 * Get all the matched peaks for all the n terminus fragmented ions selected.
			 */
			n_TerminusList.forEach(function(ion){
				// Calculate Matched Peaks and Distribution
				let matchedPeaksObj = new MatchedPeaks();
				let prefixMassList = [];
				let matchedPeaks = [];
				let massShift = parseFloat(ion.mass);
				let ionType = ion.ionType;
				/**
				 * Get claculated prefix mass list
				 */
				prefixMassList = calculatePrefixAndSuffixMassObj
												.getPrefixMassList(sequence,massShiftList,massShift);
				/**
				 * Get matched peak list
				 */
				matchedPeaks = matchedPeaksObj.getMatchedPeakList(prefixMassList,monoMassList,
													sequence,massErrorthVal,ppmErrorthVal,ionType,"prefix");	
				/**
				 * copy the matched peaks to a new list for each ion selected
				 */	
				let temp_matchedPeaks =  matchedPeaks.map(x => ({...x}));
				matchedPeakList = matchedPeakList.concat(temp_matchedPeaks);//concat(matchedPeaks);		
			})
			/**
			 * Get all the c terminus ions selected
			 */
			let c_TerminusList = iontabledataObj.getCterminusCheckedList();
			/**
			 * Get all the matched peaks for all the c terminus fragmented ions selected.
			 */
			c_TerminusList.forEach(function(ion){
				let matchedPeaksObj = new MatchedPeaks();
				let suffixMassList = [];
				let matchedPeaks = [];
				let massShift = parseFloat(ion.mass);
				let ionType = ion.ionType;
				/**
				 * Get claculated suffix mass list
				 */
				suffixMassList = calculatePrefixAndSuffixMassObj
													.getSuffixMassList(sequence,
															massShiftList,massShift);
				/**
				 * Get matched peak list
				 */	
				matchedPeaks	= matchedPeaksObj.getMatchedPeakList(suffixMassList,monoMassList,
															sequence,massErrorthVal,ppmErrorthVal,ionType,"suffix");	
				let temp_matchedPeaks =  matchedPeaks.map(x => ({...x}));
				/**
				 * copy the matched peaks to a new list for each ion selected
				 */		
				matchedPeakList = matchedPeakList.concat(temp_matchedPeaks);														
			})
			let matchedPeaksObj = new MatchedPeaks();
			/**
			 * Get combined list of both matched and unmatched peaks to write to table
			 */
			matchedUnMatchedPeaks = matchedPeaksObj.getMatchedAndUnMatchedList(monoMassList,matchedPeakList);
			/**
			 * Get calculated distribution 
			 */
			let distributionList = matchedPeaksObj.getDistribution(modifiablePeakData,sequence,matchedUnMatchedPeaks);
			//let distributionList = matchedPeaksObj.getDistribution(peakDataList,sequence,matchedUnMatchedPeaks);
			/**
			 *  Draw SVG of Sequence
			 */
			let para = new parameters();
			para = buildSvg(para,sequence,Constants.SEQSVGID,massShiftList,monoMassList);
			getNumValues(para,sequence,Constants.SEQSVGID);
			annotations(para,matchedPeakList,Constants.SEQSVGID);
			$("#"+Constants.SEQSVGID).show();
			$("#"+Constants.SVGDOWNLOADID).show();
			/**
			 * Get total mass and wite to HTML
			 */
			let totalMass = calculatePrefixAndSuffixMassObj.getTotalSeqMass(sequence,massShiftList);
			UIHelperObj.setTotalSeqMass(totalMass);
			//Set Mass Difference, precursorMass is a global variable
			UIHelperObj.setMassDifference(precursorMass,totalMass);

			$("#"+Constants.SPECTRUMGRAPHID).show();
			/** 
			 * Call generateCorrespondingGraph which calls addSpectrum function in invokeSpectrum file to draw graph 
			 */
			document.getElementById("monoMasstitle").style.display = "block";
			generateCorrespondingGraph(peakDataList,distributionList,null);
			$("#"+Constants.SPECTRUMDOWNLOADID).show();
			/**
			 * Display All-peaks/matched/non-matched buttons on click of submit
			 */
			$("#peakCount").show();
			/**
			 * Create tabe to display the input mass list data and calculated data
			 */
			UIHelperObj.createMonoMassTable();
			/**
			 * Add data to the table
			 */
			UIHelperObj.addMassDataToTable(matchedUnMatchedPeaks);
			/**
			 * function to show the count of matched peaks, un matched peaks and All peaks
			 */
			$("#"+Constants.PEAKCOUNTID).show();
			/**
			 * Bootstrap syntax to keep the table box to 400px height and setting properties to the table
			 */
			this.setBootStarpTableProperties();
			UIHelperObj.showPeakCounts();
			/**
			 * Local function to set the actions on click of download button in HTML
			 */
			this.download();
		}
	}
	/**
	 * Sets the properties of bootstrap table 
	 */
	setBootStarpTableProperties()
	{
		$("#tableContainer").DataTable({
			"scrollY": Constants.TABLEHEIGHT,
			"scrollCollapse": true,
			"paging":         false,
			"bSortClasses": false,
			"searching": false,
			"bInfo" : false
		});
	}
	/**
	 * Sets the properties of bootstrap table 
	 */
	setBootStarpropertiesforFragmentIons()
	{
		$("#selectedIonTableContainer").DataTable({
			"scrollY": Constants.TABLEHEIGHT,
			"scrollCollapse": true,
			"paging":         false,
			"bSortClasses": false,
			"searching": false,
			"bInfo" : false
		});
	}
	/**
	 * Download function to download the SVG's
	 */
	download()
	{
		/**
		 * On click action to download sequence SVG in .svg format
		 */
		d3.select("#"+Constants.SEQDOWNLOADSVG).on("click",function(){
			x = d3.event.pageX;
			y = d3.event.pageY - 40;
			//function in prsmtohtml
			popupnamewindow("svg","seq",Constants.SEQSVGID,x,y)
		})
		/**
		 * On click action to download sequence svg in .svg format
		 */
		d3.select("#"+Constants.SEQDOWNLOADPNG).on("click",function(){
			x = d3.event.pageX;
			y = d3.event.pageY ;
			//function in prsmtohtml
			popupnamewindow("png","seq", Constants.SEQSVGID,x,y)
		})

		d3.select("#"+Constants.GRAPHDOWNLOADSVG).on("click",function(){
			x = d3.event.pageX;
			y = d3.event.pageY + 40;
			//function in prsmtohtml
			popupnamewindow("svg","graph", Constants.SPECTRUMGRAPHID,x,y)
		})

		d3.select("#"+Constants.GRAPHDOWNLOADPNG).on("click",function(){
			x = d3.event.pageX;
			y = d3.event.pageY + 80;
			//function in prsmtohtml
			popupnamewindow("png","graph", Constants.SPECTRUMGRAPHID,x,y)
		})
	}	
}
