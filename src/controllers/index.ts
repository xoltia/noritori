import 'reflect-metadata';
import fs from 'fs';
import {promisify, format} from 'util';
import {RouteDefinition} from './decorators/route';
import {Router} from 'express';
import path from 'path';

const readdir = promisify(fs.readdir);

const CONTROLLER_REGEX = /^(.*)\.controller.js$/;

async function getAllControllers() {
  // get all files in the controllers directory
  const files = await readdir(__dirname).then(files =>
    files.filter(file => file.match(CONTROLLER_REGEX))
  );

  // import the controllers
  return await Promise.all(
    files.map(file => import(path.join(__dirname, file)))
  ).then(controllerImports =>
    controllerImports.map(controllerImport => controllerImport.default)
  );
}

export async function createRouter(): Promise<Router> {
  const mainRouter = Router();
  const controllers = await getAllControllers();

  // register all the controllers
  controllers.forEach(controller => {
    const basePath: string = Reflect.getMetadata('basePath', controller);
    const routes: RouteDefinition[] = Reflect.getMetadata('routes', controller);
    const router = Router();
    const instance = new controller();

    // register all the routes
    routes.forEach(route => {
      const {requestMethod, path, methodName, middleware} = route;
      const method = instance[methodName];

      console.log(
        format(
          `[%s] Registering route: %s %s %s%s\n${' '.repeat(
            instance.constructor.name.length + 3
          )}(%s)`,
          instance.constructor.name,
          methodName,
          requestMethod.toUpperCase(),
          basePath,
          path,
          middleware.map(f => (f.name || 'arrow function') + ' -> ').join('') +
            instance.constructor.name +
            '.' +
            methodName
        )
      );

      // transpiled methods are never async, so no need to wrap with express-async-handler
      router[requestMethod](path, middleware, method);
    });

    mainRouter.use(basePath, router);
  });

  return mainRouter;
}
