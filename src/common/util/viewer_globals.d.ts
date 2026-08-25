// Ambient declarations for globals that the TopMSV viewer's page scripts
// (public/topmsv/visual/js, public/topmsv/inspect/js) define at runtime.
// draw_table.ts and the viewer variant of add_shift.ts reference them; the
// scripts themselves are loaded by the viewer HTML pages, not compiled here.
declare var ms2ScanList: any;
declare function showMs2Graph(...args: any[]): any;
declare function switchTab(...args: any[]): any;
declare class SeqOfExecution {
  constructor(...args: any[]);
  [key: string]: any;
}
declare function setDataToSequence(...args: any[]): any;
declare function getSequenceFromUI(...args: any[]): any;
declare function parseSequenceMassShift(...args: any[]): any;
