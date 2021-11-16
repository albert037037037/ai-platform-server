import validator from '../libs/validator';
import logger from '../libs/logger';
import k8s from '../k8s';

const tensorboardController = {
  async create(req, res) {
    const rule = {
      username: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
      runname: {
        type: 'string',
        allowEmpty: false,
      },
      bucketname: {
        type: 'string',
        allowEmpty: false,
      },
      logdir: {
        type: 'string',
        allowEmpty: false,
      },
    };

    try {
      validator.validate(req.body, rule);
      await k8s.tensorboard.createDeployment(req.body.username, req.body.bucketname, req.body.logdir);
      await k8s.tensorboard.createService(req.body.username);
      const tensorboardurl = await k8s.tensorboard.createIngress(req.body.username, req.body.runname);
      res.json({ tensorboardurl });
    } catch (error) {
      logger.info('[serving Controller] serving request failed', error);
      res.json({ success: false });
    }
  },
};

export default tensorboardController;
