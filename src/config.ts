import path from 'path';
import fs from 'fs';
import {promisify} from 'util';
import joi from 'joi';

const readFile = promisify(fs.readFile);

// Interface describing the config object
export interface Config {
  port: number;
  mongoUri: string;
  secret: string;
  isProduction: boolean;
}

// This will be used to validate the config file
const configSchema = joi.object().keys({
  port: joi.number().default(3000),
  mongoUri: joi.string().default('mongodb://localhost:27017/noritori'),
  secret: joi.string().required(),
  isProduction: joi.boolean().default(process.env.NODE_ENV === 'production'),
});

// Empty config object and variable to check if already loaded
let isLoaded = false;

const config = new Proxy({} as Config, {
  get: (target, name: keyof Config) => {
    if (!isLoaded) {
      throw new Error(
        'Config is not loaded. Call loadConfig() before accessing config.'
      );
    }
    return target[name];
  },
});

// Function to load the config file
export async function loadConfig(): Promise<void> {
  const configFilePrefix =
    process.env.NODE_ENV === 'production'
      ? ''
      : (process.env.NODE_ENV ?? 'dev') + '.';

  const configPath = path.join(process.cwd(), `${configFilePrefix}config.json`);

  if (!fs.existsSync(configPath))
    throw new Error('Config file not found. Expected at: ' + configPath);

  const configFile = await readFile(configPath, 'utf8');
  const configJson = JSON.parse(configFile);

  const {error, value} = configSchema.validate(configJson);

  if (error) {
    throw new Error(
      'Config file is invalid. Please check the config file at: ' + configPath
    );
  }

  // copy the config object to the config variable
  Object.assign(config, value);
  isLoaded = true;
}

export default config;
