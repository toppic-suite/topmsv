/**	@function SpectrumData
 * @description assign level to the input data to the spectrum graphs 
 */
class SpectrumData{
    mzLevel = [{"interval": 1, "intervalNum": 0, "maxPeakIdx":-1, "maxInte": -10000},
        {"interval": 1.5, "intervalNum": 0, "maxPeakIdx":-1, "maxInte": -10000},
        {"interval": 2, "intervalNum": 0, "maxPeakIdx":-1, "maxInte": -10000},
        {"interval": 3, "intervalNum": 0, "maxPeakIdx":-1, "maxInte": -10000},
        {"interval": 5, "intervalNum": 0, "maxPeakIdx":-1, "maxInte": -10000},
        {"interval": 10, "intervalNum": 0, "maxPeakIdx":-1, "maxInte": -10000}, 
        {"interval": 20, "intervalNum": 0, "maxPeakIdx":-1, "maxInte": -10000}]//m/z interval
    constructor() {}

/**
 * @function assignLevelPeaks
 * @description assigns level to each peak and envelope to control the number of peaks/envelopes shown at once
 * @param {object} peaks - fragment ion peaks list
 */
    assignLevelPeaks(peaks){
        //iterating once through the peakList or envList, assign level to each peak/envelope
        //initially, all peaks/envs are assigned to the largest level
        //and if a peak/env is the highest peak in the given interval (ex: betwen 200 - 300 m/z or 150m/z - 200m/z)
        //the peak's level is updated
        peaks.sort(function(x, y){
            return d3.ascending(x.getMz(), y.getMz());
        })

        let minMz = peaks[0].getMz();

        for (let i = 0; i < peaks.length; i++){
            let mz = peaks[i].getMz() - minMz;
            let inte = peaks[i].getIntensity();
            peaks[i].setLevel(0);//as an initial value

            //for each peak, check with each interval level to see if the peak is the maximum intensity in the range
            for (let k = 0; k < this.mzLevel.length; k++){
                let eachInterval = this.mzLevel[k];
                let idx = Math.floor(mz / eachInterval.interval);

                if (idx <= eachInterval.intervalNum){
                    if (inte > eachInterval.maxInte){
                        eachInterval.maxInte = inte;
                        eachInterval.maxPeakIdx = i;
                    }
                }
                else{
                    //update level of the highest peak in the currnet interval
                    //and increment the intervalNum (because this envelope belongs to next interval)
                    if (peaks[eachInterval.maxPeakIdx].getLevel() < k + 1){//k + 1 because assigned level should be between 1-7 (0 by default)
                        //don't update the peak level if it is already assigned a larger level (= if it is a max peak in larger range) 
                        peaks[eachInterval.maxPeakIdx].setLevel(k + 1);
                    }
                    eachInterval.maxInte = inte;
                    eachInterval.maxPeakIdx = i;
                    eachInterval.intervalNum = idx + eachInterval.interval;
                }
            }
        }
    }

    /**
     * @function assignLevelEnvs
     * @description assigns level to each peak and envelope to control the number of peaks/envelopes shown at once
     * @param {object} envs - envelope list
     */
    assignLevelEnvs(envs){
        //iterating once through the peakList or envList, assign level to each peak/envelope
        //initially, all peaks/envs are assigned to the smallest level (level 0)
        //and if a peak/env is the highest peak in the given interval (ex: betwen 200 - 300 m/z or 150m/z - 200m/z)
        //the peak's level is updated
        //lv. 0 has the smallest interval (=original data), lv.7 has the largest interval
        envs.sort(function(x, y){
            return d3.ascending(parseFloat(x.getTheoPeaks()[0].getMz()), parseFloat(y.getTheoPeaks()[0].getMz()));
        })
        for (let i = 0; i < envs.length; i++){
            let envPeaks = envs[i].getTheoPeaks();
            let mz = parseFloat(envPeaks[0].getMz())
            let inte = 0;
            
            for (let j = 0; j < envPeaks.length; j++){
                inte = Math.max(inte, parseFloat(envPeaks[j].getIntensity()));
            }
            envs[i].setLevel(0);//as an initial value

            for (let k = 0; k < this.mzLevel.length; k++){
                let eachInterval = this.mzLevel[k];
                let idx = Math.floor(mz / eachInterval.interval);
                if (idx <= eachInterval.intervalNum){
                    if (inte > eachInterval.maxInte){
                        eachInterval.maxInte = inte;
                        eachInterval.maxPeakIdx = i;
                    }
                }
                else{
                    //update level of the highest peak in the currnet interval
                    //and increment the intervalNum (because this envelope belongs to next interval)
                    if (eachInterval.maxPeakIdx >= 0){
                        if (envs[eachInterval.maxPeakIdx].getLevel() < k + 1){//k + 1 because assigned level should be between 1-7 (0 by default)
                            //don't update the peak level if it is already assigned a larger level (= if it is a max peak in larger range) 
                            envs[eachInterval.maxPeakIdx].setLevel(k + 1);
                        }
                    }
                    else{//if it is the first envelope, there is no previous interval
                        //if so, just update the interval information based on that envelope
                        envs[i].setLevel(k + 1);
                    }
                    eachInterval.maxInte = inte;
                    eachInterval.maxPeakIdx = i;
                    eachInterval.intervalNum = idx + eachInterval.interval;
                }
            }
        }
    }
}
