/**
 * Shared navigation bar for every page of the app (home page, raw-spectra
 * browser and the TopMSV viewer pages). It is injected into <div id="nav-bar">
 * with plain DOM calls (no jQuery/Bootstrap, so the home page can use it too)
 * and derives its links from the URL: pages under /d/<dataset>/ get the
 * dataset's identification, inspection and raw-spectra links, while pages
 * outside a dataset (the home page) show only the brand.
 */
const drawNavBar = function(): void {
  const render = function(): void {
    const container: HTMLElement | null = document.getElementById("nav-bar");
    if (!container) {
      return;
    }
    // dataset root, e.g. "/d/st/" — empty when outside a dataset
    const match: RegExpMatchArray | null = location.pathname.match(/^(.*\/d\/[^/]+\/)/);
    const dsRoot: string = match ? match[1] : "";

    let navCode: string = '<nav class="topmsv-nav" id="nav-div"><div class="navcontainer">'
      + '<span class="navbar-brand logo">'
      + '<span class="headBlock"><h3><strong id="toppic_icon">T</strong>opMSV</h3></span></span>';
    if (dsRoot) {
      const items: { href: string, text: string }[] = [
        { href: "/", text: "Home" },
        { href: dsRoot + "topmsv/visual/proteins.html?data=toppic_proteoform_cutoff", text: "Protein Identifications" },
        { href: dsRoot + "topmsv/visual/ms.html?data=toppic_prsm_cutoff", text: "Spectrum Identifications" },
        { href: dsRoot + "topmsv/inspect/spectrum.html", text: "Visual Inspection" },
        { href: dsRoot + "spectra/spectra.html", text: "Spectra" },
      ];
      navCode += '<ul class="topmsv-nav-links">';
      items.forEach((item) => {
        // highlight the item for the page being shown (hrefs are absolute
        // paths built from dsRoot, so they compare against location.pathname)
        const active: boolean = item.href.split("?")[0] === location.pathname;
        navCode += '<li class="navtab">|</li>'
          + '<li class="nav-item"><a class="nav-link' + (active ? ' active' : '') + '" href="' + item.href + '">' + item.text + '</a></li>';
      });
      navCode += '</ul>';
    }
    navCode += '</div></nav>';
    container.innerHTML = navCode;
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
}();
