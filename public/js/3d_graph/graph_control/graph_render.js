class GraphRender{
    constructor(){}
    static checkAndRender = () => {
        if (Graph.currentData.length > 0){
            if (Graph.camera.position.y > 25.495){
                Graph.isPerpendicular = true;
                //if camera is perpendicular to view, switch to 2D
                GraphData.plotPoint2D();
            }else{
                Graph.isPerpendicular = false;
                let dataGroup = Graph.scene.getObjectByName("dataGroup");
                let prevGroup = dataGroup.getObjectByName("peak2DGroup");
    
                dataGroup.remove(prevGroup);
                //let curRT = document.getElementById("scan1RT").innerText;    
                GraphData.draw(Graph.curRT);
            }
        }
        this.renderImmediate();
    }
    static renderImmediate = () => {     
        Graph.renderer.render( Graph.scene, Graph.camera );
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    }
}