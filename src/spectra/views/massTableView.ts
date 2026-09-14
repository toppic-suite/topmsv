/// <reference types="datatables.net" />

// Column config for the MS1 and MS2 mass-list tables (deconvoluted
// envelopes): ID, mono mass, mono m/z, [ref m/z: computed from the
// envelope's ref_mass, click to center the spectrum], charge, intensity,
// score. Built per table so a table without the ref m/z
// column keeps the right column indexes.

/** DataTables API instance / configuration (the types come with datatables.net) */
type MassTable = ReturnType<JQueryDataTableApi>;
type MassTableConfig = NonNullable<Parameters<JQueryDataTableApi>[0]>;
type MassTableColumnDefs = NonNullable<MassTableConfig['columnDefs']>;

function massTableConfig(withRefMz: boolean): MassTableConfig {
  // index of each column after the optional ref m/z column
  const shift: number = withRefMz ? 1 : 0;
  const mzLink = function (cls: string) {
    return function (data: unknown, type: string) {
      if (type === 'display') {
        if (typeof data !== 'number' || isNaN(data)) {
          return '';   // e.g. ref_mass missing in an older sqlite file
        }
        return '<a class="' + cls + '" href="#!">' + data.toFixed(3) + '</a>';
      }
      return data;
    };
  };
  const columnDefs: MassTableColumnDefs = [{
    targets: [4 + shift],
    render: function (data: unknown, type: string) {
      if (type === 'display' && typeof data === 'number') {
        return data.toExponential(3);
      }
      return data;
    }
  },
  {
    targets: [1, 2, 5 + shift],
    render: function (data: unknown, type: string) {
      if (type === 'display' && typeof data === 'number') {
        return data.toFixed(3);
      }
      return data;
    }
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

// read by viewer.ts (were implicit globals before strict mode)
let mass_table: MassTable, mass2_table: MassTable;
$(document).ready(function () {
  mass_table = $('#mass1Table').DataTable(massTableConfig(true));
  mass2_table = $('#mass2Table').DataTable(massTableConfig(true));
});
