function drawPrsm(svgId: string, para: PrsmPara, data: PrsmViewData): void {
  let svg: any = d3.select("body").select("#"+svgId);
  // Removes all the elements under SVG group 'svgGroup' everytime there this function is called
  $("#" + svgId).children().remove();
  initSvg(svg, para, data);
  if (data.getShowStartSkipped()) {
    addStartSkippedLine(svg,para,data);
  }
  if (data.getShowEndSkipped()) {
    addEndSkippedLine(svg,para,data);
  }
  addAnnos(svg, para, data);
  addAnnoBackground(svg, para, data);
  
  if (para.getIsModAllowed()) {
    addAminoAcids(svg, para, data);
  }
  else{
    addAminoAcidsNoMods(svg, para, data);
  }
  
  if (para.getShowNum()) {
    addPosNums(svg, para, data);
  }
  drawStartSymbol(svg, para, data);
  drawEndSymbol(svg, para, data);
  drawBreakPoints(svg, para, data);
}

function initSvg(svg: any, para: PrsmPara, data: PrsmViewData): void {
  let [width, height]: number[] = para.getSvgSize(data.getRowNum(), data.getShowStartSkipped(), data.getShowEndSkipped());
  //console.log("width", width, "height", height);
  svg.attr("width", width)
    .attr("height", height)
    .attr("font-family","FreeMono,Miltonian,monospace")
    .attr("font-size","16px")
    .style("fill", para.getSvgBackgroundColor());
}

/**
 * Get the terminated/skipped acid information on to the svg
 * @param {String} svg - Contians id of the SVG tag from html.
 * @param {Object} para - Contains parameters of width, letter space etc., to draw SVG
 * @param {Object} info - Contains the skipped information. 
 */
function addStartSkippedLine(svg: any, para: PrsmPara, data: PrsmViewData): void {
  let info: string = data.getStartSkippedInfo();
  let [x,y]: number[] = para.getSkipStartCoordinates();
  //	Get the coordinates to write the skip information at the start of acid
  svg.append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("class","prsm_svg_group")
    .style("fill","black")
    .text(info);
}

/**
 * Get the terminated/skipped acid information on to the svg
 * @param {String} svg - Contians id of the SVG tag from html.
 * @param {Object} para - Contains parameters of width, letter space etc., to draw SVG
 * @param {Object} info - Contains the skipped information. 
 */
function addEndSkippedLine(svg: any, para: PrsmPara, data: PrsmViewData): void {
  let startPos: number = data.getDisplayFirstPos();
  let linePos: number = data.getDisplayLastPos() + 1;
  let info: string = data.getEndSkippedInfo();
  let isStartSkipped: boolean = data.getShowStartSkipped();

  let [x,y]: number[] = para.getSkipEndCoordinates(linePos, startPos);
  //console.log("x", x, "y", y, "info", info);

  if (isStartSkipped){
    y = y + para.getMiddleMargin();
  }

  //	Get the coordinates to write the skip information at the start of acid
  svg.append("text")
    .attr("x", x)
    .attr("y", y)
    .attr("class","prsm_svg_group")
    .style("fill","black")
    .text(info);
}

/**
 * Draw the sequence on to svg
 * @param {String} svg - Svg element.
 * @param {String} seq - Contains the protein sequence
 */
function addAminoAcids(svg: any, para: PrsmPara, data:PrsmViewData): void {
  let residues: Residue[] = data.getResidues(); 
  let start: number = data.getDisplayFirstPos();
  let end: number = data.getDisplayLastPos();
  let isStartSkipped: boolean = data.getShowStartSkipped();
  let addShift: AddShift = new AddShift();

  let aaGroup = svg.append("g")
    .attr("id", "amino_acid")
    .attr("class","prsm_svg_group")

  for (let i = 0; i < residues.length; i++) {
    let pos: number = residues[i].position;
    if (pos >= start && pos <= end) {
      let letter: string = residues[i].acid;
      let xPos: number = para.getX(pos, start); 
      let yPos: number = para.getY(pos, start);
      let color: string = residues[i].color;

      if (isStartSkipped){
        yPos = yPos + para.getMiddleMargin();
      }
      
      aaGroup.append("text")
        .attr("x", xPos)
        .attr("y", yPos) 
        .style("fill", color)
        .text(letter)
        .on("click",function(d){
          addShift.handleOnClick(letter, pos);
        });
    }
  }
}
/**
 * Draw the sequence on to svg
 * Do not allow clicking residues to add modifications
 * @param {String} svg - Svg element.
 * @param {String} seq - Contains the protein sequence
 */
 function addAminoAcidsNoMods(svg: any, para: PrsmPara, data:PrsmViewData): void {
  let residues: Residue[] = data.getResidues(); 
  let start: number = data.getDisplayFirstPos();
  let end: number = data.getDisplayLastPos();
  let isStartSkipped: boolean = data.getShowStartSkipped();

  let aaGroup = svg.append("g")
    .attr("id", "amino_acid")
    .attr("class","prsm_svg_group")

  for (let i = 0; i < residues.length; i++) {
    let pos: number = residues[i].position;
    if (pos >= start && pos <= end) {
      let letter: string = residues[i].acid;
      let xPos: number = para.getX(pos, start); 
      let yPos: number = para.getY(pos, start);
      let color: string = residues[i].color;

      if (isStartSkipped){
        yPos = yPos + para.getMiddleMargin();
      }
      
      aaGroup.append("text")
        .attr("x", xPos)
        .attr("y", yPos) 
        .style("fill", color)
        .text(letter)
    }
  }
}
/**
 * Put the numerical positions at the start and end of each row of the sequence
 * @param {*} para Contains parameters of width, letter space etc., to draw SVG
 * @param {Object} prsm - Contains the complete information of prsm. 
 * @param {String} id - Contians id of the SVG tag from html.
 */
function addPosNums (svg: any, para: PrsmPara, data: PrsmViewData): void {
  let startPos: number = data.getDisplayFirstPos();
  let lastPos: number = data.getDisplayLastPos(); 
  let rowNum: number = data.getRowNum();
  let isStartSkipped: boolean = data.getShowStartSkipped();

  let numGroup = svg.append("g")
    .attr("id", "pos_num")
    .attr("class","prsm_svg_group");

  for (let i = 0; i < rowNum; i++) {
    let leftPos: number = startPos + i * para.getRowLength();
    let [lx,ly]: number[] = para.getLeftNumCoordinates (leftPos, startPos);
    let leftText: number = leftPos + 1;
   
    if (isStartSkipped){
      ly = ly + para.getMiddleMargin();
    }

    numGroup.append("text")
      .attr("x",lx)
      .attr("y",ly)
      .text(leftText)
      .style("text-anchor", "end")
      .style("fill", "black");

    let rightPos: number = leftPos + para.getRowLength() - 1;
    if (rightPos > lastPos) {
      rightPos = lastPos;
    }
    let [rx,ry]: number[] = para.getRightNumCoordinates (rightPos, startPos);
    let rightText: number = rightPos + 1;

    if (isStartSkipped){
      ry = ry + para.getMiddleMargin();
    }
    
    numGroup.append("text")
      .attr("x",rx)
      .attr("y",ry)
      .text(rightText)
      .style("text-anchor", "start")
      .style("fill", "black");
  }
}

/**
 * Draw the annotations to show the start and end position of the sequence
 * @param {String} svg - Contians id of the SVG tag from html.
 * @param {Object} para - Contains parameters of width, letter space etc., to draw SVG
 */
function drawStartSymbol(svg: any, para: PrsmPara, data: PrsmViewData): void {
  let dispFirstPos: number = data.getDisplayFirstPos();
  let formFirstPos: number = data.getFormFirstPos();
  let isStartSkipped: boolean = data.getShowStartSkipped();
    if (dispFirstPos !== formFirstPos) {
		let [x,y]: number[] = para.getAACoordinates(formFirstPos, dispFirstPos);
		x = x - (para.getLetterWidth()/2) ;

    if (isStartSkipped){
      y = y + para.getMiddleMargin();
    }
    
		let coordinates: string = (x)+","+(y+2)+ " " +(x+5)+","+ (y+2)+" "+(x+5)+","+(y-12)+ " "+(x) + ","+(y-12);
    svg.append("polyline")
      .attr("class","prsm_svg_group")
      .attr("points", coordinates)
      .style("fill", "none")
      .style("stroke", "red")
      .style("stroke-width", "1.3");
  }
}

function drawEndSymbol(svg: any, para: PrsmPara, data: PrsmViewData) {
  let dispFirstPos: number = data.getDisplayFirstPos();
  let dispLastPos: number = data.getDisplayLastPos();
  let formLastPos: number = data.getFormLastPos();
  let isStartSkipped: boolean = data.getShowStartSkipped();

  if (dispLastPos !== formLastPos) {
		let [x,y]: number[] = para.getAACoordinates(formLastPos, dispFirstPos);
		x = x + (para.getLetterWidth()/2) ;
    
    if (isStartSkipped){
      y = y + para.getMiddleMargin();
    }
    
    let coordinates: string = (x+7)+","+(y-12)+ " " +(x+2)+","+ (y-12)+" "+(x+2)+","+(y+2)+ " "+(x+7) + ","+(y+2);

    svg.append("polyline")
          .attr("class","prsm_svg_group")
					.attr("points", coordinates)
					.style("fill", "none")
					.style("stroke", "red")
					.style("stroke-width", "1.3") ;
	}
}


/**
 * Invoke drawBreakPoints method 
 * @param {String} svg - Contians id of the SVG tag from html.
 * @param {Object} para - Contains parameters of width, letter space etc., to draw SVG
 * @param {Object} breakPoints - Json object with information of the position
 */
function drawBreakPoints(svg: any, para: PrsmPara, data:PrsmViewData): void {
  let dispFirstPos: number = data.getDisplayFirstPos();
  let formFirstPos: number = data.getFormFirstPos();
  let breakPoints: BreakPoints[] = data.getBreakPoints();
  let isStartSkipped: boolean = data.getShowStartSkipped();

  let bpGroup = svg.append("g")
    .attr("id", "break_point")
    .attr("class","prsm_svg_group");
  for (let i = 0; i < breakPoints.length; i++) {
    let bp: BreakPoints = breakPoints[i];
    //console.log(bp.position, dispFirstPos);
    let [x,y]: number[] = para.getBpCoordinates(parseInt(bp.position), dispFirstPos);

    if (isStartSkipped){
      y = y + para.getMiddleMargin();
    }
    
    // Setting polyline coordinates
    let coordinates: string; 
    if (bp.existNIon && !bp.existCIon) {
      coordinates = (x-2)+","+(y-13)+ " " +(x+4)+","+ (y-11)+" "+(x+4)+","+(y+2);
    }
    else if (!bp.existNIon && bp.existCIon) {
      coordinates = (x+4)+","+ (y-11)+" "+(x+4)+","+(y+2)+ " "+(x+10) + ","+(y+5);
    }
    else {
	    coordinates =  (x-2)+","+(y-13)+ " " + (x+4)+","+ (y-11)+" "+(x+4)+","+(y+2)+ " "+(x+10) + ","+(y+5);
    }
    bpGroup.append("polyline")
      .attr("points", coordinates)
      .style("fill", "none")
      .style("stroke", "#1e90ff")
      .style("stroke-width", "1");	
    //	Rectangle to have flexible on click and on mouse actions	
    let anno: string = bp.anno;
    let bpIonPos: number = parseInt(bp.position) - formFirstPos;
    bpGroup.append("rect")
      .attr("class","break_point")
      .attr("x", x)
      .attr("y", y-14)
      .attr("width", 13)
      .attr("height", 23)
      .attr("ion_pos", bpIonPos)
      .style("opacity", 0)
      .on("mouseover", function(){
        appendBpAnno(anno);
      })
      .on("mouseout", function(){
        removeBpAnno();	
      }); 
  }
}

/**
 * Function to add annotation to the polylines on mouseOver
 * @param {String} anno - Contains consolidated annotation to display
 */
function appendBpAnno(anno: string): void {
  // tooltip is a bootstrap class
  let div = d3.select("body").append("div")	
    .attr("id", "break_point_anno")
    .attr("class", "tooltip")				
    .style("opacity", 0); 
  div.transition()		
    .duration(10)		
    .style("opacity", .9);
  div.html(anno)	
    .style("left", (d3.event.pageX)  + "px")		
    .style("top", (d3.event.pageY - 28)+ "px") ;
}

/**
 * Function to remove annotation to the polylines on mouseOver
 */
function removeBpAnno(): void {
	d3.selectAll("#break_point_anno").remove();
}


/**
 * Color the background of the occurence
 * @param {String} svg - Contians id of the SVG tag from html.
 * @param {Object} para - Contains parameters of width, letter space etc., to draw SVG
 * @param {Object} shifts - Contains the complete information of mass shifts. 
 */
function addAnnos(svg: any, para: PrsmPara, data: PrsmViewData): void {
  let firstPos: number = data.getDisplayFirstPos();
  let annos: Annotation[] = data.getAnnotations();
  let isStartSkipped: boolean = data.getShowStartSkipped();
  //truncate after 4th pos after decimal point
  annos.forEach(anno => {
    let decimal: number = (anno.annoText.toString()).indexOf(".");
    if (decimal > -1) {
      anno.annoText = parseFloat(anno.annoText).toFixed(4);
    } 
  })

  annos.sort(function(a,b) {
    return a.leftPos - b.leftPos;
  })

  let annoGroup = svg.append("g")
    .attr("id", "mass_shift_anno")
    .attr("class","prsm_svg_group");
  let yShiftIdx: number = 0;
  for (let i = 0; i < annos.length; i++) {
    let leftPos: number = annos[i].leftPos;
    let [x1,y1]: number[] = para.getAACoordinates(leftPos, firstPos);
    //console.log(leftPos, x1, y1);
    let overlap: boolean = false;
    if (i > 0) {
      let prevPos: number = Math.floor(annos[i-1].leftPos);
      let [x2,y2]: number[] = para.getAACoordinates(prevPos, firstPos);
			// subtract -2 for CSS and alignment purpose
      let annoLen: number = annos[i-1].annoText.length * (para.getFontWidth()-2);
      //console.log(shifts[i-1].anno, annoLen, x2, x1);
			if(y1 == y2 && (x1-x2 < annoLen)) {
        overlap = true;
			}
    }
    // change y shift based on overlapping
    if (overlap) {
      yShiftIdx = (yShiftIdx + 1) % 2;
    }
    else {
      yShiftIdx = 0;
    }
    y1 = y1 + (para.getModAnnoYShifts())[yShiftIdx];
    let annoText: string = annos[i].annoText;
    if (isStartSkipped){
      y1 = y1 + para.getMiddleMargin();
    }

    annoGroup.append("text")
      .attr("x", x1)
      .attr("y", y1)
      .text(annoText)
      .attr("fill","black")
      .attr("font-size","15px");
  }
}

/**
 * Code to color the background of a occurence acids
 * @param {Integer} x - Contains x coordinate of the start postion to add background color
 * @param {Integer} y - Contains y coordinate of the end position to add background color
 * @param {String} id - Contains id of the SVG tag from html.
 * @param {Integer} width - Contains width to whuich backgroud color has to be added
 * @param {Object} para - Contains parameters of width, letter space etc., to draw SVG
 */
function addAnnoBackground(svg: any, para: PrsmPara, data: PrsmViewData) {
  let firstPos: number = data.getDisplayFirstPos();
  let annos: Annotation[] = data.getAnnotations(); 
  let isStartSkipped: boolean = data.getShowStartSkipped();
  let bgGroup = svg.append("g")
    .attr("id", "background")
    .attr("class","prsm_svg_group");
  for (let i = 0; i < annos.length; i++) {
    let leftPos: number = annos[i].leftPos;
    let rightPos: number = annos[i].rightPos;
    //console.log("left", leftPos, "right", rightPos);
    let startRow: number = Math.floor((leftPos -firstPos)/para.getRowLength());
    let endRow: number = Math.floor((rightPos - 1 - firstPos)/para.getRowLength());
    //console.log("start row", startRow, "end row", endRow);
    for (let j = startRow; j <= endRow; j++) {
      let rowLeft: number = firstPos + j * para.getRowLength();
      let rowRight: number = rowLeft + para.getRowLength() - 1;
      if (j == startRow) {
        rowLeft = leftPos;
      }
      if (j == endRow) {
        rowRight = rightPos-1;
      }
      //console.log("row left", rowLeft, "row right", rowRight);
      let [x1,y1]: number[] = para.getAACoordinates(rowLeft, firstPos);
      let [x2,y2]: number[] = para.getAACoordinates(rowRight, firstPos);

      if (isStartSkipped){
        y1 = y1 + para.getMiddleMargin();
      }

      if (isStartSkipped){
        y2 = y2 + para.getMiddleMargin();
      }
    
      bgGroup.append("rect")
        .attr("x", x1-para.getFontWidth()*0.1)
        .attr("y", y1-para.getFontHeight()*0.7)
        .attr("width", x2-x1 + para.getFontWidth())
        .attr("height", para.getFontHeight())
        .style("fill", para.getMassShiftColor(annos[i].type))
        .style("fill-opacity", ".4")
        .style("stroke-width", "1.5px");
    }
  }
}