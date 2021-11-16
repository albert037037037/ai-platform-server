import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import model from '../models';
import logger from '../libs/logger';
import config from '../libs/config';

const SessionService = {
  async login(params) {
    const user = await model.users.findOne({ username: params.username.toLowerCase() }).lean();
    if (!user) throw new Error("Didn't find user in database");
    const validPassword = await argon2.verify(user.password, params.password);
    if (!validPassword) throw new Error('Wrong Password');

    const payload = {
      _id: user._id,
      username: params.username,
    };

    const token = jwt.sign(payload, config.jwtSecretKey);
    logger.info('User login successfully');
    return { token };
  },
};

export default SessionService;
