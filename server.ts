import createApp from './src/server/app';
import { APP_VERSION } from './src/server/version';
import { serverConfig, applyCommandLine } from './src/server/config';

const PORT = process.env.PORT || 3000;

// usage: npm start -- [--view-only]
const unknownArgs = applyCommandLine(process.argv.slice(2));
if (unknownArgs.length > 0) {
  console.error(`unknown argument(s): ${unknownArgs.join(' ')}\nusage: npm start -- [--view-only]`);
  process.exit(1);
}

createApp().listen(PORT, () => {
  console.log(`TopMSV for TopPIC ${APP_VERSION} running at http://localhost:${PORT}`
    + (serverConfig.viewOnly ? ' (view-only)' : ''));
});
