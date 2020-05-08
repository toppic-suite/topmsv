function Graph(){
    this.maxPoints = 1000;
    this.minIntensity = 0;
    this.dataRange = {};
    //this.scene;
}
Graph.prototype.initGraph = function(){
    //this.scene = canvas.getScene();
    //console.log(this.scene);
}
Graph.prototype.calculatePoints = function(rawPoints){
    let points = [];

    for (let i = 0; i < 1000; i++){
        points.push(new THREE.Vector3(rawPoints[i][1]/100, 0, rawPoints[i][3]/10000000));
        points.push(new THREE.Vector3(rawPoints[i][1]/100, rawPoints[i][2]/10, rawPoints[i][3]/10000000));
    }
    return points;
}
Graph.prototype.drawGraph = function(rawPoints){
    let lineMaterial = new THREE.LineBasicMaterial({color:0x3D85C6});

    //the points array contain 4 numbers each (id, mz, intensity, rt);

    let points = this.calculatePoints(rawPoints);
    
    let geometry = new THREE.BufferGeometry().setFromPoints(points);
    let peaks = new THREE.LineSegments(geometry, lineMaterial);
    
    peaks.position.set(15, 7, 20);
    peaks.rotation.x = 0.95 * Math.PI;
    peaks.rotation.y = 0.10 * Math.PI;
    peaks.rotation.z = -0.10 * Math.PI

    console.log("peak data : ", points);

    let scene = canvas.getScene();
    scene.add(peaks);

    console.log(scene);

    canvas.updateScene(scene);

}