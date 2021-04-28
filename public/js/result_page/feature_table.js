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

function showFeatureTable() {
    if($('#featureStatus').val() === "0"){
        return;
    }
    let fullDir = (document.getElementById("projectDir").value).split("/");
    let fileName = (fullDir[fullDir.length -1].split("."))[0];
    let dir = fullDir[0].concat("/");
    dir = dir.concat(fullDir[1]);

    $('#featureTable').DataTable( {
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
                extend: 'selected',
                text: 'Jump to',
                className: 'btn',
                name: 'jumpto_feature'
            }
        ],
        "ajax": {
            url:'loadMzrtData?projectDir=' + dir + "/" + fileName + ".db" + 
            "&minRT=0" + "&maxRT=" + Graph.dataRange.rtmax +
            "&minMZ=0" + "&maxMZ=" + Graph.dataRange.mzmax,
            dataSrc: '',
            type: "GET"
        },
        "columns": [
            { "data": "id", readonly: 'true'},
            { "data": "envelope_num", "visible": true},
            { "data": "charge", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "mass",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "mono_mz", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "intensity",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'}
        ],
    });
}

function jumpToFeature(data) {
    GraphData.updateGraph(data.mz_low, data.mz_high, data.rt_low, data.rt_high, Graph.curRT);
}

