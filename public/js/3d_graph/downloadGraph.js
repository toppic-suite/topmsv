//add event handler for button downloading graph as image
document.getElementById("save3dGraph").addEventListener("click", this.save3dGraph.bind(this), false);

function save3dGraph(e){
    //get mouse x y position for location of pop up
    graph3D.renderImmediate();
    popupnamewindow("png", e.clientX, e.clientY);
}

function popupnamewindow(type,x,y){
	d3.selectAll("#tooltip_imagename").remove() ;
	var div = d3.select("body").append("div")
	.attr("class", "tooltip")
	.attr("id","tooltip_imagename")
	.style("opacity", 1);

	div.transition()
	.duration(200)
	.style("opacity", .9);
	div.html(
			'<input type="text" placeholder="Image Name" id="imagename" />'+
			'<button id="saveimage" style = "none" type="button">save</button>'
			)
	.style("left", (x - 90) + "px")             
	.style("top", (y + 20) + "px")
	// .style("transform","translateX(-35%)!important")
	.attr("box-sizing","border")
	.attr("display","inline-block")
	.attr("min-width","1.5em")
	.attr("padding","2px")
	.attr("margin-left","0px")
	.attr("text-align","center")
	.attr("text-decoration","none")
	.attr("border","1px solid #111111")
	.attr("background-color","white");

	$("#saveimage").click(function(){
		let imagename = $("#imagename").val();
		if( imagename == null || imagename == "")
		{
			imagename = "peak3DGraph";
		}
		if(type == "png"){
			d3.selectAll("#tooltip_imagename").remove() ;
			//let width = graph3D.
			//let height = specParams.svgHeight ;
			createImage('png', save ); 
			function save( dataBlob, filesize ){
				saveAs( dataBlob, imagename ); 
			}
		}
	})
}
function createImage(format, callback ) {
	let imgsrc = graph3D.imageAddress;
    let canvas = document.createElement("canvas");
    let oriCanvas = document.getElementById("canvas3D");
    let context = canvas.getContext("2d");
	canvas.width = oriCanvas.width;
    canvas.height = oriCanvas.height;

	let image = new Image();
	image.onload = function() {
		//context.clearRect ( 0, 0, width, height );
		context.drawImage(image, 0, 0);
		
		canvas.toBlob( function(blob) {
			var filesize = Math.round( blob.length/1024 ) + ' KB';
			if ( callback ) callback( blob, filesize );
        });
        
	};
    image.src = imgsrc;
}