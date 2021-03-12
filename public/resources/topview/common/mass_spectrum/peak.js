class Peak{
    constructor(peakId, mz, intensity){
        this.peakId_ = parseInt(peakId);
        this.mz_ = parseFloat(mz);
        this.intensity_ = parseFloat(intensity);
        this.level_ = -1
    }
    getId(){
        return this.peakId_;
    }
    getMz(){
        return this.mz_;
    }
    getIntensity(){
        return this.intensity_;
    }
    getLevel(){
        return this.level_;
    }
    setLevel(level){
        this.level_ = level;
    }
    setIntensity(intensity){
        this.intensity_ = intensity;
    }
}