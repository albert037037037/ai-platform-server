import model from '../models';
import logger from '../libs/logger';

const pipelineService = {
  async create(req) {
    try {
      const savedParams = req.body;
      savedParams.username = req.user.username.toLowerCase();
      savedParams.createdAt = Date.now();
      savedParams.run_id = req.body.run_id.substring(1, req.body.run_id.length - 1);
      const res = await model.pipeline.create(savedParams);
      logger.info('[Pipeline Service] Create run successfully');
      return res;
    } catch (error) {
      logger.info('[Pipeline Service] Failed to create run', error);
      throw new Error(`Failed to create run to database, ${error}`);
    }
  },
  async list(req) {
    const user = await model.users.findOne({ username: req.user.username.toLowerCase() }).lean();
    if (!user) throw new Error("Didn't find user in database");
    /* eslint max-len: ["error", { "code": 200 }] */
    const total = await model.pipeline.countDocuments({ username: req.user.username.toLowerCase() }).lean();
    const allRun = await model.pipeline.find({ username: req.user.username.toLowerCase() }).sort({ _id: -1 }).lean();
    logger.info(JSON.stringify(allRun));
    return { total, data: allRun };
  },
  async addServingUrl(uname, modelname, servingUrl) {
    try {
      const username = uname.toLowerCase();
      await model.pipeline.findOneAndUpdate({ username, runname: modelname }, { servingUrl });
      logger.info('[Pipeline Service] update serving url successfully');
    } catch (error) {
      logger.info(`[Pipeline Service] ${error}`);
      throw new Error(error);
    }
  },
};

export default pipelineService;
