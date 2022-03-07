"use strict";
/**
 * Class to execute download operations for the spectrum graph
 */
class SpectrumDownload {
    //default costructor
    constructor() {
    }
}
//Unique Id values for graph and download buttons 
SpectrumDownload.SPECDOWNLOADPNG = "spectrum_download_png";
SpectrumDownload.SPECDOWNLOADSVG = "spectrum_download_svg";
SpectrumDownload.SPECTRUMGRAPHID = "spectrum";
SpectrumDownload.downloadbuttonX = 41;
SpectrumDownload.spanWidth = 50;
SpectrumDownload.downloadButtonWidth = 30;
SpectrumDownload.downloadButtonHeight = 30;
SpectrumDownload.buttonWidth = 50;
SpectrumDownload.buttonHeight = 28;
SpectrumDownload.buttonOne_Y = 33;
SpectrumDownload.buttonTwo_Y = 60;
/**
 * Draw a rectangular block to keep download image
 */
SpectrumDownload.addDownloadRect = function (svgId, spectrumParameters) {
    d3.select("#g_spectrum_button").remove();
    let svg = d3.select("body").select(svgId);
    let group = svg.append("g").attr("id", "g_spectrum_button");
    group.append("svg:image").attr("id", "spectrum_download")
        .attr('x', (spectrumParameters.svgWidth - SpectrumDownload.downloadbuttonX))
        .attr('y', 0) //top most point in svg
        .attr('width', SpectrumDownload.downloadButtonWidth)
        .attr('height', SpectrumDownload.downloadButtonHeight)
        .attr("xlink:href", "../shared_scripts/spectrum_graph/images/download.png");
    d3.selectAll("#g_spectrum_button").on('mouseover', function () {
        d3.select(this).style("cursor", "pointer");
    })
        .on('mouseout', function () {
        d3.select(this).style("cursor", "default");
    });
    $("#spectrum_download").on("click", function () {
        d3.selectAll(".downloadgraph_button").remove();
        SpectrumDownload.addDownloadbuttons(svgId, spectrumParameters);
    });
};
/**
 * Setting images as download buttons
 */
SpectrumDownload.addDownloadbuttons = function (svgId, spectrumParameters) {
    let group = d3.select("#g_spectrum_button");
    group.append("svg:image").attr("id", SpectrumDownload.SPECDOWNLOADSVG)
        .attr("class", "downloadgraph_button")
        .attr('x', (spectrumParameters.svgWidth - SpectrumDownload.spanWidth))
        .attr('y', SpectrumDownload.buttonOne_Y)
        .attr('width', SpectrumDownload.buttonWidth)
        .attr('height', SpectrumDownload.buttonHeight)
        .attr("xlink:href", "../shared_scripts/spectrum_graph/images/svg.png");
    group.append("svg:image").attr("id", SpectrumDownload.SPECDOWNLOADPNG)
        .attr("class", "downloadgraph_button")
        .attr('x', (spectrumParameters.svgWidth - SpectrumDownload.spanWidth))
        .attr('y', SpectrumDownload.buttonTwo_Y)
        .attr('width', SpectrumDownload.buttonWidth)
        .attr('height', SpectrumDownload.buttonHeight)
        .attr("xlink:href", "../shared_scripts/spectrum_graph/images/png.png");
    SpectrumDownload.download(svgId, spectrumParameters);
};
/**
 * On click action to download spectrum graph as SVG/PNG
 */
SpectrumDownload.download = function (svgId, spectrumParameters) {
    //On click action to download spectrum graph SVG in .svg format
    $("#" + SpectrumDownload.SPECDOWNLOADSVG).click(function () {
        $("#g_spectrum_button").remove();
        let name = "spectrum.svg";
        let svg_element = d3.selectAll("#" + SpectrumDownload.SPECTRUMGRAPHID).node();
        svg2svg(svg_element, name);
        SpectrumDownload.addDownloadRect(svgId, spectrumParameters);
    });
    //On click action to download spectrum graph PNG in .png format
    $("#" + SpectrumDownload.SPECDOWNLOADPNG).click(function () {
        $("#g_spectrum_button").remove();
        let l_svgContainer = d3.select("#" + SpectrumDownload.SPECTRUMGRAPHID);
        let svgString = getSVGString(l_svgContainer.node());
        //let svg_element = document.getElementById(SpectrumDownload.SPECTRUMGRAPHID);
        //let bBox = svg_element.getBBox();
        let width = spectrumParameters.svgWidth;
        let height = spectrumParameters.svgHeight;
        svgString2Image(svgString, 2 * width, 2 * height, 'png', save);
        function save(dataBlob, filesize) {
            saveAs(dataBlob, 'spectrum.png');
        }
        SpectrumDownload.addDownloadRect(svgId, spectrumParameters);
    });
};
