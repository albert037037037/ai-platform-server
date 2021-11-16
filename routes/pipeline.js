import express from 'express';
import controller from '../controller';
import authentication from '../middlewares/authentication';

const pipelineRouter = express.Router();

pipelineRouter.post('/create', authentication(), controller.pipeline.create);
pipelineRouter.post('/list', authentication(), controller.pipeline.list);

export default pipelineRouter;
