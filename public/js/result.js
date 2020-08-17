let rangeTemp;

function getRelatedScan2(scanID) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var response = this.responseText;
            //loadPeakList1(response);
            getScanLevelTwoList(response,scanID);
        }
    };
    xhttp.open("GET", "relatedScan2?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
    xhttp.send();
}
function getScanLevel(scanID,nextScan) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var response = this.responseText;
            if (response === "1") {
                if (nextScan - scanID === 1) {
                    $('#scanLevelTwoInfo').show();
                    $("#tabs").show();
                    $("#noScanLevelTwo").hide();
                    getScanLevelTwoList(scanID, nextScan);
                } else {
                    loadPeakList1(scanID, null);
                    // cleanInfo();
                    $("#noScanLevelTwo").show();
                    $("#tabs").hide();
                    $('#scanLevelTwoInfo').hide();
                }
            }
            else {
                getRelatedScan2(scanID);
            }
        }
    };
    xhttp.open("GET", "scanlevel?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
    xhttp.send();
}
// get scanNum by ID
function getScanID(ID) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var response = this.responseText;
            findNextLevelOneScan(response);
        }
    };
    xhttp.open("GET", "scanID?projectDir=" + document.getElementById("projectDir").value + "&ID=" + ID, true);
    xhttp.send();
}
let peakList1_g;
let envList1_g;
function loadPeakList1(scanID, prec_mz) {
    let t0 = new Date();
    if (scanID !== '0') {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                getRT(scanID);
                peakList1_g = JSON.parse(this.responseText);
                
                var xhttp2 = new XMLHttpRequest();
                xhttp2.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        envList1_g = JSON.parse(this.responseText);
                        console.log("envList1_g", envList1_g);

                        if (envList1_g !== 0){
                            let ms1Graph = addSpectrum("spectrum1",peakList1_g, envList1_g,prec_mz);
                        }else {
                            let ms1GraphParameters = addSpectrum("spectrum1",peakList1_g, [],prec_mz);
                            rangeTemp = ms1GraphParameters;
                        }    
                    }
                };
                xhttp2.open("GET", "envlist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID + "&projectCode=" + document.getElementById("projectCode").value, true);
                xhttp2.send();
                document.getElementById("scanID1").innerText = scanID;
            }
        };
        xhttp.open("GET", "peaklist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
        xhttp.send();

    }else{
        alert("NULL");
    }
}

function getRT(scanNum) {
    var xhttpRT = new XMLHttpRequest();
    xhttpRT.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var rt = parseFloat(this.responseText);
            rawRT = rt;
            moveLine(rt/60);
            document.getElementById("scan1RT").innerText = (rt/60).toFixed(4);
        }
    };
    xhttpRT.open("GET", "getRT?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanNum, true);
    xhttpRT.send();
}
function getMax(){
    return new Promise(function(resolve, reject){
        let fullDir = (document.getElementById("projectDir").value).split("/");
        let fileName = (fullDir[fullDir.length -1].split("."))[0];
        let dir = fullDir[0].concat("/");
        dir = dir.concat(fullDir[1]);

        var xhttp3 = new XMLHttpRequest();
        xhttp3.onreadystatechange = function (){
            if (this.readyState == 4 && this.status == 200) {
                var result = JSON.parse(this.responseText);

                if (result != undefined){
                    resolve(result);
                }
                else{
                    reject("max values are undefined")
                }
            }
        }
        xhttp3.open("GET","getMax?projectDir=" + dir + "/" + fileName + ".db" + "&colName=" + 'MZ',true);
        xhttp3.send();
    });
}
function getPeaksPerTable(totalLayer){
    return new Promise(function(resolve, reject){
        let fullDir = (document.getElementById("projectDir").value).split("/");
        let fileName = (fullDir[fullDir.length -1].split("."))[0];
        let dir = fullDir[0].concat("/");
        dir = dir.concat(fullDir[1]);

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function (){
            if (this.readyState == 4 && this.status == 200) {
                var result = this.responseText;
                
                if (result != undefined){
                    resolve(result);
                }
                else{
                    reject("trouble counting rows of each table")
                }
            }
        }
        xhttp.open("GET","getPeaksPerTable?projectDir=" + dir + "/" + fileName + ".db" + "&layerCount=" + totalLayer,true);
        xhttp.send();
    });
}
function init3dGraph(){
    let t0 = new Date();
    let t1 = new Date();

    let scanID = document.getElementById("rangeMin").value;

    let promise = getMax();
    
    promise.then(function(data){//to make sure max values are fetched before creating graph
        console.log("getMax: ", new Date() - t0)
        t0 = new Date();

        Graph.tablePeakCount = data;

        let graph3D = new Graph(document.querySelector("#graph-container"), data,scanID);
        graph3D.main();

        console.log("graph3DInit :" , new Date() - t0);
        t0 = new Date();

        console.log("total init time: " , new Date() - t1);
    }, function(err){
        console.log(err);
    })
}
function findNextLevelOneScan(scan) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var nextScan = parseInt(this.responseText);
            getScanLevel(scan,nextScan);
        }
    };
    xhttp.open("GET", "findNextLevelOneScan?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scan, true);
    xhttp.send();
}
let peakList2_g;
let envList2_g;
function loadPeakList2(scanID, prec_mz, prec_charge, prec_inte, rt, levelOneScan) {
    if(scanID !== '0') {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                /*
                                        var t5 = performance.now();
                                        console.log("Call to fetch peaklist2 data from server took " + (t5 - t4) + " milliseconds.");
                */
                peakList2_g = JSON.parse(this.responseText);
                // document.getElementById("scanID2").innerText = scanID;
                //getPrecMZ(scanID);
                // var t6 = performance.now();
                var xhttp2 = new XMLHttpRequest();
                xhttp2.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        envList2_g = JSON.parse(this.responseText);
                        //console.log(envList2_g);
                        if (envList2_g !== 0){
                            addSpectrum("spectrum2",peakList2_g, envList2_g,null);
                        }else {
                            addSpectrum("spectrum2",peakList2_g, [],null);
                        }
                        // var t7 = performance.now();
                        // console.log("Call to show figure took " + (t7 - t6) + " milliseconds.");
                        document.getElementById("scanID2").innerHTML = scanID;
                        document.getElementById("prec_mz").innerHTML = prec_mz.toFixed(4);
                        loadPeakList1(levelOneScan, prec_mz);
                        document.getElementById("prec_charge").innerHTML = prec_charge;
                        document.getElementById("prec_inte").innerHTML = prec_inte.toFixed(4);
                        document.getElementById("rt").innerHTML = (rt/60).toFixed(4);
                    }

                };
                xhttp2.open("GET", "envlist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID + "&projectCode=" + document.getElementById("projectCode").value, true);
                xhttp2.send();
            }
        };
        // var t4 = performance.now();
        xhttp.open("GET", "peaklist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
        xhttp.send();
        // show envelope table for MS2
        showEnvTable(scanID);
        $("#switch").text('MS1');
    }else{
        alert("NULL");
    }
}
function loadInteSumList() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var t3 = performance.now();
            // console.log("Call to fetch inteSum data from server took " + (t3 - t2) + " milliseconds.");
            var response = JSON.parse(this.responseText);
/*            console.log("SumList:");
            console.log(response);*/
            var t0 = performance.now();
            addFigure(response);
            var t1 = performance.now();
            // console.log("Call to show figure took " + (t1 - t0) + " milliseconds.");
        }
    };
    var t2 = performance.now();
    xhttp.open("GET", "getInteSumList?projectDir=" + document.getElementById("projectDir").value, true);
    xhttp.send();
}
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
        .attr("stroke", "#f00")
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
            findNextLevelOneScan(d.scanNum);
        } else if (i === dataset.length && mouse_x -padding.left<= maxMouse+1 && mouse_y < height-padding.bottom && mouse_y > padding.top)
        {
            var d = dataset[i-1];
            fixedLine.attr("x1", mouse_x).attr("x2", mouse_x);
            fixedLine.style("opacity", 1);
            findNextLevelOneScan(d.scanNum);
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
function prev(scanID) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            //console.log("Call to fetch prev id from server took " + (t5 - t4) + " milliseconds.");
            var response = this.responseText;
            if(response !== '0'){
                getScanID(response);
            }else {
                /*$( "#spectrum1" ).empty();
                $( "#spectrum2" ).empty();
                $("#scanID1").empty();
                cleanInfo();*/
                alert("NULL");
            }
        }
    };
    xhttp.open("GET", "prev?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
    xhttp.send();
}
function next(scanID) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            //console.log("Call to fetch next id from server took " + (t7 - t6) + " milliseconds.");
            var response = this.responseText;
            if(response !== '0') {
                getScanID(response);
            }else {
                /*$("#spectrum1" ).empty();
                $("#spectrum2" ).empty();
                $("#scanID1").empty();
                cleanInfo();*/
                alert("NULL");
            }
        }
    };
    xhttp.open("GET", "next?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
    xhttp.send();
}
function cleanInfo() {
    $("#scanID2").empty();
    $("#prec_mz").empty();
    $("#prec_charge").empty();
    $("#prec_inte").empty();
    $("#rt").empty();
    //$("#tabs").empty();
    $("#spectrum2").empty();
    $("#tabList").empty();
}
function compare(a, b){
    var a_inte = a.intenstiy;
    var b_inte = b.intensity;
    return a_inte - b_inte;
}

function getScanLevelTwoList(scanID,target) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var response = JSON.parse(this.responseText);
            // console.log(response);
            // $("#tabs li").remove();
            $( "#tabs" ).tabs();
            $("#tabs li").remove();
            $( "#tabs" ).tabs("destroy");
            // var tabs = $( "#tabs" ).tabs();
            // var ul = tabs.find( "ul" );
            response.forEach(function (item) {
                //console.log(item.scanID);
                //getPrecMZ(item.scanID);
                var scanTwoNum = item.scanID;
                var rt = item.rt;
                $("#tabs ul").append('<li><a href="#spectrum2"' + ' id='+ scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scanID + ')">'+ item.prec_mz.toFixed(4) + '</a></li>');
                // $( '<li><a href="#spectrum2" class="ui-icon ui-icon-close role=\'presentation\'" onclick="loadPeakList3(' + scanTwoNum + ')">'+ item.prec_mz + '</a></li>' ).appendTo( ul );
            });
            $( "#tabs" ).tabs();
            /*
                                console.log(scanID);
                                console.log(document.getElementById(scanID));
            */
            //console.log(target);
            /*
                                var showID = (parseInt(scanID) + 1).toString(10);
                                console.log(showID);
                                console.log(document.getElementById(showID));
            */
            document.getElementById(target).click();
        }
    };
    xhttp.open("GET", "scanTwoList?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID, true);
    xhttp.send();
}
function showEnvTable(scan) {
    $('#envScan').text(scan);
    if(scan === $('#scanID1').text()) {
        $('#msType').text('MS1');
    } else {
        $('#msType').text('MS2');
    }
    if($('#envStatus').val() === "0"){
        return;
    }

    $.ajax( {
        url:'seqQuery?projectDir=' + document.getElementById("projectDir").value + "&scanID=" + $('#envScan').text()
            + "&projectCode=" + document.getElementById('projectCode').value,
        type: "get",
        success: function (res) {
            //console.log(res);
            if(res!== '0') {
                let sequence = preprocessSeq(res);
                $('#proteoform').text(sequence);
                window.localStorage.setItem('proteoform', sequence);
            } else {
                $('#proteoform').text('N/A');
                window.localStorage.setItem('proteoform', '');
            }
        }
    });

    $('#envTable').DataTable( {
        destroy: true,
        paging: false,
        searching: false,
        dom: 'Bfrtip',
        scrollY: 370,
        scroller: true,
        altEditor: true,
        select: 'os',
        responsive: true,
        buttons: [
            {
                extend: 'csv',
                text: 'Export CSV',
                className: 'btn',
                filename: 'envelope_data'
            },
            {
                text: 'Add',
                className: 'btn',
                name: 'add'        // do not change name
            },
            {
                extend: 'selected', // Bind to Selected row
                text: 'Update',
                className: 'btn',
                name: 'edit'        // do not change name
            },
            {
                extend: 'selected', // Bind to Selected row
                text: 'Delete',
                className: 'btn',
                name: 'delete'      // do not change name
            },
            {
                text: 'Refresh',
                className: 'btn',
                name: 'refresh'      // do not change name
            },
            {
                extend: 'selected',
                text: 'Jump to',
                className: 'btn',
                name: 'jumpto'
            }
        ],
        "ajax": {
            url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scan,
            dataSrc: '',
            type: "GET"
        },
        "columns": [
            /*{
                data: null,
                defaultContent: '',
                className: 'select-checkbox',
                orderable: false
            },*/
            { "data": "envelope_id", readonly: 'true'},
            { "data": "scan_id", "visible": true, type:"hidden"},
            { "data": "charge", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            // { "data": "mono_mass",type:'number', required: 'true'},
            { "data": "mono_mass",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "intensity",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true', readonly: 'true',"visible": true, type:"hidden"},
            {
                "data": "mono_mz",
                render: function (data, type, row ) {
                    let mono_mz =  (( row.mono_mass / row.charge ) + 1).toFixed(5);
                    row.mono_mz = mono_mz; // set mono_mz value
                    /*if($('#msType').text() === 'MS2'){
                        return `<a href="#spectrum2" onclick="relocSpet2( `+ mono_mz + `)">` + mono_mz + '</a>';
                    } else {
                        return `<a href="#spectrum1" onclick="relocSpet1( `+ mono_mz + `)">` + mono_mz + '</a>';
                    }*/
                    return mono_mz;
                }
                // ,type: "readonly"
                , required: 'true'
            }
        ],
        onAddRow: function(datatable, rowdata, success, error) {
            console.log(rowdata);
            $.ajax({
                // a tipycal url would be / with type='PUT'
                url: "/addrow?projectDir=" + document.getElementById("projectDir").value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        },
        onDeleteRow: function(datatable, rowdata, success, error) {
            console.log(rowdata);
            //rowdata=JSON.stringify(rowdata);
            $.ajax({
                // a tipycal url would be /{id} with type='DELETE'
                url: "/deleterow?projectDir=" + document.getElementById("projectDir").value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        },
        onEditRow: function(datatable, rowdata, success, error) {
            $.ajax({
                // a tipycal url would be /{id} with type='POST'
                url: "/editrow?projectDir=" + document.getElementById("projectDir").value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        }
    } );
}
function jumpTo(mono_mz) {
    if($('#msType').text() === 'MS2'){
        relocSpet2(mono_mz);
    } else {
        relocSpet1(mono_mz);
    }
}
function relocSpet1 (mono_mz) {
    addSpectrum("spectrum1", peakList1_g, envList1_g, mono_mz+0.5);
}
function relocSpet2 (mono_mz) {
    addSpectrum("spectrum2", peakList2_g, envList2_g, mono_mz+0.5);
}
var requestButton = document.getElementById('request');
requestButton.addEventListener('click', function () {
    // $( "#spectrum2" ).empty();
    var requestID = document.getElementById("scanID").value;
    var min = document.getElementById("rangeMin").value;
    var max = document.getElementById("rangeMax").value;
    // console.log(parseInt(requestID));
    if(parseInt(requestID) >= parseInt(min) && parseInt(requestID) <= parseInt(max)) {
        //console.log("Yes");
        findNextLevelOneScan(parseInt(requestID));
        showEnvTable(parseInt(requestID));
        $("#scanID").val("");
    }else {
        //console.log("No");
        alert("Please type in one scanID within range!")
    }

    // getScanLevelTwoList(document.getElementById("scanID").value);
},false)
var prev1 = document.getElementById('prev1');
prev1.addEventListener('click', function () {

    var scanID1 = document.getElementById("scanID1").innerHTML;
    if (scanID1 !== '') {
        prev(document.getElementById("scanID1").innerHTML);
    }
},false)
var next1 = document.getElementById('next1');
next1.addEventListener('click', function () {

    var scanID1 = document.getElementById("scanID1").innerHTML;
    if (scanID1 !== '') {
        next(document.getElementById("scanID1").innerHTML);
    }
},false)

//listener for rt range and mz range change in 3d graph
let redrawRequestButton = document.getElementById('request3dGraphRedraw');
redrawRequestButton.addEventListener('click', function(){
    let minRT = parseFloat(document.getElementById('rtRangeMin').value) * 60;//unit is different in DB
    let maxRT = parseFloat(document.getElementById('rtRangeMax').value) * 60;
    let minMZ = parseFloat(document.getElementById('mzRangeMin').value);
    let maxMZ = parseFloat(document.getElementById('mzRangeMax').value);
    let curRT = rawRT; 

    //error handing
    if (minRT > maxRT){
        alert("Invalid Range : Minimum retention time is bigger than maximum.");
    } 
    else if (minMZ > maxMZ){
        alert("Invalid Range : Minimum m/z is bigger than maximum");
    }
    else if (isNaN(minRT) || isNaN(maxRT) || isNaN(minMZ) || isNaN(maxMZ)){
        alert("Invalid Value Found : Please make sure the range has valid values.");
    }
    else{
        //reload data and redraw graph
        //LoadData.load3dDataByParaRange(minMZ, maxMZ, minRT, maxRT, curRT, false);
    }
}, false);
function init2dGraph(){
    return new Promise(function(resolve, reject){
        let min = document.getElementById("rangeMin").value;

        if($('#envStatus').val() === "0"){
            $('#brhr').hide();
            $("#envInfo").hide();
            $('#envFileInfo').hide();
        }
        $('#envFileInfo').hide();

        showEnvTable(min);
        findNextLevelOneScan(min);
        loadInteSumList();

        let scanRef = window.localStorage.getItem('scan');
        if(scanRef) {
            console.log(scanRef);
            $('#scanID').val(scanRef);
            $('#request').click();
            localStorage.clear();
        }
        resolve();
    });
}
//function running on startup
$( document ).ready(function() {
    let promise = init2dGraph();
    promise.then(function(){
        init3dGraph();
    });
});
$("#scanID").keyup(function(event) {
    if (event.keyCode === 13) {
        $("#request").click();
    }
});
$( "#hide" ).click(function() {
    if($("#hide").text() === 'Hide') {
        $("#hide").text('Show');
        $("#datatable").hide();
    }else {
        $("#hide").text('Hide');
        $("#datatable").show();
    }
});
$("#switch").click(function () {
    if($("#switch").text() === 'MS1') {
        showEnvTable($("#scanID1").text());
        $("#switch").text('MS2');
    }else {
        showEnvTable($("#scanID2").text());
        $("#switch").text('MS1');
    }
});

$("#inspect").click(function () {
    let peaklist;
    let masslistID = $('#envScan').text();
    if($("#switch").text() === 'MS1') {
        peaklist = peakList2_g;
    }else {
        peaklist = peakList1_g;
    }
    let peakAndIntensityList = "";
    peaklist.forEach(peak => {
        peakAndIntensityList = peakAndIntensityList + peak.mz + ' ' + peak.intensity+'\n';
    });
    peakAndIntensityList = peakAndIntensityList.slice(0,-1);
    window.localStorage.setItem('peakAndIntensityList', peakAndIntensityList);
    window.localStorage.setItem('scan', masslistID);
    window.localStorage.setItem('scanID', masslistID);
    window.localStorage.setItem('projectCode', document.getElementById('projectCode').value);
    if($('#proteoform').text() === 'N/A') {
        window.localStorage.setItem('proteoform', '');
    } else {
        window.localStorage.setItem('proteoform', $('#proteoform').text());
    }
    $.ajax({
        url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + masslistID,
        type: "get",
        dataType: 'json',
        success: function (res) {
            let massAndIntensityList = "";
            res.forEach(mass => {
                massAndIntensityList = massAndIntensityList + mass.mono_mass + ' ' + mass.intensity + ' ' + mass.charge + '\n';
            });
            massAndIntensityList = massAndIntensityList.slice(0, -1);
            window.localStorage.setItem('massAndIntensityList', massAndIntensityList);
            window.localStorage.setItem('ionType', 'Y,B');
            window.open('/resources/topview/inspect/spectrum.html', '_blank');
            //console.log(res);
        }
    });
});

$("#deleteMsalign").click(function () {
    var result = confirm("Are you sure that you want to delete msalign data?");
    if (result) {
        //Logic to delete the item
        $.ajax({
            url:"deleteMsalign?projectDir=" + document.getElementById("projectDir").value+ "&projectCode=" + document.getElementById('projectCode').value,
            type: "get",
            // dataType: 'json',
            success: function (res) {
                alert('Your previous msalign data has been removed.');
                location.reload();
            }
        });
    }
});
$("#deleteMzrt").click(function () {
    var result = confirm("Are you sure that you want to delete mzrt data?");
    if (result) {
        $.ajax({
            url:"deleteMzrt?projectDir=" + document.getElementById("projectDir").value+ "&projectCode=" + document.getElementById('projectCode').value,
            type: "get",
            // dataType: 'json',
            success: function (res) {
                alert('Your previous mzrt data has been removed.');
                location.reload();
            }
        });
    }
});
$("#deleteSeq").click(function () {
    var result = confirm("Are you sure that you want to delete sequence data?");
    if (result) {
        $.ajax({
            url:"deleteSeq?projectDir=" + document.getElementById("projectDir").value+ "&projectCode=" + document.getElementById('projectCode').value,
            type: "get",
            // dataType: 'json',
            success: function (res) {
                alert('Your previous sequence data has been removed.');
                location.reload();
            }
        });
    }
});
$('#uploadSequence').click(function () {
    window.open("seqResults?projectCode=" + document.getElementById("projectCode").value, '_self');
});
$("#seqUpload").click(function () {
    var seqFile = document.querySelector('#seqFile');
    var seqProgress = document.querySelector('#seqProgressbar');
    var xhr = new XMLHttpRequest();
    if(seqFile.files[0] === undefined) {
        alert("Please choose a sequence file first!");
        return;
    } else if (!seqFile.files[0].name.match(/.(csv)$/i)) {
        alert('Please upload a csv file for sequence!');
        return;
    }
    var formData = new FormData();
    formData.append('seqFile', seqFile.files[0]);
    formData.append('projectDir', document.getElementById('projectDir').value);
    formData.append('projectCode',document.getElementById("projectCode").value);
    formData.append('projectName', document.getElementById("projectName").value);
    formData.append('email', document.getElementById("email").value);
    xhr.upload.onprogress = seqSetProgress;
    xhr.onload = seqUploadSuccess;
    xhr.open('post', '/sequence', true);
    xhr.send(formData);

    function seqUploadSuccess(event) {
        if (xhr.readyState === 4) {
            alert("Upload successfully!");
            window.location.replace("/projects");
        }
    }

    function seqSetProgress(event) {
        if (event.lengthComputable) {
            var complete = Number.parseInt(event.loaded / event.total * 100);
            seqProgress.style.width = complete + '%';
            seqProgress.innerHTML = complete + '%';
            if (complete == 100) {
                seqProgress.innerHTML = 'Done!';
            }
        }
    }
});
$("#mzrtUpload").click(function () {
    var mzrtFile = document.querySelector('#mzrtFile');
    var mzrtProgress = document.querySelector('#mzrtProgressbar');
    var xhr = new XMLHttpRequest();
    if(mzrtFile.files[0] === undefined) {
        alert("Please choose a mzrt file first!");
        return;
    } else if (!mzrtFile.files[0].name.match(/.(csv)$/i)) {
        alert('Please upload a csv file!');
        return;
    }
    var formData = new FormData();
    formData.append('mzrtFile', mzrtFile.files[0]);
    formData.append('projectDir', document.getElementById('projectDir').value);
    formData.append('projectCode',document.getElementById("projectCode").value);
    formData.append('projectName', document.getElementById("projectName").value);
    formData.append('email', document.getElementById("email").value);
    xhr.upload.onprogress = mzrtSetProgress;
    xhr.onload = mzrtUploadSuccess;
    xhr.open('post', '/mzrt', true);
    xhr.send(formData);

    function mzrtUploadSuccess(event) {
        if (xhr.readyState === 4) {
            alert("Upload successfully!");
            window.location.replace("/projects");
        }
    }

    function mzrtSetProgress(event) {
        if (event.lengthComputable) {
            var complete = Number.parseInt(event.loaded / event.total * 100);
            mzrtProgress.style.width = complete + '%';
            mzrtProgress.innerHTML = complete + '%';
            if (complete == 100) {
                mzrtProgress.innerHTML = 'Done!';
            }
        }
    }
});
var ms1file = document.querySelector('#MS1_msalign');
var ms2file = document.querySelector('#MS2_msalign');
var upload = document.querySelector('#modalUpload');
var progress = document.querySelector('#progressbar');
var xhr = new XMLHttpRequest();
upload.addEventListener('click', uploadFile, false);

function uploadFile() {
    if(ms1file.files[0] === undefined || ms2file.files[0] === undefined) {
        alert("Please choose msalign files for both ms1 and ms2!");
        return;
    } else if (!ms1file.files[0].name.match(/.(msalign)$/i)) {
        alert("Please upload .msalign file for ms1");
        return;
    } else if (!ms2file.files[0].name.match(/.(msalign)$/i)) {
        alert("Please upload .msalign file for ms2");
        return;
    }
    var formData = new FormData();
    formData.append('ms1file', ms1file.files[0]);
    formData.append('ms2file', ms2file.files[0]);
    formData.append('projectDir', document.getElementById('projectDir').value);
    formData.append('projectCode',document.getElementById("projectCode").value);
    formData.append('projectName', document.getElementById("projectName").value);
    formData.append('email', document.getElementById("email").value);
    xhr.onload = uploadSuccess;
    xhr.upload.onprogress = setProgress;
    xhr.open('post', '/msalign', true);
    xhr.send(formData);
}
function uploadSuccess(event) {
    if (xhr.readyState === 4) {
        alert("Upload successfully! Please wait for data processing, you will receive an email when it's done");
        window.location.replace("/projects");
    }
}

function setProgress(event) {
    if (event.lengthComputable) {
        var complete = Number.parseInt(event.loaded / event.total * 100);
        progress.style.width = complete + '%';
        progress.innerHTML = complete + '%';
        if (complete == 100) {
            progress.innerHTML = 'Done!';
        }
    }
}

/*function preprocessSeq(seq) {
    var firstDotIndex = seq.indexOf('.');
    var lastDotIndex = seq.lastIndexOf('.');
    seq = seq.slice(firstDotIndex+1,lastDotIndex);
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
    seq = seq.replace(/\[[A-z]*\]/g, '');
    return seq;
    //console.log(seq);
}*/
function preprocessSeq(seq) {
    let firstIsDot = 1;
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
    seq = seq.replace(/\[[A-z]*\]/g, '');
    var firstDotIndex = seq.indexOf('.');
    if(firstDotIndex === -1) {
        firstDotIndex = 0;
        firstIsDot = 0;
    }
    var lastDotIndex = seq.lastIndexOf('.');
    if(lastDotIndex === -1) {
        lastDotIndex = seq.length;
    }
    var firstIndex = seq.indexOf('[');
    var lastIndex = seq.lastIndexOf(']');
    if(firstDotIndex> firstIndex && firstIndex !== -1) {
        firstDotIndex = 0;
        firstIsDot = 0;
    }
    if(lastDotIndex < lastIndex){
        lastDotIndex = seq.length;
    }
    if(firstIsDot){
        seq = seq.slice(firstDotIndex + 1, lastDotIndex);
    } else {
        seq = seq.slice(firstDotIndex,lastDotIndex);
    }
    return seq;
    //console.log(seq);
}

function plus() {
    var input = $("input[name='mono_mass']");
    let inputVal = input[input.length-1].value;
    if(inputVal === "") {inputVal = 0;}
    inputVal = parseFloat(inputVal) + 1.00235;
    inputVal = inputVal.toFixed(5);
    input[input.length-1].value = inputVal;
    change_mono_mz()
}
function minus() {
    var input = $("input[name='mono_mass']");
    let inputVal = input[input.length-1].value;
    if(inputVal === "") {inputVal = 0;}
    inputVal = parseFloat(inputVal) - 1.00235;
    inputVal = inputVal.toFixed(5);
    input[input.length-1].value = inputVal;
    change_mono_mz()
}
function change_mono_mass() {
    var input_mz = $("input[id='mono_mz']");
    let mz = input_mz[input_mz.length-1].value;
    if(mz === "") {mz = 0;}
    mz = parseFloat(mz);
    var chargeInput = $("input[name='Charge']");
    let charge = chargeInput[chargeInput.length-1].value;
    if(charge === "") {charge = 1;}
    charge = parseInt(charge);
    let result = (mz - 1)*charge;
    if(result < 0) result = 0;
    var input = $("input[name='mono_mass']");
    input[input.length-1].value = result.toFixed(5);
    //console.log(result);
}
function change_mono_mz() {
    var input_mass = $("input[name='mono_mass']");
    let mass = input_mass[input_mass.length-1].value;
    if(mass === "") {mass = 0;}
    mass = parseFloat(mass);
    var chargeInput = $("input[name='Charge']");
    let charge = chargeInput[chargeInput.length-1].value;
    if(charge === "") {charge = 1;}
    charge = parseInt(charge);
    let result = (mass/charge) + 1;
    if(result < 0) result = 0;
    var input = $("input[id='mono_mz']");
    input[input.length-1].value = result.toFixed(5);
}
let specPara1_g;
let lockPara1 = false;
let specPara2_g;
let lockPara2 = false;
function refresh() {
    /*let monoMZ1_old = mono_mz_list1_g;
    let monoMZ2_old = mono_mz_list2_g;
    let msType_old = $('#msType').text();
    console.log(msType_old);
    findNextLevelOneScan($('#envScan').text());
    addSpectrum('spectrum1', peakList1_g, envList1_g, monoMZ1_old);
    addSpectrum('spectrum2', peakList2_g, envList2_g, monoMZ2_old);
    if (msType_old === 'MS1') {
        showEnvTable($("#scanID1").text());
        $("#switch").text('MS2');
    }*/

    // addSpectrum('spectrum1', peakList1_g, envList1_g, mono_mz_list1_g);

    let msType_old = $('#msType').text();
    let scanID;
    if (msType_old === 'MS1') {
        lockPara1 = true;
        scanID = $('#scanID1').text();
        showEnvTable($("#scanID1").text());
        $("#switch").text('MS2');
    } else {
        lockPara2 = true;
        scanID = $('#scanID2').text();
    }
    $.ajax({
        url:"envlist?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scanID + "&projectCode=" + document.getElementById("projectCode").value,
        type: "get",
        // dataType: 'json',
        success: function (res) {
            if (msType_old === 'MS1') {
                envList1_g = JSON.parse(res);
                if(envList1_g===0) {
                    envList1_g = [];
                }
                addSpectrum('spectrum1', peakList1_g, envList1_g, null);
            } else {
                envList2_g = JSON.parse(res);
                console.log(envList2_g);
                if(envList2_g===0) {
                    envList2_g = [];
                }
                addSpectrum('spectrum2', peakList2_g, envList2_g, null);
            }
        }
    });
    // findNextLevelOneScan($('#envScan').text());
    //setTimeout()
}