import express from 'express';
import userRouter from './user';
import sessionRouter from './session';
import registryRouter from './registry';
import pipelineRouter from './pipeline';
import accessRouter from './access';
import fileRouter from './file';
import servingRouter from './serving';
import tensorboardRouter from './tensorboard';

const router = express.Router();

router.use('/user', userRouter);
router.use('/session', sessionRouter);
router.use('/auth', registryRouter);
router.use('/pipeline', pipelineRouter);
router.use('/access', accessRouter);
router.use('/file', fileRouter);
router.use('/serving', servingRouter);
router.use('/tensorboard', tensorboardRouter);

export default router;
