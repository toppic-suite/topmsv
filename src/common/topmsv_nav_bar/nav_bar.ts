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
    if (dsRoot) {
      hideIdentificationLinks(container, dsRoot);
    }
  };

  // A dataset uploaded without the TopPIC XMLs has no identification pages:
  // drop those links once the dataset's metadata says so; a sqlite without
  // the MS1 3D peak tables keeps the MS1 3D item but disabled. (The links
  // are rendered first so the bar never flashes when the fetch is slow.)
  const hideIdentificationLinks = function(container: HTMLElement, dsRoot: string): void {
    fetch(dsRoot + "api/meta")
      .then((res) => (res.ok ? res.json() : null))
      .then((meta: { hasIdentifications?: boolean, has3d?: boolean } | null) => {
        if (meta && meta.hasIdentifications === false) {
          container.querySelectorAll("[data-identification]").forEach((el) => el.remove());
        }
        if (meta && meta.has3d !== true) {
          container.querySelectorAll("[data-threed] .nav-link").forEach((el) => {
            const link = el as HTMLAnchorElement;
            link.classList.add("disabled");
            link.removeAttribute("href");
            link.title = "This dataset's sqlite file has no MS1 3D peak tables";
          });
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
