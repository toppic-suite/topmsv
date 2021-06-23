enum ModType {//enum cannot be declared inside class
  Fixed,
  Unexpected,
  ProteinVariable,
  Variable
};

class MassShift {
  private leftPos_: number;
  private rightPos_: number;
  private massShift_: number;
  private annotation_: string;
  private type_: ModType;
  private ptmList_: Mod[];

  constructor(leftPos: number, rightPos: number, massShift: number, type: string, annotation: string, ptm: Mod | null = null) {
    this.leftPos_ = leftPos;
    this.rightPos_ = rightPos;
    this.massShift_ = massShift;
    this.type_ = this.setModType(type);
    this.annotation_ = annotation;
    this.ptmList_ = [];
    if (ptm) {
      this.ptmList_.push(ptm!);//ignore the possibility of ptm being null
    }
  }
  addNewPtm(ptm: Mod): void {
    this.ptmList_.push(ptm);
  }
  getLeftPos(): number {
    return this.leftPos_;
  }
  getRightPos(): number {
    return this.rightPos_;
  }
  getShift(): number {
    return this.massShift_;
  }
  getType(): ModType {
    return this.type_;
  }
  getAnnotation(): string {
    return this.annotation_;
  }
  getPtmList(): Mod[] {
    return this.ptmList_;
  }
  setModType(type: string): ModType {
    let modType: ModType;
    if (type == "Fixed") {
      modType = ModType.Fixed;
    }
    else if (type == "Protein variable") {
      modType = ModType.ProteinVariable;
    }
    else if (type == "Variable") {
      modType = ModType.Variable;
    }
    else {
      modType = ModType.Unexpected;
    }
    return modType;
  }
}