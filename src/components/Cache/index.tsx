import createUncontrolledClassComponent, {
  UncontrolledComponent,
  UncontrolledContext,
} from "@utils/components/uncontrolled";
import { ResourceComponentManager } from "./manager";
import { CacheConfig, NamedResource, Resource } from "@utils/types/Cache";
import { createObjectWithGetters } from "@utils/common/format";
import { reducer } from "./logic/context";

type CacheResourceFuncWithInstance = <
  T extends Resource<string>,
  TName extends string
>(
  instance: () => ResourceComponentManager,
  name: TName,
  resource: T,
  resourceConf: CacheConfig<Extract<keyof T, string>>
) => NamedResource<T, TName>;

type CacheResourceFunc = <T extends Resource<string>, TName extends string>(
  name: TName,
  resource: T,
  resourceConf: CacheConfig<Extract<keyof T, string>>
) => NamedResource<T, TName>;

const cacheResource: CacheResourceFuncWithInstance = (
  instance,
  name,
  resource,
  resourceConf
) => {
  let cacheRet = instance()?.cacheResource(name, resource, resourceConf);
  const funcs = createObjectWithGetters(resource, (key) => {
    const comp = instance();
    if (!cacheRet && comp)
      cacheRet = comp.cacheResource(name, resource, resourceConf);
    return cacheRet.funcs?.[key] || {};
  });
  return {
    name,
    funcs,
    depends: resourceConf.depends || [],
  };
};

interface ICacheResourceUncontrolled extends UncontrolledComponent {
  cacheResource: CacheResourceFuncWithInstance;
}

export interface ICacheResource
  extends Omit<ICacheResourceUncontrolled, "cacheResource"> {
  cacheResource: CacheResourceFunc;
}

export namespace CacheResource {
  export const createCacheResource = (): ICacheResource => {
    const cacheResourceManager: ICacheResourceUncontrolled =
      createUncontrolledClassComponent(
        ResourceComponentManager,
        {
          cacheResource,
        },
        {
          strictMode: false,
          contextOptions: {
            initialValues: {},
            reducer: reducer as UncontrolledContext["reducer"],
          },
        }
      );

    return cacheResourceManager as unknown as ICacheResource;
  };
}
