/*expand/reduce graph div size when a button is clicked */
class GraphResize{
    oriWidth;
    oriHeight;
    oriViewSize;
    viewSize = Graph.viewSize;
    viewAdjust = 3;
    isFullScreen = false;

    constructor(){};
    /*graph div resizing*/
    expandGraph = () => {
        Graph.viewSize = Graph.viewSize - this.viewAdjust; 
        GraphControl.resizeCameraUserControl(this.viewAdjust);
    }
    shrinkGraph = () => {
        Graph.viewSize = Graph.viewSize + this.viewAdjust; 
        GraphControl.resizeCameraUserControl(1/this.viewAdjust);
    }
    fullScreen = () => {
        let graphDiv = document.getElementById("graph-container"); 
        if (this.isFullScreen){//shrink back
            let leftColumnDiv = document.getElementById("left-jumbotron"); 
            let rightColumnDiv = document.getElementById("right-jumbotron"); 

            rightColumnDiv.style.display = "inline-block";
            leftColumnDiv.style.width = "50%";

            //graphDiv.scrollIntoView();
           // graphDiv.scrollIntoView(false);
            //graphDiv.scrollIntoView({block: "start"});

            Graph.renderer.setSize(this.oriWidth, this.oriHeight, true);

            this.isFullScreen = false;
        }else{//expand to full screen
            let leftColumnDiv = document.getElementById("left-jumbotron"); 
            let rightColumnDiv = document.getElementById("right-jumbotron"); 
            let graphMenuDiv = document.getElementById("graph-3d-parameter");
            
            this.oriHeight = Graph.graphEl.clientHeight;
            this.oriWidth = Graph.graphEl.clientWidth;

            rightColumnDiv.style.display = "none";
            leftColumnDiv.style.width = "100%";
            
            graphMenuDiv.scrollIntoView();
            graphMenuDiv.scrollIntoView(true);
            graphMenuDiv.scrollIntoView({block: "nearest"});

            this.isFullScreen = true;

            Graph.renderer.setSize(window.innerWidth, window.innerHeight, true);
        }
    }
    main = () => {
        document.getElementById("graph-expand").addEventListener("click", this.expandGraph, false);
        document.getElementById("graph-shrink").addEventListener("click", this.shrinkGraph, false);
        document.getElementById("graph-full-screen").addEventListener("click", this.fullScreen, false);
    }
}