import express from 'express';
import controller from '../controller';

const registryRouter = express.Router();

registryRouter.get('/', controller.registry.auth);

export default registryRouter;
