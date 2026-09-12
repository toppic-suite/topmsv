// Shared types of the MS1 3D view (ES modules; see page.ts for the entry).

/** One resolution level of the 3D peak database (CONFIG row). */
export interface LevelConfig {
  level: number;
  mzMin: number; mzMax: number;
  rtMin: number; rtMax: number;     // minutes
  intMin: number; intMax: number;
  count: number;                    // rows in PEAKS<level>
}

/** Config endpoint payload. */
export interface Config3d {
  levels: LevelConfig[];
  totalIntensity: number;           // sum over the full-resolution level
}

/** One peak returned by the peaks endpoint. */
export interface PeakRow {
  mz: number;
  intensity: number;
  rt: number;                       // minutes
  color: number;                    // 0..6 intensity class assigned by the converter
}

/** One MS1 scan of the TopFD file. */
export interface ScanRow {
  id: number;
  scan: number;
  rt: number;                       // minutes
}

/** The m/z x RT window on display plus the intensity range of its peaks. */
export interface ViewRange {
  mzmin: number; mzmax: number; mzrange: number;
  rtmin: number; rtmax: number; rtrange: number;
  intmin: number; intmax: number;
}
