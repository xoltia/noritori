import 'reflect-metadata';
import {Handler} from 'express';

enum RequestMethod {
  GET = 'get',
  POST = 'post',
  DELETE = 'delete',
  OPTIONS = 'options',
  PUT = 'put',
}

export interface RouteDefinition {
  path: string;
  requestMethod: RequestMethod;
  methodName: string;
  middleware: Handler[];
}

export const Get = (path: string): MethodDecorator =>
  createRouteMethodDecorator(path, RequestMethod.GET);

export const Post = (path: string): MethodDecorator =>
  createRouteMethodDecorator(path, RequestMethod.POST);

export const Delete = (path: string): MethodDecorator =>
  createRouteMethodDecorator(path, RequestMethod.DELETE);

export const Put = (path: string): MethodDecorator =>
  createRouteMethodDecorator(path, RequestMethod.PUT);

export const Options = (path: string): MethodDecorator =>
  createRouteMethodDecorator(path, RequestMethod.OPTIONS);

function createRouteMethodDecorator(
  path: string,
  requestMethod: RequestMethod
): MethodDecorator {
  return (target, propertyKey) => {
    if (!Reflect.hasMetadata('routes', target.constructor)) {
      Reflect.defineMetadata('routes', [], target.constructor);
    }

    const routes = Reflect.getMetadata(
      'routes',
      target.constructor
    ) as RouteDefinition[];

    const middlewares =
      Reflect.getMetadata('middlewares', target.constructor) || {};

    routes.push({
      requestMethod,
      path,
      methodName: propertyKey.toString(),
      middleware: middlewares[propertyKey.toString()] || [],
    });

    Reflect.defineMetadata('routes', routes, target.constructor);

    return target;
  };
}
