"use strict";
class PrsmGraph {
    constructor(svgId, prsmObj, graphData = null) {
        this.id_ = svgId;
        this.para_ = new PrsmPara();
        this.data_ = graphData;
        if (!this.data_) {
            this.data_ = new PrsmViewData();
            if (!prsmObj) {
                console.error("ERROR: PrsmObj is empty!");
                return;
            }
            this.data_.initData(prsmObj, this.para_);
        }
    }
    getData() {
        return this.data_;
    }
    getPara() {
        return this.para_;
    }
    redraw() {
        if (!this.data_) {
            console.error("PrsmGraph data is empty");
            return;
        }
        this.data_.updatePara(this.para_);
        drawPrsm(this.id_, this.para_, this.data_);
    }
}
