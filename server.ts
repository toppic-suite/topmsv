import createApp from './src/server/app';

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`TopMSV for TopPIC running at http://localhost:${PORT}`);
});
