// Column config for the MS1 and MS2 mass-list tables (deconvoluted
// envelopes): ID, mono mass, mono m/z (click to center the spectrum),
// [ref m/z: computed from the envelope's ref_mass, also clickable],
// charge, intensity, score. Built per table so a table without the ref m/z
// column keeps the right column indexes.
function massTableConfig(withRefMz) {
    // index of each column after the optional ref m/z column
    const shift = withRefMz ? 1 : 0;
    const mzLink = function (cls) {
        return function (data, type, row) {
            if (type === 'display') {
                if (typeof data !== 'number' || isNaN(data)) {
                    return '';   // e.g. ref_mass missing in an older sqlite file
                }
                return '<a class="' + cls + '" href="#!">' + data.toFixed(3) + '</a>';
            }
            return data;
        };
    };
    const columnDefs = [{
        targets: [4 + shift],
        render: function (data, type, row) {
            if (type === 'display' && typeof data === 'number') {
                return data.toExponential(3);
            }
            return data;
        }
    },
    {
        targets: [1, 5 + shift],
        render: function (data, type, row) {
            if (type === 'display' && typeof data === 'number') {
                return data.toFixed(3);
            }
            return data;
        }
    },
    {
        targets: [2],
        render: mzLink('row_mono_mz')
    }];
    if (withRefMz) {
        columnDefs.push({ targets: [3], render: mzLink('row_ref_mz') });
    }
    return {
        "paging": false,
        "info": false,
        "searching": false,
        columnDefs: columnDefs,
    };
}

// read by viewer.js (were implicit globals before strict mode)
let mass_table, mass2_table;
$(document).ready(function () {
    mass_table = $('#mass1Table').DataTable(massTableConfig(true));
    mass2_table = $('#mass2Table').DataTable(massTableConfig(true));
});
