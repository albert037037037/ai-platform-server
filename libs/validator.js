import Validator from 'fastest-validator';

const validator = new Validator();

const validate = (value, schema) => {
  const res = validator.validate(value, schema);
  if (res !== true) {
    throw new Error(`Parameters validation error, ${JSON.stringify(res)}`);
  }
  return true;
};

export default { validate };
