"use strict";
class SpectrumData {
    constructor() {
        this.msOneScanNum_ = 0;
        this.msTwoScanNum_ = 0;
        this.curMsOneId_ = -1;
        this.curMsTwoId_ = -1;
    }
    getMsOneScanNum() {
        return this.msOneScanNum_;
    }
    getMsTwoScanNum() {
        return this.msTwoScanNum_;
    }
    getCurMsOneId () {
        return this.curMsOneId_;
    }
    getCurMsTwoId() {
        return this.curMsTwoId_;
    }
    setMsOneScanNum(scanNum) {
        this.msOneScanNum_ = scanNum;
    }
    setMsTwoScanNum(scanNum) {
        this.msTwoScanNum_ = scanNum;
    }
    setCurMsOneId (scanId) {
        this.curMsOneId_ = scanId;
    }
    setCurMsTwoId(scanId) {
        this.curMsTwoId_ = scanId;
    }
}
