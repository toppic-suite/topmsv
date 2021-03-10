/**
 * Function gets invokes whenever zoom or drag is invoked and redraws the graph whenever there is zoom or draw
 * This function invokes all the functions that draw the graph
 * @param {string} svgId - Contains the Id from html on which the graph should be drawn
 * @param {object} para - Contains the parameters to help draw the graph
 * @param {list} peaks - Contains the data of Peaks to draw lines on the graph
 * @param {list} envPeaks - Contains the data of Envelope peaks to draw circles on the graph
 * @param {list} ions - Contains Ions to draw upon the peaks
 */
function drawBasicSpectrum(svgId, para, peaks, ions) {
  let svg = d3.select("body").select("#"+svgId);
  // svg.attr("width", para.svgWidth).attr("height", para.svgHeight);
  // Removes all the elements under SVG group 'svgGroup' everytime there this function is called
  svg.selectAll("#svgGroup").remove();
  // Create a group under which all the fucntions of the graph will be appended
  svg = svg.append("g").attr("id","svgGroup");

  //call onMouseOut everytime to fix onHover bug adding multiple data when mouseover and zoomed up
  onMouseOut();
  drawTicks(svg, para);
  drawAxis(svg,para);
  addDatatoAxis(svg,para);
  addLabels(svg,para);
  if (para.showHighlight) {
    addHighlight(svg, para);
  }
  drawPeaks(svg, para, peaks);
  if (para.showIons && ions) {//only run when ion information is not undefined
    drawIons(svg, para, ions);
  }
}

function drawRawSpectrum(svgId, para, envPeaks) {
  let svg = d3.select("body").select("#"+svgId).select("#svgGroup");
  if (para.showEnvelopes && envPeaks != null) {
    drawEnvelopes(svg, para, envPeaks);
  }
}

function drawMonoMassSpectrum(svgId, para, proteoform, nMasses, cMasses, ions) {
  let svg = d3.select("body").select("#"+svgId).select("#svgGroup");
  updateViewBox(svgId, para.svgWidth, para.svgHeight);
  drawSequence(svg, para, proteoform, nMasses, cMasses, ions);
  addErrorPlot(svg, para);
  addErrorBox(svg, para);
  drawErrorYTicks(svg, para);
  drawErrorPoints(svg, para, ions);
}

/**
 * @function onPeakMouseOut
 * @description Function to reset to the original on mouse out of peaks
 * @param {Node} this_element - is a html node. 
 * On mouse over generates tooltip based on the current peak
 */
onPeakMouseOut = function(this_element) {
  this.onMouseOut();
  d3.select(this_element).style("stroke","black");
}
/**
 * @function onCircleMouseOut
 * @description Function to reset to the original on mouse out of peaks
 */
onCircleMouseOut = function(){
  this.onMouseOut();
}

onFragmentMassAndIonTypeMouseOut = function(this_element) {
  this.onMouseOut();
  d3.select(this_element).style("stroke","black")
    .style("stroke-width","1");
}

/**
 * @function onMouseOut
 * @description Function to remove the tooltips on mouseout
 */
onMouseOut = function(){
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
onMouseOverPeak = function(this_element,peak,para) {
  let intensity =" inte:"+ parseFloat(peak.getIntensity()).toFixed(3);
  let pos = parseFloat(peak.getMz()).toFixed(3);
  if (para.isMonoMassGraph) {
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
  div.html(tooltipData).style("left", (d3.event.pageX + 12)  + "px")
    .style("top", (d3.event.pageY - 28)+ "px")
    .style("fill", "black");
}

/**
 * @function onMouseOverCircle
 * @description Function to show the data of Mass and Intensity on mouse over of circles
 * @param {Node} this_element - is a html node. On mouse over generates tooltip based on the current peak
 * @param {Array} envelope_list - Contains Envelope List
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
onMouseOverCircle = function(this_element,envelope, peak) {
  let mz = "m/z:"+peak.getMz().toFixed(3);
  let inte = "inte:"+peak.getIntensity().toFixed(2);
  let mass = "mass:"+envelope.getMonoMass().toFixed(3);
  let charge = "charge:"+ envelope.getCharge() ;
  let tooltipData = mz + "<br>" + inte + "<br>" + mass + "<br>" + charge ;
  /*	Rectangle to have flexible on click and on mouse actions	*/
  var div = d3.select("body").append("div")
    .attr("id", "MyTextMassCharge")
    .attr("class", "tooltip")
  div.transition().duration(30)
    .style("opacity", 2);
  div.html(tooltipData).style("left", (d3.event.pageX + 12)  + "px")
    .style("top", (d3.event.pageY - 28)+ "px")
    .style("fill", "black");
}

/**
 * @function onMouseOverFragmentMassAndIonType
 * @description Function to show the theoretical mass and matched ion type on mouse over of peaks
 */
onMouseOverFragmentMassAndIonType = function(this_element, mass, ionData) {
  let pos = parseFloat(mass).toFixed(3);
  let tooltipData = "mass: " + pos + ", " + "ion type: " + ionData;
  if (ionData == null){
    tooltipData = "mass: " + pos;
  }

  d3.select(this_element).style("stroke","red")
    .style("stroke-width","2");

  /*	Rectangle to have flexible on click and on mouse actions	*/
  var div = d3.select("body").append("div")
    .attr("id", "MyTextFragmentMass")
    .attr("class", "tooltip")
  div.transition().duration(30)
    .style("opacity", 2);
  div.html(tooltipData).style("left", (d3.event.pageX + 12)  + "px")
    .style("top", (d3.event.pageY - 28)+ "px")
    .style("fill", "black");
}


/**
 * @function drawTicks
 * @description Function that draws ticks on x-axis and y-axis
 * @param{HTMLBaseElement} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function drawTicks(svg,para){
  // Creating a group under svg node with id 'ticks' under which ticks are drawn 
  let addXTicks = svg.append("g").attr("id","x_ticks").attr("class", "ticks");
  let xTickPosList = para.getXTickPosList();
  for(let i=0; i < xTickPosList.length ; i++) {
    let tickMz = xTickPosList[i];
    // get the x position of the tick 
    let x = para.getPeakXPos(tickMz);
    // Below condition helps the ticks to be to the right of the y - axis 
    if(x >= para.padding.left && 
      x <= (para.svgWidth - para.padding.right))
    {
      addXTicks.append("line")
        .attr("x1",x)
        .attr("y1",para.svgHeight -para.padding.bottom)
        .attr("x2",x)
        .attr("y2",para.svgHeight -para.padding.bottom + para.tickLength)
        .attr("stroke","black")
        .attr("stroke-width","1")
    }
  }
  addYTicks = svg.append("g").attr("id","y_ticks").attr("class","ticks");
  let tickHeight = para.getTickHeight();
  for(let i=0; i <= para.yTickNum ; i++)
  {
    // Get the default tick height and calculate the actual tick height position
    tickPos = i*tickHeight; 
    //* para.dataMaxInte /100;
    let y = parseFloat(para.getPeakYPos(tickHeight)) ;
    if(!isNaN(y) && y >= para.padding.head)//y >= para.padding.head helps the ticks to be in the length of Y axis
    {
      addYTicks.append("line")
        .attr("x1",para.padding.left)
        .attr("y1",y)
        .attr("x2",para.padding.left - para.tickLength)
        .attr("y2",y)
        .attr("stroke","black")
        .attr("stroke-width","1")
    }
  }
}

/**
 * @function drawAxis
 * @description Function to draw x-axis and y-axis
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function drawAxis(svg,para){
  //Draw x-axis
  xAxis = svg.append("g").attr("id", "xaxis").append("line")
    .attr("x1",para.padding.left)
    .attr("y1",para.svgHeight -para.padding.bottom)
    .attr("x2",para.specWidth+para.padding.left)
    .attr("y2",para.svgHeight -para.padding.bottom)
    .attr("stroke","black")
    .attr("stroke-width","2")
  // Draw y-axis
  yAxis = svg.append("g").attr("id", "yaxis").append("line")
    .attr("x1",para.padding.left)
    .attr("y1",para.padding.head)
    .attr("x2",para.padding.left)
    .attr("y2",para.svgHeight -para.padding.bottom)
    .attr("stroke","black")
    .attr("stroke-width","2")
}

/**
 * @function addDatatoAxis
 * @description Function to add tick numbers on x and y axis
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function addDatatoAxis(svg,para){
  let maxMz = para.winMaxMz;
  let minMz = para.winMinMz ;
  // Creating a group wih id 'axisPoints' under which the code to add tick numbers is added  
  xAxisData = svg.append("g")
    .attr("id", "xAxisPoints");
  let xTickPosList = para.getXTickPosList();
  for(let i = 0 ; i < xTickPosList.length ; i++)
  {
    tickMz = xTickPosList[i];
    x = para.getPeakXPos(tickMz);
    if(x >= para.padding.left && 
      x <= (para.svgWidth - para.padding.right))
    {
      xAxisData.append("text").attr("id","xtext").attr("x",x)
        .attr("y",(para.svgHeight - para.padding.bottom + 20))// Dividing with 1.6 to set the position of the numbers under the ticks appropriately
        .attr("text-anchor","middle")
        .text(function(){
          // conditions to show more decimal values as we zoom in further and limit decimals when zoomed back
          if(maxMz - minMz <=0.0001) return parseFloat(tickMz).toFixed(6);
          else if(maxMz - minMz <=0.001) return parseFloat(tickMz).toFixed(5);
          else if(maxMz - minMz <=0.01) return parseFloat(tickMz).toFixed(4);
          else if(maxMz - minMz <=0.1) return parseFloat(tickMz).toFixed(3);
          else if(maxMz - minMz <=1) return parseFloat(tickMz).toFixed(2);
          else if(maxMz - minMz <= 3) return parseFloat(tickMz).toFixed(2)
          else if(maxMz - minMz <= 5) return parseFloat(tickMz).toFixed(1)
          return parseInt(tickMz)
        })
        .style("font-size","14px")
    }
  }
  // Creating a group wih id 'axisPoints' under which the code to add tick numbers is added  
  this.yAxisData = svg.append("g")
    .attr("id", "yAxisPoints");
  for(let i = 0 ; i <= para.yTickNum; i++)
  {
    let tickHeight = 0;
    // Get the default tick height and calculate the actual tick height position
    tickHeight = para.getTickHeight();
    let data = i*tickHeight ;
    if(data <= 1 && data != 0) data = data.toFixed(1);
    tickInt = i*tickHeight * para.dataMaxInte /100;
    y = parseFloat(para.getPeakYPos(tickInt)) ;

    if(!isNaN(y) && y >= para.padding.head)
    {
      this.yAxisData.append("text").attr("class","ytext").attr("x",para.padding.left - para.tickLength)
        .attr("y",y)
        .attr("text-anchor","end")
        .attr("alignment-baseline","middle")
        .text(data + "%")
        .style("font-size","14px")
    }
  }
}

/**
 * @function addLabels
 * @description Function to add labels on x and y axis
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function addLabels(svg, para){
  let text = "M/Z";
  if (para.isMonoMassGraph) {
    text = "Mass";
  }
  svg.append("text").attr("id","label")
  // -5 is added simply as buffer to place m/z on top of error rect plot
    .attr("transform","translate(" + (para.svgWidth-40) + "," 
      + (para.svgHeight - para.padding.bottom + 20) + ")")
    .attr("fill","black")
    .attr("font-family","Helvetica Neue,Helvetica,Arial,sans-serif")
    .attr("font-size","16px")
    .text(text);
  svg.append("text").attr("id","label")
    .attr("transform", "translate("+ para.padding.left/3 +","+(para.svgHeight/2)+")rotate(-90)")
    .attr("fill","black")
    .attr("font-family","Helvetica Neue,Helvetica,Arial,sans-serif")
    .attr("font-size","16px")
    .text("Intensity");
}

/**
 * @function addHighlight
 * @description Function to add backGround color to the spectrum graph for MS1 spectrum at precursor mz
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function addHighlight(svg,para){
  let svg_temp = svg.append("g")
    .attr("id", "svg_bgColor");
  if(!((para.hlMinMz < para.winMinMz 
    && para.hlMaxMz < para.winMinMz) 
    || (para.hlMinMz > para.winMaxMz 
      && para.hlMaxMz > para.winMaxMz)))
  {
    let x = para.getPeakXPos(para.hlMinMz);
    let x2 = para.getPeakXPos(para.hlMaxMz);
    if(para.hlMinMz < para.winMinMz)
    {
      x = para.getPeakXPos(para.winMinMz);
    }
    if(para.hlMaxMz > para.winMaxMz)
    {
      x2 = para.getPeakXPos(para.winMaxMz);
    }
    //console.log(para.winMaxMz, x, x2);
    svg_temp.append("rect")
      .attr("x", x)
      .attr("y", para.padding.head)
      .attr("width", x2-x)
      .attr("height", function(){
        let y1 = para.svgHeight - para.padding.bottom;
        let y2 = para.padding.head;
        return y1-y2;
      })
      .style("fill", para.hlColor)
      .style("fill-opacity", ".4")
      .style("stroke-width", "1.5px");
  }
}

/**
 * @function drawPeaks
 * @description Function to draw peak lines on the graph
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 * @param {Array} peakdata - Contians both peak list and envelopelist
 */
function drawPeaks(svg,para,peakList){
  let peaks = svg.append("g")
    .attr("id", "peaks");
  var len = peakList.length;
  // limits provide current count of number of peaks drawn on graph per bin(range) 
  // so that we can limit tha peak count to peaksPerRange count
  let ratio = (para.winMaxMz - para.winMinMz) / (para.dataMaxMz - para.dataMinMz);
  ratio = Math.min(1, ratio);
  let spectrumData = new SpectrumData();

  for(let i =0;i<len;i++)
  {
    let peak = peakList[i];
    if(peak.getMz() >= para.winMinMz && peak.getMz() < para.winMaxMz)
    {
      if (peak.getLevel() / (spectrumData.mzLevel.length - 3)>= ratio || ratio <= 0.2){
        peaks.append("line")
        .attr("x1",function(){
          return para.getPeakXPos(peak.getMz());
        })
        .attr("y1",function(){
          let y = para.getPeakYPos(peak.getIntensity());
          if(y<=para.padding.head) return para.padding.head ;
          else return y ;
        })
        .attr("x2",function(){
          return para.getPeakXPos(peak.getMz());
        })
        .attr("y2",para.svgHeight - para.padding.bottom )
        .attr("stroke","black")
        .attr("stroke-width","2")
        .on("mouseover",function(){
          onMouseOverPeak(this,peak,para);
        })
        .on("mouseout",function(){
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
function drawEnvelopes(svg,para,envList) {
  let circles = svg.append("g").attr("id", "circles");
  let minPercentage = 0.0;
  let maxIntensity = para.dataMaxInte ;
  let spectrumData = new SpectrumData();
  // limits provide current count of number of peaks drawn on graph per bin(range)
  // so that we can limit tha peak count to circlesPerRange count
  let ratio = (para.winMaxMz - para.winMinMz) / (para.dataMaxMz - para.dataMinMz);
  ratio = Math.min(1, ratio);

  envList.forEach(env => {
    let peaks = env.getTheoPeaks(); 
    let color = env.getColor();
    
    if(peaks[0].getMz() >= para.winMinMz && peaks[0].getMz() < para.winMaxMz) 
    { 
      if (env.getLevel() / (spectrumData.mzLevel.length - 3) >= ratio || ratio <= 0.2){
        //display envelopes based on level, but when the ratio falls below threshold, show all envs in the range
        peaks.forEach(peak => {
          let percentInte = peak.getIntensity()/maxIntensity * 100 ;
          if (percentInte >= minPercentage){//Show only envelopes with minimum of 0.5%
            circles.append("circle")
            .attr("id","circles")
            .attr("cx",function(){
              return para.getPeakXPos(peak.getMz());
            })
            .attr("cy",function(){
              let cy = para.getPeakYPos(peak.getIntensity());
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
        })
      }
    }
  })
}
/*function drawEnvelopes(svg,para,envPeakList) {
  let circles = svg.append("g").attr("id", "circles");
  let minPercentage = 0.0;
  let maxIntensity = para.dataMaxInte ;
  let spectrumData = new SpectrumData();

  // limits provide current count of number of peaks drawn on graph per bin(range)
  // so that we can limit tha peak count to circlesPerRange count
  let ratio = (para.winMaxMz - para.winMinMz) / (para.dataMaxMz - para.dataMinMz);
  ratio = Math.min(1, ratio);

  for (let i = 0; i < envPeakList.length; i++) {
    let peak = envPeakList[i]; 
    let env = peak.env; 
    console.log(peak);
    let color = env.getColor();
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

/**
 * @function drawIons
 * @description Function to add IONS at the top of the peaks for each cluster of envelopes
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 * @param {Array} ionData - Contians Ion list to display on the graph
 */
function drawIons(svg,para,ions){
  let ionGroup = svg.append("g").attr("id", "graph_ions");
  
  ions.sort(function(x,y){
    return d3.ascending(x.mz, y.mz);
  })
  //console.log(ions);

  for (let i = 0; i < ions.length; i++) {
    let ion = ions[i];
    let x = ion.mz;
    let xPos = para.getPeakXPos(x) + para.ionXShift;
    let yPos = para.getPeakYPos(ion.intensity) + para.ionYShift;
    //console.log("yPos", yPos);
   // console.log("para.getPeakYPos(ion.intensity)",para.getPeakYPos(ion.intensity))
    
    if(x >= para.winMinMz && x <= para.winMaxMz) {
      if (para.isMonoMassGraph){
        //if mass graph, to avoid overlapping with annotation with the sequence
        if (yPos < 50){
          continue;
        }
      }
      let color = "black";
      if (typeof ion.env !== "undefined") {
        color = ion.env.getColor();
      }
      if (i > 0){
        //check if this ion is annotating the same peak as the previous ion
        //if so, its yPos should be adjusted
        if (ion.mz == ions[i-1].mz){
          yPos = yPos + 15;
        }
      }
      ionGroup.append("text")
        .attr("id","graph_matched_ions")
        .attr("x", xPos)
        .attr("y", yPos) 
        .style("fill", color)
        .style("opacity", "0.8")
        .style("stroke-width","2")
        .text(ion.text);
    } /*else {
      ionGroup.append("text")
      .attr("id","graph_matched_ions")
      .attr("x", xPos)
      .attr("y", yPos) 
      .style("opacity", "0.8")
      .style("stroke-width","2")
      .text(ion.text);
    }*/
  }
}

/**
 * @function drawSequence
 * @description Draw Sequence on spectrum graph
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function drawSequence(svg, para, proteoform, nMasses, cMasses, ions){
	let x,y;
	// Draw | at 0 for prefix mass list
	x = para.getPeakXPos(0);
	y = 15;
  let seq = proteoform.sequence;
  let prevMass = -1.0;
  let residues = "";
  for (let i = 0; i < nMasses.length; i++) {
    let curMass = nMasses[i];
    if (i > 0) {
      residues = residues + seq[i-1];
    }
    if (curMass > prevMass) {
      if (curMass >= para.winMinMz - 10 && curMass <= para.winMaxMz) {
        let x = para.getPeakXPos(curMass);
        interAddLineAndAnno(svg,x,y, curMass, i, ions, "n")
      }
      if (i > 0) {
        let mz = (prevMass + curMass)/2
        if (mz >= para.winMinMz && mz <= para.winMaxMz) {
          let x = para.getPeakXPos(mz) - 5;
          interAddAminoAcid(x,y+12,residues);
        }
        residues = "";
      }
      prevMass = curMass;
    }
  }

	x = para.getPeakXPos(0);
  y = 35;
  prevMass = -1.0;
  resiudes = "";
  for (let i = 0; i < cMasses.length; i++) {
    let curMass = cMasses[i];
    if (i > 0) {
      residues = residues + seq[seq.length - i];
    }
    if (curMass > prevMass) {
      if (curMass >= para.winMinMz - 10 && curMass <= para.winMaxMz) {
        let x = para.getPeakXPos(curMass);
        interAddLineAndAnno(svg,x,y, curMass, i, ions, "c");
      }
      if (i > 0) {
        let mz = (prevMass + curMass)/2
        if (mz >= para.winMinMz && mz <= para.winMaxMz) {
          let x = para.getPeakXPos(mz) - 5;
          interAddAminoAcid(x,y+12,residues);
        }
        residues = "";
      }
      prevMass = curMass;
    }
  }
  function getMatchedIon(residuePos, ions, terminal){
    for (let i = 0; i < ions.length; i++){
      if (parseInt(residuePos) == parseInt(ions[i].pos)){
        let text = ions[i].text.split(ions[i].pos)[0]
        if ((terminal == "n" && (text[0] == "A" || text[0] == "B" || text[0] == "C")) ||
            (terminal == "c" && (text[0] == "X" || text[0] == "Y" || text[0] == "Z"))){
              //return text;
              return ions[i].text
        }
      }
    }
    return null;
  }
 
  function interAddLineAndAnno(svg, x,y, mass, residuePos, ions, terminal) {
    let lineGroup = svg.append("g").attr("id", "seq_peak_line_anno");
    let seqGroup = svg.append("g").attr("id", "graph_sequence");
    let ionData = getMatchedIon(residuePos, ions, terminal);

    let lineYPos = 180;

    if (terminal == "c"){
      lineYPos = 160;
    }

    seqGroup.append("line")
      .attr("x1",x)
      .attr("y1",y)
      .attr("x2",x)
      .attr("y2",y+15)
      .attr("stroke","black")
      .attr("stroke-width","1")
      .on("mouseover",function(){
        onMouseOverFragmentMassAndIonType(this, mass, ionData);
      })
      .on("mouseout",function(){
        onFragmentMassAndIonTypeMouseOut(this);
      });

      if (ionData){//if matched peak exists, draw a dotted line
        lineGroup.append("line")
        .attr("x1",x)
        .attr("y1",y+16)
        .attr("x2",x)
        .attr("y2",y+lineYPos)
        .attr("stroke","black")
        .attr("stroke-width","1")
        .style("stroke-dasharray", ("3, 3"))
      }
  }
 
	function interAddAminoAcid(x,y,text){
    let svgGroup = d3.select("#seq_peak_line_anno");
		svgGroup.append("text")
			.attr("id","")
			.attr("x",x)
			.attr("y",y)
			.style("fill","black")
			.style("opacity", "0.6")
			.style("stroke-width","2")
			.text(text);
	}
}

/**
 * @function addErrorPlot
 * @description Add Error Plot to the MonoMass Spectrum
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
addErrorPlot = function(svg, para){
  //Draw x-axis
  this.xAxis = svg.append("g").attr("id", "xaxis_errorplot").append("line")
    .attr("x1",para.errorPlotPadding.left)
    .attr("y1",para.svgHeight - para.errorPlotHeight/2 - para.errorPlotPadding.bottom)
    .attr("x2",para.specWidth + para.errorPlotPadding.left)
    .attr("y2",para.svgHeight - para.errorPlotHeight/2 - para.errorPlotPadding.bottom)
    .attr("stroke","black")
    .style("stroke-dasharray", ("5, 3"))
    .attr("stroke-width","1.5")
  // Draw y-axis
  this.yAxis = svg.append("g").attr("id", "yaxis_errorplot").append("line")
    .attr("x1",para.errorPlotPadding.left)
    .attr("y1",para.svgHeight - para.errorPlotPadding.bottom)
    .attr("x2",para.errorPlotPadding.left)
    .attr("y2",para.svgHeight - para.errorPlotHeight - para.errorPlotPadding.bottom)
    .attr("stroke","black")
    .attr("stroke-width","1")
}

/**
 * @function addErrorBox
 * @description Draw Error plot
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function addErrorBox(svg, para){
  let rectBlock = svg.append("g").attr("id", "rect_error_plot");
  rectBlock.append("line")
    .attr("x1",para.errorPlotPadding.left)
    .attr("y1",para.svgHeight - para.errorPlotHeight - para.errorPlotPadding.bottom)
    .attr("x2",para.specWidth + para.errorPlotPadding.left)
    .attr("y2",para.svgHeight - para.errorPlotHeight - para.errorPlotPadding.bottom)
    .attr("stroke","black")
    .attr("stroke-width","1")
  rectBlock.append("line")
    .attr("x1",para.errorPlotPadding.left)
    .attr("y1",para.svgHeight - para.errorPlotPadding.bottom)
    .attr("x2",para.specWidth + para.errorPlotPadding.left)
    .attr("y2",para.svgHeight - para.errorPlotPadding.bottom)
    .attr("stroke","black")
    .attr("stroke-width","1")
  rectBlock.append("line")
    .attr("x1",para.svgWidth - para.errorPlotPadding.right)
    .attr("y1",para.svgHeight - para.errorPlotPadding.bottom)
    .attr("x2",para.svgWidth - para.errorPlotPadding.right)
    .attr("y2",para.svgHeight - para.errorPlotHeight - para.errorPlotPadding.bottom)
    .attr("stroke","black")
    .attr("stroke-width","1")
}

/**
 * @function drawErrorYticks
 * @description Draw Error plot y ticks
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function drawErrorYTicks(svg, para){

	let addYTicks = svg.append("g").attr("id","yErrorTicks")
									.attr("class","yErrorTicks");
  let tickSize = para.errorThreshold/para.errorYTickNum;
	// Draw ticks
	for(let i=-para.errorYTickNum;i<=para.errorYTickNum;i++) {
		y = para.getErrorYPos(i*tickSize);
		innerDrawYTick(y);
		innerAddErrorYTickValue(i*tickSize,y);
	}
	function innerDrawYTick(y){
    //y >= para.padding.head helps the ticks to be in the length of Y axis
    if(!isNaN(y) && y >= para.padding.head) {
			addYTicks.append("line")
						.attr("x1",para.padding.left)
						.attr("y1",y)
						.attr("x2",para.padding.left - para.tickLength)
						.attr("y2",y)
						.attr("stroke","black")
						.attr("stroke-width","1")
		}
	}
  function innerAddErrorYTickValue(data,y) {
    if(!isNaN(y) && y >= para.padding.head) {
      addYTicks.append("text").attr("class","ytext").attr("x",para.padding.left - para.tickLength)
        .attr("y",y)
        .attr("text-anchor","end")
        .attr("alignment-baseline","middle")
        .text(data)
        .style("font-size","14px")
    }
  }
}

/**
 * @function drawErrorPoints
 * @description Draw Error points on the error graph
 * @param {Node} svg -  is a html node on which the graph is being ploted
 * @param {object} para - Contains the parameters like height, width etc.,. tht helps to draw the graph
 */
function drawErrorPoints(svg, para, ionList){
	let circles = svg.append("g").attr("id", "error_circles");
  ionList.forEach((element)=>{
    let mass = element.mz;
    if(mass > para.winMinMz && mass <= para.winMaxMz){
      let cx = para.getPeakXPos(mass);
      let cy = para.getErrorYPos(element.error);
      circles.append("circle")
        .attr("class","error_circles")
        .attr("cx",cx)
        .attr("cy",cy)
        .attr("r", 3)
        .style("fill","black")
        .style("opacity", "1")
        .style("stroke-width","2");
    }
  })
}

function updateViewBox(svgId, width, height) {
  let svg = d3.select("body").select("#"+svgId);
  svg.attr("viewBox", "0 0 "+ width +" "+ height);
}
