var xScale_g;
var padding_g;
var fixedLine_g;
function addFigure(dataset) {

    var width = 1100; //1100
    var height = 120; //120
    var padding = { top: 10, right: 10, bottom: 50, left: 80 };
    padding_g = padding;

    var maxInte = d3.max(dataset, function(d) {
        return d.inteSum;
    });

    var formatPercent = d3.format(".0%");

    dataset.forEach(function (element) {
        element.rt = element.rt/60;
        element.intePercentage = element.inteSum/maxInte;
    });
    dataset.sort((a,b) => {a.rt > b.rt ? 1:-1});

    var min = d3.min(dataset, function(d) {
        return d.intePercentage;
    });
    var max = d3.max(dataset, function(d) {
        return d.intePercentage;
    });

    var minRT = d3.min(dataset, function(d) {
        return d.rt;
    });
    var maxRT = d3.max(dataset, function(d) {
        return d.rt;
    });
    var xScale = d3.scaleLinear()
        .domain([0, maxRT+5])
        .range([0, width - padding.left - padding.right]);
    xScale_g = xScale;
    var yScale = d3.scaleLinear()
        .domain([0, max])
        .range([height - padding.top - padding.bottom, 0]);

    var svg = d3.select('#rt-sum')
        .append('svg')
        .attr('viewBox', "0 0 "+ width + " "+height)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('width', '100%')
        .attr('height', '100%');

    var xAxis = d3.axisBottom()
        .scale(xScale)
        .ticks(20);

    var yAxis = d3.axisLeft()
        .scale(yScale)
        .tickFormat(formatPercent)
        .ticks(5);

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + padding.left + ',' + (height - padding.bottom) + ')')
        .call(xAxis);
    // text label for the x axis
    svg.append("text")
        // .attr("fill", "black")//set the fill here
        .attr("transform",
            "translate(" + ((width+padding.left-padding.right)/2) + " ," +
            (height - padding.bottom + 35) + ")")
        .style("text-anchor", "middle")
        .text("Retention Time (mins)");

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
        .call(yAxis);
    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x",0 - (height / 2) + 20)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Intensity");

    var linePath = d3.line()
        .x(function(d){ return xScale(d.rt) })
        .y(function(d){ return yScale(d.intePercentage) }).curve(d3.curveBasis);

    svg.append('g')
        .append('path')
        .attr('class', 'line-path')
        .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')')
        .attr('d', linePath(dataset))
        .attr('fill', 'none')
        .attr('stroke-width', 1)
        .attr('stroke', 'black');

    //Line chart mouse over
    var vis = svg;
    var hoverLineGroup = vis.append("g")
        .attr("class", "hover-line");
    var hoverLine = hoverLineGroup
        .append("line")
        .attr("stroke", "#ff0000")
        .attr("x1", padding.left).attr("x2", padding.left)
        .attr("y1", padding.top).attr("y2", height-padding.bottom);
    var fixedLine = hoverLineGroup
        .append("line")
        .attr("stroke", "#ff8000")
        .attr("x1", padding.left).attr("x2", padding.left)
        .attr("y1", padding.top).attr("y2", height-padding.bottom);
    fixedLine_g = fixedLine;
    /*			var hoverTT = hoverLineGroup.append('text')
                        .attr("class", "hover-text capo")
                        .style('fill', 'red')
                        .attr('dy', "0.35em");

                var hoverTT2 = hoverLineGroup.append('text')
                        .attr("class", "hover-text capo")
                        .style('fill', 'red')
                        .attr('dy', "0.45em");

                var hoverTT3 = hoverLineGroup.append('text')
                        .attr("class", "hover-text capo")
                        .style('fill', 'red')
                        .attr('dy', "0.45em");*/

    hoverLine.style("opacity", 1e-6);
    /*
                var rectHover = vis.append("rect")
                        .data(dataset)
                        .attr("fill", "none")
                        .attr("class", "overlay")
                        .attr("width", width - padding.right -padding.left)
                        .attr("height", height - padding.bottom - padding.top)
                        .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')');
    */

    vis
        .on("mouseout", hoverMouseOff)
        .on("mouseover mousemove touchmove", hoverMouseOn)
        .on("click", mouseClick);

    var bisectRT = d3.bisector(function(d) { return d.rt; }).right;
    function mouseClick() {
        var mouse_x = d3.mouse(this)[0];
        var mouse_y = d3.mouse(this)[1];
        var maxMouse = xScale(maxRT);
        var mouseRT = xScale.invert(mouse_x-padding.left);
        var i = bisectRT(dataset, mouseRT); // returns the index to the current data item

        if(i>0 && i < dataset.length && mouse_y < height-padding.bottom && mouse_y > padding.top) {
            var d0 = dataset[i - 1];
            var d1 = dataset[i];
            // work out which date value is closest to the mouse
            var d = mouseRT - d0.rt > d1.rt - mouseRT ? d1 : d0;
            fixedLine.attr("x1", mouse_x).attr("x2", mouse_x);
            fixedLine.style("opacity", 1);
            init2D(d.scanNum);
        } else if (i === dataset.length && mouse_x -padding.left<= maxMouse+1 && mouse_y < height-padding.bottom && mouse_y > padding.top)
        {
            var d = dataset[i-1];
            fixedLine.attr("x1", mouse_x).attr("x2", mouse_x);
            fixedLine.style("opacity", 1);
            init2D(d.scanNum);
        } else {
            //fixedLine.style("opacity", 1e-6);
        }
    }
    function hoverMouseOn() {
        var mouse_x = d3.mouse(this)[0];
        var mouse_y = d3.mouse(this)[1];
        var maxMouse = xScale(maxRT);
        hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);
        hoverLine.style("opacity", 1);
        var graph_y = yScale.invert(mouse_y);
        var graph_x = xScale.invert(mouse_x-padding.left);

        var mouseRT = xScale.invert(mouse_x-padding.left);
        var i = bisectRT(dataset, mouseRT); // returns the index to the current data item
        if(i>0 && i < dataset.length && mouse_y < height-padding.bottom && mouse_y > padding.top) {
            var d0 = dataset[i - 1];
            var d1 = dataset[i];
            // work out which date value is closest to the mouse
            var d = mouseRT - d0.rt > d1.rt - mouseRT ? d1 : d0;

            document.getElementById("rt-hover").innerHTML = Math.round(d.rt * 100)/100;
            document.getElementById("intensity-hover").innerHTML = d.inteSum.toExponential(2);
            document.getElementById("scan-hover").innerHTML = d.scanNum;

            /*hoverTT.text("RT: " + Math.round(d.rt * 10000)/10000);
            hoverTT.attr('x', mouse_x);
            hoverTT.attr('y', yScale(d.intePercentage)+20);
            hoverTT2.text("Intensity: " + d.inteSum.toExponential(2))
                    .attr('x', mouse_x)
                    .attr('y', yScale(d.intePercentage)+30);
            hoverTT3.text("Scan: " + d.scanNum)
                    .attr('x', mouse_x)
                    .attr('y', yScale(d.intePercentage) + 42);
            hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);*/
            hoverLine.style("opacity", 1);
        } else if (i === dataset.length&& mouse_x-padding.left <= maxMouse+1 && mouse_y < height-padding.bottom && mouse_y > padding.top)
        {
            var d = dataset[i-1];
            document.getElementById("rt-hover").innerHTML = Math.round(d.rt * 100)/100;
            document.getElementById("intensity-hover").innerHTML = d.inteSum.toExponential(2);
            document.getElementById("scan-hover").innerHTML = d.scanNum;

            /*hoverTT.text("RT: " + Math.round(d.rt * 10000)/10000);
            hoverTT.attr('x', mouse_x);
            hoverTT.attr('y', yScale(d.intePercentage)+20);
            hoverTT2.text("Intensity: " + d.inteSum.toExponential(2))
                    .attr('x', mouse_x)
                    .attr('y', yScale(d.intePercentage) + 30);
            hoverTT3.text("Scan: " + d.scanNum)
                    .attr('x', mouse_x)
                    .attr('y', yScale(d.intePercentage) + 42);
            hoverLine.attr("x1", mouse_x).attr("x2", mouse_x);*/
            hoverLine.style("opacity", 1);
        } else {
            document.getElementById("rt-hover").innerHTML = 0;
            document.getElementById("intensity-hover").innerHTML = 0;
            document.getElementById("scan-hover").innerHTML = 0;
            hoverLine.style("opacity", 0);
        }
    }
    function hoverMouseOff() {
        hoverLine.style("opacity", 1e-6);
    }
}
function moveLine(rt) {
    var newX = xScale_g(rt) + padding_g.left;
    fixedLine_g.attr("x1", newX).attr("x2", newX);
    fixedLine_g.style("opacity", 1);
}