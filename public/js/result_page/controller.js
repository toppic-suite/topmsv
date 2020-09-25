function initGraph(){
    let min = document.getElementById("rangeMin").value;
    if($('#envStatus').val() === "0"){
        $('#brhr').hide();
        $("#envInfo").hide();
        $('#envFileInfo').hide();
    }
    $('#envFileInfo').hide();
    showEnvTable(min);
    
    init2D(min);
    init3D();

    const topview_2d = new Topview2D();
    topview_2d.getInteSumList()
        .then((response) => {
            rtInteGraph = new InteRtGraph("rt-sum", response.data, init2D);
            rtInteGraph.drawGraph();
        })
        .catch((error) => {
            console.log(error);
        });

    let scanRef = window.localStorage.getItem('scan');
    if(scanRef) {
        // console.log(scanRef);
        $('#scanID').val(scanRef);
        $('#request').click();   
        localStorage.clear();
    }

    let fileName = $('#fileName').val();
    let apix = fileName.substr(fileName.lastIndexOf('.'), fileName.length);
    if(apix === '.txt') {
        $('#rt-sum_panel').hide();

        topview_2d.getScanLevel(min)
            .then((response) => {
                if (response === "1") {
                    loadPeakList1(min, null);
                    $('#scanLevelTwo').hide();
                }
                else {
                    $('#scanLevelOne').hide();
                    topview_2d.getRelatedScan2(min)
                        .then(function(response) {
                            scanLevelOne = response;
                            return topview_2d.getScanLevelTwoList(response);
                        })
                        .then(function(response){
                            $( "#tabs" ).tabs();
                            $("#tabs li").remove();
                            $( "#tabs" ).tabs("destroy");
                            response.forEach(function (item) {
                                let scanTwoNum = item.scanID;
                                let rt = item.rt;
                                $("#tabs ul").append('<li><a href="#spectrum2"' + ' id='+ scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scanLevelOne + ')">'+ item.prec_mz.toFixed(4) + '</a></li>');
                            });
                            $( "#tabs" ).tabs();
                            document.getElementById(min).click();
                        })
                        .catch(function(error) {
                            console.log(error);
                        });
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }
}
$( document ).ready(function() {
    initGraph();
    init3D(window.localStorage);
    
});