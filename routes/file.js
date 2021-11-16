import express from 'express';
import controller from '../controller';
import authentication from '../middlewares/authentication';

const fileRouter = express.Router();

fileRouter.post('/uploadRequest', authentication(), controller.file.uploadRequest);
fileRouter.post('/deleteUploadPod', authentication(), controller.file.deletePod);
fileRouter.post('/createFile', authentication(), controller.file.create);
fileRouter.post('/listFiles', authentication(), controller.file.listFiles);

export default fileRouter;
