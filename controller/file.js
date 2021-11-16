import validator from '../libs/validator';
import logger from '../libs/logger';
import service from '../service';
import k8s from '../k8s';

const fileController = {
  async create(req, res) {
    const rule = {
      filename: {
        type: 'string',
        allowEmpty: false,
      },
      subPath: {
        type: 'string',
        allowEmpty: false,
      },
    };

    try {
      validator.validate(req.body, rule);
      const fileId = await service.file.createFile(req);
      res.json({ file_id: fileId });
    } catch (error) {
      logger.info('[File Controller] create file failed', error);
      res.json({ success: false });
    }
  },
  async listFiles(req, res) {
    try {
      const files = await service.file.getAllFiles(req.user.username);
      res.json(files);
    } catch (error) {
      req.json(error);
    }
  },
  async uploadRequest(req, res) {
    const rule = {
      filename: {
        type: 'string',
        allowEmpty: false,
      },
    };

    try {
      validator.validate(req.body, rule);
      const subPath = await k8s.upload.createPod(req);
      res.json({ subPath });
    } catch (error) {
      logger.info('[File Controller] upload request failed', error);
      res.json({ success: false });
    }
  },

  async deletePod(req, res) {
    try {
      await k8s.upload.deletePod(req.user.username);
      res.json({ success: true });
    } catch (error) {
      logger.info('[File Controller] delete pod failed', error);
      res.json({ success: false });
    }
  },
};

export default fileController;
