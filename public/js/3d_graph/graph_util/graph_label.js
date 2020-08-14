/*graph_label.js: class for creating tick labels and data labels for 3d graph*/

class GraphLabel{
    constructor(){}
    /******** CREATE LABELS ******/
    /*creates text label*/
    static makeTextSprite(msg, textColor, fontsize) 
    {
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
    static drawDataLabels() {
        // dispose all labels on the graph
        while(Graph.scene.getObjectByName("labelGroup").children.length > 0) 
        {
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

        labels.mzMin = this.makeTextSprite(mzmintext, {r: 0, g: 0, b: 0}, 16);
        labels.mzMax = this.makeTextSprite(mzmaxtext,{r: 0, g: 0, b: 0}, 16);
        labels.rtMin = this.makeTextSprite(rtmintext,{r: 0, g: 0, b: 0}, 16);
        labels.rtMax = this.makeTextSprite(rtmaxtext,{r: 0, g: 0, b: 0}, 16);
        labels.mz = this.makeTextSprite(mztext,{r: 0, g: 0, b: 0}, 16);
        labels.rt = this.makeTextSprite(rttext,{r: 0, g: 0, b: 0}, 16);

        labels.mz.position.set(0.5, 0.5, Graph.gridRange + 1.5);
        labels.mzMin.position.set(0.5, -0.5,  Graph.gridRange + 1.5);
        labels.mzMax.position.set(Graph.gridRange, -0.5,  Graph.gridRange + 1.5);

        labels.rt.position.set(-1.5, 0.5,  Graph.gridRange);
        labels.rtMin.position.set(-1.5, -0.5,  Graph.gridRange);
        labels.rtMax.position.set(-1.5, -0.5, 0.5);

        Graph.labelgroup.add(labels.mzMin, labels.mzMax, labels.rtMin, labels.rtMax, labels.mz, labels.rt);
    }
    /*display details about the current peaks on the graph*/
    static displayGraphData(peaks){
        //display highest intensity, sum of intensity, total peak count in the current grph
        let highestInte = "Highest Intensity: " + Graph.viewRange.intmax;
        let sumInte = "Sum of Intensity: " + Graph.intensitySum;
        let peakCount = "Total Peaks on Graph: " + peaks;
        let sep = "\n";
        document.getElementById('graph-metadata').innerText = highestInte + sep + sumInte + sep + peakCount + sep;
    }
}