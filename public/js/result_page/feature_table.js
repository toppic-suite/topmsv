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
            url:'loadMzrtData?projectDir=' + fileName + ".db" + 
            "&minRT=0" + "&maxRT=" + Graph.dataRange.rtmax +
            "&minMZ=0" + "&maxMZ=" + Graph.dataRange.mzmax + 
            "&limit=" + "ALL",
            dataSrc: '',
            type: "GET"
        },
        "columns": [
            { "data": "id", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "envelope_num", "visible": true},
            { "data": "charge", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "mass",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "mono_mz", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "intensity",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'}
        ],
    });
}

function jumpToFeature(data) {
    let mzPadding = 1;
    let rtPadding = 0.01;
    GraphData.updateGraph(data.mz_low - mzPadding, data.mz_high + mzPadding, data.rt_low - rtPadding, data.rt_high + rtPadding, Graph.curRT);
}

