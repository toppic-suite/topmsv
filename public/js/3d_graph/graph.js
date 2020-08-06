// graph.js: graph initialization code and helper methods

function MsGraph(containerEl, graphEl) {
    this.containerEl = $(containerEl);
    this.graphEl = graphEl;
    this.scene = new THREE.Scene();

    // Adjusts the size of the baseline grid
    this.GRID_RANGE = 20;
    this.GRID_RANGE_VERTICAL = 6;
    this.VIEW_SIZE = 18; // in world units; large enough to fit the graph and labels at reasonable angles

    this.graphPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    this.rangeTransform = new THREE.Vector3(1/this.GRID_RANGE, 1/this.GRID_RANGE_VERTICAL, 1/this.GRID_RANGE);

    this.LOG_SCALAR = 1;
    this.USE_LOG_SCALE_COLOR = true;
    this.USE_LOG_SCALE_HEIGHT = false;
 
    // number of ruler ticks to render
    this.RULER_TICKS = 5;

    this.dataRange = { mzmin: 0, mzmax: 1, mzrange: 1, rtmin: 0, rtmax: 1, rtrange: 1, intmin: 0, intmax: 1000, intrange: 1000 };

    this.labels = {};

    this.renderRequested = false;

    this.ROUND_MZ = 3;
    this.ROUND_RT = 3;
    this.ROUND_INT = 3;

    this.currentData; //all data for current scan (so that no need to load all back when moving ms1 graph)
    this.ms1Peaks;//ms1 peaks for each scan

    this.mzAxisZoom = false;
    this.rtAxisZoom = false;

    this.maxPeaks = 6000;

    this.totalMaxMz = 0;//max mz and rt for all peaks in this mzMLm, used to limit the maximum mz rt in the 3d graph
    this.totalMaxRt = 0;
    this.totalMinRt = 0;

    this.intensitySum = 0; //for display near the graph
    
    this.imageAddress;

    //this.gradientColor = ["#c6dbef", "#9ecae1", "#6baed6", "#3182bd", "#08519c"];//5 shades of blue
    this.gradientColor = ["#2233c3", "#5f31ac", "#963097", "#c82f84", "#fd2d70"];//purple-pink (low to high);
    this.cutoff = []; //intensity cutoff point for each color in gradient
}

/******** SETUP FUNCTIONS ******/

// creates the graph scene and sets it up. Should be called
// after the document is ready and all javascript has loaded
MsGraph.prototype.init = function(maxMzRt){
    //set maximum mz rt value 
    this.totalMaxMz = maxMzRt.MZMAX;
    this.totalMaxRt = maxMzRt.RTMAX;
   
    var scene = this.scene;

    // rendering element
    var renderer = this.renderer = new THREE.WebGLRenderer( { antialias: true, alpha:true} );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize(window.innerWidth, window.innerHeight * 0.3);
    renderer.setClearColor(0xEEEEEE, 1);
    
    this.graphEl.appendChild(renderer.domElement);

    this.renderer.domElement.id = "canvas3D";

    /*initiate graph interactions*/
    //enable zoom
    this.zoomGraph(this);

    //enable panning
    this.panGraph(this);

    //enable hover over peaks
    //this.hoverGraph(this);

    // camera
    //var camera = this.camera = new THREE.OrthographicCamera(el.offsetLeft/-2, el.offsetLeft/2, el.offsetTop/-2, el.offsetTop/2, - 300, 300 );
    var camera = this.camera = new THREE.OrthographicCamera( 5000, 5000, 5000, 5000, 0, 5000 );
    
    camera.position.set(15, 15, 30);
    this.prevCameraPos = camera.position.clone();

    // window resizing
    window.addEventListener("resize", this.resizeCamera.bind(this));
    this.resizeCamera();

    //set up threeEx.domevents event listener
    this.domEvents = new THREEx.DomEvents(this.resizedCamera, this.renderer.domElement)

    // right-click rotation controls
    var graphControls = this.graphControls = new THREE.OrbitControls( camera, renderer.domElement );
    graphControls.mouseButtons = { ORBIT: THREE.MOUSE.RIGHT };
    graphControls.addEventListener( 'change', this.renderImmediate.bind(this) );
    graphControls.target.set(this.GRID_RANGE/2, 0, this.GRID_RANGE/2); // focus on the center of the grid
    graphControls.enablePan = false;
    graphControls.enabled = true;

    // make grouping constructs
    this.gridgroup = new THREE.Group();
    this.datagroup = new THREE.Group();
    this.markergroup = new THREE.Group();
    this.labelgroup = new THREE.Group();
    this.ticksGroup = new THREE.Group();
    this.ticklabelgroup = new THREE.Group();

    // plotting objects
    this.linesArray = [];
    this.plotGroup = new THREE.Group();
  
    this.datagroup.add(this.plotGroup);
    //this.datagroup.add(this.cylinderGroup);
    this.datagroup.add(this.ticksGroup);
    
    // graph "surface" (gray underside)
    var surfaceGeo = new THREE.PlaneGeometry(this.GRID_RANGE, this.GRID_RANGE);
    var surfaceMat = new THREE.MeshBasicMaterial({ color: 0xbbbbbb, side: THREE.DoubleSide });
    var surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    surface.rotateX(Math.PI/2);
    surface.position.set(this.GRID_RANGE / 2, -0.05, this.GRID_RANGE / 2);
    this.gridgroup.add(surface);
    this.gridgroup.add(this.drawGrid());

    //add two invisible lines on top of rt and mz axis for zooming
    var axisMat = new THREE.LineBasicMaterial({color: 0x0000ff, linewidth:100});
    
    var rtpoints = [];
    rtpoints.push( new THREE.Vector3( 0, 0, this.GRID_RANGE) );
    rtpoints.push( new THREE.Vector3( 0, 0, 0 ) );
    
    var mzpoints = [];
    mzpoints.push( new THREE.Vector3( 0, 0, this.GRID_RANGE) );
    mzpoints.push( new THREE.Vector3( this.GRID_RANGE, 0, this.GRID_RANGE) );

    var mzGeo = new THREE.BufferGeometry().setFromPoints( mzpoints );
    var rtGeo = new THREE.BufferGeometry().setFromPoints( rtpoints );

    var mzLine = new THREE.Line( mzGeo, axisMat );
    var rtLine = new THREE.Line( rtGeo, axisMat );

    mzLine.visible = false;
    rtLine.visible = false;

    this.domEvents.addEventListener(mzLine, 'mouseover', (function(event){
        //console.log("over mz")
        this.mzAxisZoom = true;
    }).bind(this), false);

    this.domEvents.addEventListener(rtLine, 'mouseover', (function(event){
        //console.log("over rt")
        this.rtAxisZoom = true;
    }).bind(this), false);

    this.domEvents.addEventListener(mzLine, 'mouseout', (function(event){
        this.mzAxisZoom = false;
    }).bind(this), false);

    this.domEvents.addEventListener(rtLine, 'mouseout', (function(event){
        this.rtAxisZoom = false;
    }).bind(this), false);

    // add objects to the scene
    scene.add(this.gridgroup);
    scene.add(mzLine, rtLine);
    scene.add(this.datagroup);
    scene.add(this.labelgroup);
    scene.add(this.ticklabelgroup);
    scene.add(this.markergroup);
    this.updateViewRange(this.dataRange);

    renderer.setAnimationLoop(function() {
        graphControls.update();
    });
};

/******** GEOMETRY/MATH FUNCTIONS *******/
// Converts mz, rt coordinate to normal space (0 to GRID_RANGE)
MsGraph.prototype.mzRtToGridSpace = function(mz, rt) {
    var vr = this.viewRange;

    var mz_norm = (mz - vr.mzmin) / vr.mzrange;
    var rt_norm = (rt - vr.rtmin) / vr.rtrange;

    return { x: mz_norm * this.GRID_RANGE, z: (1 - rt_norm) * this.GRID_RANGE };
}

// Returns number rounded to places decimals
MsGraph.roundTo = function(number, places) {
    var power = Math.pow(10, places);
    return Math.round(number * power) / power;
};

/******** OBJECT MANAGEMENT AND UTILITIES *****/

// disposes everything related to an individual object
MsGraph.disposeObject = function(obj) {
    if (obj.material.map) {
        obj.material.map.dispose();
    }
    if (obj.material) {
        obj.material.dispose();
    }
    if (obj.geometry) {
        obj.geometry.dispose();
    }
    if (obj.dispose) {
        obj.dispose();
    }
};

// clears out objects in a group
MsGraph.emptyGroup = function(g) {
    while (g.children.length > 0) {
        var obj = g.children.pop();
        MsGraph.disposeObject(obj);
    }
};


/******* DATA RANGE AND VIEWING ANGLE FUNCTIONS ****/

// resizes the renderer and camera, especially in response to a window resize
MsGraph.prototype.resizeCamera = function() {
    // reset the renderer to fit the window
    this.renderer.setSize(this.graphEl.clientWidth, this.graphEl.clientHeight, true);
	var aspectRatio = this.renderer.getSize().width / this.renderer.getSize().height;

    var camera = this.camera;
    var vs = this.VIEW_SIZE;
    if (aspectRatio > 1) {
        // width greater than height; scale height to view size to fit content
        // and scale width based on the aspect ratio (this creates extra space on the sides)
        camera.left = vs * aspectRatio / -2;
        camera.right = vs * aspectRatio / 2;
        camera.top = vs / 2;
        camera.bottom = vs / -2;
    } else {
        // height greater than width; same as above but with top+bottom switched with left+right
        camera.left = vs / -2;
        camera.right = vs / 2;
        camera.top = vs / aspectRatio / 2;
        camera.bottom = vs / aspectRatio / -2;
    }
    // render the view to show the changes
    camera.updateProjectionMatrix();
    this.renderDelayed();

    this.resizedCamera = camera;
};

// update labels and legend to reflect a new view range
MsGraph.prototype.updateViewRange = function(newViewRange) {
    this.viewRange = newViewRange;
    this.repositionPlot(newViewRange);
    this.drawDataLabels();
    this.renderImmediate();
};

// prevent user from going outside the data range or zooming in so far that math breaks down
MsGraph.prototype.constrainBounds = function(r) {
    var dataRange = this.dataRange;

    // prevent mzrange and rtrange from getting too small and causing bizarre floating point errors
    var newmzrange = Math.min(Math.max(r.mzrange, 0.05), dataRange.mzrange);
    var newrtrange = Math.min(Math.max(r.rtrange, 0.05), dataRange.rtrange);
    var mzmid = (r.mzmin + r.mzmax) / 2;
    var rtmid = (r.rtmin + r.rtmax) / 2;
    var newmzmin = mzmid - newmzrange / 2;
    var newrtmin = rtmid - newrtrange / 2;

    // stay within data range
    newmzmin = Math.min(Math.max(newmzmin, dataRange.mzmin), dataRange.mzmax - newmzrange);
    newrtmin = Math.min(Math.max(newrtmin, dataRange.rtmin), dataRange.rtmax - newrtrange);

    return {
        mzmin: newmzmin, mzmax: newmzmin + newmzrange, mzrange: newmzrange,
        rtmin: newrtmin, rtmax: newrtmin + newrtrange, rtrange: newrtrange,
    };
};

// zooms the view to a specific view range.
// alternatively, pass an object with properties named after the parameters
MsGraph.prototype.setViewingArea = function(mzmin, mzrange, rtmin, rtrange) {
    var r = mzmin;

    if (typeof mzmin === "number") {
        r = {
            mzmin: mzmin, mzmax: mzmin + mzrange, mzrange: mzrange,
            rtmin: rtmin, rtmax: rtmin + rtrange, rtrange: rtrange,
        };
    }
    r = this.constrainBounds(r);
    load3dDataByParaRange(mzmin,mzmin + mzrange, rtmin, rtmin + rtrange, rawRT, graph3D);
};

/******** RENDERING AND DRAWING FUNCTIONS *****/

// render the graph immediately (i.e. can't wait for timed update)
MsGraph.prototype.renderImmediate = function() {
    //if camera angle is perpendicular to the graph plane
    if (this.camera.position.y > 25.495){
        this.plotPointAsCircle();
    }
    else{
        let prevGroup = this.datagroup.getObjectByName("cylinderGroup");
        this.datagroup.remove(prevGroup);
    }
    this.renderer.render( this.scene, this.camera );
    this.imageAddress = this.renderer.domElement.toDataURL();
    this.renderRequested = false;
};

// render the graph at the next automatic interval
MsGraph.prototype.renderDelayed = function() {
    this.renderRequested = true;
};

// creates a THREEjs Sprite that renders as a floating text label
MsGraph.makeTextSprite = function(msg, textColor, fontsize) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var fontwidth = context.measureText(msg).width;
    context.font = fontsize + "px Arial";
    context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
    context.fillText(msg, ((canvas.width/2) - (fontwidth/2)), ((canvas.height/2) - (fontsize/2)));

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
    return sprite;
};

// updates status text labels and the outer graph axis labels
MsGraph.prototype.drawDataLabels = function() {
    // dispose all labels on the graph
    while(this.labelgroup.children.length > 0) {
        var obj = this.labelgroup.children.pop();
        MsGraph.disposeObject(obj);
    }
    var mzmintext = MsGraph.roundTo(this.viewRange.mzmin, this.ROUND_MZ);
    var mzmaxtext = MsGraph.roundTo(this.viewRange.mzmax, this.ROUND_MZ);
    var rtmintext = MsGraph.roundTo((this.viewRange.rtmin/60).toFixed(4), this.ROUND_RT);
    var rtmaxtext = MsGraph.roundTo((this.viewRange.rtmax/60).toFixed(4), this.ROUND_RT);

    var mztext = "m/z";
    var rttext = "retention time";

    this.labels.mzMin = MsGraph.makeTextSprite(mzmintext, {r: 0, g: 0, b: 0}, 16);
    this.labels.mzMax = MsGraph.makeTextSprite(mzmaxtext,{r: 0, g: 0, b: 0}, 16);
    this.labels.rtMin = MsGraph.makeTextSprite(rtmintext,{r: 0, g: 0, b: 0}, 16);
    this.labels.rtMax = MsGraph.makeTextSprite(rtmaxtext,{r: 0, g: 0, b: 0}, 16);
    this.labels.mz = MsGraph.makeTextSprite(mztext,{r: 0, g: 0, b: 0}, 16);
    this.labels.rt = MsGraph.makeTextSprite(rttext,{r: 0, g: 0, b: 0}, 16);

    this.labels.mz.position.set(0.5, 0.5, this.GRID_RANGE + 1.5);
    this.labels.mzMin.position.set(0.5, -0.5, this.GRID_RANGE + 1.5);
    this.labels.mzMax.position.set(this.GRID_RANGE, -0.5, this.GRID_RANGE + 1.5);

    this.labels.rt.position.set(-1.5, 0.5, this.GRID_RANGE);
    this.labels.rtMin.position.set(-1.5, -0.5, this.GRID_RANGE);
    this.labels.rtMax.position.set(-1.5, -0.5, 0.5);

    this.labelgroup.add(this.labels.mzMin, this.labels.mzMax, this.labels.rtMin, this.labels.rtMax, this.labels.mz, this.labels.rt);
};

// labels the closest point to the mouse
MsGraph.prototype.drawHoverLabel = function(point) {
    var currentPtText = "[ No point near mouse ]";
    if (point) {
        currentPtText = "[ m/z: " + MsGraph.roundTo(point.mz, this.ROUND_MZ) +
            ", RT: " + MsGraph.roundTo(point.rt, this.ROUND_RT) +
            ", intensity: " + MsGraph.roundTo(point.int, this.ROUND_INT) +
            ", trace: " + point.trace + " ]";
    }
    this.containerEl.find(".status-current-pt").text(currentPtText);
};

// returns a 1x1 unit grid, GRID_RANGE units long in the x and z dimension
MsGraph.prototype.drawGrid = function() {
    var y = 0;

    var gridgeo = new THREE.Geometry();
    var gridmaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    for (var i = 0; i <= this.GRID_RANGE; i++) {
        gridgeo.vertices.push(new THREE.Vector3(i, y, 0));
        gridgeo.vertices.push(new THREE.Vector3(i, y, this.GRID_RANGE));

        gridgeo.vertices.push(new THREE.Vector3(0, y, i));
        gridgeo.vertices.push(new THREE.Vector3(this.GRID_RANGE, y, i));
    }

    gridgeo.vertices.push(new THREE.Vector3(0, y, this.GRID_RANGE));
    gridgeo.vertices.push(new THREE.Vector3(0, 0, this.GRID_RANGE));

    return new THREE.LineSegments(gridgeo, gridmaterial);
};