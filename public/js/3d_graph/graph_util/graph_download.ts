/*graph_download.js: add event handler for button downloading graph as image*/
class GraphDownload {
  constructor(){}

  static createImage = (callback: Function): void => {
	let imgsrc: string = Graph.imageAddress;
	let canvas: HTMLCanvasElement = document.createElement("canvas");
	let oriCanvas: HTMLCanvasElement | null = document.querySelector<HTMLCanvasElement>("#canvas3D");
	let context: CanvasRenderingContext2D | null = canvas.getContext("2d");

	if (!oriCanvas) {
	  console.error("canvas for 3d view does not exist");
	  return;
	}

	canvas.width = oriCanvas.width;
	canvas.height = oriCanvas.height;

	let image = new Image();

	image.onload = () => {
	  if (!context) {
	    console.error("context for 3d view does not exist");
		return;
	  }
	  context.drawImage(image, 0, 0);
		
	  canvas.toBlob((blob: Blob | null) => {
		if (blob) {
		  let filesize = Math.round( blob.size/1024 ) + ' KB';
		  if (callback) callback( blob, filesize );
		} else {
		  console.error("error creating Blob from canvas");
		}
	  });
	};
	image.src = imgsrc;
  }  


  static getImageName = (): string => {
	let trimStart: number = Graph.projectDir.lastIndexOf("/");
	if (trimStart < 0){
		trimStart = Graph.projectDir.lastIndexOf("\\");
	}
	let trimEnd: number = Graph.projectDir.lastIndexOf(".");
	
	return Graph.projectDir.slice(trimStart + 1, trimEnd);
  }


  static popupnamewindow = (x: number, y: number): void => {
	//save-as-image-form
	let formDiv: HTMLDivElement | null = document.querySelector<HTMLDivElement>("#save-as-image-form");
	let btn: HTMLButtonElement | null = document.querySelector<HTMLButtonElement>("#btn-save-file-name");

	if (!formDiv) {
	  console.error("save an image form does not exist");
	  return;
	}
	if (!btn) {
	  console.error("button for saving image doesn't exist");
	  return;
	}
	formDiv.style.display = "flex";
	formDiv.style.left = (x - 90) + "px"
	formDiv.style.top = (y + 20) + "px";

	btn.onclick = () => {
	  let imagename = GraphDownload.getImageName();
	  if( imagename == null || imagename == ""){
		imagename = "peak3DGraph";
	  }
	  formDiv!.style.display = "none";

	  const save = (dataBlob, filesize) => {
		//@ts-ignore //function defined in an external library
		saveAs( dataBlob, imagename ); 
	  }
	  GraphDownload.createImage(save); 
	}
  }


  static save3dGraph = (e: MouseEvent) => {
	//get mouse x y position for location of pop up
	GraphRender.renderImmediate();
	GraphDownload.popupnamewindow(e.clientX, e.clientY);
  }
}
