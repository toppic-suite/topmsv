/*graph_label.js: class for creating tick labels and data labels for 3d graph*/

class GraphLabel{
    constructor(){}
    /******** CREATE LABELS ******/
    static makeTextSprite = (msg, textColor, fontsize) => {
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        let fontwidth = context.measureText(msg).width;
        context.font = fontsize + "px Arial";
        context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
        context.fillText(msg, ((canvas.width/2) - (fontwidth/2)), ((canvas.height/2) - (fontsize/2)));

        let texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;

        let spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
        let sprite = new THREE.Sprite( spriteMaterial );
        sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
        return sprite;
    };

    /*updates status text labels and the outer graph axis labels*/
    static drawDataLabels = () => {
        // dispose all labels on the graph
        while(Graph.scene.getObjectByName("labelGroup").children.length > 0) {
            let obj = Graph.scene.getObjectByName("labelGroup").children.pop();
            
            GraphUtil.disposeObject(obj);
        }
        let mzmintext = GraphUtil.roundTo(Graph.viewRange.mzmin, Graph.roundMz);
        let mzmaxtext = GraphUtil.roundTo(Graph.viewRange.mzmax, Graph.roundMz);
        let rtmintext = GraphUtil.roundTo((Graph.viewRange.rtmin/60).toFixed(4), Graph.roundRt);
        let rtmaxtext = GraphUtil.roundTo((Graph.viewRange.rtmax/60).toFixed(4), Graph.roundRt);

        let mztext = "m/z";
        let rttext = "retention time";
        let labels = {};

        labels.mzMin = GraphLabel.makeTextSprite(mzmintext, {r: 0, g: 0, b: 0}, 16);
        labels.mzMax = GraphLabel.makeTextSprite(mzmaxtext,{r: 0, g: 0, b: 0}, 16);
        labels.rtMin = GraphLabel.makeTextSprite(rtmintext,{r: 0, g: 0, b: 0}, 16);
        labels.rtMax = GraphLabel.makeTextSprite(rtmaxtext,{r: 0, g: 0, b: 0}, 16);
        labels.mz = GraphLabel.makeTextSprite(mztext,{r: 0, g: 0, b: 0}, 16);
        labels.rt = GraphLabel.makeTextSprite(rttext,{r: 0, g: 0, b: 0}, 16);

        labels.mz.position.set(0.5, 0, Graph.gridRange + 1);
        labels.mzMin.position.set(0.5, -0.5,  Graph.gridRange + 1.5);
        labels.mzMax.position.set(Graph.gridRange, -0.5,  Graph.gridRange + 1.5);

        labels.rt.position.set(-1.8, 0.5,  Graph.gridRange + 0.5);
        labels.rtMin.position.set(-1.5, -0.5,  Graph.gridRange);
        labels.rtMax.position.set(-1.5, -0.5, 0.5);

        Graph.labelGroup.add(labels.mzMin, labels.mzMax, labels.rtMin, labels.rtMax, labels.mz, labels.rt);
    }
    /*display details about the current peaks on the graph*/
    static displayGraphData = (peaks) => {
        //display highest intensity, sum of intensity, total peak count in the current grph
        let highestInte = "Highest intensity: " + GraphUtil.formatScientificNotation(Graph.viewRange.intmax);
        let sumInte = "Intensity sum: " + GraphUtil.formatScientificNotation(Graph.intensitySum);
        let peakCount = "Total peaks: " + peaks;
        let sep = "\n";

        //if intensity was 0, it should be just 0
        if (Graph.intensitySum == 0){
            sumInte = "Sum of Intensity: 0";
            highestInte = "Highest Intensity: 0";
        }
        document.getElementById('graph-metadata').innerText = highestInte + sep + sumInte + sep + peakCount + sep;
    }
}