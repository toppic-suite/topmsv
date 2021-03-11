class Spectrum {
  envList_ = [];
  constructor(id, level, peakList, nIon, cIon, mass, charge = -1, mz = -1) {
    this.id_ = id; 
    this.level_ = level;
    this.peakList_ = peakList;
    this.nIon_ = nIon;
    this.cIon_ = cIon;
    this.mass_ = parseFloat(mass);
    this.charge_ = parseInt(charge);
    this.mz_ = parseFloat(mz);
   }
   getSpectrumId() {
    return this.id_;
   }
   getSpectrumLevel() {
    return this.level_;
   }
   getPeaks() {
    return this.peakList_;
   }
   getEnvs() {
    return this.envList_;
   }
   getNTerminalIon() {
    return this.nIon_;
   }
   getCTerminalIon() {
    return this.cIon_;
   }
   getPrecMass() {
    return this.mass_;
   }
   getPrecCharge() {
    return this.charge_;
   }
   getPrecMz() {
    return this.mz_;
   }
   setPeaks(peaks) {
    this.peakList_ = peaks;
   }
   setEnvs(envs) {
    this.envList_ = envs;
   }
   addNTerminalIon(ion) {
    this.nIon_.push(ion);
   }
   addCTerminalIon(ion) {
    this.cIon_.push(ion);
   }
}