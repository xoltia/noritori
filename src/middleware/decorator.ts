import 'reflect-metadata';
import {Handler} from 'express';

export function createMiddlewareAppender(middleware: Handler): MethodDecorator {
  return (target, propertyKey) => {
    propertyKey = propertyKey.toString();

    if (!Reflect.hasMetadata('middlewares', target.constructor)) {
      Reflect.defineMetadata('middlewares', {}, target.constructor);
    }

    const middlewares = Reflect.getMetadata(
      'middlewares',
      target.constructor
    ) as Record<string, Handler[]>;

    if (!middlewares[propertyKey]) {
      middlewares[propertyKey] = [];
    }

    middlewares[propertyKey].push(middleware);
  };
}
