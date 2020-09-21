function getMax(){
    return new Promise(function(resolve, reject){
        let fullDir = (document.getElementById("projectDir").value).split("/");
        let fileName = (fullDir[fullDir.length -1].split("."))[0];
        let dir = fullDir[0].concat("/");
        dir = dir.concat(fullDir[1]);

        var xhttp3 = new XMLHttpRequest();
        xhttp3.onreadystatechange = function (){
            if (this.readyState == 4 && this.status == 200) {
                var result = JSON.parse(this.responseText);

                if (result != undefined){
                    resolve(result);
                }
                else{
                    reject("max values are undefined")
                }
            }
        }
        xhttp3.open("GET","getMax?projectDir=" + dir + "/" + fileName + ".db" + "&colName=" + 'MZ',true);
        xhttp3.send();
    });
}
function init3D(localStorage){
    let promise = getMax();
    
    promise.then(function(tableData){//to make sure max values are fetched before creating graph
        Graph.tablePeakCount = tableData;

        let graph3D = new Graph(document.querySelector("#graph-container"), tableData);
        graph3D.main();

        console.log("localStorage", window.localStorage)
        GraphData.drawInitGraph(localStorage.mzmin, localStorage.mzmax, localStorage.curRT, true)
        
    }, function(err){
        console.log(err);
    })
}