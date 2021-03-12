class Spectrum {
  constructor(id, level, peakList, nIon, cIon, mass, charge = -1, mz = -1) {
    this.id_ = id; 
    this.level_ = level;
    this.peakList_ = peakList;
    this.nIon_ = nIon;
    this.cIon_ = cIon;
    this.precMass_ = parseFloat(mass);
    this.precCharge_ = parseInt(charge);
    this.precMz_ = parseFloat(mz);
    this.envList_ = [];
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
    return this.precMass_;
   }
   getPrecCharge() {
    return this.precCharge_;
   }
   getPrecMz() {
    return this.precMz_;
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