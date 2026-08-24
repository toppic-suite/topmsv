// Copies the browser libraries used by public/spectra.html from node_modules
// into public/vendor, so the served files are managed through package.json
// like every other dependency (runs automatically via the postinstall hook).
//
// Version constraints (enforced by the ranges in package.json):
//   jquery         ^3   - jQuery 4 removes APIs the viewer code uses ($.trim, ...)
//   datatables.net ^1   - DataTables 2 changes API and markup
//   d3             5.16.0 exactly - the drawing code uses the v5-only
//                        d3.event / d3.mouse API removed in v6+
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = (...p) => path.join(root, 'node_modules', ...p);
const vendor = (...p) => path.join(root, 'public', 'vendor', ...p);

const FILES = [
  [nm('jquery', 'dist', 'jquery.js'), vendor('jquery', 'jquery.js')],
  [nm('jquery-ui', 'dist', 'jquery-ui.min.js'), vendor('jquery-ui', 'jquery-ui.min.js')],
  [nm('bootstrap', 'dist', 'css', 'bootstrap.min.css'), vendor('bootstrap', 'bootstrap.min.css')],
  [nm('bootstrap', 'dist', 'js', 'bootstrap.min.js'), vendor('bootstrap', 'bootstrap.min.js')],
  [nm('datatables.net', 'js', 'jquery.dataTables.min.js'), vendor('datatables', 'jquery.dataTables.min.js')],
  [nm('datatables.net-dt', 'css', 'jquery.dataTables.min.css'), vendor('datatables', 'jquery.dataTables.min.css')],
  [nm('d3', 'dist', 'd3.js'), vendor('d3', 'd3.js')],
];

let failed = false;
for (const [src, dst] of FILES) {
  if (!fs.existsSync(src)) {
    console.error(`sync-vendor: missing ${path.relative(root, src)} (run npm install)`);
    failed = true;
    continue;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  console.log(`sync-vendor: ${path.relative(root, dst)} <- ${path.relative(root, src)}`);
}
process.exit(failed ? 1 : 0);
