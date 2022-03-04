/* *ResultViz: a class containing:
* 1. parameters to be used by all visual elements on the page
* 2. methods for initializing and redrawing views
*/
import { Graph } from '../3d_graph/graph_init/graph.js';
import { GraphData } from '../3d_graph/graph_data/graph_data.js';
import { DataGetter } from './dataGetter.js';
import { EventHandler } from './event_handlers.js';
import { init2D } from "../result_page/init2D.js";
export class ResultViz {
    constructor(projectDir) {
        this.config = {
            floatDigit: 3,
            scientificDigit: 2
        };
        this.view3d = null;
        this.projectDir = projectDir;
        this.dbPath = projectDir.substring(0, projectDir.lastIndexOf(".")) + ".db";
        this.dataGetter = new DataGetter(projectDir);
    }
    initEventHandler() {
        this.eventHandler = new EventHandler(this);
        this.eventHandler.initialize();
    }
    initGraph() {
        let rangeMin = document.querySelector("#rangeMin");
        if (!rangeMin) {
            console.error("input text box rangeMin does not exist");
            return;
        }
        let min = rangeMin.value;
        if ($('#userType').val() === 'guest') {
            $('#topfdtask').prop('disabled', true);
            $('#toppicTask').prop('disabled', true);
            $('#uploadMsalign').prop('disabled', true);
        }
        if ($('#envStatus').val() === "0") {
            $('#brhr').hide();
            $("#envInfo").hide();
            $('#envFileInfo').hide();
        }
        $('#envFileInfo').hide();
        $("#ms2Info").hide();
        if ($('#featureStatus').val() === '0') {
            $('#show-feature-anno-div').hide();
        }
        else {
            $('#show-feature-anno-div').show();
        }
        let scanRef = window.localStorage.getItem('scan');
        if (scanRef) {
            //init2D(scanRef);
            min = scanRef;
            localStorage.clear();
        }
        this.initInteRt();
        init2D(parseFloat(min), this.config);
        this.init3D(parseInt(min));
        /*let fileName: string | number | string[] | undefined = $('#fileName').val();
        if (typeof fileName != "string") {
          console.error("invalid input file name");
          return;
        }
        let apix = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
        if(apix === '.txt') {
          $('#rt-sum_panel').hide();
    
          this.dataGetter.getScanLevel(min)
            .then((response) => {
              if (response.data === 0) {//invalid result
                throw new Error("invalid scan level!");
              }
              else if (response === "1") {
                loadPeakList1(min, null);
                $('#scanLevelTwo').hide();
              }
              else {
                $('#scanLevelOne').hide();
                this.dataGetter.getRelatedScan2(min)
                  .then((response) => {
                    //scanLevelOne = response;
                    return this.dataGetter.getScanLevelTwoList(response);
                })
                  .then(function(response){
                    $( "#tabs" ).tabs();
                    $("#tabs li").remove();
                    $( "#tabs" ).tabs("destroy");
                    response.forEach(function (item) {
                      let scanTwoNum = item.scanID;
                      let rt = item.rt;
                      $("#tabs ul").append('<li><a href="#spectrum2"' + ' id='+ scanTwoNum + ' onclick="loadPeakList2(' + scanTwoNum + ', ' + item.prec_mz + ', ' + item.prec_charge + ', ' + item.prec_inte + ', ' + rt + ', ' + scanLevelOne + ')">'+ item.prec_mz.toFixed(4) + '</a></li>');
                    });
                    $( "#tabs" ).tabs();
                    let minBtn =
                    document.getElementById(min).click();
                  })
                  .catch(function(error) {
                    console.log(error);
                  });
              }
            })
            .catch((error) => {
              console.log(error);
            });
        }*/
    }
    init3D(scanID) {
        this.view3d = new Graph(this.dbPath, this);
        this.view3d.main(scanID);
        /*this.dataGetter.getRelatedScan2(scanID)
          .then((ms2Scan) => {
            let scan: number = parseInt(ms2Scan.data);
            if (ms2Scan < 0){
              let promise = this.dataGetter.getRelatedScan1(scanID);
              promise.then((ms1Scan) => {
                scan = parseInt(ms1Scan.data);
                return this.dataGetter.getPrecursorMz(scan);
              })
            }else{
              return this.dataGetter.getPrecursorMz(ms2Scan);
            }
          })
          .then((precMz)=>{
            this.view3d = new Graph(this.dbPath, this);
    
            let mzRange = calcInitRange(precMz.data);
            this.view3d.main(mzRange.mzmin, mzRange.mzmax, scanID);
        }).catch((err) => {
          console.log(err);
        })*/
    }
    update3DShowFull(scanID) {
        GraphData.drawFullRangeGraph(scanID);
    }
    update3D(scanID) {
        GraphData.updateGraphForNewScan(scanID);
    }
    initInteRt() {
        this.dataGetter.getInteSumList()
            .then((response) => {
            //rename some keys and remove unused keys
            let rtInteData = [];
            response.data.forEach((data) => {
                let rtInte = {};
                rtInte.rt = data.RETENTIONTIME;
                rtInte.inteSum = data.PEAKSINTESUM;
                rtInte.scanNum = data.SCAN;
                if ('IONTIME' in data) {
                    rtInte.ionTime = data.IONTIME;
                }
                rtInteData.push((rtInte));
            });
            this.rtInteGraph = new InteRtGraph("rt-sum", rtInteData, this.redrawGrph.bind(this), this.config);
            this.rtInteGraph.drawGraph();
        })
            .catch((error) => {
            console.log(error);
        });
    }
    redrawGrph(scanID) {
        init2D(scanID, this.config);
        this.update3D(scanID);
    }
    main() {
        this.initEventHandler();
        this.initGraph();
    }
    getConfig() {
        return this.config;
    }
    getRtInteGraph() {
        return this.rtInteGraph;
    }
    getView3d() {
        if (!this.view3d) {
            return null;
        }
        else {
            return this.view3d;
        }
    }
}
$(document).ready(function () {
    let projectDir = document.querySelector("#projectDir");
    if (projectDir) {
        let resultPage = new ResultViz(projectDir.value);
        resultPage.main();
    }
    else {
        console.error("project dir information not found");
    }
});
