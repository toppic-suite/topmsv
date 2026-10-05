/// <reference types="datatables.net" />

// Column config for the MS1 and MS2 mass-list tables (deconvoluted
// envelopes): ID, mono mass, mono m/z, [ref m/z: computed from the
// envelope's ref_mass, click to center the spectrum], charge, intensity,
// score, and a hidden last column that carries the "Group by mass" order.
// Built per table so a table without the ref m/z
// column keeps the right column indexes.
//
// Sorting controls of a mass list (initMassTableSortControls): a "Group by
// mass" check box and an advanced-sorting popup that sets a first and a
// second sort column. Both go through DataTables' own ordering, so the
// column-header sorting keeps working with them.

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
  // the hidden group column: not in the row data, its sort keys come from
  // the "mass-group" ordering plug-in below
  columnDefs.push({
    targets: [MASS_GROUP_COL_FROM_END],
    visible: false,
    data: null,
    defaultContent: '',
    type: 'num',
    orderDataType: 'mass-group',
  });
  return {
    "paging": false,
    "info": false,
    "searching": false,
    // with a hidden column DataTables' width calculation would pin the table
    // to a pixel width wider than its panel; let it follow the panel instead
    "autoWidth": false,
    columnDefs: columnDefs,
  };
}

// ---- Group by mass ----
// With the check box on, the rows of the envelopes with the same mono mass
// (the charge states of one mass) stay together: the rows are sorted as the
// column headers / the advanced sorting ask, the groups follow each other in
// the order of their first row, and the rows of a group keep that sort
// order. It is DataTables' fixed pre-ordering on the hidden group column,
// whose sort key — the rank of the row's group — is recomputed from the
// current ordering each time the table is sorted.
const MASS_COL: number = 1;
const MASS_GROUP_COL_FROM_END: number = -1;

type SortDir = 'asc' | 'desc';
type ColumnOrder = [number, SortDir];

/** the table's ordering as [column, direction] pairs (without the fixed group column) */
function massTableOrder(table: MassTable): ColumnOrder[] {
  return (table.order() as (string | number)[][]).map(o => [o[0] as number, o[1] as SortDir] as ColumnOrder);
}

/** numbers ascending; missing values (NaN: no ref m/z) last */
function compareCells(a: unknown, b: unknown): number {
  let x: number = typeof a === 'number' ? a : NaN;
  let y: number = typeof b === 'number' ? b : NaN;
  if (isNaN(x) || isNaN(y)) {
    return (isNaN(x) ? 1 : 0) - (isNaN(y) ? 1 : 0);
  }
  return x - y;
}

/**
 * Rank of each row's mass group, by row index: groups are numbered in the
 * order of their first row when the rows are sorted by `order`.
 */
function massGroupRanks(rows: unknown[][], order: ColumnOrder[]): number[] {
  let indexes: number[] = rows.map((row, i) => i);
  // mass groups: in mass order, a row continues the group of the previous
  // one when their masses agree up to floating-point noise
  let byMass: number[] = indexes.slice().sort((a, b) => compareCells(rows[a][MASS_COL], rows[b][MASS_COL]));
  let group: number[] = new Array(rows.length);
  let groupNum: number = 0;
  byMass.forEach((row, i) => {
    let sameAsPrev: boolean = i > 0
      && (rows[row][MASS_COL] as number) - (rows[byMass[i - 1]][MASS_COL] as number) < SpectrumViewParameters.envSameMassTol;
    group[row] = sameAsPrev ? group[byMass[i - 1]] : groupNum++;
  });
  let sorted: number[] = indexes.slice().sort((a, b) => {
    for (const [col, dir] of order) {
      let d: number = compareCells(rows[a][col], rows[b][col]);
      if (d !== 0) {
        return dir === 'desc' ? -d : d;
      }
    }
    return a - b;
  });
  let rankOfGroup: number[] = new Array(groupNum).fill(-1);
  let rankNum: number = 0;
  sorted.forEach(row => {
    if (rankOfGroup[group[row]] < 0) {
      rankOfGroup[group[row]] = rankNum++;
    }
  });
  return indexes.map(row => rankOfGroup[group[row]]);
}

// DataTables calls an ordering plug-in for the sort keys of a column each
// time the table is sorted by it (keys by row index).
($.fn.dataTable.ext.order as { [name: string]: (this: JQuery, settings: unknown, col: number) => number[] })['mass-group'] =
  function (this: JQuery): number[] {
    let table: MassTable = this.DataTable();
    return massGroupRanks(table.rows({ order: 'index' }).data().toArray() as unknown[][], massTableOrder(table));
  };

// ---- Advanced sorting popup (one popup, opened for a table) ----
let sort_popup_table: MassTable | null = null;

function sortPopupSelect(id: string): HTMLSelectElement {
  return document.getElementById(id) as HTMLSelectElement;
}

/** Open the popup on the table's visible columns, showing its current ordering. */
function openSortPopup(table: MassTable): void {
  sort_popup_table = table;
  let order: ColumnOrder[] = massTableOrder(table);
  let options: string = '';
  table.columns(':visible').every(function () {
    options += '<option value="' + this.index() + '">' + $(this.header()).text() + '</option>';
  });
  $('#sortFirstCol').html(options);
  $('#sortSecondCol').html('<option value="-1">(none)</option>' + options);
  sortPopupSelect('sortFirstCol').value = String(order.length > 0 ? order[0][0] : 0);
  sortPopupSelect('sortFirstDir').value = order.length > 0 ? order[0][1] : 'asc';
  sortPopupSelect('sortSecondCol').value = String(order.length > 1 ? order[1][0] : -1);
  sortPopupSelect('sortSecondDir').value = order.length > 1 ? order[1][1] : 'asc';
  document.getElementById('sortPopupWin').classList.add('open');
}

function closeSortPopup(): void {
  document.getElementById('sortPopupWin').classList.remove('open');
  sort_popup_table = null;
}

function applySortPopup(): void {
  if (sort_popup_table) {
    let first: number = parseInt(sortPopupSelect('sortFirstCol').value);
    let second: number = parseInt(sortPopupSelect('sortSecondCol').value);
    let order: ColumnOrder[] = [[first, sortPopupSelect('sortFirstDir').value as SortDir]];
    if (second >= 0 && second !== first) {
      order.push([second, sortPopupSelect('sortSecondDir').value as SortDir]);
    }
    sort_popup_table.order(order).draw();
  }
  closeSortPopup();
}

/** Wire a mass list's "Group by mass" check box and advanced-sorting button. */
function initMassTableSortControls(table: MassTable, groupCheckId: string, sortBtnId: string): void {
  let groupCheck = document.getElementById(groupCheckId) as HTMLInputElement;
  let applyGrouping = () => {
    let groupCol: number = table.column(MASS_GROUP_COL_FROM_END).index();
    table.order.fixed(groupCheck.checked ? { pre: [[groupCol, 'asc']] } : {}).draw();
  };
  groupCheck.addEventListener('change', applyGrouping);
  // the browser may restore a checked box on reload
  if (groupCheck.checked) {
    applyGrouping();
  }
  document.getElementById(sortBtnId).addEventListener('click', () => openSortPopup(table));
}

// read by viewer.ts (were implicit globals before strict mode)
let mass_table: MassTable, mass2_table: MassTable;
$(document).ready(function () {
  mass_table = $('#mass1Table').DataTable(massTableConfig(true));
  mass2_table = $('#mass2Table').DataTable(massTableConfig(true));
  initMassTableSortControls(mass_table, 'mass1GroupCheck', 'mass1SortBtn');
  document.getElementById('mass2SortBtn').addEventListener('click', () => openSortPopup(mass2_table));

  let sortWin: HTMLElement = document.getElementById('sortPopupWin');
  document.getElementById('sortApplyBtn').addEventListener('click', applySortPopup);
  document.getElementById('sortCancelBtn').addEventListener('click', closeSortPopup);
  document.getElementById('sortPopupWinCloseBtn').addEventListener('click', closeSortPopup);
  // close when clicking the backdrop outside the dialog
  sortWin.addEventListener('click', (e: MouseEvent) => {
    if (e.target === sortWin) closeSortPopup();
  });
});
