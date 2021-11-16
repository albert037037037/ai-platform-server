import validator from '../libs/validator';
import logger from '../libs/logger';
import k8s from '../k8s';
import service from '../service';

const servingController = {
  async create(req, res) {
    const rule = {
      username: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
      modelname: {
        type: 'string',
        allowEmpty: false,
      },
    };

    try {
      logger.info(JSON.stringify(req.body));
      validator.validate(req.body, rule);
      await k8s.tfserve.createDeployment(req.body.username, req.body.modelname);
      await k8s.tfserve.createService(req.body.username, req.body.modelname);
      const servingUrl = await k8s.tfserve.createIngress(req.body.username, req.body.modelname);
      await service.pipeline.addServingUrl(req.body.username, req.body.modelname, servingUrl);
      res.json({ servingUrl });
    } catch (error) {
      logger.info('[Serving Controller] serving request failed', error);
      res.json({ success: false });
    }
  },
  async findUrl(req, res) {
    const rule = {
      username: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
      modelname: {
        type: 'string',
        allowEmpty: false,
      },
    };

    try {
      validator.validate(req.body, rule);
      const servingUrl = await service.serving.findUrl(req.body);
      res.json(servingUrl);
    } catch (error) {
      logger.info('[Serving Controller] find serving URL failed', error);
      res.json({ success: false });
    }
  },
};

export default servingController;
