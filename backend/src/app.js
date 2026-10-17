import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  // Render / Railway / Heroku sit behind a proxy; needed for correct client IPs in rate limiting.
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (curl, Postman) and configured frontends.
        if (!origin || env.clientUrls.includes('*') || env.clientUrls.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  if (!env.isProduction) app.use(morgan('dev'));

  app.get('/', (_req, res) => res.json({ name: 'Retain API', docs: '/api/health' }));
  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
