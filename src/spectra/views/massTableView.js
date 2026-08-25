// Shared column config for the MS1 and MS2 mass-list tables (deconvoluted
// envelopes): ID, mono mass, mono m/z (click to center the spectrum), charge,
// intensity, score.
const massTableConfig = {
    "paging": false,
    "info": false,
    "searching": false,
    columnDefs: [{
        targets: [4],
        render: function (data, type, row) {
            if (type === 'display' && typeof data === 'number') {
                return data.toExponential(3);
            }
            return data;
        }
    },
    {
        targets: [1, 5],
        render: function (data, type, row) {
            if (type === 'display' && typeof data === 'number') {
                return data.toFixed(3);
            }
            return data;
        }
    },
    {
        targets: [2],
        render: function (data, type, row) {
            if (type === 'display' && typeof data === 'number') {
                let mz = data.toFixed(3);
                return '<a class="row_mono_mz" href="#!">' + mz + '</a>';
            }
            return data;
        }
    }],
};

// read by viewer.js (were implicit globals before strict mode)
let mass_table, mass2_table;
$(document).ready(function () {
    mass_table = $('#mass1Table').DataTable(massTableConfig);
    mass2_table = $('#mass2Table').DataTable(massTableConfig);
});
