import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const {
  MONGO_SCHEME,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOST,
  MONGO_PORT,
  MONGO_DATABASE,
  JWT_SECRET_KEY,
} = process.env;

export default {
  mongoScheme: MONGO_SCHEME,
  mongoUsername: MONGO_USERNAME,
  mongoPassword: MONGO_PASSWORD,
  mongoHost: MONGO_HOST,
  mongoPort: MONGO_PORT,
  mongoDatabase: MONGO_DATABASE,
  jwtSecretKey: JWT_SECRET_KEY,
};
