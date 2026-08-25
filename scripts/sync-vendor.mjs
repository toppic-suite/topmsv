// Regenerates public/vendor (gitignored) from node_modules, so every browser
// library served to the client — both public/spectra.html and the TopMSV
// viewer under public/topmsv — is managed through package.json like any other
// dependency (runs automatically via the postinstall hook).
//
// Version constraints (enforced by the ranges in package.json):
//   jquery         ^3       - jQuery 4 removes APIs the viewer code uses ($.trim, ...)
//   datatables.net ^1       - DataTables 2 changes API and markup
//   d3             5.16.0 exactly - the drawing code uses the v5-only
//                            d3.event / d3.mouse API removed in v6+
//   bootstrap4     npm:bootstrap@^4 - the TopMSV viewer markup is Bootstrap 4
//                            (spectra.html uses the separate Bootstrap 5 copy)
//   popper.js      ^1       - what Bootstrap 4's dropdowns/tooltips require
//   fontawesome    ^5       - the icon class names used by the viewer HTML
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = (...p) => path.join(root, 'node_modules', ...p);
const vendor = (...p) => path.join(root, 'public', 'vendor', ...p);

// [source in node_modules, destination in public/vendor]
// A trailing '/' on the source marks a directory copy.
const ENTRIES = [
  // shared by spectra.html and the TopMSV viewer
  [nm('jquery', 'dist', 'jquery.js'), vendor('jquery', 'jquery.js')],
  [nm('jquery-ui', 'dist', 'jquery-ui.min.js'), vendor('jquery-ui', 'jquery-ui.min.js')],
  [nm('d3', 'dist', 'd3.js'), vendor('d3', 'd3.js')],
  [nm('datatables.net', 'js', 'jquery.dataTables.js'), vendor('datatables', 'js', 'jquery.dataTables.js')],
  [nm('datatables.net', 'js', 'jquery.dataTables.min.js'), vendor('datatables', 'js', 'jquery.dataTables.min.js')],
  [nm('datatables.net-dt', 'css', 'jquery.dataTables.css'), vendor('datatables', 'css', 'jquery.dataTables.css')],
  [nm('datatables.net-dt', 'css', 'jquery.dataTables.min.css'), vendor('datatables', 'css', 'jquery.dataTables.min.css')],
  [nm('datatables.net-dt', 'images') + path.sep, vendor('datatables', 'images')],
  // spectra.html only (Bootstrap 5)
  [nm('bootstrap', 'dist', 'css', 'bootstrap.min.css'), vendor('bootstrap', 'bootstrap.min.css')],
  [nm('bootstrap', 'dist', 'js', 'bootstrap.min.js'), vendor('bootstrap', 'bootstrap.min.js')],
  // TopMSV viewer only (Bootstrap 4 + friends)
  [nm('bootstrap4', 'dist', 'css', 'bootstrap.min.css'), vendor('bootstrap4', 'bootstrap.min.css')],
  [nm('bootstrap4', 'dist', 'js', 'bootstrap.min.js'), vendor('bootstrap4', 'bootstrap.min.js')],
  [nm('popper.js', 'dist', 'umd', 'popper.js'), vendor('popper', 'popper.js')],
  [nm('@fortawesome', 'fontawesome-free', 'css', 'all.css'), vendor('fontawesome', 'css', 'all.css')],
  [nm('@fortawesome', 'fontawesome-free', 'css', 'fontawesome.min.css'), vendor('fontawesome', 'css', 'fontawesome.min.css')],
  [nm('@fortawesome', 'fontawesome-free', 'webfonts') + path.sep, vendor('fontawesome', 'webfonts')],
  [nm('file-saver', 'dist', 'FileSaver.js'), vendor('file-saver', 'FileSaver.js')],
  [nm('canvas-toBlob', 'canvas-toBlob.js'), vendor('canvas-toBlob', 'canvas-toBlob.js')],
];

let failed = false;
for (const [src, dst] of ENTRIES) {
  const isDir = src.endsWith(path.sep);
  const srcPath = isDir ? src.slice(0, -1) : src;
  if (!fs.existsSync(srcPath)) {
    console.error(`sync-vendor: missing ${path.relative(root, srcPath)} (run npm install)`);
    failed = true;
    continue;
  }
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (isDir) fs.cpSync(srcPath, dst, { recursive: true });
  else fs.copyFileSync(srcPath, dst);
  console.log(`sync-vendor: ${path.relative(root, dst)} <- ${path.relative(root, srcPath)}`);
}
process.exit(failed ? 1 : 0);
