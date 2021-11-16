import validator from '../libs/validator';
import logger from '../libs/logger';
import service from '../service';

const accessController = {
  async addRelation(req, res) {
    const rule = {
      username: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
      file_id: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
    };

    try {
      validator.validate(req.body, rule);
      await service.access.addRelation(req);
      logger.info('[Access Controller] Success to add relation');
      res.json({ success: true });
    } catch (error) {
      res.status(error.status).json({ code: error.code, message: `Failed to create relation, ${error.message}` });
      logger.info('[Access Controller] Failed to add relation', error.message);
    }
  },
  // async getHasPermission(req, res) {
  //   const rule = {
  //     username: {
  //       type: 'string',
  //       allowEmpty: false,
  //       min: 1,
  //     },
  //   };

  //   try {
  //     validator.validate(req.body, rule);
  //     const hasRightToAccess = await service.access.getHasPermission(req.body.username);
  //     res.json(hasRightToAccess);
  //   } catch (error) {
  //     logger.info('[Access Controller] Failed to get relation', error);
  //   }
  // },

  async getPermissionTo(req, res) {
    const rule = {
      file_id: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
    };

    try {
      validator.validate(req.body, rule);
      const permissionTo = await service.access.getPermissionTo(req.body.file_id, req.user.username);
      res.json(permissionTo);
    } catch (error) {
      logger.info('[Access Controller] Failed to get relation', error);
    }
  },

  async deletePermissionTo(req, res) {
    const rule = {
      username: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
      file_id: {
        type: 'string',
        allowEmpty: false,
        min: 1,
      },
    };

    try {
      validator.validate(req.body, rule);
      await service.access.deletePermissionTo(req.body.username, req.body.file_id);
      res.json({ success: true });
    } catch (error) {
      req.json(error);
    }
  },
};

export default accessController;
