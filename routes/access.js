import express from 'express';
import controller from '../controller';
import authentication from '../middlewares/authentication';

const accessRouter = express.Router();

// accessRouter.post('/getHasPermission', authentication(), controller.access.getHasPermission);
accessRouter.post('/getPermissionTo', authentication(), controller.access.getPermissionTo);
accessRouter.post('/deletePermissionTo', authentication(), controller.access.deletePermissionTo);
accessRouter.post('/addRelation', authentication(), controller.access.addRelation);

export default accessRouter;
