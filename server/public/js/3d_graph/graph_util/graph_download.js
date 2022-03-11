/*graph_download.js: add event handler for button downloading graph as image*/
import { Graph } from '../graph_init/graph.js';
import { GraphRender } from '../graph_control/graph_render.js';
export class GraphDownload {
    constructor() { }
}
GraphDownload.createImage = (callback) => {
    let imgsrc = Graph.imageAddress;
    let canvas = document.createElement("canvas");
    let oriCanvas = document.querySelector("#canvas3D");
    let context = canvas.getContext("2d");
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
        canvas.toBlob((blob) => {
            if (blob) {
                let filesize = Math.round(blob.size / 1024) + ' KB';
                if (callback)
                    callback(blob, filesize);
            }
            else {
                console.error("error creating Blob from canvas");
            }
        });
    };
    image.src = imgsrc;
};
GraphDownload.getImageName = () => {
    let trimStart = Graph.projectDir.lastIndexOf("/");
    if (trimStart < 0) {
        trimStart = Graph.projectDir.lastIndexOf("\\");
    }
    let trimEnd = Graph.projectDir.lastIndexOf(".");
    return Graph.projectDir.slice(trimStart + 1, trimEnd);
};
GraphDownload.popupnamewindow = (x, y) => {
    //save-as-image-form
    let formDiv = document.querySelector("#save-as-image-form");
    let btn = document.querySelector("#btn-save-file-name");
    if (!formDiv) {
        console.error("save an image form does not exist");
        return;
    }
    if (!btn) {
        console.error("button for saving image doesn't exist");
        return;
    }
    formDiv.style.display = "flex";
    formDiv.style.left = (x - 90) + "px";
    formDiv.style.top = (y + 20) + "px";
    btn.onclick = () => {
        let imagename = '';
        let userInput = document.querySelector("#input-file-name");
        if (userInput && userInput.value != '') {
            imagename = userInput.value;
        }
        else {
            imagename = GraphDownload.getImageName();
            if (imagename == null || imagename == "") {
                imagename = "peak3DGraph";
            }
        }
        formDiv.style.display = "none";
        const save = (dataBlob, filesize) => {
            //@ts-ignore //function defined in an external library
            saveAs(dataBlob, imagename);
        };
        GraphDownload.createImage(save);
    };
};
GraphDownload.save3dGraph = (e) => {
    //get mouse x y position for location of pop up
    GraphRender.renderImmediate();
    GraphDownload.popupnamewindow(e.clientX, e.clientY);
};