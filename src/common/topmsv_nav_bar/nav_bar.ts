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
      + '<span class="headBlock"><h3><strong id="toppic_icon">T</strong>opMSV'
      + '<span class="version" id="navVersion"></span></h3></span></span>';
    if (dsRoot) {
      // identification: true marks the pages that need the TopPIC XMLs,
      // threeD: true the page that needs the MS1 3D peak database
      const items: { href: string, text: string, identification?: boolean, threeD?: boolean }[] = [
        { href: "/", text: "Home" },
        { href: dsRoot + "topmsv/visual/proteins.html?data=toppic_proteoform_cutoff", text: "Protein Identifications", identification: true },
        { href: dsRoot + "topmsv/visual/ms.html?data=toppic_prsm_cutoff", text: "Spectrum Identifications", identification: true },
        { href: dsRoot + "topmsv/inspect/spectrum.html", text: "Visual Inspection" },
        { href: dsRoot + "spectra/spectra.html", text: "Spectra" },
        { href: dsRoot + "ms1_3d/ms1_3d.html", text: "MS1 3D", threeD: true },
      ];
      navCode += '<ul class="topmsv-nav-links">';
      items.forEach((item) => {
        // highlight the item for the page being shown (hrefs are absolute
        // paths built from dsRoot, so they compare against location.pathname)
        const active: boolean = item.href.split("?")[0] === location.pathname;
        const flags: string = (item.identification ? ' data-identification="1"' : '') + (item.threeD ? ' data-threed="1"' : '');
        navCode += '<li class="navtab"' + flags + '>|</li>'
          + '<li class="nav-item"' + flags + '>'
          + '<a class="nav-link' + (active ? ' active' : '') + '" href="' + item.href + '">' + item.text + '</a></li>';
      });
      navCode += '</ul>';
    }
    navCode += '</div></nav>';
    container.innerHTML = navCode;
    showVersion(container);
    if (dsRoot) {
      hideIdentificationLinks(container, dsRoot);
    }
  };

  // The application version (package.json, served by /api/config) after the
  // brand, as on the home page; the bar renders first and the span stays
  // empty if the request fails.
  const showVersion = function(container: HTMLElement): void {
    fetch("/api/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((config: { version?: string } | null) => {
        const el = container.querySelector("#navVersion");
        if (el && config && typeof config.version === "string") {
          el.textContent = "v" + config.version;
        }
      })
      .catch(() => { /* leave the brand without a version */ });
  };

  // A sqlite without the TopPIC identification tables has no identification
  // pages, one without the MS1 3D peak tables no 3D view: their nav items
  // are rendered disabled once the dataset's metadata says so. (The links
  // are rendered first so the bar never flashes when the fetch is slow.)
  const disable = function(container: HTMLElement, selector: string, title: string): void {
    container.querySelectorAll(selector).forEach((el) => {
      const link = el as HTMLAnchorElement;
      link.classList.add("disabled");
      link.removeAttribute("href");
      link.title = title;
    });
  };
  const hideIdentificationLinks = function(container: HTMLElement, dsRoot: string): void {
    fetch(dsRoot + "api/meta")
      .then((res) => (res.ok ? res.json() : null))
      .then((meta: { hasIdentifications?: boolean, has3d?: boolean } | null) => {
        if (meta && meta.hasIdentifications === false) {
          disable(container, "[data-identification] .nav-link", "This dataset's sqlite file has no TopPIC identification tables");
        }
        if (meta && meta.has3d !== true) {
          disable(container, "[data-threed] .nav-link", "This dataset's sqlite file has no MS1 3D peak tables");
        }
      })
      .catch(() => { /* keep the links */ });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
}();
