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
            let middleColumnDiv = document.getElementById("middle-jumbotron");
            let graphDiv = document.getElementById("3d-graph-div");
            let graphContainerDiv = document.getElementById("graph-container");

            rightColumnDiv.style.display = "inline-block";
            leftColumnDiv.style.display = "inline-block";
            middleColumnDiv.style.width = "47%";
            graphDiv.style.height = "55%";
            graphContainerDiv.style.height = "75%";

            //graphDiv.scrollIntoView();
           // graphDiv.scrollIntoView(false);
            //graphDiv.scrollIntoView({block: "start"});

            Graph.renderer.setSize(this.oriWidth, this.oriHeight, true);

            this.isFullScreen = false;
        }else{//expand to full screen
            let leftColumnDiv = document.getElementById("left-jumbotron"); 
            let rightColumnDiv = document.getElementById("right-jumbotron"); 
            let middleColumnDiv = document.getElementById("middle-jumbotron");
            let graphMenuDiv = document.getElementById("graph-3d-parameter");
            let graphDiv = document.getElementById("3d-graph-div");
            let graphContainerDiv = document.getElementById("graph-container");

            this.oriHeight = Graph.graphEl.clientHeight;
            this.oriWidth = Graph.graphEl.clientWidth;

            rightColumnDiv.style.display = "none";
            leftColumnDiv.style.display = "none";
            middleColumnDiv.style.width = "100%";
            graphDiv.style.height = "120%";
            graphContainerDiv.style.height = "80%";
            
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