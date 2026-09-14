//MIT license
//Permission is hereby granted, free of charge, to any person obtaining a 
//copy of this software and associated documentation files (the "Software"), 
//to deal in the Software without restriction, including without limitation 
//the rights to use, copy, modify, merge, publish, distribute, sublicense, 
//and/or sell copies of the Software, and to permit persons to whom the 
//Software is furnished to do so, subject to the following conditions:
//The above copyright notice and this permission notice shall be included 
//in all copies or substantial portions of the Software.
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
//OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
//FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
//OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
//IN THE SOFTWARE.

/**
 * Serialize an SVG element to a string, inlining the page's CSS rules that
 * match its id/class selectors so the exported image keeps the styling.
 */
function getSVGString(svgNode: SVGElement): string {
  svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  let cssStyleText: string = getCSSStyles(svgNode);
  appendCSS(cssStyleText, svgNode);
  let serializer = new XMLSerializer();
  let svgString: string = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix
  return svgString;

  function getCSSStyles(parentElement: Element): string {
    let selectorTextArr: string[] = [];
    // Add Parent element Id and Classes to the list
    selectorTextArr.push('#' + parentElement.id);
    for (let c = 0; c < parentElement.classList.length; c++) {
      let cls: string = '.' + parentElement.classList[c];
      if (!selectorTextArr.includes(cls)) {
        selectorTextArr.push(cls);
      }
    }
    // Add Children element Ids and Classes to the list
    let nodes = parentElement.getElementsByTagName("*");
    for (let i = 0; i < nodes.length; i++) {
      let id: string = '#' + nodes[i].id;
      if (!selectorTextArr.includes(id)) {
        selectorTextArr.push(id);
      }
      let classes = nodes[i].classList;
      for (let c = 0; c < classes.length; c++) {
        let cls: string = '.' + classes[c];
        if (!selectorTextArr.includes(cls)) {
          selectorTextArr.push(cls);
        }
      }
    }
    // Extract CSS Rules
    let extractedCSSText: string = "";
    for (let i = 0; i < document.styleSheets.length; i++) {
      let s: CSSStyleSheet = document.styleSheets[i];
      let cssRules: CSSRuleList;
      try {
        if (!s.cssRules) {
          continue;
        }
        cssRules = s.cssRules;
      }
      catch (e) {
        if ((e as Error).name !== 'SecurityError') {
          throw e; // for Firefox
        }
        continue;
      }
      for (let r = 0; r < cssRules.length; r++) {
        let rule: CSSRule = cssRules[r];
        if (rule instanceof CSSStyleRule && selectorTextArr.includes(rule.selectorText)) {
          extractedCSSText += rule.cssText;
        }
      }
    }
    return extractedCSSText;
  }

  function appendCSS(cssText: string, element: Element): void {
    let styleElement: HTMLStyleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = cssText;
    let refNode: Element | null = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore(styleElement, refNode);
  }
}

/** Render an SVG string to an image Blob (PNG by default) of the given size. */
function svgString2Image(svgString: string, width: number, height: number, format: string | undefined,
                         callback: (blob: Blob, filesize: string) => void): void {
  let imgFormat: string = format ? format : 'png';
  let imgsrc: string = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL
  let canvas: HTMLCanvasElement = document.createElement("canvas");
  let context: CanvasRenderingContext2D | null = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  let image = new Image();
  image.onload = function () {
    if (!context) {
      return;
    }
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    canvas.toBlob(function (blob: Blob | null) {
      if (!blob) {
        return;
      }
      let filesize: string = Math.round(blob.size / 1024) + ' KB';
      if (callback) {
        callback(blob, filesize);
      }
    }, 'image/' + imgFormat);
  };
  image.src = imgsrc;
}

/** Download an SVG element as an .svg file named `name`. */
function svg2svg(svgNode: Node, name: string): void {
  let serializer = new XMLSerializer();
  let svgData: string = serializer.serializeToString(svgNode);
  let svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  let svgUrl: string = URL.createObjectURL(svgBlob);
  let downloadLink: HTMLAnchorElement = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = name;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
