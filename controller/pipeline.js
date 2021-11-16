import validator from '../libs/validator';
import logger from '../libs/logger';
import service from '../service';

const pipelineController = {
  async create(req, res) {
    const rule = {
      runname: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
      url: {
        type: 'string',
        allowEmpty: false,
      },
      run_id: {
        type: 'string',
        allowEmpty: false,
      },
    };
    try {
      validator.validate(req.body, rule);
      await service.pipeline.create(req);
      logger.info('[Pipeline Controller] create run successfully');
      res.json({ success: true });
    } catch (error) {
      logger.error('[Pipeline Controller] Failed to create run:', error);
      res.status(400).json({ message: `Failed to create run, ${error}` });
    }
  },
  async list(req, res) {
    try {
      const response = await service.pipeline.list(req);
      logger.info('[Pipeline Controller] list run successfully');
      res.json(response);
    } catch (error) {
      logger.info('[Pipeline Controller] Failed to list run:', error);
      res.status(400).json({ message: `Failed to list run, ${error}` });
    }
  },
};

export default pipelineController;
