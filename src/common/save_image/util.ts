/**
 * Pop up a small box at (x, y) asking for an image name, then download the
 * SVG element `id` as an .svg or .png image under that name.
 * @param type - "svg" or "png"
 * @param id - id of the svg element to download
 * @param x - page x coordinate of the box
 * @param y - page y coordinate of the box
 */
function popupNameWindow(type: string, id: string, x: number, y: number): void {
  d3.selectAll("#tooltip_imagename").remove();
  let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .attr("id", "tooltip_imagename")
    .style("opacity", 1);
  // Provides a tooltip to enter a name for the image to be downloaded
  div.transition()
    .duration(200)
    .style("opacity", .9);
  div.html('<input type="text" placeholder="Image Name" id="imagename" />' +
    '<button id="saveimage" style = "none" type="button">save</button>')
    .style("left", (x - 30) + "px") // x Coordinate of the position of the tooltip
    .style("top", (y - 60) + "px") // y Coordinate of the position of the tooltip
    .attr("box-sizing", "border")
    .attr("display", "inline-block")
    .attr("min-width", "1.5em")
    .attr("padding", "2px")
    .attr("margin-left", "0px")
    .attr("text-align", "center")
    .attr("text-decoration", "none")
    .attr("border", "1px solid #111111")
    .attr("background-color", "white");
  // On click action to save the image on click of download button
  $("#saveimage").on("click", function () {
    let input = $("#imagename").val();
    let imagename: string = (typeof input === "string" && input !== "") ? input : "spectrum";
    let svgElement: SVGSVGElement | null = d3.select<SVGSVGElement, unknown>("#" + id).node();
    if (!svgElement) {
      return;
    }
    // Check if the image needs to be downloaded as svg
    if (type == "svg") {
      d3.selectAll("#tooltip_imagename").remove();
      svg2svg(svgElement, imagename);
    }
    // Check if the image needs to be downloaded as png
    if (type == "png") {
      d3.selectAll("#tooltip_imagename").remove();
      let svgString: string = getSVGString(svgElement);
      let width: number = $("#" + id).width() ?? 0;
      let height: number = $("#" + id).height() ?? 0;
      svgString2Image(svgString, 2 * width, 2 * height, 'png', function (dataBlob: Blob) {
        saveAs(dataBlob, imagename);
      });
    }
  });
}
