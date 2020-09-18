/*graph_download.js: add event handler for button downloading graph as image*/
class GraphDownload{
	constructor(){}
	static createImage = (callback) => {
		let imgsrc = Graph.imageAddress;
		let canvas = document.createElement("canvas");
		let oriCanvas = document.getElementById("canvas3D");
		let context = canvas.getContext("2d");

		canvas.width = oriCanvas.width;
		canvas.height = oriCanvas.height;
	
		let image = new Image();
		image.onload = () => {
			context.drawImage(image, 0, 0);
			
			canvas.toBlob((blob) => {
				var filesize = Math.round( blob.length/1024 ) + ' KB';
				console.log(callback)
				if (callback) callback( blob, filesize );
			});
		};
		image.src = imgsrc;
	}
	static popupnamewindow = (x, y) => {
		//save-as-image-form
		let formDiv = document.getElementById("save-as-image-form");

		formDiv.style.display = "flex";
		formDiv.style.left = (x - 90) + "px"
		formDiv.style.top = (y + 20) + "px";

		$("#btn-save-file-name").click(function(){
			let imagename = $("#input-file-name").val();
			if( imagename == null || imagename == ""){
				imagename = "peak3DGraph";
			}
			document.getElementById("save-as-image-form").style.display = "none";

			const save = (dataBlob, filesize) => {
				saveAs( dataBlob, imagename ); 
			}
			GraphDownload.createImage(save); 
		})
	}
	static save3dGraph = (e) => {
		//get mouse x y position for location of pop up
		GraphRender.renderImmediate();
		GraphDownload.popupnamewindow(e.clientX, e.clientY);
	}
}
