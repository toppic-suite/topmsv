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
                //$('#proteoform').class('env-table-text');
                window.localStorage.setItem('proteoform', sequence);
            } else {
                $('#proteoform').text('N/A');
                //$('#proteoform').class('env-table-text');
                window.localStorage.setItem('proteoform', '');
            }
        }
    });

    let envTableObj = $('#envTable').DataTable( {
        destroy: true,
        paging: false,
        searching: false,
        dom: 'Bfrtip',
        scrollY: false,
        scrollCollapse:true,
        scroller: false,
        altEditor: true,
        select: 'os',
        responsive: true,
        buttons: [
            {
                extend: 'csv',
                text: 'Export CSV',
                className: 'btn defaultBtn',
                filename: 'envelope_data'
            },
            {
                text: 'Add',
                className: 'btn owner_btn defaultBtn',
                name: 'add'        // do not change name
            },
            {
                extend: 'selected', // Bind to Selected row
                text: 'Update',
                className: 'btn owner_btn defaultBtn',
                name: 'edit'        // do not change name
            },
            {
                extend: 'selected', // Bind to Selected row
                text: 'Delete',
                className: 'btn owner_btn defaultBtn',
                name: 'delete'      // do not change name
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
                className: 'btn defaultBtn',
                name: 'jumpto'
            }
        ],
        "ajax": {
            url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + scan,
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
            { "data": "envelope_id", readonly: 'true'},
            { "data": "scan_id", "visible": true, type:"hidden"},
            { "data": "charge", pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "mono_mass",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true'},
            { "data": "intensity",pattern:"[+-]?([0-9]*[.])?[0-9]+", required: 'true', readonly: 'true',"visible": true, type:"hidden"},
            {
                "data": "mono_mz",
                render: function (data, type, row) {
                    let mono_mz =  (( row.mono_mass / row.charge ) + 1).toFixed(5);
                    row.mono_mz = mono_mz; // set mono_mz value
                    return mono_mz;
                }
                // ,type: "readonly"
                , required: 'true'
            }
        ],
        onAddRow: function(datatable, rowdata, success, error) {
            //console.log(rowdata);
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
            // console.log(rowdata);
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
                url: "/previewEdit?projectDir=" + document.getElementById("projectDir").value,
                type: 'GET',
                data: rowdata,
                success: success,
                error: error
            });
        }
    } );
    if ($('#userType').val() === 'guest') {
        let buttonsList = envTableObj.buttons(['.owner_btn']);
        buttonsList.remove();
        // buttonsList.disable();
    }
}

function jumpTo(mono_mz) {
    if($('#msType').text() === 'MS2'){
        graph2_g.redraw(mono_mz);
        // relocSpet2(mono_mz);
    } else {
        graph1_g.redraw(mono_mz);
        // relocSpet1(mono_mz);
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
} */

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
}

