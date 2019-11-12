/*	Spectrum start point */
addSpectrum1 = function(peakList,envelopeList){
	console.log("hello graph");//("hello, graph");
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
	let maxIntensity = peakList[listSize-1].intensity;
	let minIntensity = peakList[0].intensity;
	let currminMz = minMzData ;
	let currmaxMz = maxMzData ;
	let currentMaxIntensity = maxIntensity ;
	specParameters.initScale(currminMz,currmaxMz,maxIntensity,minIntensity,minMzData,maxMzData,currentMaxIntensity);
	let peakData = {};
	peakData.peak_list = peakList ;
	peakData.envelope_list = envelopeList ;
	let spectrumgraph = new SpectrumGraph("#spectrum1",specParameters,peakData);
	 return spectrumgraph;
};
addSpectrum2 = function(peakList,envelopeList){
	console.log("hello graph");//("hello, graph");
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
	let maxIntensity = peakList[listSize-1].intensity;
	let minIntensity = peakList[0].intensity;
	let currminMz = minMzData ;
	let currmaxMz = maxMzData ;
	let currentMaxIntensity = maxIntensity ;
	specParameters.initScale(currminMz,currmaxMz,maxIntensity,minIntensity,minMzData,maxMzData,currentMaxIntensity);
	let peakData = {};
	peakData.peak_list = peakList ;
	peakData.envelope_list = envelopeList ;
	let spectrumgraph = new SpectrumGraph("#spectrum2",specParameters,peakData);
	return spectrumgraph;
};
addSpectrum3 = function(peakList,envelopeList){
	console.log("hello graph");//("hello, graph");
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
	let maxIntensity = peakList[listSize-1].intensity;
	let minIntensity = peakList[0].intensity;
	let currminMz = minMzData ;
	let currmaxMz = maxMzData ;
	let currentMaxIntensity = maxIntensity ;
	specParameters.initScale(currminMz,currmaxMz,maxIntensity,minIntensity,minMzData,maxMzData,currentMaxIntensity);
	let peakData = {};
	peakData.peak_list = peakList ;
	peakData.envelope_list = envelopeList ;
	let spectrumgraph = new SpectrumGraph("#spectrum3",specParameters,peakData);
	return spectrumgraph;
};
