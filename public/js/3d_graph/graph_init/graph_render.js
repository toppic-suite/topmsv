class GraphRender{

    constructor(){}
    /******** RENDERING AND DRAWING FUNCTIONS *****/
    static renderImmediate() {
        /*if camera angle is perpendicular to the graph plane*/
        if (Graph.camera.position.y > 25.495){
            graphData.plotPointAsCircle();
        }else{
            let prevGroup = Graph.scene.getObjectByName("cylinderGroup");
            if (prevGroup != undefined){
                Graph.scene.remove(prevGroup);
            }
            
        }
        Graph.renderer.render( Graph.scene, Graph.camera );
        
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    };
    
}