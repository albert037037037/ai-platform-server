import validator from '../libs/validator';
import logger from '../libs/logger';
import service from '../service';
import k8s from '../k8s';

const userController = {
  async register(req, res) {
    const rule = {
      username: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
      password: {
        type: 'string',
        allowEmpty: false,
        min: 4,
      },
    };

    try {
      validator.validate(req.body, rule);
      await service.user.create(req.body);
      logger.info('[User Controller] Register successfully');
      await k8s.user.createNamespace(req.body.username);
      await k8s.user.createPVC();
      await k8s.user.createStatefuleset(req.body.username);
      await k8s.user.createService();
      await k8s.user.createSecret(req.body.username);
      await k8s.user.createIngress(req.body.username);
      await k8s.upload.createNamespace();
      await k8s.upload.createService(req.body.username);
      await k8s.upload.createIngress(req.body.username);
      res.json({ success: true });
    } catch (error) {
      logger.error('[User Controller] Failed to register:', error);
      res.status(400).json({ message: `Failed to register, ${error}` });
    }
  },

  async validateToken(req, res) {
    res.json({ success: true });
  },

  async getUserJupyterToken(req, res) {
    const rule = {
      targetName: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
    };

    try {
      validator.validate(req.body, rule);
      const user = await service.user.getJupyterToken(req.body.targetName);
      logger.info(`Get user ${req.body.targetName} Jupyter Token successfully`);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: `Failed to get ${req.body.targetName} Jupyter Token, ${error}` });
    }
  },
};

export default userController;
