/*hover_positon.js: display m/z and rt information of the point the mouse cursor is on */
class HoverPosition {
  constructor(){};
  showHighlight = (mz: number, rt: number, event: MouseEvent): void => {      
    //disdlay a line and a scan information in tooltip
    let scanNum: number = GraphUtil.findNearestScan(rt);
    let sep: string = "</br>";
 
    let tooltip: HTMLDivElement | null = document.querySelector<HTMLDivElement>("#tooltip-scanID");
    let tooltipText: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>("#tooltiptext-scanID");
 
    if (scanNum >= 0) {
      if (tooltip) {
        tooltip.style.display = "inline-block";
        tooltip.style.top = (event.clientY - 70) + 'px';
        tooltip.style.left = (event.clientX + 20) + 'px';
      } else {
        console.error("there is no tooltip element");
      }
      if (tooltipText) {
        tooltipText.innerHTML = "scan: " + scanNum + sep + "mz: " + GraphUtil.formatFloat(mz) + sep + "rt: " + GraphUtil.formatFloat(rt) + sep;        
      } else {
        console.error("there is no tooltipText element");
      }
    } else{
      if (tooltip) {
        tooltip.style.display = "none";
      }
    }
  }
  onMouseOver = (event: MouseEvent) => {
    let [mz, rt]: number[] = GraphUtil.getMzRtCoordinate(event);
    let scan: number =  GraphUtil.findNearestScan(rt);
    let ionTime: number = GraphUtil.findIonTime(rt);

    let mzString, rtString, scanString, ionTimeString = '';
    let cursorData: string = "";

    let tooltip: HTMLDivElement | null = document.querySelector<HTMLDivElement>("#tooltip-scanID");
    let graphCursorData: HTMLSpanElement | null = document.querySelector<HTMLSpanElement>("#graph-cursor-data");

    if (mz < 0 || rt < 0){
      mzString = "";
      rtString = "";
    } else{
      mzString = mz.toString();
      rtString = rt.toString();

      if (event.ctrlKey) {
        this.showHighlight(mz, rt, event);
      } else{
        if (tooltip) {
          tooltip.style.display = "none";
        }      
      }
    }
    if (scan < 0) {
      scanString = "n/a";
    } else {
      scanString = scan.toString();
    }
        
    if (ionTime != null) {
      ionTimeString = ionTime.toFixed(3);
      if (ionTime < 0) {
        ionTimeString = "n/a";
      }
      cursorData = "m/z: " + GraphUtil.formatFloat(mzString) + "\n" + "retention time (min): " + GraphUtil.formatFloat(rtString) + "\n" + "ion injection time (ms): " + GraphUtil.formatFloat(ionTimeString) + "\n" + "scan ID: " + scanString;
    } else {
      cursorData = "m/z: " + GraphUtil.formatFloat(mzString) + "\n" + "retention time (min): " + GraphUtil.formatFloat(rtString) + "\n" + "scan ID: " + scanString;
    }

    if (graphCursorData) {
      graphCursorData.innerText = cursorData;
    } else {
      console.error("graph-cursor-data doesn't exist");
    }
  }
  main = (): void => {
    Graph.renderer.domElement.addEventListener('mousemove', this.onMouseOver, false);
  }
}