class InteRtGraph {
    private xScale_g_: any;
    private fixedLine_g_: any;
  
    private inteRtArray_: {"rt": number, "inteSum": number, "scanNum": number, "ionTime": number, "intePercentage": number}[] = [];
    private svg_ID_: string;
    private rt_ID_: string;
    private inte_ID_: string;
    private scanNum_ID_: string;
  
    private svg_padding_: Padding = {} as Padding;
    private svg_width_: number = 0;
    private svg_height_: number = 0;
  
    onClickFunc: (scanId: number) => void;;
  
    config_: {"floatDigit": number, "scientificDigit": number};
  
    constructor(svg_ID: string, inteRtArray: {"rt": number, "inteSum": number, "scanNum": number, "ionTime": number, "intePercentage": number}[], onClickFunc = (scanId: number)=>{}, 
    config: {"floatDigit": number, "scientificDigit": number}, scanNum_ID: string = 'scan-hover', rt_ID: string = 'rt-hover', inte_ID: string = 'intensity-hover', 
    height: number = 120, width: number = 1100, padding: Padding = {head: 10, right: 10, bottom: 50, left: 80}) {
      this.inteRtArray_ = inteRtArray;
      this.svg_ID_ = "#"+svg_ID;
      this.rt_ID_ = rt_ID;
      this.inte_ID_ = inte_ID;
      this.scanNum_ID_ = scanNum_ID;
      this.padding = padding;
      this.width = width;
      this.height = height;
      this.onClickFunc = onClickFunc;
      this.config_ = config;
    }
    get inteRtArray(): {"rt": number, "inteSum": number, "scanNum": number, "ionTime": number, "intePercentage": number}[] {
      return this.inteRtArray_;
    } 
    
    set padding(obj: Padding) {
      if (!obj.head || !obj.bottom || !obj.left || !obj.right) {
        console.log("padding should be an object that contanins top, bottom, left and right");
        return;
      }
      this.svg_padding_ = obj;
    }
  
    get padding(): Padding {
      return this.svg_padding_;
    }
  
    set width(value: number) {
      if (value > this.svg_padding_.left + this.svg_padding_.right) {
        this.svg_width_ = value;
      } else {
        console.log("width should be larger than padding left plus padding right!");
      }
    }
  
    get width(): number {
      return this.svg_width_;
    }
  
    set height(value: number) {
      if (value > this.svg_padding_.head + this.svg_padding_.bottom) {
        this.svg_height_ = value;
      } else {
        console.log("height should be larger than padding top plus padding bottom");
      }
    }
  
    get height() {
      return this.svg_height_;
    }
  
    drawGraph(): void {
      let inteRtArray: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number}[] = this.inteRtArray_;
      let padding: Padding = this.padding;
      let rt_ID: string = this.rt_ID_;
      let inte_ID: string = this.inte_ID_;
      let scanNum_ID: string = this.scanNum_ID_;
      let height: number = this.height;
      let config: {floatDigit: number, scientificDigit: number} = this.config_;
  
      let maxInte: number | undefined = d3.max(this.inteRtArray_, function(d) {
        return d.inteSum;
      });
      let minRT: number | undefined = d3.min(this.inteRtArray_, function(d) {
        return d.rt;
      });
      let maxRT: number | undefined = d3.max(this.inteRtArray_, function(d) {
        return d.rt;
      });

      this.inteRtArray_.forEach((element) => {
        if (maxInte == undefined) {
          console.error("ERROR: invalid intensity in inte-rt graph");
          return;
        }
        element.rt = element.rt;
        element.intePercentage = element.inteSum/maxInte;
      });

      this.inteRtArray_.sort((a,b): number => {return a.rt > b.rt ? 1:-1});

      let min: number | undefined = d3.min(this.inteRtArray_, function(d) {
          return d.intePercentage;
      });
      let max: number | undefined = d3.max(this.inteRtArray_, function(d) {
          return d.intePercentage;
      });
  
      if (maxInte == undefined) {
        maxInte = 0;
      }
      if (maxRT == undefined) {
        maxRT = 0;
      }
      if (!min || !max || !minRT || !maxRT){
          console.log(`min: ${min} max: ${max} minRT ${minRT} maxRT: ${maxRT}`);
          console.error("ERROR: invalid intensity or rt in inte-rt graph");
          return;
      }
      let formatPercent: Function = d3.format(".0%");
  
      let xScale: d3.ScaleLinear<number, number, never> = d3.scaleLinear()
          .domain([0, maxRT+5])
          .range([0, this.width - this.padding.left - this.padding.right]);
      this.xScale_g_ = xScale;
  
      let yScale: d3.ScaleLinear<number, number, never> = d3.scaleLinear()
          .domain([0, max])
          .range([this.height - this.padding.head - this.padding.bottom, 0]);
  
      let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any> = d3.select(this.svg_ID_)
          .append('svg')
          .attr('viewBox', "0 0 "+ this.width + " "+this.height)
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .attr('width', '100%')
          .attr('height', '100%');
      //@ts-ignore   
      let xAxis: d3.Axis<d3.AxisDomain> = d3.axisBottom()
      //@ts-ignore   
          .scale(xScale)
          .ticks(20);
      //@ts-ignore   
      let yAxis: d3.Axis<d3.AxisDomain> & ((domainValue: d3.AxisDomain, index: number) => string) = d3.axisLeft()
      //@ts-ignore   
          .scale(yScale)
      //@ts-ignore  
          .tickFormat(formatPercent)
          .ticks(5);
  
      svg.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(' + this.padding.left + ',' + (this.height - this.padding.bottom) + ')')
          .call(xAxis);
      // text label for the x axis
      svg.append("text")
          // .attr("fill", "black")//set the fill here
          .attr("transform",
              "translate(" + ((this.width+this.padding.left-this.padding.right)/2) + " ," +
              (this.height - this.padding.bottom + 35) + ")")
          .style("text-anchor", "middle")
          .text("Retention Time (mins)");
  
      svg.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.head + ')')
          .call(yAxis);
      // text label for the y axis
      svg.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 20)
          .attr("x",0 - (this.height / 2) + 20)
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text("Intensity");
  
      let linePath: d3.Line<[number, number]> = d3.line()
      //@ts-ignore   
          .x(function(d){ return xScale(d.rt) })
      //@ts-ignore   
          .y(function(d){ return yScale(d.intePercentage) }).curve(d3.curveBasis);
  
      svg.append('g')
          .append('path')
          .attr('class', 'line-path')
          .attr('transform', 'translate(' + this.padding.left + ',' + this.padding.head + ')')
          //@ts-ignore   
          .attr('d', linePath(this.inteRtArray_))
          .attr('fill', 'none')
          .attr('stroke-width', 1)
          .attr('stroke', 'black');
  
  
      //Line chart mouse over
      let hoverLineGroup: d3.Selection<SVGGElement, unknown, HTMLElement, any> = svg.append("g")
          .attr("class", "hover-line");
      let hoverLine: d3.Selection<SVGLineElement, unknown, HTMLElement, any> = hoverLineGroup
          .append("line")
          .attr("stroke", "#ff0000")
          .attr("x1", this.padding.left).attr("x2", this.padding.left)
          .attr("y1", this.padding.head).attr("y2", this.height-this.padding.bottom);
      let fixedLine: d3.Selection<SVGLineElement, unknown, HTMLElement, any> = hoverLineGroup
          .append("line")
          .attr("stroke", "#ff8000")
          .attr("x1", this.padding.left).attr("x2", this.padding.left)
          .attr("y1", this.padding.head).attr("y2", this.height-this.padding.bottom);
      this.fixedLine_g_ = fixedLine;
  
      hoverLine.style("opacity", 1e-6);
      let self = this;
      svg
          .on("mouseout", hoverMouseOff)
          .on("mouseover mousemove touchmove", hoverMouseOn)
          .on("click", mouseClick);
  
  
      let bisectRT = d3.bisector(function(d: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number}) { return d.rt; }).right;
      
      let selectedDataPoint: { rt: number; inteSum: number; scanNum: number; ionTime: number; intePercentage: number; };
  
      function mouseClick(): void {
          //@ts-ignore allow use of this
          let mouse_x: number = d3.mouse(this)[0];
          //@ts-ignore allow use of this
          let mouse_y: number = d3.mouse(this)[1];
          let maxMouse: number = xScale(maxRT!);
          let mouseRT: number = xScale.invert(mouse_x-padding.left);
          let i: number = bisectRT(inteRtArray, mouseRT); // returns the index to the current data item
  
          if(i>0 && i < inteRtArray.length && mouse_y < height-padding.bottom && mouse_y > padding.head) {
              let d0: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number} = inteRtArray[i - 1];
              let d1: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number} = inteRtArray[i];
              // work out which date value is closest to the mouse
              let d: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number} = mouseRT - d0.rt > d1.rt - mouseRT ? d1 : d0;
              fixedLine.attr("x1", mouse_x).attr("x2", mouse_x);
              fixedLine.style("opacity", 1);
              self.onClickFunc(d.scanNum);
              selectedDataPoint = d;
          } else if (i === inteRtArray.length && mouse_x -padding.left<= maxMouse+1 && mouse_y < height-padding.bottom && mouse_y > padding.head)
          {
              let d: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number} = inteRtArray[i-1];
              fixedLine.attr("x1", mouse_x).attr("x2", mouse_x);
              fixedLine.style("opacity", 1);
              self.onClickFunc(d.scanNum);
              selectedDataPoint = d;
          } else {
              //fixedLine.style("opacity", 1e-6);
          }
      }
  
      function hoverMouseOn(): void {
          //@ts-ignore allow use of this
          let mouse_x: number = d3.mouse(this)[0];
          //@ts-ignore allow use of this
          let mouse_y: number = d3.mouse(this)[1];
          let maxMouse: number = xScale(maxRT!);
          hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
          hoverLine.style("opacity", 1);
  
          let mouseRT: number = xScale.invert(mouse_x-padding.left);
          let i: number = bisectRT(inteRtArray, mouseRT); // returns the index to the current data item
          if (i > 0 && i < inteRtArray.length && mouse_y < height-padding.bottom && mouse_y > padding.head) {
            let d0 = inteRtArray[i - 1];
            let d1 = inteRtArray[i];
            // work out which date value is closest to the mouse
            let d: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number} = mouseRT - d0.rt > d1.rt - mouseRT ? d1 : d0;
            if(document.getElementById(rt_ID)) {
              document.getElementById(rt_ID)!.innerHTML = (Math.round(d.rt * 100)/100).toFixed(config.floatDigit) + " (min)";
            }
            if (document.getElementById(inte_ID)) {
              document.getElementById(inte_ID)!.innerHTML = d.inteSum.toExponential(config.scientificDigit);
            }
            if (document.getElementById(inte_ID)) {
              document.getElementById(scanNum_ID)!.innerHTML = d.scanNum.toString();
            }
            hoverLine.style("opacity", 1);
          } else if (i === inteRtArray.length&& mouse_x-padding.left <= maxMouse+1 && mouse_y < height-padding.bottom && mouse_y > padding.head)
          {
            let d: {rt: number, inteSum: number, scanNum: number, ionTime: number, intePercentage: number} = inteRtArray[i-1];
            if(document.getElementById(rt_ID)) {
              document.getElementById(rt_ID)!.innerHTML = (Math.round(d.rt * 100)/100).toFixed(config.floatDigit) + " (min)";
            }
            if (document.getElementById(inte_ID)) {
              document.getElementById(inte_ID)!.innerHTML = d.inteSum.toExponential(config.scientificDigit);
            }
            if (document.getElementById(inte_ID)) {
              document.getElementById(scanNum_ID)!.innerHTML = d.scanNum.toString();
            }

            hoverLine.style("opacity", 1);
          } else {
            if (selectedDataPoint) {
              if(document.getElementById(rt_ID)) {
                document.getElementById(rt_ID)!.innerHTML = (Math.round(selectedDataPoint.rt * 100)/100).toFixed(config.floatDigit) + " (min)";
              }
              if (document.getElementById(inte_ID)) {
                document.getElementById(inte_ID)!.innerHTML = selectedDataPoint.inteSum.toExponential(config.scientificDigit);
              }
              if (document.getElementById(inte_ID)) {
                document.getElementById(scanNum_ID)!.innerHTML = selectedDataPoint.scanNum.toString();
              }
            } else {
              if(document.getElementById(rt_ID)) {
                document.getElementById(rt_ID)!.innerHTML = "0";
              }
              if (document.getElementById(inte_ID)) {
                document.getElementById(inte_ID)!.innerHTML = "0";
              }
              if (document.getElementById(inte_ID)) {
                document.getElementById(scanNum_ID)!.innerHTML = "0";
              }
            }
            hoverLine.style("opacity", 0);
          }
      }
      function hoverMouseOff(): void {
          hoverLine.style("opacity", 1e-6);
      }
    }
  
    moveLine(rt: number): void {
      let newX = this.xScale_g_(rt) + this.padding.left;
      this.fixedLine_g_.attr("x1", newX).attr("x2", newX);
      this.fixedLine_g_.style("opacity", 1);
    }
  }