class GraphRender{
    constructor(){}
    static checkAndRender = () => {
        if (Graph.camera.position.y > 25.495){
            Graph.isPerpendicular = true;
            //if camera is perpendicular to view, switch to cylinder group
            GraphData.plotPoint2D();
        }else{
            Graph.isPerpendicular = false;
            let dataGroup = Graph.scene.getObjectByName("dataGroup");
            let prevGroup = dataGroup.getObjectByName("peak2DGroup");
            let plotGroup = dataGroup.getObjectByName("plotGroup");

            dataGroup.remove(prevGroup);

            if (plotGroup.children.length < 1 && Graph.currentData.length > 0){//if 3D peaks 
                GraphData.draw();
            }
        }
        this.renderImmediate();
    }
    static renderImmediate = () => {        
        Graph.renderer.render( Graph.scene, Graph.camera );
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    }
}