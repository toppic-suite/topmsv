/**
 * @function SpectrumGraph
 * @description Function draws the graph, binds zoom and drag function to the graph
 * @param {String} svgId - SVG id on which the graph needed to be drawn
 * @param {object} spectrumParameters - Contains the parameters like height, width etc.,. tht helps to draw the graph
 * @param {Array} peakData - contains peakList and envelope list 
 * @param {Array} ionData - Contains data with mass and ACID name to plot on the graph
 */
class SpectrumGraph {
  // parameters for zoom
  transformX = 0;
  transformScale = 1.0;
  
  constructor(svgId, peakList, envList, ionList, proteoform){
    this.id = svgId;
    this.para = new SpectrumParameters();
    this.peakList = peakList;
    this.para.initParameters(peakList);
    this.peakList.sort(function(x,y){
      return y.intensity - x.intensity; 
    });
    this.envList = envList;
    this.para.addColorToEnvelopes(envList);
    this.envPeakList = this.getEnvPeakList(this.envList);
    this.ionList = ionList; 
    this.proteoform = proteoform;
    $("#" + svgId).data("graph", this);
    // add zoom function
    this.svg = d3.select("body").select("#"+svgId);
    this.svg.attr("viewBox", "0 0 "+ this.para.svgWidth+" "+ this.para.svgHeight)
      .attr("width", "100%")
      .attr("height", "100%")
      .call(this.zoom);
  }

  redraw = function(){
    //console.log(this.envList);
    drawSpectrum(this.id, this.para, this.peakList, this.envPeakList, this.proteoform, this.ionList);
  }

  zoomed = function () {
    let transform = d3.event.transform;
    let graph = $("#"+ this.id).data("graph");
    let distance = transform.x - graph.transformX;
    let ratio = transform.k / graph.transformScale;
    graph.transformX = transform.x;
    graph.transformScale = transform.k;
    let mousePos = d3.mouse(this);
    if(ratio == 1) {
      graph.para.drag(distance);
    }
    else{
      graph.para.zoom(mousePos[0], mousePos[1], ratio);
    }
    graph.redraw(); 
  }

  zoom = d3.zoom()
    .on("zoom", this.zoomed);

  getEnvPeakList = function(envList) {
    if (!envList || envList.length === 0 || typeof envList[0].env_peaks === "undefined") {return [];}
    let envPeakList = [];
    for (let i = 0; i < envList.length; i++) {
      let env = envList[i];
      for (let j = 0; j < env.env_peaks.length; j++) {
        let peak = env.env_peaks[j];
        peak.env = env;
        envPeakList.push(peak);
      }
    }
    envPeakList.sort(function(x,y){
      return y.intensity - x.intensity;
    });
    return envPeakList;
  }
}
