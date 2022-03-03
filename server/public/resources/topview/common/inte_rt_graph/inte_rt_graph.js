"use strict";
class InteRtGraph {
    constructor(svg_ID, inteRtArray, onClickFunc = (scanId) => { }, config, scanNum_ID = 'scan-hover', rt_ID = 'rt-hover', inte_ID = 'intensity-hover', height = 120, width = 1100, padding = { head: 10, right: 10, bottom: 50, left: 80 }) {
        this.inteRtArray_ = [];
        this.svg_padding_ = {};
        this.svg_width_ = 0;
        this.svg_height_ = 0;
        this.inteRtArray_ = inteRtArray;
        this.svg_ID_ = "#" + svg_ID;
        this.rt_ID_ = rt_ID;
        this.inte_ID_ = inte_ID;
        this.scanNum_ID_ = scanNum_ID;
        this.padding = padding;
        this.width = width;
        this.height = height;
        this.onClickFunc = onClickFunc;
        this.config_ = config;
    }
    ;
    get inteRtArray() {
        return this.inteRtArray_;
    }
    set padding(obj) {
        if (!obj.head || !obj.bottom || !obj.left || !obj.right) {
            console.log("padding should be an object that contanins top, bottom, left and right");
            return;
        }
        this.svg_padding_ = obj;
    }
    get padding() {
        return this.svg_padding_;
    }
    set width(value) {
        if (value > this.svg_padding_.left + this.svg_padding_.right) {
            this.svg_width_ = value;
        }
        else {
            console.log("width should be larger than padding left plus padding right!");
        }
    }
    get width() {
        return this.svg_width_;
    }
    set height(value) {
        if (value > this.svg_padding_.head + this.svg_padding_.bottom) {
            this.svg_height_ = value;
        }
        else {
            console.log("height should be larger than padding top plus padding bottom");
        }
    }
    get height() {
        return this.svg_height_;
    }
    drawGraph() {
        let inteRtArray = this.inteRtArray_;
        let padding = this.padding;
        let rt_ID = this.rt_ID_;
        let inte_ID = this.inte_ID_;
        let scanNum_ID = this.scanNum_ID_;
        let height = this.height;
        let config = this.config_;
        let maxInte = d3.max(this.inteRtArray_, function (d) {
            return d.inteSum;
        });
        let minRT = d3.min(this.inteRtArray_, function (d) {
            return d.rt;
        });
        let maxRT = d3.max(this.inteRtArray_, function (d) {
            return d.rt;
        });
        this.inteRtArray_.forEach((element) => {
            if (maxInte == undefined) {
                console.error("ERROR: invalid intensity in inte-rt graph");
                return;
            }
            element.rt = element.rt;
            element.intePercentage = element.inteSum / maxInte;
        });
        this.inteRtArray_.sort((a, b) => { return a.rt > b.rt ? 1 : -1; });
        let min = d3.min(this.inteRtArray_, function (d) {
            return d.intePercentage;
        });
        let max = d3.max(this.inteRtArray_, function (d) {
            return d.intePercentage;
        });
        if (maxInte == undefined) {
            maxInte = 0;
        }
        if (maxRT == undefined) {
            maxRT = 0;
        }
        if (!min || !max || !minRT || !maxRT) {
            console.log(`min: ${min} max: ${max} minRT ${minRT} maxRT: ${maxRT}`);
            console.error("ERROR: invalid intensity or rt in inte-rt graph");
            return;
        }
        let formatPercent = d3.format(".0%");
        let xScale = d3.scaleLinear()
            .domain([0, maxRT + 5])
            .range([0, this.width - this.padding.left - this.padding.right]);
        this.xScale_g_ = xScale;
        let yScale = d3.scaleLinear()
            .domain([0, max])
            .range([this.height - this.padding.head - this.padding.bottom, 0]);
        let svg = d3.select(this.svg_ID_)
            .append('svg')
            .attr('viewBox', "0 0 " + this.width + " " + this.height)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('width', '100%')
            .attr('height', '100%');
        //@ts-ignore   
        let xAxis = d3.axisBottom()
            //@ts-ignore   
            .scale(xScale)
            .ticks(20);
        //@ts-ignore   
        let yAxis = d3.axisLeft()
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
            .attr("transform", "translate(" + ((this.width + this.padding.left - this.padding.right) / 2) + " ," +
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
            .attr("x", 0 - (this.height / 2) + 20)
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Intensity");
        let linePath = d3.line()
            //@ts-ignore   
            .x(function (d) { return xScale(d.rt); })
            //@ts-ignore   
            .y(function (d) { return yScale(d.intePercentage); }).curve(d3.curveBasis);
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
        let hoverLineGroup = svg.append("g")
            .attr("class", "hover-line");
        let hoverLine = hoverLineGroup
            .append("line")
            .attr("stroke", "#ff0000")
            .attr("x1", this.padding.left).attr("x2", this.padding.left)
            .attr("y1", this.padding.head).attr("y2", this.height - this.padding.bottom);
        let fixedLine = hoverLineGroup
            .append("line")
            .attr("stroke", "#ff8000")
            .attr("x1", this.padding.left).attr("x2", this.padding.left)
            .attr("y1", this.padding.head).attr("y2", this.height - this.padding.bottom);
        this.fixedLine_g_ = fixedLine;
        hoverLine.style("opacity", 1e-6);
        let self = this;
        svg
            .on("mouseout", hoverMouseOff)
            .on("mouseover mousemove touchmove", hoverMouseOn)
            .on("click", mouseClick);
        let bisectRT = d3.bisector(function (d) { return d.rt; }).right;
        let selectedDataPoint;
        function mouseClick() {
            //@ts-ignore allow use of this
            let mouse_x = d3.mouse(this)[0];
            //@ts-ignore allow use of this
            let mouse_y = d3.mouse(this)[1];
            let xScaled = xScale(maxRT);
            let maxMouse = -1;
            if (xScaled) {
                maxMouse = xScaled;
            }
            let mouseRT = xScale.invert(mouse_x - padding.left);
            let i = bisectRT(inteRtArray, mouseRT); // returns the index to the current data item
            if (i > 0 && i < inteRtArray.length && mouse_y < height - padding.bottom && mouse_y > padding.head) {
                let d0 = inteRtArray[i - 1];
                let d1 = inteRtArray[i];
                // work out which date value is closest to the mouse
                let d = mouseRT - d0.rt > d1.rt - mouseRT ? d1 : d0;
                fixedLine.attr("x1", mouse_x).attr("x2", mouse_x);
                fixedLine.style("opacity", 1);
                self.onClickFunc(d.scanNum);
                selectedDataPoint = d;
            }
            else if (i === inteRtArray.length && mouse_x - padding.left <= maxMouse + 1 && mouse_y < height - padding.bottom && mouse_y > padding.head) {
                let d = inteRtArray[i - 1];
                fixedLine.attr("x1", mouse_x).attr("x2", mouse_x);
                fixedLine.style("opacity", 1);
                self.onClickFunc(d.scanNum);
                selectedDataPoint = d;
            }
            else {
                //fixedLine.style("opacity", 1e-6);
            }
        }
        function hoverMouseOn() {
            //@ts-ignore allow use of this
            let mouse_x = d3.mouse(this)[0];
            //@ts-ignore allow use of this
            let mouse_y = d3.mouse(this)[1];
            let xScaled = xScale(maxRT);
            let maxMouse = -1;
            if (xScaled) {
                maxMouse = xScaled;
            }
            hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
            hoverLine.style("opacity", 1);
            let mouseRT = xScale.invert(mouse_x - padding.left);
            let i = bisectRT(inteRtArray, mouseRT); // returns the index to the current data item
            if (i > 0 && i < inteRtArray.length && mouse_y < height - padding.bottom && mouse_y > padding.head) {
                let d0 = inteRtArray[i - 1];
                let d1 = inteRtArray[i];
                // work out which date value is closest to the mouse
                let d = mouseRT - d0.rt > d1.rt - mouseRT ? d1 : d0;
                if (document.getElementById(rt_ID)) {
                    document.getElementById(rt_ID).innerHTML = (Math.round(d.rt * 100) / 100).toFixed(config.floatDigit) + " (min)";
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(inte_ID).innerHTML = d.inteSum.toExponential(config.scientificDigit);
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(scanNum_ID).innerHTML = d.scanNum.toString();
                }
                hoverLine.style("opacity", 1);
            }
            else if (i === inteRtArray.length && mouse_x - padding.left <= maxMouse + 1 && mouse_y < height - padding.bottom && mouse_y > padding.head) {
                let d = inteRtArray[i - 1];
                if (document.getElementById(rt_ID)) {
                    document.getElementById(rt_ID).innerHTML = (Math.round(d.rt * 100) / 100).toFixed(config.floatDigit) + " (min)";
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(inte_ID).innerHTML = d.inteSum.toExponential(config.scientificDigit);
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(scanNum_ID).innerHTML = d.scanNum.toString();
                }
                hoverLine.style("opacity", 1);
            }
            else {
                /*if(document.getElementById(rt_ID)) {
                    document.getElementById(rt_ID).innerHTML = 0;
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(inte_ID).innerHTML = 0;
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(scanNum_ID).innerHTML = 0;
                }*/
                //below code makes the previous selected rt data to be displayed when mouse cursor is out of range
                if (document.getElementById(rt_ID)) {
                    document.getElementById(rt_ID).innerHTML = (Math.round(selectedDataPoint.rt * 100) / 100).toFixed(config.floatDigit) + " (min)";
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(inte_ID).innerHTML = selectedDataPoint.inteSum.toExponential(config.scientificDigit);
                }
                if (document.getElementById(inte_ID)) {
                    document.getElementById(scanNum_ID).innerHTML = selectedDataPoint.scanNum.toString();
                }
                hoverLine.style("opacity", 0);
            }
        }
        function hoverMouseOff() {
            hoverLine.style("opacity", 1e-6);
        }
    }
    moveLine(rt) {
        let newX = this.xScale_g_(rt) + this.padding.left;
        this.fixedLine_g_.attr("x1", newX).attr("x2", newX);
        this.fixedLine_g_.style("opacity", 1);
    }
}
