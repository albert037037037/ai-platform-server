import validator from '../libs/validator';
import service from '../service';
import logger from '../libs/logger';
import k8s from '../k8s';

const SessionController = {
  async login(req, res) {
    const rule = {
      username: {
        type: 'string',
        allowEmpty: false,
      },
      password: {
        type: 'string',
        allowEmpty: false,
        min: 4,
      },
    };

    try {
      validator.validate(req.body, rule);
      const response = await service.session.login(req.body);
      const jupyterToken = await k8s.session.UserLogIn(req.body.username, 1);
      await service.user.updateJupyterToken(req.body.username, jupyterToken);
      response.jupyterToken = jupyterToken;
      res.json(response);
    } catch (error) {
      res.status(400).json({ message: `Failed to Login: ${error}` });
    }
  },
  async logout(req, res) {
    k8s.session.UserLogOut(req.user.username, 0);
    res.json({ message: `Bye, user ${req.user.username}.` });
  },
  async checkJupyter(req, res) {
    try {
      const respond = await k8s.user.checkJupyterStatus(req.user.username);
      res.json({ ready: respond });
    } catch (error) {
      logger.info(`[User Controller]check jupyter notebook error: ${error}`);
      res.json({ success: false });
    }
  },
};

export default SessionController;
