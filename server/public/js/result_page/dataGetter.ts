//in the external library axios.min.js
//@ts-nocheck //otherwise it won't find axios, which is added as a script
import {Graph} from "../3d_graph/graph_init/graph.js";

export class DataGetter {
  projectDir: string;
  constructor(projectDir: string) {
    this.projectDir = projectDir;
  }

  findNextLevelOneScan(scan): Promise<AxiosResponse<any>> {
    return axios.get('/findNextLevelOneScan', {
      params: {
        projectDir: this.projectDir,
        scanID: scan
      }
    });
  }

  getRelatedScan2 (scanID): Promise<AxiosResponse<any>> {
    // console.log("scanID:",scanID);
    return axios.get('/relatedScan2', {
      params: {
        projectDir: this.projectDir,
        scanID: scanID
      }
    });
  }

  getRelatedScan1 (scanID): Promise<AxiosResponse<any>> {
    // console.log("scanID:",scanID);
    return axios.get('/relatedScan1', {
      params: {
        projectDir: this.projectDir,
        scanID: scanID
      }
    });
  }

  getScanLevel(scanID): Promise<AxiosResponse<any>> {
    return axios.get('/scanlevel', {
      params: {
        projectDir: this.projectDir,
        scanID: scanID
      }
    });
  }

  getScanID(ID): Promise<AxiosResponse<any>> {
    return axios.get('/scanID', {
      params: {
        projectDir: this.projectDir,
        ID: ID
      }
    });
  }

  getPeakList(scanId): Promise<AxiosResponse<any>> {
    if (scanId !== '0') {
      return axios.get('/peaklist', {
        params: {
          projectDir: this.projectDir,
          scanID: scanId
        }
      });
    } else{
      alert("NULL");
      return Promise.reject();
    }
  }

  getEnvList(scan): Promise<AxiosResponse<any>> {
    let projectCode = document.querySelector<HTMLInputElement>("#projectCode");

    if (!projectCode) {
      console.error("project code cannot be found");
      return Promise.reject();
    }
    return axios.get('/envlist', {
      params: {
        projectDir: this.projectDir,
        scanID: scan,
        projectCode: projectCode.value
      }
    })
  }

  getEnvTable(scan): Promise<AxiosResponse<any>> {
    return axios.get('/envtable', {
      params: {
        projectDir: this.projectDir,
        scanID: scan // scan number actually
      }
    })
  }

/*     loadPeakList1(scanID) {
    if (scanID !== '0') {
        return axios.get('/peaklist', {
            params: {
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        }).then(function(response){
            getRT(scanID);
            peakList1_g = JSON.parse(response);
            document.getElementById("scanID1").innerText = scanID;
            return axios.get('/envlist', {
                params: {
                    projectDir: document.getElementById("projectDir").value,
                    scanID: scanID,
                    projectCode: document.getElementById("projectCode").value
                }
            });
        }).catch(function(error) {
            console.log(error);
        })
    }else{
        alert("NULL");
    }
} */

  getRT(scanNum, rtInteGraph): void {
    axios.get('/getRT', {
      params: {
        projectDir: this.projectDir,
        scanID: scanNum
      }
    }).then(function(response){
      let rt = parseFloat(response.data);
      if (rtInteGraph) {
        rtInteGraph.moveLine(rt);
      }
      let scanRtElem: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>("#scan1RT");

      if (scanRtElem) {
        scanRtElem.innerText = rt.toFixed(4);
        Graph.resultViz.getRtInteGraph().moveLine(rt);
        scanRtElem.innerText = rt.toFixed(Graph.resultViz.getConfig().floatDigit) + " (min)";  
      } else {
        throw(new Error("scan1RT <span> element doesn't exist"));
      }
    }).catch(function(error) {
      console.log(error);
    });
  }
/*
findNextLevelOneScan(scan) {
    return axios.get('/findNextLevelOneScan', {
        params: {
            projectDir: document.getElementById("projectDir").value,
            scanID: scan
        }
    });
}

    loadPeakList2(scanID, prec_mz, prec_charge, prec_inte, rt, levelOneScan) {
    if(scanID !== '0') {
        const graphFeatures = new GraphFeatures();
        // show envelope table for MS2
        showEnvTable(scanID);
        $("#switch").text('MS1');

        axios.get('/peaklist',{
            params:{
                projectDir: document.getElementById("projectDir").value,
                scanID: scanID
            }
        }).then(function(response) {
            peakList2_g = JSON.parse(response);
            return axios.get('/envlist', {
                params: {
                    projectDir: document.getElementById("projectDir").value,
                    scanID: scanID,
                    projectCode: document.getElementById("projectCode").value
                }
            })
        }).catch(function(error) {
            console.log(error);
        })
    }else{
        alert("NULL");
    }
} */

  getInteSumList(): Promise<AxiosResponse<any>> {
    return axios.get('/getInteSumList', {
      params: {
        projectDir: this.projectDir
      }
    })
  }

  prev(scanID): Promise<AxiosResponse<any>> {
    return axios.get('/prev', {
      params: {
        projectDir: this.projectDir,
        scanID: scanID
      }
    });
  }

  next(scanID): Promise<AxiosResponse<any>> {
    return axios.get('/next', {
      params: {
        projectDir: this.projectDir,
        scanID: scanID
      }
    });
  }

  getScanLevelTwoList(scanID): Promise<AxiosResponse<any>> {
    return axios.get('/scanTwoList', {
      params: {
        projectDir: this.projectDir,
        scanID: scanID
      }
    });
  }

  getPrecursorMz(ms2Scan): Promise<AxiosResponse<any>> {
    return axios.get('/precMZ', {
      params: {
        projectDir: this.projectDir,
        ms2Scan: ms2Scan
      }
    })
  }
}