import createApp from './src/server/app';
import { APP_VERSION } from './src/server/version';

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`TopMSV for TopPIC ${APP_VERSION} running at http://localhost:${PORT}`);
});
