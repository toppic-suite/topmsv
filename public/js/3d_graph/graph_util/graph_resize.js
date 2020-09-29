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
        let graphDiv = document.getElementById("3d-graph-parameter"); 

        if (this.isFullScreen){//shrink back
            document.body.style.width = this.oriWidth;
            document.getElementById("left-jumbotron").style.paddingLeft = "60px";
            document.getElementById("left-jumbotron").style.paddingRight = "60px";

            document.getElementById("graph-container").style.height = this.oriHeight;

            graphDiv.scrollIntoView();
            graphDiv.scrollIntoView(false);
            graphDiv.scrollIntoView({block: "end"});

            Graph.renderer.setSize(Graph.graphEl.clientWidth, this.oriHeight, true);

            this.isFullScreen = false;
        }else{//expand to full screen
            this.oriWidth = document.getElementById("left-jumbotron").style.width;
            this.oriHeight = Graph.graphEl.clientHeight;
            
            document.getElementById("left-jumbotron").style.padding = "0px";
            document.body.style.width = "100%";
            
            graphDiv.scrollIntoView();
            graphDiv.scrollIntoView(false);
            graphDiv.scrollIntoView({block: "start"});

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