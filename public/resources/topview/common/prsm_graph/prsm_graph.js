class PrsmGraph {

  /*constructor(svgId, prsm, data = new PrsmData(), para = new PrsmPara()){
    this.id = svgId;
    this.para = para;
    this.data = data;
    if (prsm) {
      this.data.initData(prsm, this.para); 
    }
  }*/
  constructor(svgId, prsmObj, graphData = null){
    this.id = svgId;
    this.para = new PrsmPara();
    this.data = graphData;

    if (!this.data){
      this.data = new PrsmData();
      this.data.initData(prsmObj, this.para);   
    }
  }

  redraw = function(){
    //console.log(this.envList);
    this.data.updatePara(this.para);
    drawPrsm(this.id, this.para, this.data); 
  }

}
