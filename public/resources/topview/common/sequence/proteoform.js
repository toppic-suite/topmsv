class Proteoform {
  massShiftList_ = [];
  prefixMasses_ = [];
  suffixMasses_ = [];

  constructor (id, protName, seq, firstPos, lastPos, protMass, massShiftList, fixedPtm, protVarPtm = [], varPtm = []) {
    this.id_ = id;
    this.protName_ = protName;
    this.seq_ = seq;
    this.firstPos_ = parseInt(firstPos);
    this.lastPos_ = parseInt(lastPos);
    this.protMass_ = parseFloat(protMass);//rename to prot_mass
    this.massShiftList_ = massShiftList.concat(fixedPtm, protVarPtm, varPtm);
    this.compPrefixSuffixMasses();
  }
  /**getters */
  getId() {
    return this.id_;
  }
  getProtName() {
    return this.protName_;
  }
  getSeq() {
    return this.seq_;
  }
  getFirstPos() {
    return this.firstPos_;
  }
  getLastPos() {
    return this.lastPos_;
  }
  getMass() {
    return this.protMass_;
  }
  getProtVarPtm() {
    let protVarPtm = [];
    this.massShiftList_.forEach(shift => {
      if (shift.getType() == "Protein variable") {
        protVarPtm.push(shift);
      }
    })
    return protVarPtm;
  }
  getVarPtm() {
    let varPtm = [];
    this.massShiftList_.forEach(shift => {
      if (shift.getType() == "Variable") {
        varPtm.push(shift);
      }
    })
    return varPtm;
  }
  getUnknownMassShift() {
    let massShiftList = [];
    this.massShiftList_.forEach(shift => {
      if (shift.getType() == "unexpected") {
        massShiftList.push(shift);
      }
    })
    return massShiftList;
  }
  getUnknownMassShiftAndVarPtm() {//return unknown mass shift and variable ptm in one array 
    let massShiftList = [];
    let fixedPtmMasses = [];
    let variablePtmPrefixMasses = [];
    let variablePtmSuffixMasses = [];
    let unexpectedPrefixMasses = [];
    let unexpectedSuffixMasses = [];
    [fixedPtmMasses, variablePtmPrefixMasses, variablePtmSuffixMasses, unexpectedPrefixMasses, unexpectedSuffixMasses] = this.compMassShiftMasses();
    for (let i = 0; i < this.seq_.length; i++) {
      let mass = variablePtmPrefixMasses[i] + unexpectedPrefixMasses[i];
      if (mass != 0.0) {
        let massShift = new MassShift(i, i+1, mass, "unexpected", mass.toFixed(4));
        massShiftList.push(massShift);
      }
    }
    return massShiftList;
  }
  getFixedPtm() {
    let fixedPtm = [];
    this.massShiftList_.forEach(shift => {
      if (shift.getType() == "Fixed") {
        fixedPtm.push(shift);
      }
    })
    return fixedPtm;
  }
  getAllShift() {
    return this.massShiftList_;
  }
  /**compute masses and set to the private members of class*/
  compPrefixSuffixMasses() {
    let fixedPtmMasses = [];
    let variablePtmPrefixMasses = [];
    let variablePtmSuffixMasses = [];
    let unexpectedPrefixMasses = [];
    let unexpectedSuffixMasses = [];
    let aminoAcidMasses = this.compAminoAcidMasses();
    [fixedPtmMasses, variablePtmPrefixMasses, variablePtmSuffixMasses, unexpectedPrefixMasses, unexpectedSuffixMasses] = this.compMassShiftMasses();
    let prefixModResidueMasses = this.compPrefixModResidueMasses(aminoAcidMasses, fixedPtmMasses, variablePtmPrefixMasses, unexpectedPrefixMasses);
    this.compPrefixMasses(aminoAcidMasses, fixedPtmMasses, variablePtmPrefixMasses, unexpectedPrefixMasses);
    this.compSuffixMasses(aminoAcidMasses, fixedPtmMasses, variablePtmSuffixMasses, unexpectedSuffixMasses);

    //console.log("aminoAcidMasses", aminoAcidMasses);
    //console.log("fixedPtmMasses", fixedPtmMasses);
    //console.log("unexpectedSuffixMasses", unexpectedSuffixMasses);

    if (isNaN(this.protMass_)) {//if it is inspect page
      this.compProteoformMass(prefixModResidueMasses);
    }
  }

  compPrefixModResidueMasses(aminoAcidMasses, fixedPtmMasses, variablePtmPrefixMasses, unexpectedPrefixMasses) {//compute amino acid mass in prefix
    let prefixModResidueMasses = new Array(this.seq_.length).fill(0);
    for (let i = 0; i < this.seq_.length; i++) {
      let mass = aminoAcidMasses[i] + fixedPtmMasses[i]  
        + variablePtmPrefixMasses[i] + unexpectedPrefixMasses[i];
        prefixModResidueMasses[i] = mass;
    }
    return prefixModResidueMasses;
  }
  compProteoformMass(prefixModResidueMasses) {//compute proteoform mass
    let mass = 0;
    if (this.seq_) {
      for (let i = 0; i < this.seq_.length; i++) {
        mass = mass + prefixModResidueMasses[i];
      }
      mass = mass + getWaterMass(); 
    } 
    this.protMass_ = mass;
  }
  compAminoAcidMasses() {//compute mass of each amino acid
    let residueMasses = new Array(this.seq_.length);
    for (let i = 0; i < this.seq_.length; i++) {
      let isotopes = getAminoAcidDistribution(this.seq_[i]);
      residueMasses[i] = isotopes[0].mass;
    }
    return residueMasses;
  }
  compMassShiftMasses() {//compute proteoform mass with ptm shifts added
    let fixedPtmMasses = new Array(this.seq_.length).fill(0);
    let variablePtmPrefixMasses = new Array(this.seq_.length).fill(0);
    let variablePtmSuffixMasses = new Array(this.seq_.length).fill(0);
    let unexpectedPrefixMasses = new Array(this.seq_.length).fill(0);
    let unexpectedSuffixMasses = new Array(this.seq_.length).fill(0);

    this.massShiftList_.forEach(massShift => {
      if (massShift.getType() == "Fixed") {
        let pos = massShift.getLeftPos();
        fixedPtmMasses[pos-this.firstPos_] = parseFloat(massShift.getShift());
      }
      else if(massShift.getType() == "Protein variable") {
        let pos = massShift.getLeftPos();
        variablePtmPrefixMasses[pos-this.firstPos_] += parseFloat(massShift.getShift());
        variablePtmSuffixMasses[pos-this.firstPos_] += parseFloat(massShift.getShift());
  
      }
      else if(massShift.getType() == "Variable") {
        let leftPos = massShift.getLeftPos(); 
        let rightPos = massShift.getRightPos();
        variablePtmPrefixMasses[leftPos-this.firstPos_] += parseFloat(massShift.getShift());
        variablePtmSuffixMasses[rightPos-this.firstPos_] += parseFloat(massShift.getShift());
      }
      else{
        unexpectedPrefixMasses[massShift.getLeftPos() - this.firstPos_] += parseFloat(massShift.getShift());
        unexpectedSuffixMasses[massShift.getRightPos() - 1 - this.firstPos_] += parseFloat(massShift.getShift());  
      }
    })
    return [fixedPtmMasses, variablePtmPrefixMasses, variablePtmSuffixMasses, unexpectedPrefixMasses, unexpectedSuffixMasses];
  }

  compPrefixMasses(aminoAcidMasses, fixedPtmMasses, variablePtmPrefixMasses, unexpectedPrefixMasses) {//compute theoratical prefix mass
    if (this.seq_) {
      let mass = 0; 
      for (let i = 0; i < this.seq_.length - 1; i++) {
        mass = mass + aminoAcidMasses[i] + fixedPtmMasses[i]  
        + variablePtmPrefixMasses[i] + unexpectedPrefixMasses[i];
        let theoMass = new TheoMass(mass, i);
        this.prefixMasses_.push(theoMass);
      }
    } 
  }

  compSuffixMasses(aminoAcidMasses, fixedPtmMasses, variablePtmSuffixMasses, unexpectedSuffixMasses) {//compute theoratical suffix mass
    if (this.seq_) {
      let mass = 0;
      for (let i = this.seq_.length - 1; i > 0; i--) {
        mass = mass + aminoAcidMasses[i] + fixedPtmMasses[i]  
        + variablePtmSuffixMasses[i] + unexpectedSuffixMasses[i];
        let theoMass = new TheoMass(mass, i);
        this.suffixMasses_.push(theoMass);
      }
    }
  }
  /**other functions that return calculated values */
  getNMasses(nIonType) {//theoretical mass with n-term ion shift added
    let ionMassShift = getIonMassShift(nIonType);
    //console.log("N mass shift", ionMassShift);
    let massList = [];
    massList.push(new TheoMass(0, -1));
    this.prefixMasses_.forEach(theoMass => {
      let newMass = theoMass.getMass() + ionMassShift;
      let pos = theoMass.getPos();
      let ionMassAdjusted = new TheoMass(newMass, pos);
      
      massList.push(ionMassAdjusted);
    })
    massList.push(new TheoMass(this.protMass_, this.prefixMasses_.length));
    return massList;
  }

  getCMasses(cIonType) {//theoretical mass with c-term ion shift added
    let ionMassShift = getIonMassShift(cIonType);
    //console.log("C mass shift", ionMassShift);
    let massList = []; 
    massList.push(new TheoMass(0, -1));
    this.suffixMasses_.forEach(theoMass => {
      let newMass = theoMass.getMass() + ionMassShift;
      let pos = theoMass.getPos();
      let ionMassAdjusted = new TheoMass(newMass, pos);
      
      massList.push(ionMassAdjusted);
    })
    massList.push(new TheoMass(this.protMass_, this.suffixMasses_.length));
    return massList;
  }

}