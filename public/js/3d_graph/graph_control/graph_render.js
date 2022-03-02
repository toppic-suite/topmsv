import { Graph } from '../graph_init/graph.js';
import { GraphData } from '../graph_data/graph_data.js';
export class GraphRender {
    constructor() { }
}
GraphRender.checkAndRender = () => {
    let dataGroup = Graph.scene.getObjectByName("dataGroup");
    if (!dataGroup) {
        console.error("there is no data group");
        return;
    }
    if (Graph.currentData.length > 0) {
        if (Graph.camera.position.y > 25.495) { //if switching to 2D view
            Graph.isPerpendicular = true;
            //if camera is perpendicular to view, switch to 2D
            GraphData.plotPoint2D();
        }
        else if (Graph.isPerpendicular) { //if switching from 2D view to 3D view
            Graph.isPerpendicular = false;
            let prevGroup = dataGroup.getObjectByName("peak2DGroup");
            if (prevGroup) {
                dataGroup.remove(prevGroup);
            }
            //let curRT = document.getElementById("scan1RT").innerText;    
            GraphData.draw(Graph.curRT);
        }
        //do nothing if just rotating 3D view without switching to 2D
    }
    GraphRender.renderImmediate();
};
GraphRender.renderImmediate = () => {
    Graph.renderer.render(Graph.scene, Graph.camera);
    Graph.imageAddress = Graph.renderer.domElement.toDataURL();
};
