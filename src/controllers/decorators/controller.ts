import 'reflect-metadata';

export default function Controller(basePath: string): ClassDecorator {
  return function <T extends Function>(target: T) {
    Reflect.defineMetadata('basePath', basePath, target);

    if (!Reflect.hasMetadata('routes', target)) {
      Reflect.defineMetadata('routes', [], target);
    }
  };
}
