/*	Spectrum start point */
addSpectrum = function(id,peakList,envelopeList,monoMZ){
	let specParameters = new SpectrumParameters();
	peakList.sort(function(x,y){
		return d3.ascending(x.mz, y.mz);
	})
	let listSize = peakList.length;
	let minMzData = peakList[0].mz;
	let maxMzData = peakList[listSize-1].mz;

	peakList.sort(function(x,y){
		return d3.ascending(x.intensity, y.intensity);
	})
	//console.log("peakList : ", peakList);
	let maxIntensity = peakList[listSize-1].intensity;
	//console.log("maxIntensity : ", maxIntensity);
	let minIntensity = peakList[0].intensity;
	//console.log("minIntensity : ", minIntensity);
	let currminMz = minMzData ;
	let currmaxMz = maxMzData ;
	let currentMaxIntensity = maxIntensity ;
	if(monoMZ != null)
	{
		currentMaxIntensity = 0 ;
		monoMZ = parseInt(monoMZ);
		currminMz = monoMZ - specParameters.onClickMassAdjacentRange ;
		currmaxMz = monoMZ + specParameters.onClickMassAdjacentRange ;
		for(let i = 0; i<listSize ; i++)
		{
			if(peakList[i].mz > currminMz && peakList[i].mz < currmaxMz)
			{
				if(peakList[i].intensity > currentMaxIntensity)
				{
					currentMaxIntensity = peakList[i].intensity;
				}
			}
		}
	}
	//currminMz and currmaxMz = range shown in the graph now
	
	specParameters.initScale(currminMz,currmaxMz,maxIntensity,minIntensity,minMzData,maxMzData,currentMaxIntensity);
	let peakData = {};
	peakList.sort(function(x,y){
		return d3.descending(x.intensity, y.intensity);
	})
	peakData.peak_list = peakList ;
	peakData.envelope_list = specParameters.setColorToEnvelops(envelopeList) ;

	//console.log(peakData);
	id = "#"+id;
	let spectrumgraphPara = new SpectrumGraph(id,specParameters,peakData);
	return spectrumgraphPara;
}

