function Graph(){
    this.maxPoints = 1000;
    this.minIntensity = 0;
    this.dataRange = {};
    //this.scene;
}
Graph.prototype.initGraph = function(){
    //this.scene = canvas.getScene();
}
Graph.prototype.scale = function(rawPoints){
	//decide scale factor based on range of mz and rt
	//find max/min mz and rt
	let minMZ = 0, minRT = 0, minInte = 0;
	let maxMZ = rawPoints[0].MZ, maxInte = rawPoints[0].INTENSITY, maxRT = rawPoints[0].RETENTIONTIME;
	
	for (let i = 0; i < rawPoints.length;i++){
		if (rawPoints[i].MZ < minMZ){
			minMZ = rawPoints[i].MZ;
		}
		if (rawPoints[i].MZ > maxMZ){
			maxMZ = rawPoints[i].MZ;
		}
		if (rawPoints[i].RETENTIONTIME < minRT){
			minRT = rawPoints[i].RETENTIONTIME;
		}
		if (rawPoints[i].RETENTIONTIME < maxRT){
			maxRT = rawPoints[i].RETENTIONTIME;
		}
		if (rawPoints[i].RETENTIONTIME < minInte){
			minInte = rawPoints[i].INTENSITY;
		}
		if (rawPoints[i].RETENTIONTIME < maxInte){
			maxInte = rawPoints[i].INTENSITY;
		}
	}

	let mzRange = Math.ceil(maxMZ - minMZ);
	let rtRange = Math.ceil(maxRT - minRT);
	let inteRange = Math.ceil(maxInte - minInte);
	
	//current graph is 20:12 (5:3)
	//mzRange : 5 = value : target => target * mzRange = value * 5 

	let mzScale = 5 / mzRange;
	let rtScale = 3 / rtRange;
	let inteScale = 5 / inteRange;
	console.log("range", mzRange, rtRange, inteRange)
	console.log("scale", mzScale, rtScale, inteScale)
	return {"mzScale":mzScale, "rtScale":rtScale, "inteScale":inteScale};
}
Graph.prototype.calculatePoints = function(rawPoints){
    let points = [];
	
	let scale = this.scale(rawPoints);
	
    for (let i = 0; i < rawPoints.length; i++){
        points.push(new THREE.Vector3(rawPoints[i].MZ * scale.mzScale, 0, rawPoints[i].RETENTIONTIME * scale.rtScale));
        points.push(new THREE.Vector3(rawPoints[i].MZ * scale.mzScale, rawPoints[i].INTENSITY * scale.inteScale, rawPoints[i].RETENTIONTIME * scale.rtScale));
    }
	console.log(points)
    return points;
}
Graph.prototype.drawGraph = function(rawPoints, canvas){
    let lineMaterial = new THREE.LineBasicMaterial({color:0x3D85C6});

    //the points array contain 4 numbers each (id, mz, intensity, rt);

    let points = this.calculatePoints(rawPoints);
    
    let geometry = new THREE.BufferGeometry().setFromPoints(points);
    let peaks = new THREE.LineSegments(geometry, lineMaterial);
    
    peaks.position.set(15, 7, 20);
    peaks.rotation.x = 0.95 * Math.PI;
    peaks.rotation.y = 0.10 * Math.PI;
    peaks.rotation.z = -0.10 * Math.PI

    let scene = canvas.getScene();
    scene.add(peaks);

    console.log(scene);

    canvas.updateScene(scene);

}