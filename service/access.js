import mongoose from 'mongoose';
import model from '../models';
import logger from '../libs/logger';
import ErrorRes from '../libs/errorRes';

const accessService = {
  async addRelation(req) {
    const savedReq = {
      username: req.body.username.toLowerCase(),
      file_id: mongoose.Types.ObjectId(req.body.file_id),
    };
    // check if the user(username) exist
    const user = await model.users.findOne({ username: savedReq.username }).lean();
    if (!user) throw new ErrorRes(2000, "Didn't find user in database when create relation");
    // check if relation already exists
    const relation = await model.access.findOne(savedReq);
    if (relation) throw new ErrorRes(2001, 'Relation already exists');
    // create relation
    const res = await model.access.create(savedReq);
    if (!res) throw new ErrorRes(2002, 'Creating relation failed.');
    return res;
  },
  async getHasPermission(username) {
    try {
      const hasRightToAccess = await model.access.find({ username: username.toLowerCase() }, '-_id file_id');
      logger.info('[User Service] Get has permission in database successfully');
      return hasRightToAccess;
    } catch (error) {
      logger.error('[Access Service] Failed to get has permission in database:', error);
      throw new Error(`Failed to get has permission in database, ${error}`);
    }
  },

  async getPermissionTo(fileId, username) {
    try {
      const permissionTo = await model.access.find({ file_id: fileId, username: { $ne: `${username}` } }, 'username');
      logger.info('[User Service] Get permission to others in database successfully');
      return permissionTo;
    } catch (error) {
      logger.error('[Access Service] Failed to get permission to others in database:', error);
      throw new Error(`Failed to get permission to others in database, ${error}`);
    }
  },
  async deletePermissionTo(username, fileId) {
    try {
      const number = await model.access.deleteOne({ username: username.toLowerCase(), file_id: fileId });
      if (number === 0) logger.info("Database didn't store this combination of username and filename");
    } catch (error) {
      logger.info('[User Service] Faild to delete permission to others in database', error);
      throw new Error(`Failed to delete permission to others in database, ${error}`);
    }
  },
};

export default accessService;
