/**
 * Function gets invoked when clicked on inspect button.
 * This function stores all the information of a spectrum that is being inspected using local storage.
 * @param {object} scansWithData - This is a json object with data of all the scan Ids
 * @param {Integer} scanId - Contians the Scan numbers
 */
function onclickTopView(scansWithData,scanId){
    let currentSpectrumData;
    [currentSpectrumData,specId] = getCurrentData(scansWithData,scanId);
    let peakAndIntensityList = getDataFromPRSMtoSpectralView(currentSpectrumData);
    let massAndIntensityList = getMassAndIntensityData(specId);
    let sequence = getSequence();
    let fixedPtmList = getFixedPTMMassList();
    let unknownMassShiftList = getUnknownMassList();
    let precursorMass = prsm_data.prsm.ms.ms_header.precursor_mono_mass;
    // Stores all the data in the variables respectively
    window.localStorage.setItem('peakAndIntensityList',  JSON.stringify(peakAndIntensityList));
    window.localStorage.setItem('massAndIntensityList',  JSON.stringify(massAndIntensityList));
    window.localStorage.setItem('sequence',  JSON.stringify(sequence));
    window.localStorage.setItem('fixedPtmList', JSON.stringify(fixedPtmList));
    window.localStorage.setItem('unknownMassShiftList', JSON.stringify(unknownMassShiftList));
    window.localStorage.setItem('precursorMass', JSON.stringify(precursorMass));
    window.open("../inspect/spectrum.html");
}
/**
 * Get the peaklist from respective spectrum.js to set the data for inspect page
 * @param {object} ms2_data - json object with complete data spectrum for corresponding scan Id
 */
function getDataFromPRSMtoSpectralView(ms2_data){
    let peakAndIntensity = [];
    ms2_data.peaks.forEach(function(eachrow){
        let tempObj = eachrow.mz + " " + eachrow.intensity;
        peakAndIntensity.push(tempObj);
    })
    return peakAndIntensity;
}
/**
 * Get the masslist from respective prsm.js to set the data for inspect page
 * @param {Integer} specId - Contians spec Id to get the data of corrsponding mass list
 */
function getMassAndIntensityData(specId){
  let massAndIntensityList = [];

  prsm_data.prsm.ms.peaks.peak.forEach(function(eachPeak,i){
    if (eachPeak.spec_id == specId) {
      let tempObj = eachPeak.monoisotopic_mass + " "+eachPeak.intensity+ " "+eachPeak.charge;
      massAndIntensityList.push(tempObj);
    }
  })
  return massAndIntensityList;
}
/**
 * Function to get the sequence of the protein from prsm.js
 */
function getSequence(){
    let sequence = [];
    let firstposition = prsm_data.prsm.annotated_protein.annotation.first_residue_position;
    let lastposition = prsm_data.prsm.annotated_protein.annotation.last_residue_position;
    prsm_data.prsm.annotated_protein.annotation.residue.forEach(function(eachrow,i){
        if(parseInt(eachrow.position) >= parseInt(firstposition)&&
            parseInt(eachrow.position) <= parseInt(lastposition))
        {
            sequence = sequence+eachrow.acid;
        }
    })
   return sequence;
}
/**
 * Gets all the masslist shifts of the Fixed ptms for prsm
 */
function getFixedPTMMassList()
{
    let fixedPTMList = [];
    let l_prsm = prsm_data;
    if(l_prsm.prsm.annotated_protein.annotation.hasOwnProperty('ptm'))
    {
        let ptm = l_prsm.prsm.annotated_protein.annotation.ptm ;
		if(Array.isArray(ptm))
		{
			ptm.forEach(function(ptm, index){
				if(ptm.ptm_type == "Fixed")
				{
                    let abbrevation = ptm.ptm.abbreviation ;
                    let tempObj = {name:abbrevation};
                    fixedPTMList.push(tempObj);
				}
			})
        }
        else
        {
            if(ptm.ptm_type == "Fixed")
            {
                let abbrevation = ptm.ptm.abbreviation ;
                let tempObj = {name:abbrevation};
                fixedPTMList.push(tempObj);
            }
        }
    }
    return fixedPTMList;
}
/**
 * Get all the unknwon mass lists form the prsm
 */
function getUnknownMassList()
{
    let unknownMassShiftList = [];
    let l_prsm = prsm_data;
    if(l_prsm.prsm.annotated_protein.annotation.hasOwnProperty('mass_shift'))
	{
        let mass_shift = l_prsm.prsm.annotated_protein.annotation.mass_shift ;
			if(Array.isArray(mass_shift))
			{
				let len = mass_shift.length;
				mass_shift.forEach(function(each_mass_shift, i){
                    // Removing -1 as the sequece in inspect elements takes from 0
                    let position = parseInt(each_mass_shift.left_position) - 1 ;
                    let mass = parseFloat(each_mass_shift.anno);
					unknownMassShiftList.push({"position":position,"mass":mass})
				})
			}
			else if(mass_shift.shift_type == "unexpected")
			{
                 // Removing -1 as the sequece in inspect elements takes from 0
                let position = parseInt(mass_shift.left_position) - 1;
                let mass = parseFloat(mass_shift.anno);
                unknownMassShiftList.push({"position":position,"mass":mass})
			}
    }
    return unknownMassShiftList;
}
/**
 * Create HTML dropdown buttons based on the scan list
 * @param {Array} scanIdList - Contains Scan id numbers
 * @param {Array} specIdList - Contains Spec Id numbers
 */
function setDropDownItemsForInspectButton(scanIdList,specIdList){
    let dropdown_menu = $(".dropdownscanlist .dropdown-menu");
    let len = scanIdList.length;
    for(let i=0; i<len;i++)
    {
        let value = scanIdList[i];
        let specId = specIdList[i];
        let id = "scan_"+ value ;
        let a = document.createElement("a");
        a.setAttribute("class","dropdown-item");
        a.setAttribute("href","#!");
        a.setAttribute("id",id);
        a.setAttribute("value",value);
        a.setAttribute("specid", specId);
        a.innerHTML = "Scan "+value;
        dropdown_menu.append(a);
    }
    
}
/**
 * Onclick function, invoked on click of the inspect scn button
 */
function onClickToInspect(){
    $(".dropdownscanlist .dropdown-item ").click(function(){
        let scanId = $(this).attr('value')
        onclickTopView(ms2_ScansWithData,scanId);
    });  
}
