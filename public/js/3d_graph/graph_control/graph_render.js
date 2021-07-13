class GraphRender{
    constructor(){}
    static checkAndRender = () => {
        if (Graph.currentData.length > 0){
            if (Graph.camera.position.y > 25.495){//if switching to 2D view
                Graph.isPerpendicular = true;
                //if camera is perpendicular to view, switch to 2D
                GraphData.plotPoint2D();
            }
            else if (Graph.isPerpendicular) {//if switching from 2D view to 3D view
                Graph.isPerpendicular = false;
                let dataGroup = Graph.scene.getObjectByName("dataGroup");
                let prevGroup = dataGroup.getObjectByName("peak2DGroup");
    
                dataGroup.remove(prevGroup);
                //let curRT = document.getElementById("scan1RT").innerText;    
                GraphData.draw(Graph.curRT);
            }
            //do nothing if just rotating 3D view without switching to 2D
        }
        this.renderImmediate();
    }
    static renderImmediate = () => {     
        Graph.renderer.render( Graph.scene, Graph.camera );
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    }
}