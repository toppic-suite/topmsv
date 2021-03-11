class Proteoform {
  massShiftList_ = [];
  fixedPtmMasses_ = [];
  prefixMasses_ = [];
  suffixMasses_ = [];
  variablePtmPrefixMasses_ = [];
  variablePtmSuffixMasses_ = [];
  unexpectedPrefixMasses_ = [];
  unexpectedSuffixMasses_ = [];
  prefixModResidueMasses_ = [];

  constructor (id, protName, seq, firstPos, lastPos, mass, massShiftList, fixedPtm, protVarPtm = [], varPtm = []) {
    this.id_ = id;
    this.protName_ = protName;
    this.seq_ = seq;
    this.firstPos_ = parseInt(firstPos);
    this.lastPos_ = parseInt(lastPos);
    this.mass_ = parseFloat(mass);
    this.massShiftList_ = massShiftList;
    this.fixedPtm_ = fixedPtm;
    this.protVarPtm_ = protVarPtm;
    this.varPtm_ = varPtm;

    this.compResidueMasses();
    this.compFixedPtmMasses();
    this.compVariablePtmMasses();
    this.compUnexpectedMasses();
    this.compPrefixModResidueMasses();
    this.compPrefixMasses();
    this.compSuffixMasses();

    if (!mass) {//if it is inspect page
        this.compProteoformMass();
      }
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
    return this.mass_;
  }
  getProtVarPtm() {
    return this.protVarPtm_;
  }
  getVarPtm() {
    return this.varPtm_;
  }
  getMassShift() {
    return this.massShiftList_;
  }
  getFixedPtm() {
    return this.fixedPtm_;
  }
  getAllShift() {
    let totalShift = this.fixedPtm_.concat(this.protVarPtm_, this.varPtm_, this.massShiftList_);
    return totalShift;
  }
  /**compute masses and set to the private members of class*/
  compPrefixModResidueMasses() {
    this.prefixModResidueMasses_ = new Array(this.seq_.length).fill(0);
    for (let i = 0; i < this.seq_.length; i++) {
      let mass = this.residueMasses_[i] + this.fixedPtmMasses_[i]  
        + this.variablePtmPrefixMasses_[i] + this.unexpectedPrefixMasses_[i];
      this.prefixModResidueMasses_[i] = mass;
    }
  }
  compProteoformMass() {
    let mass = 0;
    if (this.seq_) {
      for (let i = 0; i < this.seq_.length; i++) {
        mass = mass + this.prefixModResidueMasses_[i];
      }
      mass = mass + getWaterMass(); 
    } 
    this.mass_ = mass;
  }
  compResidueMasses() {
    this.residueMasses_ = new Array(this.seq_.length);
    for (let i = 0; i < this.seq_.length; i++) {
      let isotopes = getAminoAcidIsotopes(this.seq_[i]);
      this.residueMasses_[i] = isotopes[0].mass;
    }
  }
  compFixedPtmMasses() {
    this.fixedPtmMasses_ = new Array(this.seq_.length).fill(0);
    this.fixedPtm_.forEach((element) => {
      let pos = element.getLeftPos();
      this.fixedPtmMasses_[pos-this.firstPos_] = parseFloat(element.getShift());
    });
  }

  compVariablePtmMasses() {
    this.variablePtmPrefixMasses_ = new Array(this.seq_.length).fill(0);
    this.variablePtmSuffixMasses_ = new Array(this.seq_.length).fill(0);
    this.protVarPtm_.forEach((element) => {
      let pos = element.getLeftPos();
      this.variablePtmPrefixMasses_[pos-this.firstPos_] += parseFloat(element.getShift());
      this.variablePtmSuffixMasses_[pos-this.firstPos_] += parseFloat(element.getShift());
    });
    this.varPtm_.forEach((element) => {
      let leftPos = element.posList[i].getLeftPos(); 
      let rightPos = element.posList[i].getRightPos();
      this.variablePtmPrefixMasses_[leftPos-this.firstPos_] += parseFloat(element.getShift());
      this.variablePtmSuffixMasses_[rightPos-this.firstPos_] += parseFloat(element.getShift());
    });
  }

  compUnexpectedMasses() {
    this.unexpectedPrefixMasses_ = new Array(this.seq_.length).fill(0);
    this.unexpectedSuffixMasses_ = new Array(this.seq_.length).fill(0);
    this.massShiftList_.forEach((element) => {
      this.unexpectedPrefixMasses_[element.getLeftPos() - this.firstPos_] += parseFloat(element.getShift());
      this.unexpectedSuffixMasses_[element.getRightPos() - 1 - this.firstPos_] += parseFloat(element.getShift());
    });
  }

  compPrefixMasses() {
    if (this.seq_) {
      let mass = 0; 
      for (let i = 0; i < this.seq_.length - 1; i++) {
        mass = mass + this.residueMasses_[i] + this.fixedPtmMasses_[i]  
        + this.variablePtmPrefixMasses_[i] + this.unexpectedPrefixMasses_[i];
        let theoMass = new TheoMass(mass, i);
        this.prefixMasses_.push(theoMass);
      }
    } 
  }
  
  compMassShiftList() {
    this.massShiftList_ = [];
    for (let i = 0; i < this.seq_.length; i++) {
      let mass = this.variablePtmPrefixMasses_[i] + this.unexpectedPrefixMasses_[i];
      if (mass != 0.0) {
        let massShift = new MassShift(i, i+1, mass, "unexpected", mass.toFixed(4));
        this.massShiftList_.push(massShift);
      }
    }
  }

  compSuffixMasses() {
    if (this.seq_) {
      let mass = 0;
      for (let i = this.seq_.length - 1; i > 0; i--) {
        mass = mass + this.residueMasses_[i] + this.fixedPtmMasses_[i]  
        + this.variablePtmSuffixMasses_[i] + this.unexpectedSuffixMasses_[i];
        let theoMass = new TheoMass(mass, i);
        this.suffixMasses_.push(theoMass);
      }
    }
  }
  /**other functions that return calculated values */
  getNMasses(nIonType) {
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
    massList.push(new TheoMass(this.mass_, this.prefixMasses_.length));
    return massList;
  }

  getCMasses(cIonType) {
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
    massList.push(new TheoMass(this.mass_, this.suffixMasses_.length));
    return massList;
  }

}