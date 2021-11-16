import model from '../models';
import logger from '../libs/logger';

const servingService = {
  async create(req) {
    try {
      const savedReq = req;
      savedReq.username = req.username.toLowerCase();
      const res = await model.serving.create(savedReq);
      logger.info('[Serving Service] Create serving url successfully');
      return res;
    } catch (error) {
      logger.error('[User Service] Failed to create serving url to database:', error);
      throw new Error(`Failed to create serving url to database, ${error}`);
    }
  },
  async findUrl(req) {
    try {
      const total = await model.pipeline.countDocuments({ username: req.user.username.toLowerCase(), runname: req.body.modelname }).lean();
      const servingUrl = await model.pipeline.find({ username: req.user.username.toLowerCase(), runname: req.body.modelname }, '-_id servingUrl').sort({ _id: -1 }).lean();
      return { total, data: servingUrl };
    } catch (error) {
      logger.error('[Serving Service] Failed to find serving url to database:', error);
      throw new Error(`Failed to find serving url to database, ${error}`);
    }
  },
};

export default servingService;
