function init3D(){
    //when mz and rt are passed from 2D
    //for now
    let projectDir = document.getElementById("projectDir").value;
    let dir = projectDir.substr(0, projectDir.lastIndexOf(".")) + ".db";
    let graph = new Graph(dir);
    graph.main();
}