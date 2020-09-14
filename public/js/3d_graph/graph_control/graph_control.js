/*graph_control.js: class for scaling and repositioning objects on the graph*/

class GraphControl{
    constructor(){}
    /******** CONVERSION FUNCTIONS *****/
    /*Converts mz, rt coordinate to grid space (0 to GRID_RANGE)*/
    static mzRtToGridSpace = (mz, rt) => {
        let vr = Graph.viewRange;
        let mz_norm = (mz - vr.mzmin) / vr.mzrange;
        let rt_norm = (rt - vr.rtmin) / vr.rtrange;

        return { x: mz_norm * Graph.gridRange, z: (1 - rt_norm) * Graph.gridRange };
    }

    /******* DATA RANGE AND VIEWING AREA ****/
    static adjustIntensity = (peaks, scale) => {
        //low peak height stays the same as 0.05 until the scaled value becomes > 0.05
        //peak.height = adjusted y (current Y), peak.int = original intensity
        peaks.forEach((peak) => {
            if (peak.lowPeak){
                let resultHeight = scale * peak.int;
                if (resultHeight < Graph.minPeakHeight){
                    //peak y should be updated so that the resulting height is still 0.05
                    let newY = Graph.minPeakHeight/ scale;
                    peak.geometry.attributes.position.array[4] = newY;
                    peak.geometry.attributes.position.needsUpdate = true;
                }else{
                    //when the scaled intensity would be > 0.05
                    peak.geometry.attributes.position.array[4] = peak.int;
                    peak.geometry.attributes.position.needsUpdate = true;
                }
            }
        })
    }
    /*resizes the renderer and camera, especially in response to a window resize*/
    static repositionPlot = (r) => {
        let heightScale = Graph.viewRange.intmax;
        // This step allows points to be plotted at their normal mz,rt locations in plotPoint,
        // but keeping them in the grid. Scaling datagroup transforms the coordinate system
        // from mz,rt to GRID_RANGE. RT is also mirrored because the axis runs in the "wrong" direction.
        let mz_squish = Graph.gridRange / (r.mzmax - r.mzmin);
        let rt_squish = - Graph.gridRange / (r.rtmax - r.rtmin);
        let int_squish = (Graph.gridRangeVertical / heightScale) * r.intscale;

        if (Graph.viewRange.intmax < 1){
            //there is a problem when there is no peak --> this.dataRange.intmax becomes 0 and inte_squish is a result of dividing by zero
            int_squish = 0;
        }
        let dataGroup = Graph.scene.getObjectByName("dataGroup");
        let markerGroup = Graph.scene.getObjectByName("markerGroup");
        let tickLabelGroup = Graph.scene.getObjectByName("tickLabelGroup");
        let ticksGroup = Graph.scene.getObjectByName("ticksGroup");

        dataGroup.scale.set(mz_squish, int_squish, rt_squish);
        markerGroup.scale.set(1,1,rt_squish);
        
        // Reposition the plot so that mzmin,rtmin is at the correct corner
        dataGroup.position.set(-r.mzmin*mz_squish, 0, Graph.gridRange - r.rtmin*rt_squish);
        markerGroup.position.set(0, 0, Graph.gridRange - r.rtmin*rt_squish);
        
        //console.log(-r.mzmin*mz_squish, 0, Graph.gridRange - r.rtmin*rt_squish)

        // update tick marks
        GraphUtil.emptyGroup(tickLabelGroup);

        let markMaterial = new THREE.LineBasicMaterial({ color: 0x000000});
        // draws a tick mark at the given location
        let makeTickMark = (mzmin, mzmax, rtmin, rtmax) => {
            let markGeo = new THREE.Geometry();
            markGeo.vertices.push(new THREE.Vector3(mzmin, 0, rtmin));
            markGeo.vertices.push(new THREE.Vector3(mzmax, 0, rtmax));
            let markLine = new THREE.Line(markGeo, markMaterial);
            ticksGroup.add(markLine);
        };
    
        // draws a tick label for the given location
        let makeTickLabel = (which, mz, rt) => {
            let text;
            let xoffset = 0;
            let zoffset = 0;
            if (which == "mz") {
                text = GraphUtil.roundTo(mz, Graph.roundMz);
                zoffset = 2.0;
            } else if (which == "rt") {
                text = GraphUtil.roundTo(rt/60, Graph.roundRt);
                xoffset = -1.5;
                zoffset = 0.2;
            }
            let label = GraphLabel.makeTextSprite(text, {r:0, g:0, b:0}, 15);
            let gridsp = GraphControl.mzRtToGridSpace(mz, rt);
            label.position.set(gridsp.x + xoffset, 0, gridsp.z + zoffset);
            tickLabelGroup.add(label);
        };
    
        // calculate tick frequency
        let mzSpacing = Math.pow(10, Math.floor(Math.log(r.mzrange)/Math.log(10) - 0.5));
        let rtSpacing = Math.pow(10, Math.floor(Math.log(r.rtrange)/Math.log(10) - 0.5));
        
        GraphUtil.emptyGroup(ticksGroup);
    
        // properly check if floating-point "value" is a multiple
        // of "divisor" within a tolerance
        let isMultiple = (value, divisor) => {
            let rem = Math.abs(value % divisor);
            return (rem < 1e-4) || (divisor-rem < 1e-4);
        };
    
        // place mz marks...
        let mz, rt, long;
    
        let mzFirst = r.mzmin - (r.mzmin % mzSpacing);
        rt = r.rtmin;
        for (mz = mzFirst + mzSpacing; mz < r.mzmax; mz += mzSpacing) {
            // This little gem makes it so that tick marks that are a multiple
            // of (10 * the spacing value) are longer than the others
            long = isMultiple(mz, mzSpacing * 10);
            let rtlen = r.rtrange * (long ? 0.05 : 0.02);
            makeTickMark(mz, mz, rt, rt - rtlen);
    
            if (long) {
                makeTickLabel("mz", mz, rt);
            }
        }
        
        // ...and rt marks
        let rtFirst = r.rtmin - (r.rtmin % rtSpacing);
        mz = r.mzmin;
        for (rt = rtFirst + rtSpacing; rt < r.rtmax; rt += rtSpacing) {
            long = isMultiple(rt, rtSpacing * 10);
            let mzlen = r.mzrange * (long ? 0.05 : 0.02);
            makeTickMark(mz, mz - mzlen, rt, rt);
    
            if (long) {
                makeTickLabel("rt", mz, rt);
            }
        }
    };
    /*update labels and legend to reflect a new view range*/
    static updateViewRange = (newViewRange) => {
        Graph.viewRange = newViewRange;
        GraphControl.repositionPlot(newViewRange);
        GraphLabel.drawDataLabels();
    }
    /*prevent user from going outside the data range or zooming in so far that math breaks down*/
    static constrainBoundsZoom = (newmzmin, newmzrange, newrtmin, newrtrange) => {
        //if range is too small, set to minimum range of 0.01
        if (newrtrange < 0.01){
            newrtrange = 0.01;
        }
        if (newmzrange < 0.01){
            newmzrange = 0.01;
        }
        //if value goes below zero in rt or mz, set to 0
        if (newmzmin < 0){
            newmzmin = 0;
        }
        if (newrtmin < 0){
            newrtmin = 0;
        }
        //if max value is going to go over the max mz, rt, set them to be the max value, no going over the limit
        if (newmzmin + newmzrange > Graph.dataRange.mzmax){
            newmzrange = Graph.dataRange.mzmax - newmzmin;
        }
        if (newrtmin + newrtrange > Graph.dataRange.rtmax){
            newrtrange = Graph.dataRange.rtmax - newrtmin;
        }
        return {
            mzmin: newmzmin, mzmax: newmzmin + newmzrange, mzrange: newmzrange,
            rtmin: newrtmin, rtmax: newrtmin + newrtrange, rtrange: newrtrange,
        }
    }
    static constrainBoundsPan = (newmzmin, newmzrange, newrtmin, newrtrange) => {
        //if range is too small, set to minimum range of 0.01
        if (newrtrange < 0.01){
            newrtrange = 0.01;
        }
        if (newmzrange < 0.01){
            newmzrange = 0.01;
        }
        if (newmzmin < 0){
            newmzmin = 0;
        }
        if (newrtmin < 0){
            newrtmin = 0;
        }
        let newmzmax = newmzmin + newmzrange; 
        let newrtmax = newrtmin + newrtrange; 

        //if max value is going to go over the max mz, rt, set them to be the max value, no going over the limit
        if (newmzmin + newmzrange > Graph.dataRange.mzmax){
            //no panning
            newmzmin = Graph.viewRange.mzmin;
            newmzmax = Graph.dataRange.mzmax;
            newmzrange = newmzmax - newmzmin;

        }
        if (newrtmin + newrtrange > Graph.dataRange.rtmax){
           //no panning
           newrtmin = Graph.viewRange.rtmin;
           newrtmax = Graph.dataRange.rtmax;
           newrtrange = newrtmax - newrtmin;
        }
        return {
            mzmin: newmzmin, mzmax: newmzmax, mzrange: newmzrange,
            rtmin: newrtmin, rtmax: newrtmax, rtrange: newrtrange,
        }
    }
    static resizeCamera = () => {
        Graph.renderer.setSize(Graph.graphEl.clientWidth, Graph.graphEl.clientHeight, true);
        let aspectRatio = Graph.renderer.getSize().width / Graph.renderer.getSize().height;

        let vs = Graph.viewSize;
        if (aspectRatio > 1) 
        {
            // width greater than height; scale height to view size to fit content
            // and scale width based on the aspect ratio (this creates extra space on the sides)
            Graph.camera.left = vs * aspectRatio / -2;
            Graph.camera.right = vs * aspectRatio / 2;
            Graph.camera.top = vs / 2;
            Graph.camera.bottom = vs / -2;
        } 
        else 
        {
            // height greater than width; same as above but with top+bottom switched with left+right
            Graph.camera.left = vs / -2;
            Graph.camera.right = vs / 2;
            Graph.camera.top = vs / aspectRatio / 2;
            Graph.camera.bottom = vs / aspectRatio / -2;
        }
        // render the view to show the changes
        Graph.camera.updateProjectionMatrix();

        GraphRender.renderImmediate();

        Graph.resizedCamera = Graph.camera;
    };
}