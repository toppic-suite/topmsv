class Ion {
  constructor(name, terminal, massShift) {
    this.name_ = name;
    this.terminal_ = terminal;
    this.massShift_ = parseFloat(massShift);
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