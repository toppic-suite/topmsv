import express from 'express';
import * as path from 'path';
import apiRouter from './routes/api';
import datasetRouter from './routes/dataset';

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

export default function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);
  app.use('/d/:ds', datasetRouter);
  app.use(express.static(PUBLIC_DIR));
  return app;
}
