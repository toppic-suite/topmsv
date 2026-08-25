//TopMSV viewer drawing variants: hover info appears as a floating
//tooltip next to the cursor, and envelope circles are thinned by
//display level when zoomed out.
/**
 * @function onMouseOut
 * @description Function to remove the tooltips on mouseout
 */
function onMouseOut(){
  d3.selectAll("#MyTextMZIN").remove();
  d3.selectAll("#MyTextMassCharge").remove();
  d3.selectAll("#MyTextFragmentMass").remove();
}

/**
 * @function onMouseOverPeak
 * @description Function to show the data of Mass and Intensity on mouse over of peaks
 * @param {Node} this_element -  is a html node. On mouse over generates tooltip based on the current peak
 * @param {Object} - Contains mz and intensity value of the current peak
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
 function onMouseOverPeak(this_element: any, event: any, peak: Peak, para: SpectrumViewParameters) {
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
  let tooltipData = pos + "<br>" + intensity ;
  /*	Rectangle to have flexible on click and on mouse actions	*/
  var div = d3.select("body").append("div")
    .attr("id", "MyTextMZIN")
    .attr("class", "tooltip")
  div.transition().duration(30)
    .style("opacity", 2);
  div.html(tooltipData).style("left", (event.pageX + 12)  + "px")
    .style("top", (event.pageY - 28)+ "px")
    .style("fill", "black");
}

/**
 * @function onMouseOverCircle
 * @description Function to show the data of Mass and Intensity on mouse over of circles
 * @param {Node} this_element - is a html node. On mouse over generates tooltip based on the current peak
 * @param {Array} envelope_list - Contains Envelope List
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function onMouseOverCircle(this_element: any, event: any, envelope: Envelope, peak: Peak) {
  let mz: string = "m/z:"+peak.getPos().toFixed(3);
  let inte: string = "inte:"+peak.getIntensity().toFixed(2);
  let mass: string = "mass:"+envelope.getMonoMass().toFixed(3);
  let charge: string = "charge:"+ envelope.getCharge() ;
  let tooltipData: string = mz + "<br>" + inte + "<br>" + mass + "<br>" + charge ;
  /*	Rectangle to have flexible on click and on mouse actions	*/
  var div = d3.select("body").append("div")
    .attr("id", "MyTextMassCharge")
    .attr("class", "tooltip")
  div.transition().duration(30)
    .style("opacity", 2);
  div.html(tooltipData).style("left", (event.pageX + 12)  + "px")
    .style("top", (event.pageY - 28)+ "px")
    .style("fill", "black");
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
        .on("mouseover",function(event: any){
          //@ts-ignore - allow using this to pass interacted html node
          onMouseOverPeak(this, event, peak, para);
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
      if (env.getDisplayLevel() / (spectrumData.getMzLevel().length - 3) >= ratio || ratio <= 0.2){
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
            .on("mouseover",function(event: any){
              //@ts-ignore
              onMouseOverCircle(this, event, env, peak);
            })
            .on("mouseout",function(){
              //@ts-ignore
              onCircleMouseOut(this);
            });
          }
        })
      }
    }
  })
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
        .on("mouseover",function(event: any){
          onMouseOverCircle(this, event, env, peak);
        })
        .on("mouseout",function(){
          onCircleMouseOut(this);
        });
      }
    }
  }
}*/
