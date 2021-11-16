import mongoose from 'mongoose';
import config from './config';
import logger from './logger';

const connectMongo = async () => {
  const {
    mongoScheme,
    mongoUsername,
    mongoPassword,
    mongoHost,
    mongoPort,
    mongoDatabase,
  } = config;

  const uri = `${mongoScheme}://${mongoUsername}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDatabase}?authSource=admin`;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established.');
  });

  mongoose.connection.on('disconnected', () => {
    logger.info('MongoDB connection disconnected.');
  });

  mongoose.connection.on('close', () => {
    logger.info('MongoDB connection closed.');
  });

  mongoose.connection.on('error', (error) => {
    logger.error(`MongoDB connection error, ${error}`);
    process.exit(1);
  });

  await mongoose.connect(uri, {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
};

export default connectMongo;
