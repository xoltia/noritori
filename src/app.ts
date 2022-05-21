import express from 'express';
import {logger, errorLogger} from './middleware/logger';
import config, {loadConfig} from './config';
import mongoose from 'mongoose';
import {createRouter} from './controllers';

(async function () {
  await loadConfig();
  if (!config.isProduction) console.log(config);

  const app = express();

  app.use(logger);
  app.use(express.json());

  app.use('/api/v1', await createRouter());

  app.use(errorLogger);

  await mongoose.connect(config.mongoUri);
  console.log('Connected to MongoDB');

  app.listen(config.port, () => {
    console.log('Listening on port', config.port);
  });
})();
