//spectra-browser variant of SpectrumViewParameters. Adds the per-panel
//hover-annotation element id, resetScale(), and an xZoom that rescales
//the view when the window is clamped at the maximum m/z.
class SpectrumViewParameters extends SpectrumViewParametersBase {
  // id of the page element that shows the hovered peak's m/z and intensity
  // (each spectrum panel has its own, e.g. MS1 vs MS2)
  private annoElementId_: string = "curMsOneAnnoText";

  getAnnoElementId(): string {
    return this.annoElementId_;
  }
  setAnnoElementId(id: string): void {
    this.annoElementId_ = id;
  }

  resetScale(): void {
    this.updateScale(this.dataMinMz_, this.dataMaxMz_, this.dataMaxInte_ * this.inteMargin_);
  }

  xZoom(mouseSvgX: number, ratio: number): void {
    if (!this.isXZoomAllowed_) {
      return;
    }
    let oriValues: {"min": number, "max": number, "center": number, "xScale": number} = {} as {"min": number, "max": number, "center": number, "xScale": number}; //so that the view range can be restored when the view shouldn't be zoomed
    oriValues.min = this.winMinMz_;
    oriValues.max = this.winMaxMz_;
    oriValues.center = this.winCenterMz_;
    oriValues.xScale = this.xScale_;
    let mouseSpecX: number = mouseSvgX - this.padding_.left;
    this.winCenterMz_ =  mouseSpecX/this.xScale_ + this.winMinMz_;
    /*self is a global variable of datasource object containing all the data needed to use when zoomed*/
    this.xScale_ = this.xScale_ * ratio ; 
    this.winMinMz_ = this.winCenterMz_ - mouseSpecX / this.xScale_; 
    this.winMaxMz_ = this.winCenterMz_ + (this.specWidth_ - mouseSpecX) / this.xScale_;
    //console.log(this.winMaxMz_, this.dataMaxMz_ + 500)
    if (this.winMinMz_ < this.minPossibleMz_){//prevent zooming out into negative mass
      this.winMinMz_ = this.minPossibleMz_;
    }
    if (this.winMaxMz_ > this.dataMaxMz_ + this.maxPossibleMzMargin_) {
      this.winMaxMz_ = this.dataMaxMz_ + this.maxPossibleMzMargin_;
      if (this.winMaxMz_ > this.winMinMz_) {
        this.xScale_ = this.specWidth_ / (this.winMaxMz_ - this.winMinMz_);
      }
    }
    if (this.winCenterMz_ > this.winMaxMz_) {
      this.winMinMz_ = oriValues.min;
      this.winMaxMz_ = oriValues.max;
      this.winCenterMz_ = oriValues.center;
      this.xScale_ = oriValues.xScale;
    }
  }
}
