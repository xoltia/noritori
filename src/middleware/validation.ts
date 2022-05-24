import {createMiddlewareAppender} from './decorator';
import Joi from 'joi';
import {Request} from 'express';

type TargetSelector = (req: Request) => Object;

export const DefaultValidationOptions: Joi.ValidationOptions = {
  stripUnknown: true,
  convert: true,
};

export function Validate(
  schema: Joi.AnySchema,
  targetSelector: TargetSelector,
  options?: Joi.ValidationOptions
) {
  if (!Joi.isSchema(schema)) {
    throw new Error('ValidateBody decorator must be passed a Joi schema');
  }

  // not arrow function because the name of the function is used when logging route registration
  // eslint-disable-next-line
  return createMiddlewareAppender(function validate(req, res, next) {
    const target = targetSelector(req);
    const {value, error} = schema.validate(target, options);

    if (error) {
      res.status(400).json({
        error: error.message,
      });
      return;
    }

    Object.assign(target, value);
    next();
  });
}

export const ValidateBody = (
  schema: Joi.AnySchema,
  options: Joi.ValidationOptions = DefaultValidationOptions
) => Validate(schema, req => req.body, options);

export const ValidateQuery = (
  schema: Joi.AnySchema,
  options: Joi.ValidationOptions = DefaultValidationOptions
) => Validate(schema, req => req.query, options);
