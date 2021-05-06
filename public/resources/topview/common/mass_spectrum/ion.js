class Ion {
  constructor(id, name, terminal, massShift) {
    this.id_ = id;
    this.name_ = name;
    this.terminal_ = terminal;//"N" or "C" --> check if "N-terminus" or "C-terminus"
    this.massShift_ = parseFloat(massShift);
  }
  getId() {
    return this.id_;
  }
  getName() {
    return this.name_;
  }
  getTerminal() {
    return this.terminal_;
  }
  getShift() {
    return this.massShift_;
  }
}