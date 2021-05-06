class PrsmData {//prsmViewData
  //missing underscore in variable names
  residues; 
  formFirstPos;
  formLastPos;
  breakPoints;

  sequence;
  fixedPtms;
  variablePtms;
  massShifts;
  annotations;
  proteoform;
  //information above are retrieved from prsm and proteoform object

  rowNum;
  displayFirstPos;
  displayLastPos;
  // if there is a skipping line at the beginning
  showStartSkipped; 
  startSkippedInfo = "";
  // if there is a skipping line at the end
  showEndSkipped;
  endSkippedInfo = "";

  initData = function(prsm, para) {
    this.parseData(prsm);
    this.updatePara(para);
    this.addColor();
  }
  // form residues from sequence
  formResidues = function(sequence) {
    let residues = [];
    for (let i = 0; i < sequence.length; i++) {
      let tempObj = {
        position: i.toString(),
        acid: sequence.charAt(i).toUpperCase()
      }
    residues.push(tempObj);
    }
    return residues;
  }
  generateAnnotation(protVarPtm, variablePtm, massShift){
    let anno = [];
    //annotation in prsm object contains only variable and unknown shifts
    for (let i = 0; i < protVarPtm.length; i++){
      let temp = {"annoText":protVarPtm[i].getAnnotation(), "leftPos":0, "rightPos":0};
      temp.leftPos = protVarPtm[i].getLeftPos();
      temp.rightPos = temp.leftPos + 1;
      anno.push(temp);
    }
    for (let i = 0; i < variablePtm.length; i++){
      let temp = {"annoText":variablePtm[i].getAnnotation(), "leftPos":0, "rightPos":0};
      temp.leftPos = variablePtm[i].getLeftPos();
      temp.rightPos = temp.leftPos + 1;
      anno.push(temp);
    }
    for (let i = 0; i < massShift.length; i++){
      let temp = {"annoText":massShift[i].getAnnotation(), "leftPos":massShift[i].getLeftPos(), "rightPos":massShift[i].getRightPos()};
      anno.push(temp);
    }
    return anno;
  }
  parseData = function(prsm) {
    let proteoformObj = prsm.getProteoform();
    this.residues = this.formResidues(proteoformObj.getSeq());
    this.formFirstPos = proteoformObj.getFirstPos();
    this.formLastPos = proteoformObj.getLastPos();
    this.breakPoints = prsm.getBreakPoints();
    this.fixedPtms = proteoformObj.getFixedPtm();
    this.protVariablePtms = proteoformObj.getProtVarPtm();
    this.variablePtms = proteoformObj.getVarPtm();
    this.massShifts = proteoformObj.getUnknownMassShift();
    this.sequence = proteoformObj.getSeq();
    this.proteoform = proteoformObj;
    this.annotations = this.generateAnnotation(this.protVariablePtms, this.variablePtms, this.massShifts);
  }
 
  updatePara = function(para) {
    let len = this.residues.length; 
    //console.log(this.formFirstPos, this.formLastPos, len, para.rowLength);
    // Include 5 amino acids before and after the form
    this.displayFirstPos = Math.floor((this.formFirstPos - 5) / para.rowLength) * para.rowLength;
    if (this.displayFirstPos < 0) {
      this.displayFirstPos = 0;
    }
    this.displayLastPos = Math.ceil((this.formLastPos + 6) / para.rowLength) * para.rowLength - 1;
    //console.log("display last pos ", this.displayLastPos);
    if (this.displayLastPos > (len -1)) {
      this.displayLastPos = len -1;
    }
    this.rowNum = Math.ceil((this.displayLastPos - this.displayFirstPos + 1)/para.rowLength);
    
    // skipping line
    this.showStartSkipped = false;
    this.showEndSkipped = false;
    if (para.showSkippedLines) {
      if (this.displayFirstPos !== 0) {
        this.showStartSkipped = true;
		    this.startSkippedInfo = "... "+ this.displayFirstPos 
          + " amino acid residues are skipped at the N-terminus ... ";
      }
      if (this.displayLastPos !== len - 1) {
        this.showEndSkipped = true;
		    this.endSkippedInfo =  "... "+ (len - 1 - this.displayLastPos) 
          + " amino acid residues are skipped at the C-terminus ... ";
      }
    }

    //console.log(this.displayFirstPos, this.displayLastPos, 
    //  this.rowNum, this.showStartSkipped, this.showEndSkipped);
  }

  addColor = function() {
    for (let i = 0; i < this.residues.length; i++) {
      let residue = this.residues[i];
      let pos = residue.position;
      if (pos < this.formFirstPos || pos > this.formLastPos) {
        residue.color = "grey";
      }
      else {
        residue.color = "black";
      }
    }
    for (let i = 0; i < this.fixedPtms.length; i++) {
      let ptm = this.fixedPtms[i];
      let pos = ptm.getLeftPos();
      this.residues[pos].color = "red";
    }
  }
}