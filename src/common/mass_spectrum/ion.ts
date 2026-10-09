class Ion {
  private id_: string;
  private name_: string;
  private terminal_: string;
  private massShift_: number;
  private massError_: number | undefined;
  private ppmError_: number | undefined;
  // display position of a matched fragment ion (the N of b/c/y/z-N), undefined
  // for a plain ion type
  private pos_: number | undefined;

  constructor(id: string, name: string, terminal: string, massShift: number, massError?: number, ppmError?: number) {
    this.id_ = id;
    this.name_ = name;
    this.terminal_ = terminal;//"N" or "C"
    this.massShift_ = massShift;
    this.massError_ = massError;
    this.ppmError_ = ppmError;
  }
  getId(): string {
    return this.id_;
  }
  getPos(): number | undefined {
    return this.pos_;
  }
  setPos(pos: number): void {
    this.pos_ = pos;
  }
  getName(): string {
    return this.name_;
  }
  getTerminal(): string {
    return this.terminal_;
  }
  getShift(): number {
    return this.massShift_;
  }
  getMassError(): number | undefined {
    return this.massError_;
  }
  getPpmError(): number | undefined {
    return this.ppmError_;
  }
}