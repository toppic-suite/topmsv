/*graph_label.js: class for creating tick labels and data labels for 3d graph*/
import { Sprite, SpriteMaterial, LinearFilter, Texture } from '../../../lib/js/three.module.js';
import { Graph } from '../graph_init/graph.js';
import { GraphUtil } from '../graph_util/graph_util.js';
export class GraphLabel {
    constructor() { }
}
/******** CREATE LABELS ******/
GraphLabel.makeTextSprite = (msg, textColor, fontsize) => {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    if (!context) {
        console.error("cannot get context from canvas");
        return new Sprite();
    }
    let fontwidth = context.measureText(msg).width;
    context.font = fontsize + "px Arial";
    context.fillStyle = "rgba(" + textColor.r + ", " + textColor.g + ", " + textColor.b + ", 1.0)";
    context.fillText(msg, ((canvas.width / 2) - (fontwidth / 2)), ((canvas.height / 2) - (fontsize / 2)));
    let texture = new Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = LinearFilter;
    let spriteMaterial = new SpriteMaterial({ map: texture });
    let sprite = new Sprite(spriteMaterial);
    sprite["scale"].set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
    return sprite;
};
/*updates status text labels and the outer graph axis labels*/
GraphLabel.drawDataLabels = () => {
    // dispose all labels on the graph
    let labelGroup = Graph.scene.getObjectByName("labelGroup");
    if (!labelGroup) {
        console.error("label group cannot be found");
        return;
    }
    while (labelGroup.children.length > 0) {
        let obj = labelGroup.children.pop();
        GraphUtil.disposeObject(obj);
    }
    let mzmintext = GraphUtil.roundTo(Graph.viewRange.mzmin, Graph.roundMz);
    let mzmaxtext = GraphUtil.roundTo(Graph.viewRange.mzmax, Graph.roundMz);
    let rtmintext = GraphUtil.roundTo(parseFloat(Graph.viewRange.rtmin.toFixed(4)), Graph.roundRt);
    let rtmaxtext = GraphUtil.roundTo(parseFloat(Graph.viewRange.rtmax.toFixed(4)), Graph.roundRt);
    let mztext = "m/z";
    let rttext = "retention time";
    let lblMzMin = GraphLabel.makeTextSprite(mzmintext.toString(), { r: 0, g: 0, b: 0 }, 16);
    let lblMzMax = GraphLabel.makeTextSprite(mzmaxtext.toString(), { r: 0, g: 0, b: 0 }, 16);
    let lblRtMin = GraphLabel.makeTextSprite(rtmintext.toString(), { r: 0, g: 0, b: 0 }, 16);
    let lblRtMax = GraphLabel.makeTextSprite(rtmaxtext.toString(), { r: 0, g: 0, b: 0 }, 16);
    let lblMz = GraphLabel.makeTextSprite(mztext, { r: 0, g: 0, b: 0 }, 16);
    let lblRt = GraphLabel.makeTextSprite(rttext, { r: 0, g: 0, b: 0 }, 16);
    lblMz["position"].set(0.5, 0, Graph.gridRange + 1);
    lblMzMin["position"].set(0.5, -0.5, Graph.gridRange + 1.5);
    lblMzMax["position"].set(Graph.gridRange, -0.5, Graph.gridRange + 1.5);
    lblRt["position"].set(-1.8, 0.5, Graph.gridRange + 0.5);
    lblRtMin["position"].set(-1.5, -0.5, Graph.gridRange);
    lblRtMax["position"].set(-1.5, -0.5, 0.5);
    Graph.labelGroup.add(lblMzMin, lblMzMax, lblRtMin, lblRtMax, lblMz, lblRt);
};
/*display details about the current peaks on the graph*/
GraphLabel.displayGraphData = (peaks) => {
    //display highest intensity, sum of intensity, total peak count in the current grph
    let highestInte = "Highest intensity: " + GraphUtil.formatScientificNotation(Graph.viewRange.intmax);
    let sumInte = "Intensity sum: " + GraphUtil.formatScientificNotation(Graph.intensitySum);
    let peakCount = "Total peaks: " + peaks;
    let sep = "\n";
    //if intensity was 0, it should be just 0
    if (Graph.intensitySum == 0) {
        sumInte = "Sum of Intensity: 0";
        highestInte = "Highest Intensity: 0";
    }
    let metaData = document.querySelector('#graph-metadata');
    if (metaData) {
        metaData.innerText = highestInte + sep + sumInte + sep + peakCount + sep;
    }
    else {
        console.error("metadata span element doesn't exist");
    }
};
