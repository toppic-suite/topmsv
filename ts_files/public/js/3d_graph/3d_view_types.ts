type Range3DView = {
  "rtmax": number,
  "rtmin": number,
  "intmax": number,
  "intmin": number,
  "mzmax": number,
  "mzmin": number,
  "mzrange": number,
  "rtrange": number,
  "intrange": number,
  "intscale": number
}

type ConfigData = {
  "RTMAX": number,
  "RTMIN": number,
  "INTMAX": number,
  "INTMIN": number,
  "MZMAX": number,
  "MZMIN": number, 
  "COUNT": number
}

interface Peak3DView extends THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> {
  "mz": number,
  "rt": number, 
  "int": number, 
  "height": number, 
  "name": string, 
  "scanID": number, 
  "lowPeak": boolean,
  "pointid": string    
}

type PeakDataDB = {
  "ID": string,
  "MZ": string,
  "INTENSITY": string,
  "RETENTIONTIME": string,
  "COLOR": string
}

interface Feature3DView extends THREE.Line<THREE.BufferGeometry, THREE.LineDashedMaterial> {
  "featureId": number, 
  "mz_low": number,
  "mz_high": number,
  "rt_low": number,
  "rt_high": number, 
  "charge": number,
  "mass": number,
  "mono_mz": number,
  "intensity": number 
}

type FeatureDataDB = {
  "id": string, 
  "mz_low": string,
  "mz_high": string,
  "rt_low": string,
  "rt_high": string, 
  "charge": string,
  "mass": string,
  "mono_mz": string,
  "intensity": string
}

type InteRtObj = {
  "rt": number,
  "inteSum": number,
  "scanNum": number,
  "ionTime": number
}