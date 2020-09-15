/*expand/reduce graph div size when a button is clicked */
class GraphResize{
    isExpanded = false;
    oriWidth;
    oriHeight;
    constructor(){};
    /*graph div resizing*/
    resizeGraphDiv = () => {
        let graphDiv = document.getElementById("graph3d-entire-div"); 
        console.log("isExpanded:", this.isExpanded);
        if (this.isExpanded){
            document.body.style.width = this.oriWidth;
            graphDiv.style.height = this.oriHeight;

            document.body.scrollIntoView();
            document.body.scrollIntoView(false);
            document.body.scrollIntoView({block: "start"});

            document.getElementById("graph-expand").innerText = "Expand";

            this.isExpanded = false;
        }else{
            this.oriHeight = graphDiv.style.height;
            document.body.style.width = "100%";
            graphDiv.style.height = (window.innerHeight).toString() + "px";

            graphDiv.scrollIntoView();
            graphDiv.scrollIntoView(false);
            graphDiv.scrollIntoView({block: "end"});

            document.getElementById("graph-expand").innerText = "Reduce";
            this.isExpanded = true;
        }
    }
    main = () => {
        document.getElementById("graph-expand").addEventListener("click", this.resizeGraphDiv, false);
        this.oriWidth = document.getElementById("center-div").style.width;
    }
}