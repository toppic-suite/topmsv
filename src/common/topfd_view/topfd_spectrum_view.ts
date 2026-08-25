//spectra-browser variant of SpectrumView. Routes hover annotations to the
//MS2 panel's own element, and draws the base-intensity / minimum-reference-
//intensity lines on raw spectra.
class SpectrumView extends SpectrumViewBase {
  private baseInte_: number = 0;
  private minRefInte_: number = 0;

  constructor(svgId: string, peakList: Peak[], sequenceLength: number = -1) {
    super(svgId, peakList, sequenceLength);
    // route hover annotations to this graph's own panel element
    if (svgId === "ms2_svg_graph") {
      this.para_.setAnnoElementId("curMsTwoAnnoText");
    }
  }

  addBaseInte(baseInte: number, minRefInte: number) {
    this.baseInte_ = baseInte;
    this.minRefInte_ = minRefInte;
  }

  redraw(monoMz?: number): void {
    if (this.para_.getIsMonoMassGraph() && monoMz) {
      this.para_.updateMassRange(monoMz);
    } else if(monoMz) {
      this.para_.updateMzRange(monoMz);
    }
    this.setCenterPos(this.para_.getWinCenterMz());
    drawBasicSpectrum(this.id_, this.para_, this.peakList_, this.ionList_);
    if (this.para_.getIsMonoMassGraph() && this.ionList_) {
      drawMonoMassSpectrum(this.id_, this.para_, this.proteoform_, this.nMassList_, this.cMassList_, this.ionList_);
    }
    else {
      drawRawSpectrum(this.id_, this.para_, this.envList_,);
      drawBaseInte(this.id_, this.para_, this.baseInte_,);
      drawBaseInte(this.id_, this.para_, this.minRefInte_,);
    }
  }
}
