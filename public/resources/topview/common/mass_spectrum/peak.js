class Peak {
  constructor(peakId, mz, intensity) {
    this.peakId_ = parseInt(peakId);
    this.pos_ = parseFloat(mz);//rename to pos
    this.intensity_ = parseFloat(intensity);
    this.displayLevel_ = -1//rename to displayLevel
  }
  getId() {
    return this.peakId_;
  }
  getPos() {
    return this.pos_;
  }
  getIntensity() {
    return this.intensity_;
  }
  getDisplayLevel() {
    return this.displayLevel_;
  }
  setDisplayLevel(displayLevel) {
    this.displayLevel_ = displayLevel;
  }
  setIntensity(intensity) {
    this.intensity_ = intensity;
  }
}