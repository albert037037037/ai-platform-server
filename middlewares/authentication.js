import jwt from 'jsonwebtoken';
import config from '../libs/config';
import logger from '../libs/logger';

/**
 * Generate and return an authentication middleware with `stricted` parameter
 * @param {Boolean} stricted whether it is necessary to carried jwt or not
 */

const authenticationMiddleware = (stricted = true) => async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      const payload = await new Promise((resolve, reject) => {
        jwt.verify(token, config.jwtSecretKey, (error, decoded) => {
          if (error) reject(error);
          resolve(decoded);
        });
      });
      req.user = payload;
      next();
    } catch (error) {
      logger.error('[Authentication Middleware] Authentifaction failed, invalid token.');
      res.status(401).json({ message: 'Authentication failed.' });
    }
  } else if (stricted) {
    logger.error('[Authentication Middleware] Authentifaction failed, no token carried.');
    res.status(401).json({ message: 'Authentication failed.' });
  } else {
    req.user = {};
    next();
  }
};

export default authenticationMiddleware;
