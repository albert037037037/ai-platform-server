import service from '../service';
import logger from '../libs/logger';

const registryController = {
  async auth(req, res) {
    try {
      logger.info(`query: ${JSON.stringify(req.query)}`);
      logger.info(`header: ${JSON.stringify(req.headers)}`);
      const response = await service.registry.auth(req);
      logger.info(JSON.stringify(response));
      res.json(response);
    } catch (error) {
      logger.info(`Failed to get permission: ${error}`);
      res.status(400).json({ message: `Failed to get permission: ${error}` });
    }
  },
};

export default registryController;
