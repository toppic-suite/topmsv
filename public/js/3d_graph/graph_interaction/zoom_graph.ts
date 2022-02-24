/*zoomGraph.js : class defining zoom behavior on the graph
zoom in and zoom out on x and y axis by scrolling mouse wheel 
peak intensity is also adjusted by ctrl + mouse wheel
*/

class GraphZoom {   
  scrollTimer;//detect if scroll has ended or not
  scrollLock = false;
  constructor(){}
    
  adjustPeakHeight = (scaleFactor: number, isCtrlPressed: boolean): void => {
    let peaks: THREE.Object3D<THREE.Event> | undefined = Graph.scene.getObjectByName("plotGroup");
    let inteAutoAdjust: HTMLInputElement | null = document.querySelector<HTMLInputElement>("#inte-auto-adjust");

    if (!peaks) {
      console.error("plotGroup cannot be found");
      return;
    }
    if (!isCtrlPressed && scaleFactor < 1) {return;}//or peak intensity will be decreased
    
    if (inteAutoAdjust) {
      if (!isCtrlPressed && !inteAutoAdjust.checked) {return;}
    }

    let oriScale: number = peaks.scale.y;
    peaks.scale.set(peaks.scale.x, oriScale * scaleFactor, peaks.scale.z);
    Graph.peakScale = oriScale * scaleFactor;

    if (isCtrlPressed && scaleFactor > 1) {
      //@ts-ignore "peaks" contain a group of Peak3DView
      GraphControl.adjustIntensity(peaks.children);
    } 
    GraphRender.renderImmediate();  
  }


  onZoom = async(e: WheelEvent): Promise<void> => {
    e.preventDefault();//disable scroll of browser
    if (!this.scrollLock) {
      this.scrollLock = true;
      let axis: THREE.Object3D<THREE.Event> | null = GraphUtil.findObjectHover(e, Graph.axisGroup);//axis is null if cursor is not on axis
      if (axis == null){
        let scaleFactor: number = 0;

        if (e.deltaY > 0) {
          scaleFactor = 0.75;
        } else if (e.deltaY < 0){
          scaleFactor = 1.5;
        }

        if (e.ctrlKey){//if control key is pressed --> intensity zoom
          this.adjustPeakHeight(scaleFactor, true);
        } else {
          await this.onZoomFromEventListener(e, null);
          this.adjustPeakHeight(scaleFactor, false);
        }
      } else{
        let scaleFactor: number = 0;

        if (e.deltaY > 0) {
          scaleFactor = 0.75;
        } else if (e.deltaY < 0){
          scaleFactor = 1.5;
        }

        if (e.ctrlKey){//if control key is pressed --> intensity zoom
          this.adjustPeakHeight(scaleFactor, true);
        } else{
          if (axis.name == "xAxis"){
            await this.onZoomFromEventListener(e, "mz");
          } else if(axis.name == "yAxis"){
            await this.onZoomFromEventListener(e, "rt");
          }
          this.adjustPeakHeight(scaleFactor, false);
        }
      }
      this.scrollLock = false;
    } 
  }


  onZoomFromEventListener = async(e: WheelEvent, axisName: string | null) => {        
    //zoom action detected by event listener in each axis
    let scaleFactor: number = 0;
    let mousePos: THREE.Vector3 = GraphUtil.getMousePosition(e);
    
    let newmzrange: number = Graph.viewRange.mzrange;
    let newrtrange: number = Graph.viewRange.rtrange;
    
    let curmz: number = mousePos.x * Graph.viewRange.mzrange + Graph.viewRange.mzmin;//current mz and rt that has a cursor pointed to
    let currt: number = mousePos.z * Graph.viewRange.rtrange + Graph.viewRange.rtmin;
    
    //reset view range based on scroll up or down
    if (e.deltaY < 0) {
      scaleFactor = 0.8;
    } else{
      scaleFactor = 1.2;
    }
    if (axisName == null) {
      if (curmz >= Graph.viewRange.mzmin && curmz <= Graph.viewRange.mzmax) {
        if (currt >= Graph.viewRange.rtmin && currt <= Graph.viewRange.rtmax) {
          axisName = "both";
        } else{
          axisName = "mz";
        }
      } else if (currt >= Graph.viewRange.rtmin && currt <= Graph.viewRange.rtmax) {
        if (curmz <= Graph.viewRange.mzmin && curmz >= Graph.viewRange.mzmin) {
          axisName = "both";
        } else{
          axisName = "rt";
        }
      }
    }
    //figure out where the cursor is (near x axis, y axis)
    if (axisName == "rt"){         
      newrtrange = Graph.viewRange.rtrange * scaleFactor; 
    }
    else if (axisName == "mz"){//mz range adjust
      newmzrange = Graph.viewRange.mzrange * scaleFactor;
    }
    else if (axisName == "both"){//if adjusting both
      newrtrange = Graph.viewRange.rtrange * scaleFactor;
      newmzrange = Graph.viewRange.mzrange * scaleFactor;
    }
    else{
      return;
    }   
    let mzscale: number = (curmz - Graph.viewRange.mzmin)/(Graph.viewRange.mzmax - Graph.viewRange.mzmin);//find relative pos of current mz currrent rt
    let rtscale: number = (currt - Graph.viewRange.rtmin)/(Graph.viewRange.rtmax - Graph.viewRange.rtmin);

    let newmzmin: number = curmz - (mzscale * newmzrange);//the closer curmz or currt is to the minmz and minrt, the less change in min value
    let newrtmin: number = currt - (rtscale * newrtrange);

    let newRange: {"mzmin": number, "mzmax": number, "rtmin": number, "rtmax": number} = GraphControl.constrainBoundsZoom(newmzmin, newmzrange, newrtmin, newrtrange);
    
    /*if (newRange.rtmax - newRange.rtmin < 0.35) {//prevent rt range becoming too small
        newRange.rtmax = newRange.rtmin + 0.35;
    }*/
    GraphControl.xScale = scaleFactor;
    await GraphData.updateGraph(newRange.mzmin, newRange.mzmax, newRange.rtmin, newRange.rtmax, Graph.curRT);
  }


  main(){
    Graph.renderer.domElement.addEventListener('wheel', this.onZoom, false);
  }
}
