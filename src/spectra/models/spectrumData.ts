/** Scan counts and the currently shown MS1 / MS2 spectrum ids of the spectra browser */
class SpectrumData {
  private msOneScanNum_: number = 0;
  private msTwoScanNum_: number = 0;
  private curMsOneId_: number = -1;
  private curMsTwoId_: number = -1;

  getMsOneScanNum(): number {
    return this.msOneScanNum_;
  }
  getMsTwoScanNum(): number {
    return this.msTwoScanNum_;
  }
  getCurMsOneId(): number {
    return this.curMsOneId_;
  }
  getCurMsTwoId(): number {
    return this.curMsTwoId_;
  }
  setMsOneScanNum(scanNum: number): void {
    this.msOneScanNum_ = scanNum;
  }
  setMsTwoScanNum(scanNum: number): void {
    this.msTwoScanNum_ = scanNum;
  }
  setCurMsOneId(scanId: number): void {
    this.curMsOneId_ = scanId;
  }
  setCurMsTwoId(scanId: number): void {
    this.curMsTwoId_ = scanId;
  }
}
