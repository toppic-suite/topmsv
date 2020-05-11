function InitCanvas(){
    const near = 0.1;
    const far = 1000;

    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer:true});
    this.camera = new THREE.OrthographicCamera(-20, 20, -15, 15, near, far);

    this.camera.position.x = 45;
    this.camera.position.y = 5;
    this.camera.position.z = 45;

    this.camera.lookAt(270, 10, 0)
}

InitCanvas.prototype.updateScene = function(scene){
    this.scene = scene;
    this.renderer.render(this.scene, this.camera);
}
InitCanvas.prototype.getScene = function(){
    return this.scene;
}
InitCanvas.prototype.drawGrid = function(width, height){
    let lineMaterial = new THREE.LineBasicMaterial({color:0x000000});
    let points = [];

    for (let i = 0; i < height; i++){
        points.push(new THREE.Vector3(i, 0, 0));
        points.push(new THREE.Vector3(i, 0, width));
    };
    for (let j = 0; j < width; j++){
        points.push(new THREE.Vector3(0, 0, j));
        points.push(new THREE.Vector3(height, 0, j));
    };
    points.push(new THREE.Vector3(0, 0, width));
    points.push(new THREE.Vector3(height, 0, width));

    points.push(new THREE.Vector3(height, 0, 0));
    points.push(new THREE.Vector3(height, 0, width));

    var geometry = new THREE.BufferGeometry().setFromPoints(points);
    var gridLines = new THREE.LineSegments(geometry, lineMaterial);

    gridLines.position.set(15, 7, 20);
    //gridLines.rotation.x = 0.35 * Math.PI;
    //gridLines.rotation.y = 0.10 * Math.PI;
    //gridLines.rotation.z = -0.10 * Math.PI;

    gridLines.rotation.x = 0.95 * Math.PI;
    gridLines.rotation.y = 0.10 * Math.PI;
    gridLines.rotation.z = -0.20 * Math.PI;

    return gridLines;
}
InitCanvas.prototype.initCanvas = function(){
    const graphWidth = 20;
    const graphHeight = 12;

    const canvasDOM = document.querySelector("#graph-container");
    
    this.renderer.setClearColor(0xF5F5F5, 0);
    this.renderer.setSize(window.innerWidth * 0.5, window.innerHeight  * 0.2);
    canvasDOM.appendChild(this.renderer.domElement);
    
    //enable rotation
    
	let controls = new THREE.OrbitControls(this.camera, this.renderer.domElement );
    controls.enableRotate = false;
    //controls.target.set(graphWidth/3, 0, graphHeight/3); // focus on the center of the grid
    
    controls.screenSpacePanning = true;

    controls.addEventListener('change', this.render.bind(this));

    let baseGroup = new THREE.Group();
    
    const graphSurface = new THREE.PlaneGeometry(graphWidth, graphHeight);
    const graphMaterial = new THREE.MeshBasicMaterial({color:0xbbbbbb, side:THREE.DoubleSide});

    baseGroup.add(this.drawGrid(graphHeight, graphWidth));

    this.scene.add(baseGroup);
    this.updateScene(this.scene);
}
InitCanvas.prototype.render = function() {
    console.log("canvas rendering")
    this.renderer.render(this.scene, this.camera);
}

