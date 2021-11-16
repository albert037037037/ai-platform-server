import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import logger from './libs/logger';
import connectMongo from './libs/connect_mongo';
import router from './routes';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = express();

app.use(cors());
app.use(express.json());
app.use(router);

connectMongo();

app.get('/', (req, res) => {
  res.json({ message: 'Hello world!' });
});

app.listen(process.env.PORT, () => {
  logger.info('Server is running');
});
