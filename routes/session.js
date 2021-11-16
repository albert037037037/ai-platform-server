import express from 'express';
import controller from '../controller';
import authentication from '../middlewares/authentication';

const SessionRouter = express.Router();

SessionRouter.post('/login', controller.session.login);
SessionRouter.get('/checkJupyter', authentication(), controller.session.checkJupyter);
SessionRouter.post('/logout', authentication(), controller.session.logout);

export default SessionRouter;
