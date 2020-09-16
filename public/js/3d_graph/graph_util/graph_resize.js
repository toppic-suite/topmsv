/*expand/reduce graph div size when a button is clicked */
class GraphResize{
    isExpanded = false;
    oriWidth;
    oriHeight;
    oriViewSize;

    constructor(){};
    /*graph div resizing*/
    resizeGraphDiv = () => {

        if (this.isExpanded){
            let graphDiv = document.getElementById("graph3d-entire-div"); 

            document.body.style.width = this.oriWidth;
            graphDiv.style.height = this.oriHeight;

            graphDiv.scrollIntoView();
            graphDiv.scrollIntoView(false);
            graphDiv.scrollIntoView({block: "start"});

            Graph.viewSize = this.oriViewSize;
            GraphControl.resizeCamera();

            document.getElementById("graph-expand").innerText = "Expand";

            this.isExpanded = false;
        }else{
            //let graphDiv = document.getElementById("graph-container"); 
            let graphDiv = document.getElementById("graph3d-entire-div"); 

            this.oriHeight = graphDiv.style.height;
            document.body.style.width = "100%";
            graphDiv.style.height = (window.innerHeight).toString() + "px";
            //document.getElementById("graph-container").style.height = (window.innerHeight).toString() + "px";

            graphDiv.scrollIntoView();
            graphDiv.scrollIntoView(false);
            graphDiv.scrollIntoView({block: "end"});

            //change graph viewsize
            this.oriViewSize = Graph.viewSize;
            Graph.viewSize = 23;
            GraphControl.resizeCameraWhenExpanded();

            document.getElementById("graph-expand").innerText = "Reduce";
            this.isExpanded = true;
        }
    }
    main = () => {
        document.getElementById("graph-expand").addEventListener("click", this.resizeGraphDiv, false);
        this.oriWidth = document.getElementById("center-div").style.width;
    }
}