class GraphRender{

    constructor(){}
    /******** RENDERING AND DRAWING FUNCTIONS *****/
    static renderImmediate() {
        if (Graph.camera.position.y > 25.495){

        }

        Graph.renderer.render( Graph.scene, Graph.camera );
        Graph.imageAddress = Graph.renderer.domElement.toDataURL();
    }
}