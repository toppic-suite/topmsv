/*graph_init.js: class for initializing 3d graph*/
class GraphInit{

    constructor(graphEl){
        this.graphEl = graphEl;
    }
    init(){
        
        Graph.renderer.setSize( window.innerWidth, window.innerHeight );
        this.graphEl.appendChild( Graph.renderer.domElement );
        var camera = new THREE.OrthographicCamera( 10, 10, 10, 10, 0, 10 );
        camera.position.set( 15, 15, 30 );
        //camera.lookAt( 0, 0, 0 );
        
        //create a blue LineBasicMaterial
        var material = new THREE.LineBasicMaterial( { color: 0x0000ff } );

        var points = [];
        points.push( new THREE.Vector3( - 10, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 10, 0 ) );
        points.push( new THREE.Vector3( 10, 0, 0 ) );

        var geometry = new THREE.BufferGeometry().setFromPoints( points );

        var line = new THREE.Line( geometry, material );

        Graph.scene.add( line );
        Graph.renderer.render( Graph.scene, camera );
    }
}