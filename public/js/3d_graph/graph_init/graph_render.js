class GraphRender{

    constructor(){}
    /******** RENDERING AND DRAWING FUNCTIONS *****/
    static renderImmediate() {
        /*if camera angle is perpendicular to the graph plane*/
        if (Graph.camera.position.y > 25.495){
            graphData.plotPointAsCircle();
        }else{
            //function needed
            // let prevGroup = parent.datagroup.getObjectByName("cylinderGroup");
            // parent.datagroup.remove(prevGroup);
        }
        Graph.renderer.render( Graph.scene, Graph.camera );
        
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    };
    
}