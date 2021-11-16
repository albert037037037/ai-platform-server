import jwt from 'jsonwebtoken';
import fs from 'fs';
import argon2 from 'argon2';
import model from '../models';
import logger from '../libs/logger';

const registryService = {
  async auth(req) {
    // get private key to sign jwt
    const privateKey = fs.readFileSync('./ssl/token.key', 'utf8');

    // decode the basic auth
    if (req.headers.authorization === null) {
      throw new Error('No authorization');
    }
    const data = req.headers.authorization.split(' ')[1];
    const buff = Buffer.from(data, 'base64');
    const text = buff.toString('ascii');
    const username = text.split(':')[0];
    const password = text.split(':')[1];
    let acs = [];

    let type = '';
    let actions = [];
    let name = '';
    if (req.query.scope) {
      const parts = req.query.scope.split(':');
      if (parts.length > 0) {
        [type] = parts;
      }
      if (parts.length > 1) {
        [, name] = parts;
      }
      if (parts.length > 2) {
        actions = parts[2].split(',');
      }
    }
    if (username === 'admin') {
      acs[0] = {
        type,
        name: (name === '') ? '' : name,
        actions: [
          actions[0],
          actions[1],
        ],
      };
      acs[1] = {
        type: 'registry',
        name: 'catalog',
        actions: ['*'],
      };
    } else if (type !== '') {
      acs[0] = {
        type,
        name: (name === '') ? '' : name,
        actions: [
          actions[0],
          actions[1],
        ],
      };
    } else {
      acs = [];
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: '127.0.0.1',
      sub: req.query.account,
      aud: req.query.service,
      exp: now + 60 * 60,
      nbf: now - 10,
      iat: now,
      jti: '5577006791947779000',
      access: acs,
    };

    // verify user
    const user = await model.users.findOne({ username: username.toLowerCase() }).lean();
    if (!user) throw new Error("Didn't find user in database");
    const validPassword = await argon2.verify(user.password, password);
    if (!validPassword) throw new Error('Wrong Password');

    if (username !== 'admin' && name.split('/')[0] !== req.query.account && (actions[0] === 'push' || actions[1] === 'push')) {
      throw new Error('Permission denied, No right to push');
    }

    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      // header: { kid: 'OANQ:IODM:N4PM:6LJP:WP7E:TARG:KCH6:7ATX:IJRR:3EPD:DO2J:TZZ2' },
      header: { kid: '3KWY:J7EO:WMLO:ULDB:I6OQ:FWQU:KFZO:7KIK:FSEF:R2KI:7SQF:PO5J' },
    });

    const publicKey = fs.readFileSync('./ssl/token.crt', 'utf8');
    jwt.verify(token, publicKey, (err, decoded) => {
      if (err) logger.error('Failed to verify token:', err);
      logger.info(`Token = ${JSON.stringify(decoded)}`);
    });

    return { token, access_token: token };
  },
};

export default registryService;
