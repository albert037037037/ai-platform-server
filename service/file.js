import model from '../models';
import logger from '../libs/logger';

const fileService = {
  async createFile(req) {
    try {
      const savedReq = req.body;
      savedReq.username = req.user.username.toLowerCase();
      const fileRes = await model.file.create(savedReq);
      const accessSchema = {
        username: savedReq.username,
        file_id: fileRes._id,
      };

      await model.access.create(accessSchema);
      return fileRes._id;
    } catch (error) {
      logger.info('[File Service] Create file in database failed');
      throw new Error('Failed to create file in database ', error);
    }
  },
  async getAllFiles(username) {
    const total = await model.file.countDocuments({ username: username.toLowerCase() }).lean();
    const files = await model.file.find({ username: username.toLowerCase() }, '_id filename').sort({ _id: -1 }).lean();
    return { total, data: files };
  },
};

export default fileService;
