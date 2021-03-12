class Envelope{
    constructor(monoMass, charge, intensity = -1){
        this.monoMass_ = monoMass;
        this.charge_ = charge;
        this.intensity_ = intensity;
        this.color_ = "";
        this.level_ = -1;
        this.peaks_ = [];
    }
    getMonoMass(){
        return this.monoMass_;
    }
    getCharge(){
        return this.charge_;
    }
    getIntensity(){
        return this.intensity_;
    }
    getColor(){
        return this.color_;
    }
    getLevel(){
        return this.level_;
    }
    getTheoPeaks(){
        return this.peaks_;
    }
    setColor(color){
        this.color_ = color;
    }
    setLevel(level){
        this.level_ = level;
    }
    addTheoPeaks(peak){
        this.peaks_.push(peak);
    }
}