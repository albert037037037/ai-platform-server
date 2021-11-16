import express from 'express';
import controller from '../controller';
import authentication from '../middlewares/authentication';

const userRouter = express.Router();

userRouter.post('/register', controller.user.register);
userRouter.post('/validateToken', authentication(), controller.user.validateToken);
userRouter.post('/getUserJupyterToken', authentication(), controller.user.getUserJupyterToken);

export default userRouter;
