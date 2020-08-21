class GraphRender{
    constructor(){}
    
    static renderImmediate = () => {
        if (Graph.camera.position.y > 25.495){
            //if camera is perpendicular to view, switch to cylinder group
            GraphData.plotPointAsCircle();
        }else{
            let dataGroup = Graph.scene.getObjectByName("dataGroup");
            let prevGroup = dataGroup.getObjectByName("cylinderGroup");
            dataGroup.remove(prevGroup);
        }
        Graph.renderer.render( Graph.scene, Graph.camera );
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    }
}