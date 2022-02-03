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
    $('#featureTable').DataTable( {
        destroy: true,
        paging: true,
        pageLength: 30,
        deferRender: true,
        searching: true,
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
            url:'loadMzrtData?projectDir=' + Graph.projectDir + 
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
    $("#feature-table-search-min, #feature-table-search-max").keyup(() => {
        $('#featureTable').DataTable().draw();
    })
    //custom filtering function for search box
    $.fn.dataTable.ext.search.push(
        function( settings, data, dataIndex ) {
            let min = parseFloat( $('#feature-table-search-min').val(), 10 );
            var max = parseFloat( $('#feature-table-search-max').val(), 10 );
            let mz = parseFloat(data[4])|| 0;
     
            if ((isNaN(min) && isNaN(max)) || 
               (min <= mz && mz <= max)) {
                return true;
            }
            return false;
        }
    );
    $("#featureTable_filter").hide();
    $("#feature-table-search-id").on("keyup", function() {
        $('#featureTable').DataTable().columns(0).search(this.value).draw();
    });
}

function jumpToFeature(data) {
    let mzPadding = 1;
    let rtPadding = 0.01;

    if (data.rt_low == data.rt_high) {
        [data.rt_low, data.rt_high] = GraphUtil.addPaddingToFeature(data.rt_low);
    }
    GraphData.updateGraph(data.mz_low - mzPadding, data.mz_high + mzPadding, data.rt_low - rtPadding, data.rt_high + rtPadding, Graph.curRT);
}

