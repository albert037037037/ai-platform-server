import express from 'express';
import controller from '../controller';
import authentication from '../middlewares/authentication';

const servingRouter = express.Router();

servingRouter.post('/create', controller.serving.create);
servingRouter.post('/findUrl', authentication(), controller.serving.findUrl);

export default servingRouter;
