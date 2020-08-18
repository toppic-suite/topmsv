class GraphRender{

    constructor(){}
    /******** RENDERING AND DRAWING FUNCTIONS *****/
    static renderImmediate() {
        if (Graph.camera.position.y > 25.495){
            //switch to cylinder group
            let graphData = new GraphData();
            graphData.plotPointAsCircle();
        }else{
            
            let dataGroup = Graph.scene.getObjectByName("dataGroup");
            let prevGroup = dataGroup.getObjectByName("cylinderGroup");
            dataGroup.remove(prevGroup);
        }
    
        Graph.renderer.render( Graph.scene, Graph.camera );
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    }
    
}