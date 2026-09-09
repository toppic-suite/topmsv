//spectra-browser drawing variants: hover info goes to the panel-header
//annotation element, and raw spectra show base-intensity lines.
function drawBaseInte(svgId: string, para: SpectrumViewParameters, baseInte: number) {
  let svg = d3.select("body").select("#"+svgId).select("#svgGroup");
  let y = para.getPeakYPos(baseInte);
  if (y > para.getPadding().head) {
    let baseInteLine = svg.append("g").attr("id", "baseInte").append("line")
      .attr("x1", para.getPadding().left)
      .attr("y1", y)
      .attr("x2", para.getSVGWidth() + para.getPadding().left)
      .attr("y2", y)
      .attr("stroke", "red")
      .attr("stroke-width", "2")
      // a reference line drawn above the circles: let clicks and hovers
      // reach the circles/peaks underneath it
      .style("pointer-events", "none")
  }
}

/**
 * @function onMouseOut
 * @description Function to remove the tooltips on mouseout
 */
function onMouseOut(){
  d3.selectAll("#MyTextMZIN").remove();
  d3.selectAll("#MyTextMassCharge").remove();
  d3.selectAll("#MyTextFragmentMass").remove();
  // clear the hover annotation in every spectrum panel
  ["curMsOneAnnoText", "curMsTwoAnnoText"].forEach(function (annoId) {
    let selText = document.getElementById(annoId);
    if (selText) {
      selText.textContent = "";
    }
  });
}

/**
 * @function onMouseOverPeak
 * @description Function to show the data of Mass and Intensity on mouse over of peaks
 * @param {Node} this_element -  is a html node. On mouse over generates tooltip based on the current peak
 * @param {Object} - Contains mz and intensity value of the current peak
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
 function onMouseOverPeak(this_element: any,peak: Peak, para: SpectrumViewParameters) {
  let intensity: string = " inte:"+ peak.getIntensity().toFixed(3);
  let pos: string = peak.getPos().toFixed(3);
  if (para.getIsMonoMassGraph()) {
    pos = "mass:" + pos;
  }
  else {
    pos = "m/z:"+ pos;
  }

  d3.select(this_element).style("stroke","red")
    .style("stroke-width","2");
  let tooltipData = pos + "  " + intensity ;
  /*	Rectangle to have flexible on click and on mouse actions	*/
  var selText = document.getElementById(para.getAnnoElementId());
  if (selText) {
    selText.textContent = tooltipData;
  }
  /*
  var div = d3.select("body").append("div")
    .attr("id", "MyTextMZIN")
    .attr("class", "tooltip")
  div.transition().duration(30)
    .style("opacity", 2);
  div.html(tooltipData).style("left", (event.pageX + 12)  + "px")
    .style("top", (event.pageY - 28)+ "px")
    .style("fill", "black");
    */
}

/**
 * @function onMouseOverCircle
 * @description Function to show the data of Mass and Intensity on mouse over of circles
 * @param {Node} this_element - is a html node. On mouse over generates tooltip based on the current peak
 * @param {Array} envelope_list - Contains Envelope List
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function onMouseOverCircle(this_element: any, envelope: Envelope, peak: Peak, para: SpectrumViewParameters) {
  let mz: string = "m/z:"+peak.getPos().toFixed(3);
  let inte: string = "inte:"+peak.getIntensity().toFixed(2);
  let mass: string = "mass:"+envelope.getMonoMass().toFixed(3);
  let charge: string = "charge:"+ envelope.getCharge() ;
  let tooltipData: string = mz + "  " + inte + "  " + mass + "  " + charge ;
  /* Show the info in the panel header annotation slot, same as peak hover. */
  var selText = document.getElementById(para.getAnnoElementId());
  if (selText) {
    selText.textContent = tooltipData;
  }
}

/**
 * @function drawPeaks
 * @description Function to draw peak lines on the graph
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 * @param {Array} peakdata - Contians both peak list and envelopelist
 */
function drawPeaks(svg: any, para: SpectrumViewParameters, peakList: Peak[]){
  let peaks = svg.append("g")
    .attr("id", "peaks");
  var len: number = peakList.length;
  // limits provide current count of number of peaks drawn on graph per bin(range) 
  // so that we can limit tha peak count to peaksPerRange count
  let ratio: number = (para.getWinMaxMz() - para.getWinMinMz()) / (para.getDataMaxMz() - para.getDataMinMz());
  ratio = Math.min(1, ratio);
  let spectrumData = new SpectrumFunction();

  for(let i =0;i<len;i++)
  {
    let peak: Peak = peakList[i];

    if(peak.getPos() >= para.getWinMinMz() && peak.getPos()  < para.getWinMaxMz())
    {
      if (peak.getDisplayLevel() / (spectrumData.getMzLevel().length - 3)>= ratio || ratio <= 0.2){
        peaks.append("line")
        .attr("x1",function(){
          return para.getPeakXPos(peak.getPos() );
        })
        .attr("y1",function(){
          let y = para.getPeakYPos(peak.getIntensity());
          if(y<=para.getPadding().head) return para.getPadding().head ;
          else return y ;
        })
        .attr("x2",function(){
          return para.getPeakXPos(peak.getPos());
        })
        .attr("y2",para.getSVGHeight() - para.getPadding().bottom )
        .attr("stroke","black")
        .attr("stroke-width","2")
        .on("mouseover",function(){
          //@ts-ignore - allow using this to pass interacted html node
          onMouseOverPeak(this,peak,para);
        })
        .on("mouseout",function(){
          //@ts-ignore
          onPeakMouseOut(this);
        });
      }
    }
  }
}

/**
 * @function drawEnvelopes
 * @description Function to add circles for the envelope data
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 * @param {Array} peakdata - Contians both peak list and envelopelist
 */
function drawEnvelopes(svg: any, para: SpectrumViewParameters,envList: Envelope[]) {
  let circles = svg.append("g").attr("id", "circles");
  let minPercentage: number = 0.0;
  let maxIntensity: number = para.getDataMaxInte();
  let spectrumData = new SpectrumFunction();
  // limits provide current count of number of peaks drawn on graph per bin(range)
  // so that we can limit tha peak count to circlesPerRange count
  let ratio = (para.getWinMaxMz() - para.getWinMinMz()) / (para.getDataMaxMz() - para.getDataMinMz());
  ratio = Math.min(1, ratio);

  envList.forEach(env => {
    let peaks = env.getPeaks(); 
    let color = env.getDisplayColor();
    
    if(peaks[0].getPos() >= para.getWinMinMz() && peaks[0].getPos() < para.getWinMaxMz()) 
    { 
      //if (env.getDisplayLevel() / (spectrumData.getMzLevel().length - 3) >= ratio || ratio <= 0.2){
        //display envelopes based on level, but when the ratio falls below threshold, show all envs in the range
        peaks.forEach(peak => {
          let percentInte = peak.getIntensity()/maxIntensity * 100 ;
          if (percentInte >= minPercentage){//Show only envelopes with minimum of 0.5%
            circles.append("circle")
            .attr("id","circles")
            .attr("cx",function(){
              return para.getPeakXPos(peak.getPos());
            })
            .attr("cy",function(){
              let cy = para.getPeakYPos(peak.getIntensity());
              if(cy < para.getPadding().head) return para.getPadding().head;
              else return cy ;
            })
            .attr("r",function(){
              return para.getCircleSize();
            })
            .style("fill","white")
            .style("opacity", "0.8")
            .style("stroke",color)
            .style("stroke-width","2")
            .style("cursor","pointer")
            .on("mouseover",function(){
              //@ts-ignore
              onMouseOverCircle(this,env,peak,para);
            })
            .on("mouseout",function(){
              //@ts-ignore
              onCircleMouseOut(this);
            })
            .on("click",function(event: MouseEvent){
              //@ts-ignore
              onCircleClick(this,env,peak,event);
            });
          }
        })
      //}
    }
  })
}

/**
 * @function onCircleClick
 * @description Announce a click on an envelope circle as an "envelopeclick"
 * CustomEvent on the enclosing <svg>, with the envelope and peak in `detail`.
 * The page owning the graph listens for it (e.g. the raw-spectra browser
 * highlights the envelope's row in its mass list); the drawing code itself
 * stays independent of any page layout.
 * @param {Node} this_element - the clicked circle
 * @param {Envelope} envelope - the envelope the circle belongs to
 * @param {Peak} peak - the theoretical peak the circle marks
 * @param {MouseEvent} event - the click event (stopped so the zoom/drag
 * behavior on the svg does not also react)
 */
function onCircleClick(this_element: SVGCircleElement, envelope: Envelope, peak: Peak, event: MouseEvent) {
  event.stopPropagation();
  let svg: SVGSVGElement | null = this_element.ownerSVGElement;
  if (svg) {
    svg.dispatchEvent(new CustomEvent("envelopeclick", {
      bubbles: true,
      detail: { envelope: envelope, peak: peak }
    }));
  }
}
/*function drawEnvelopes(svg,para,envPeakList) {
  let circles = svg.append("g").attr("id", "circles");
  let minPercentage = 0.0;
  let maxIntensity = para.dataMaxInte ;
  let spectrumData = new SpectrumFunction();

  // limits provide current count of number of peaks drawn on graph per bin(range)
  // so that we can limit tha peak count to circlesPerRange count
  let ratio = (para.winMaxMz - para.winMinMz) / (para.dataMaxMz - para.dataMinMz);
  ratio = Math.min(1, ratio);

  for (let i = 0; i < envPeakList.length; i++) {
    let peak = envPeakList[i]; 
    let env = peak.env; 
    console.log(peak);
    let color = env.getDisplayColor();
    //Show only envelopes with minimum of 0.5%
    let percentInte = peak.intensity/maxIntensity * 100 ;
    if(peak.mz >= para.winMinMz && peak.mz < para.winMaxMz && percentInte >= minPercentage) 
    { 
      if (env.level / (spectrumData.mzLevel.length - 3) >= ratio || ratio <= 0.2){
        //display envelopes based on level, but when the ratio falls below threshold, show all envs in the range
        circles.append("circle")
        .attr("id","circles")
        .attr("cx",function(){
          return para.getPeakXPos(peak.mz);
        })
        .attr("cy",function(){
          let cy = para.getPeakYPos(peak.intensity);
          if(cy < para.padding.head) return para.padding.head;
          else return cy ;
        })
        .attr("r",function(){
          return para.getCircleSize();
        })
        .style("fill","white")
        .style("opacity", "0.8")
        .style("stroke",color)
        .style("stroke-width","2")
        .on("mouseover",function(){
          onMouseOverCircle(this,env,peak);
        })
        .on("mouseout",function(){
          onCircleMouseOut(this);
        });
      }
    }
  }
}*/
