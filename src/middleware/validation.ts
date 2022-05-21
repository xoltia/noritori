import {createMiddlewareAppender} from './decorator';
import joi from 'joi';

export function ValidateBody(schema: Object) {
  if (!joi.isSchema(schema)) {
    throw new Error('ValidateBody decorator must be passed a Joi schema');
  }

  // not arrow function because the name of the function is used when logging route registration
  // eslint-disable-next-line
  return createMiddlewareAppender(function validate(req, res, next) {
    const {value, error} = schema.validate(req.body);

    if (error) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    req.body = value;
    next();
  });
}
