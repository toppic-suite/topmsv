// Serves the browser libraries under /vendor/... straight from node_modules,
// so they are installed by npm alone (package.json) and never copied to or
// committed under public/. Mounted at /vendor (app.ts) and /d/:ds/vendor
// (dataset router) so the same URLs work from both the home/spectra pages and
// the TopMSV viewer's relative ../../vendor/... references.
//
// Version constraints (enforced by the ranges in package.json):
//   jquery         ^3       - jQuery 4 removes APIs the viewer code uses ($.trim, ...)
//   datatables.net ^1       - DataTables 2 changes API and markup
//   bootstrap4     npm:bootstrap@^4 - the TopMSV viewer markup is Bootstrap 4
//                            (spectra.html uses the separate Bootstrap 5 copy)
//   popper.js      ^1       - what Bootstrap 4's dropdowns/tooltips require
//   fontawesome    ^5       - the icon class names used by the viewer HTML

import * as express from 'express';
import * as path from 'path';

const NM = path.join(__dirname, '..', '..', 'node_modules');

// URL prefix under /vendor -> directory in node_modules. Two sources may
// share a prefix (bootstrap css + js); express.static falls through on miss.
// The datatables css/ and images/ dirs must stay siblings (the stylesheets
// reference ../images/), as must fontawesome css/ and webfonts/.
const MOUNTS: Array<[string, string]> = [
  ['/jquery', 'jquery/dist'],
  ['/jquery-ui', 'jquery-ui/dist'],
  ['/bootstrap', 'bootstrap/dist/css'],
  ['/bootstrap', 'bootstrap/dist/js'],
  ['/bootstrap4', 'bootstrap4/dist/css'],
  ['/bootstrap4', 'bootstrap4/dist/js'],
  ['/popper', 'popper.js/dist/umd'],
  ['/d3', 'd3/dist'],
  ['/datatables/js', 'datatables.net/js'],
  ['/datatables/css', 'datatables.net-dt/css'],
  ['/datatables/images', 'datatables.net-dt/images'],
  ['/fontawesome/css', '@fortawesome/fontawesome-free/css'],
  ['/fontawesome/webfonts', '@fortawesome/fontawesome-free/webfonts'],
  ['/file-saver', 'file-saver/dist'],
  ['/canvas-toBlob', 'canvas-toBlob'],
];

const vendorRouter = express.Router();
for (const [urlPrefix, dir] of MOUNTS) {
  vendorRouter.use(urlPrefix, express.static(path.join(NM, dir)));
}

export default vendorRouter;
