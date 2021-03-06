import {injectDefinitions} from "../decorators/inject.decorator";
import {Service, Inject} from "./service";


@Inject()
export class ProviderService extends Service
{
  protected instances = new Map();
  declarations = new Map();
  providers: Array<ProviderService> = [];
  injectDefinitions = [injectDefinitions];


  onInit()
  {
    this.instances.set(ProviderService, this);
  }


  getInjectDefinitions(Class: any): any
  {
    for (let injectDefinitions of this.injectDefinitions)
    {
      const injectDef = injectDefinitions.get(Class);

      if (injectDef)
      {
        return injectDef;
      }
    }

    throw new Error(`Inject definitions not found for ${Class.name}`);
  }


  add(Class: any)
  {
    if (Class.injectDefinitions)
    {
      this.injectDefinitions.push(Class.injectDefinitions);
    }

    const injectDef = this.getInjectDefinitions(Class);
    const singleton = injectDef.options.singleton

    if (singleton)
    {
      return this.get(Class);
    }
  }


  get<T=any>(Class: any): T
  {
    const injectDef = this.getInjectDefinitions(Class);
    const singleton = injectDef.options.singleton

    if (singleton)
    {
      if (this.instances.has(Class))
      {
        return this.instances.get(Class);
      }
    }

    const instance = this.create(Class);

    if (singleton)
    {
      this.instances.set(Class, instance)
    }

    return instance;
  }


  remove(Class: any): void
  {
    if (!this.instances.has(Class))
    {
      return;
    }

    const instance = this.instances.get(Class);
    instance.stop();
  }


  create(Class: any)
  {
    if (!Class)
    {
      throw new Error('Class empty');
    }

    const dependenciesClasses = this.getDependenciesClasses(Class);

    if (dependenciesClasses.includes(Class))
    {
      throw new Error(`Circular dependency found in ${Class.name}`);
    }

    const classDeclarations = this.declarations.get(Class);

    if (!classDeclarations)
    {
      for (let provider of this.providers)
      {
        try
        {
          return provider.get(Class);
        }
        catch (error) {}
      }

      throw new Error(`${Class.name} not declared`);
    }

    const injectDef = this.getInjectDefinitions(Class);
    let params      = [];

    for (let paramType of injectDef.paramTypes)
    {
      params.push(this.get(paramType));
    }

    const instance: any = new Class(...params);
    const configHandler = classDeclarations.configHandler;

    if (typeof(configHandler) === 'function')
    {
      configHandler(instance.options);
    }

    if (Class.injectDefinitions)
    {
      this.providers.push(instance.provider);
    }

    return instance;
  }


  getDependenciesClasses(Class: Function, dependencies = new Map(), level = 0)
  {
    if (dependencies.has(Class)) return;

    dependencies.set(Class, []);

    const injectDef = this.getInjectDefinitions(Class);

    for (let paramType of injectDef.paramTypes)
    {
      dependencies.get(Class).push(paramType);
      this.getDependenciesClasses(paramType, dependencies, level+1);
    }

    if (level > 0) return;

    const dependenciesClasses: Array<string> = [];

    for (let [_, deps] of dependencies)
    {
      dependenciesClasses.push(...deps);
    }

    return dependenciesClasses;
  }
}
