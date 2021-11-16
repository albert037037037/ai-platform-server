import argon2 from 'argon2';
import mongoose from 'mongoose';
import model from '../models';
import logger from '../libs/logger';

const userService = {
  async create(params) {
    try {
      const savedParams = params;
      savedParams.username = params.username.toLowerCase();
      const hash = await argon2.hash(params.password);
      savedParams.password = hash;
      const res = await model.users.create(savedParams);
      logger.info('[User Service] Create user successfully');
      return res;
    } catch (error) {
      logger.error('[User Service] Failed to create user to database:', error);
      throw new Error(`Failed to create user to database, ${error}`);
    }
  },
  async updateJupyterToken(username, token) {
    try {
      mongoose.set('useFindAndModify', false);
      /* eslint max-len: ["error", { "code": 200 }] */
      await model.users.findOneAndUpdate({ username: username.toLowerCase() }, { jupyterToken: token });
    } catch (err) {
      logger.info('Failed to update jupyter token: ', err);
    }
  },
  async getJupyterToken(targetName) {
    const user = await model.users.findOne({ username: targetName.toLowerCase() }, '-_id jupyterToken').lean();
    return user;
  },
};

export default userService;
