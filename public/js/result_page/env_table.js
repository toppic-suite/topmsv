"use strict";
function showEnvTable(scan) {
    let projectDir = document.querySelector("#projectDir");
    let projectCode = document.querySelector("#projectCode");
    if (!projectDir) {
        console.error("project directory information cannot be found");
        return;
    }
    if (!projectCode) {
        console.error("project code cannot be found");
        return;
    }
    let resultViz = new ResultViz(projectDir.value);
    let format = resultViz.getConfig();
    $('#envScan').text(scan);
    if (scan == $('#scanID1').text()) {
        $('#msType').text('MS1');
        $('#switch').text('MS2');
    }
    else {
        $('#msType').text('MS2');
        $('#switch').text('MS1');
    }
    if ($('#envStatus').val() === "0") {
        return;
    }
    $("#ms2Info").show();
    $.ajax({
        url: 'seqQuery?projectDir=' + projectDir.value + "&scanID=" + $('#envScan').text()
            + "&projectCode=" + projectCode.value,
        type: "get",
        success: function (res) {
            //console.log(res);
            if (res !== '0') {
                let protData = JSON.parse(res);
                let sequence = preprocessSeq(res);
                $('#proteoform').text(sequence);
                window.localStorage.setItem('proteoform', sequence);
                $('.fdr').show();
                $('#spec-fdr-value').text(protData.q_value);
            }
            else {
                $('#proteoform').text('N/A');
                window.localStorage.setItem('proteoform', '');
                $('.fdr').hide();
                $('#spec-fdr-value').text('');
            }
        }
    });
    let envTableObj = $('#envTable').DataTable({
        destroy: true,
        paging: false,
        searching: false,
        dom: 'Bfrtip',
        scrollY: "370",
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
            /*{
                text: 'Add',
                className: 'btn owner_btn',
                name: 'add'        // do not change name
            },
            {
                extend: 'selected', // Bind to Selected row
                text: 'Update',
                className: 'btn owner_btn',
                name: 'edit'        // do not change name
            },*/
            {
                extend: 'selected',
                text: 'Delete',
                className: 'btn owner_btn',
                name: 'delete' // do not change name
            },
            // refresh button for datatable
            /*             {
                    text: 'Refresh',
                    className: 'btn',
                    name: 'refresh'      // do not change name
                }, */
            {
                extend: 'selected',
                text: 'Jump to',
                className: 'btn',
                name: 'jumpto_env'
            }
        ],
        "ajax": {
            url: "envtable?projectDir=" + projectDir.value + "&scanID=" + scan,
            dataSrc: '',
            type: "GET"
        },
        "columns": [
            // select checkbox
            /*{
                data: null,
                defaultContent: '',
                className: 'select-checkbox',
                orderable: false
            },*/
            //@ts-ignore //ignoring library-specific compile error
            { "data": "envelope_id", readonly: 'true' },
            { "data": "scan_id", "visible": true, type: "hidden" },
            //@ts-ignore //ignoring library-specific compile error
            { "data": "charge", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true' },
            //@ts-ignore //ignoring library-specific compile error
            { "data": "mono_mass", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true' },
            //@ts-ignore //ignoring library-specific compile error
            { "data": "intensity", pattern: "[+-]?([0-9]*[.])?[0-9]+", required: 'true', readonly: 'true', "visible": true, type: "hidden" },
            {
                "data": "mono_mz",
                render: function (data, type, row) {
                    let mono_mz = ((row.mono_mass / row.charge) + 1).toFixed(format.floatDigit);
                    row.mono_mz = mono_mz; // set mono_mz value
                    return mono_mz;
                }
                // ,type: "readonly"
                //@ts-ignore //ignoring library-specific compile error
                ,
                required: 'true'
            }
        ],
        "columnDefs": [
            {
                targets: 3,
                render: $.fn.dataTable.render.number('', '.', format.floatDigit, '')
            },
            {
                targets: 4,
                render: function (data) {
                    return data.toExponential(format.scientificDigit);
                }
            }
        ],
        onAddRow: function (datatable, rowdata, success, error) {
            function customSuccessFunction() {
                success();
                //@ts-ignore //function from an external library
                refresh(rowdata);
            }
            $.ajax({
                // a tipycal url would be / with type='PUT'
                url: "/addrow?projectDir=" + projectDir.value,
                type: 'GET',
                data: rowdata,
                success: customSuccessFunction,
                error: error
            });
        },
        onDeleteRow: function (datatable, rowdata, success, error) {
            //rowdata=JSON.stringify(rowdata);
            async function customSuccessFunction(res) {
                let deletedEnvs = await JSON.parse(res);
                success();
                //@ts-ignore //function from an external library
                refresh(deletedEnvs);
            }
            $.ajax({
                // a tipycal url would be /{id} with type='DELETE'
                url: "/deleterow?projectDir=" + projectDir.value,
                type: 'GET',
                data: rowdata,
                success: customSuccessFunction,
                error: error
            });
        },
        onEditRow: function (datatable, rowdata, success, error) {
            $.ajax({
                // a tipycal url would be /{id} with type='POST'
                url: "/previewEdit?projectDir=" + projectDir.value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        }
    });
    if ($('#userType').val() === 'guest') {
        //@ts-ignore //ignoring library-specific compile error
        let buttonsList = envTableObj.buttons(['.owner_btn']);
        buttonsList.remove();
        // buttonsList.disable();
    }
}
function jumpToEnv(data) {
    let mono_mz = data.mono_mz;
    if ($('#msType').text() === 'MS2') {
        graph2_g.getPara().updateMzRange(mono_mz);
        graph2_g.redraw();
    }
    else {
        graph1_g.getPara().updateMzRange(mono_mz);
        graph1_g.redraw();
    }
}
/* function relocSpet1 (mono_mz) {
    const graphFeatures = new GraphFeatures();
    graph1_g.redraw(parseFloat(mono_mz+0.5), graphFeatures);
    //addSpectrum("spectrum1", peakList1_g, envList1_g, mono_mz+0.5,null, graphFeatures);
}

function relocSpet2 (mono_mz) {
    const graphFeatures = new GraphFeatures();
    // console.log("relocSpect2 on", mono_mz+0.5);
    graph2_g.redraw(parseFloat(mono_mz+0.5), graphFeatures);
    //addSpectrum("spectrum2", peakList2_g, envList2_g, mono_mz+0.5,null, graphFeatures);
}

function preprocessSeq(seq) {
    let firstIsDot = 1;
    seq = seq.replace(/\(/g,'');
    seq = seq.replace(/\)/g, '');
    seq = seq.replace(/\[[A-z]*\]/g, '');
    let firstDotIndex = seq.indexOf('.');
    if(firstDotIndex === -1) {
        firstDotIndex = 0;
        firstIsDot = 0;
    }
    let lastDotIndex = seq.lastIndexOf('.');
    if(lastDotIndex === -1) {
        lastDotIndex = seq.length;
    }
    let firstIndex = seq.indexOf('[');
    let lastIndex = seq.lastIndexOf(']');
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
}*/
