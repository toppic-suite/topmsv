import { Graph } from '../3d_graph/graph_init/graph.js';
import { GraphUtil } from '../3d_graph/graph_util/graph_util.js';
import { GraphData } from '../3d_graph/graph_data/graph_data.js';
import { ResultViz } from './resultViz.js';
export function showFeatureTable() {
    if ($('#featureStatus').val() === "0") {
        return;
    }
    let projectDir = document.querySelector("#projectDir");
    if (!projectDir) {
        console.error("project directory information cannot be found");
        return;
    }
    let resultViz = new ResultViz(projectDir.value);
    let format = resultViz.getConfig();
    $('#featureTable').DataTable({
        destroy: true,
        paging: true,
        pageLength: 30,
        deferRender: true,
        searching: true,
        dom: 'Bfrtip',
        scrollY: "370",
        scroller: true,
        altEditor: true,
        select: 'os',
        responsive: true,
        buttons: [
            {
                extend: 'selected',
                text: 'Jump to',
                className: 'btn',
                name: 'jumpto_feature',
                action: function (e, dt, node, config) {
                    var adata = dt.rows({
                        selected: true
                    });
                    jumpToFeature(adata.data()[0]);
                }
            }
        ],
        "ajax": {
            url: 'loadMzrtData?projectDir=' + Graph.projectDir +
                "&minRT=0" + "&maxRT=" + Graph.dataRange.rtmax +
                "&minMZ=0" + "&maxMZ=" + Graph.dataRange.mzmax +
                "&limit=" + "ALL",
            dataSrc: '',
            type: "GET"
        },
        "columns": [
            //@ts-ignore //ignoring library-specific compile error
            { "data": "id", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true' },
            { "data": "envelope_num", "visible": true },
            //@ts-ignore //ignoring library-specific compile error
            { "data": "charge", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true' },
            //@ts-ignore //ignoring library-specific compile error
            { "data": "mass", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true' },
            //@ts-ignore //ignoring library-specific compile error
            { "data": "mono_mz", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true' },
            //@ts-ignore //ignoring library-specific compile error
            { "data": "intensity", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true' }
        ],
        "columnDefs": [
            {
                targets: 3,
                render: $.fn.dataTable.render.number('', '.', format.floatDigit, '')
            },
            {
                targets: 4,
                render: $.fn.dataTable.render.number('', '.', format.floatDigit, '')
            },
            {
                targets: 5,
                render: function (data) {
                    return data.toExponential(format.scientificDigit);
                }
            }
        ]
    });
    $("#feature-table-search-min, #feature-table-search-max").keyup(() => {
        $('#featureTable').DataTable().draw();
    });
    //custom filtering function for search box
    $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
        let featureMin = $('#feature-table-search-min').val();
        let featureMax = $('#feature-table-search-max').val();
        let min;
        let max;
        if (typeof featureMin == "number" && typeof featureMax == "number") {
            min = featureMin;
            max = featureMax;
        }
        else if (typeof featureMin == "string" && typeof featureMax == "string") {
            min = parseFloat(featureMin);
            max = parseFloat(featureMax);
        }
        else {
            return true;
        }
        let mz = parseFloat(data[4]) || 0;
        if ((isNaN(min) && isNaN(max)) ||
            (min <= mz && mz <= max)) {
            return true;
        }
        return false;
    });
    $("#featureTable_filter").hide();
    $("#feature-table-search-id").on("keyup", function () {
        //@ts-ignore //ignoring library-specific compile error
        $('#featureTable').DataTable().columns(0).search(this.value).draw();
    });
}
export function jumpToFeature(data) {
    let mzPadding = 1;
    let rtPadding = 0.01;
    if (data.rt_low == data.rt_high) {
        [data.rt_low, data.rt_high] = GraphUtil.addPaddingToFeature(data.rt_low);
    }
    GraphData.updateGraph(data.mz_low - mzPadding, data.mz_high + mzPadding, data.rt_low - rtPadding, data.rt_high + rtPadding, Graph.curRT);
}
