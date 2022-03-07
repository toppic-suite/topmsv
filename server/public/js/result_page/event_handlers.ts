import { ResultViz } from "./resultViz.js";
import {Graph} from '../3d_graph/graph_init/graph.js';
import {GraphData} from '../3d_graph/graph_data/graph_data.js';
import {GraphFeature} from '../3d_graph/graph_data/graph_feature.js';
import {GraphRender} from '../3d_graph/graph_control/graph_render.js';

import {DataGetter} from '../result_page/dataGetter.js';
import {init2D} from '../result_page/init2D.js';
import { showEnvTable } from "./env_table.js";

export class EventHandler {
  resultViz: ResultViz;

  constructor(resultViz: ResultViz) {
    this.resultViz = resultViz;
   }
  
  initialize(): void {
    let projectDir: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#projectDir");
    if (!projectDir) {
      console.error("project directory information cannot be found");
      return;
    }
    const dataGetter = new DataGetter(projectDir.value);
  
    let requestButton: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>('#request');
    if (requestButton) {
      requestButton.addEventListener('click', (): void => {
        // $( "#spectrum2" ).empty();
        let requestInputBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#scanID");
        let requestMinBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#rangeMin");
        let requestMaxBox: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#rangeMax");

        if (requestInputBox && requestMinBox && requestMaxBox) {
          let requestID: string = requestInputBox.value;
          let min: string = requestMinBox.value;
          let max: string = requestMaxBox.value;
          if(parseInt(requestID) >= parseInt(min) && parseInt(requestID) <= parseInt(max)) {
            init2D(parseInt(requestID), this.resultViz.getConfig());
            this.resultViz.update3D(parseInt(requestID));
            $("#scanID").val("");
          } else {
            alert("Please type in one scanID within range!")
          }
        } else {
          console.error(`one of the following is not found on the page. #scanID: ${requestInputBox} #rangeMin: ${requestMinBox} #rangeMaxBox ${requestMaxBox}`);
        }
      },false)
    }
    
    let resetButton: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>('#resetGraphs');
    if (resetButton) {
      resetButton.addEventListener('click', (): void => {
        //let min = document.getElementById("rangeMin").value;
        //init2D(parseInt(min));
        let scanElem: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>("#scanID1");
        if (scanElem) {
          let curScan: number = parseFloat(scanElem.innerHTML);
          $("#rtRangeMin").val("");
          $("#rtRangeMax").val("1");
        
          $("#mzRangeMin").val("");
          $("#mzRangeMax").val("50");

          $("#cutoff-threshold").val("");
          this.resultViz.update3DShowFull(curScan);
        } else {
          console.error("scanID1 <span> element cannot be found");
        }
      })
    }

    let prev1: HTMLButtonElement | null  = document.querySelector<HTMLButtonElement>('#prev1');
    if (prev1) {
      prev1.addEventListener('click', (): void => {
        let scanElem: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>("#scanID1");
        if (scanElem) {
          let scanID1: string = scanElem.innerHTML;
          if (scanID1 !== '') {
            dataGetter.prev(scanElem.innerHTML)
              .then((res) => {
                let response = res.data;
                if(response !== 0){
                  return dataGetter.getScanID(response);
                } else {
                  alert("NULL");
                }
              }).then((res) => {
                if (res == undefined) {
                  throw new Error("response is undefined");
                } else {
                  let response = res.data;
                  if (response == undefined) {
                    throw new Error("response is undefined");
                  }
                  if(response !== 0){
                    init2D(response, this.resultViz.getConfig());
                    this.resultViz.update3D(response);
                  } else {
                    alert("NULL");
                  }
                }
              }).catch((error) => {
                console.log(error);
              })
          }  
        } else {
            console.error("scanID1 <span> element cannot be found");
        }
      },false)
    }

    let next1: HTMLButtonElement | null  = document.querySelector<HTMLButtonElement>('#next1');
    if (next1) {
      next1.addEventListener('click', () => {
        let scanElem: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>("#scanID1");
        if (scanElem) {
          let scanID1: string = scanElem.innerHTML;
          if (scanID1 !== '') {
            dataGetter.next(scanElem.innerHTML)
              .then((res) => {
                let response = res.data;
                if(response !== 0){
                  return dataGetter.getScanID(response);
                } else {
                  alert("NULL");
                }
              })
              .then((res) => {
                if (res == undefined) {
                  throw new Error("response is undefined");
                }
                let response = res.data;
                if(response !== 0) {
                  init2D(response, this.resultViz.getConfig());
                  this.resultViz.update3D(response);
                } else {
                    alert("NULL");
                }
              })
              .catch((error) => {
                console.log(error);
              })
          } else {
            console.error("scanID1 <span> element cannot be found");
          }
        }
      },false)
    }

    $("#scanID").on("keyup", function(event: JQuery.KeyUpEvent<HTMLElement, undefined, HTMLElement, HTMLElement>) {
      if (event.key === "Enter") {
        $("#request").trigger("click");
      }
    });

    $( "#hide" ).on("click", function() {
      if ($("#hide").text() === 'Hide') {
        $("#hide").text('Show');
        $("#datatable").hide();
      } else {
        $("#hide").text('Hide');
        $("#datatable").show();
      }
    });

    $( "#hideFeatureTable" ).on("click", function() {
      if ($("#hideFeatureTable").text() === 'Hide') {
        $("#hideFeatureTable").text('Show');
        $("#featureDataTable").hide();
      } else {
        $("#hideFeatureTable").text('Hide');
        $("#featureDataTable").show();
      }
    });

    $("#switch").on("click", function () {
      if($("#switch").text() === 'MS1') {
        showEnvTable($("#scanID1").text());
        $("#switch").text('MS2');
      } else {
        showEnvTable($("#scanID2").text());
        $("#switch").text('MS1');
      }
    });

    $("#inspect").on("click", function () {
        /*let peaklist;
        let masslistID = $('#envScan').text();
        if($("#switch").text() === 'MS1') {
            peaklist = peakList2_g;
        }else {
            peaklist = peakList1_g;
        }
        let peakAndIntensityList = "";
        peaklist.forEach(peak => {
            peakAndIntensityList = peakAndIntensityList + peak.mz + ' ' + peak.intensity+'\n';
        });
        peakAndIntensityList = peakAndIntensityList.slice(0,-1);
        window.localStorage.setItem('peakAndIntensityList', peakAndIntensityList);
        window.localStorage.setItem('scan', masslistID);
        window.localStorage.setItem('scanID', masslistID);
        window.localStorage.setItem('projectCode', document.getElementById('projectCode').value);
        if($('#proteoform').text() === 'N/A') {
            window.localStorage.setItem('sequence', '');
        } else {
            window.localStorage.setItem('sequence', $('#proteoform').text());
        }
        $.ajax({
            url:"envtable?projectDir=" + document.getElementById("projectDir").value + "&scanID=" + masslistID,
            type: "get",
            dataType: 'json',
            success: function (res) {
                let massAndIntensityList = "";
                res.forEach(mass => {
                    massAndIntensityList = massAndIntensityList + mass.mono_mass + ' ' + mass.intensity + ' ' + mass.charge + '\n';
                });
                massAndIntensityList = massAndIntensityList.slice(0, -1);
                window.localStorage.setItem('massAndIntensityList', massAndIntensityList);
                window.localStorage.setItem('ionType', 'Y,B');
                window.localStorage.setItem('precursorMass', $('#prec_mz').text());
                window.open('/resources/topview/inspect/spectrum_no_nav.html', '_blank');
                //console.log(res);
            }
        });*/
      let masslistID: string = $('#envScan').text();
      inspect(masslistID,masslistID);
    });

    $("#deleteMsalign").on("click", function () {
      let result: boolean = confirm("Are you sure that you want to delete msalign data?");
      if (result) {
        let projectDir = document.querySelector<HTMLInputElement>("#projectDir");
        let projectCode = document.querySelector<HTMLInputElement>("#projectCode");

        if (!projectCode) {
          console.error("project code information cannot be found");
          return;
        }
        if (!projectDir) {
          console.error("project directory information cannot be found");
          return;
        }

        //Logic to delete the item
        $.ajax({
          url:"deleteMsalign?projectDir=" + projectDir.value+ "&projectCode=" + projectCode.value,
          type: "get",
          // dataType: 'json',
          success: function (res) {
            alert('Your previous msalign data has been removed.');
            location.reload();
          }
        });
      }
    });

    $("#deleteSeq").on("click", function () {
      let result: boolean = confirm("Are you sure that you want to delete sequence data?");
        if (result) {
          let projectDir = document.querySelector<HTMLInputElement>("#projectDir");
          let projectCode = document.querySelector<HTMLInputElement>("#projectCode");
    
          if (!projectCode) {
            console.error("project code information cannot be found");
            return;
          }
          if (!projectDir) {
            console.error("project directory information cannot be found");
            return;
          }
    
          $.ajax({
            url:"deleteSeq?projectDir=" + projectDir.value+ "&projectCode=" + projectCode.value,
            type: "get",
            // dataType: 'json',
            success: function (res) {
              alert('Your previous sequence data has been removed.');
              location.reload();
            }
          });
        }
    });

    $('#uploadSequence').on("click", function () {
      let projectCode = document.querySelector<HTMLInputElement>("#projectCode");
      if (!projectCode) {
        console.error("project code information cannot be found");
        return;
      }
      window.open("seqResults?projectCode=" + projectCode.value, '_self');
    });

    $("#seqUpload").on("click", function () {
      let seqFile: HTMLInputElement | null = document.querySelector<HTMLInputElement>('#seqFile');
      let seqProgress: HTMLDivElement | null = document.querySelector<HTMLDivElement>('#seqProgressbar');
      let xhr: XMLHttpRequest = new XMLHttpRequest();

      if (!seqFile || !seqFile.files) {
        console.error("sequence file information cannot be found");
        return;
      }

      if(seqFile.files[0] === undefined) {
        alert("Please choose a sequence file first!");
        return;
      } else if (!seqFile.files[0].name.match(/.(tsv)$/i)) {
        alert('Please upload a tsv file for sequence!');
        return;
      } /*else if (!seqFile.files[0].name.includes("single")) {
        alert('Please upload a "*_ms2_toppic_prsm_single.tsv" file for sequence!');
        return;
      }*/

      let projectDir = document.querySelector<HTMLInputElement>("#projectDir");
      let projectCode = document.querySelector<HTMLInputElement>("#projectCode");
      let projectName = document.querySelector<HTMLInputElement>("#projectName");
      let email = document.querySelector<HTMLInputElement>("#email");

      if (!projectCode) {
        console.error("project code information cannot be found");
        return;
      }
      if (!projectDir) {
        console.error("project directory information cannot be found");
        return;
      }
      if (!projectName) {
        console.error("project name information cannot be found");
        return;
      }
      if (!email) {
        console.error("email information cannot be found");
        return;
      }

      let formData: FormData = new FormData();
      formData.append('seqFile', seqFile.files[0]);
      formData.append('projectDir', projectDir.value);
      formData.append('projectCode',projectCode.value);
      formData.append('projectName', projectName.value);
      formData.append('email', email.value);
      xhr.upload.onprogress = setProgress.bind(null, seqProgress);
      xhr.onload = uploadSuccess.bind(null, xhr);
      xhr.open('post', '/sequence', true);
      xhr.send(formData);
    });

    let inteAutoAdjust: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#inte-auto-adjust");
    if (inteAutoAdjust) {
      //redraw graph if intensity adjustment checkbox gets checked
      $("#inte-auto-adjust").on("click", function() {
        GraphData.draw();
      })
    }

    let showFeature: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#show-feature-anno");
    if (showFeature) {
      //hide feature annotation on 3D graph
      $("#show-feature-anno").click(function () {
        if (showFeature!.checked) {
          GraphFeature.showFeature();
        } else {
          GraphFeature.hideFeature();
        }
      });
    }
    
    //show or hide current scan marker
    let scanHighlight: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#highlight-cur-scan");
    if (scanHighlight) {
      $("#highlight-cur-scan").click(() => {
        let markerGroup: THREE.Object3D<THREE.Event> | undefined = Graph.scene.getObjectByName("markerGroup");
        if (!markerGroup) {
          console.error("there is no group for current scan highlight");
          return;
        }
        if (scanHighlight!.checked) {
          Graph.isHighlightingCurrentScan = true;
          markerGroup.children.forEach(function(line) {
            line.visible = true;
          })
          GraphData.drawNoNewData(false);
          GraphRender.renderImmediate();
        } else {
          Graph.isHighlightingCurrentScan = false;
          markerGroup.children.forEach(function(line) {
            line.visible = false;
          })
          GraphData.drawNoNewData(false);
          GraphRender.renderImmediate();
        }
      })
    }
  }  
}

