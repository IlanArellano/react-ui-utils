import { mapObject } from "@utils/common";
import {
  CacheConfig,
  CacheResource,
  CacheResourceConfig,
  FunctionCacheAction,
  Resource,
  ResourceCacheAction,
} from "@utils/types/Cache";
import { emptyFunctionCache } from "./context";
import { cacheCall } from "./func";

function getFuncCacheDispatch<T>(
  resourceDispatch: (
    action: ResourceCacheAction<Extract<keyof T, string>>
  ) => void,
  key: string,
  omit: boolean
) {
  return (ac: FunctionCacheAction) => {
    if (omit) return;

    resourceDispatch({
      type: "func",
      payload: {
        func: key as unknown as Extract<keyof T, string>,
        action: ac,
      },
    });
  };
}

export function cacheResourceFuncs<T extends Resource<string>>(
  get: () => CacheResource<T>,
  dispatch: (action: ResourceCacheAction<Extract<keyof T, string>>) => void,
  config: CacheResourceConfig,
  resource: T,
  resourceConf?: CacheConfig<Extract<keyof T, string>>
): T {
  const cacheKeys = (resourceConf && resourceConf.cache) || [];
  const clearKeys = (resourceConf && resourceConf.clear) || [];
  const ret = mapObject(resource, (value, key) => (...args: any[]): any => {
    const usarCache = cacheKeys.some((x) => (x as string) === key);
    const limpiar = clearKeys.some((x) => (x as string) === key);

    const onCall = () => {
      if (limpiar) {
        dispatch({ type: "clear", payload: { config: resourceConf || {} } });
      }
    };

    const cache = get();

    //Si no se ocupa usar el cache se realiza la llamada igual pero con un emptyCache y un fDispatch que no hace nada
    const fCache = ((usarCache && cache[key]) || emptyFunctionCache)!;
    const fDispatch = getFuncCacheDispatch(dispatch, key as string, !usarCache);

    return cacheCall(
      fCache,
      config,
      fDispatch,
      value as any,
      args,
      onCall
    ) as T;
  });

  return ret as any as T;
}
