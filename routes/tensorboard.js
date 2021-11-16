import express from 'express';
import controller from '../controller';
// import authentication from '../middlewares/authentication';

const tensorboardRouter = express.Router();

tensorboardRouter.post('/create', controller.tensorboard.create);

export default tensorboardRouter;
