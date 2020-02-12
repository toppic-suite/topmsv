//map the ion name from the prsm.js files to the ion checkbox id  in the spectrum.html

function setIonCheckbox(ionType){
	const ionNames = {
		"B":"b",
		"A":"a",
		"Y":"y",
		"C": "c",
		"Z_DOT":"z_",
		"X":"x"		
	}
	
	let ionsAll = document.getElementsByClassName("custom-control-input");
	let ionTypeSplit = ionType.split(',');

	ionTypeSplit.forEach(function(ionTy){
		for (let i = 0; i<ionsAll.length;i++){
			if (ionNames[ionTy] == ionsAll[i].id){
				 ionsAll[i].checked = true;
			}
		}
	})
}