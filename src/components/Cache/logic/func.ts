import { deepEqual, isPromiseLike } from "@utils/common";
import {
  CacheEntry,
  CachePayload,
  CacheResourceConfig,
  FunctionCache,
  FunctionCacheAction,
  JSONValue,
} from "@utils/types/Cache";

function syncCacheCall(
  cache: FunctionCache,
  func: (...args: JSONValue[]) => CachePayload,
  args: JSONValue[]
): {
  /**Resultado ya sea de la función o de la entrada existente del caché */
  result: CachePayload;
  /**En caso de que el valor no existiera en el cache, es la entrada que hay que agregar al cache */
  newEntry: CacheEntry | undefined;
  /**Indica si la función devolvió una promesa */
  async: boolean;
} {
  const entry = cache.entries.find((entry) => deepEqual(entry.args, args));
  const value = entry ? entry.value.payload : func(...args);

  const cached = !!entry;
  const async = entry ? entry.value.async : isPromiseLike(value);
  const newEntry: CacheEntry | undefined = cached
    ? undefined
    : {
        args: args,
        value: {
          async: async,
          payload: value,
        },
        id: (cache.entries[cache.entries.length - 1]?.id ?? 0) + 1,
      };
  //El valor se encontró en el caché:
  return {
    result: value,
    newEntry: newEntry,
    async: async,
  };
}

export function cacheCall<TFunc extends (...args: any[]) => any>(
  cache: FunctionCache,
  config: CacheResourceConfig,
  dispatch: (ac: FunctionCacheAction) => void,
  func: TFunc,
  args: JSONValue[],
  onCall: (() => void) | undefined
): ReturnType<TFunc> {
  //Leer el cache
  const result = syncCacheCall(cache, func, args);

  //La entrada que se va a agregar al cache:
  let newEntry = result.newEntry;

  if (newEntry) {
    dispatch({
      type: "setEntry",
      payload: {
        entry: newEntry,
        config: config,
      },
    });

    if (isPromiseLike(result.result)) {
      //Agrega la entrada al cache, note que no devolvemos la promesa resultante de la función,
      //si no que agregamos la promesa generada por 'ret':
      //Ruta asincrona para verificar que la promesa no devuelva una excepción:
      const ret = (async () => {
        try {
          const syncValue = (await result.result) as JSONValue;

          //Establecer el cache con el valor síncrono

          //NOTA: Es posible que en este punto la entrada del cache ya no exista, ya que existe un "await" entre el "setEntry" y el "resolvePromise",
          //en ese inter se pudo haber llenado el cache y borrado ese elemento, en este caso el reduce ignora el resolvePromise ya que el resolvePromise funciona
          //por "id", no por "args"
          dispatch({
            type: "resolvePromise",
            payload: {
              id: newEntry.id,
              value: syncValue,
            },
          });

          return syncValue;
        } catch (error) {
          //La promesa lanzó error, limpiamos el caché:
          dispatch({
            type: "error",
            payload: { error: error as Error },
          });
          throw error;
        } finally {
          if (result.newEntry) {
            //Llamamos al onCall hasta que ya se resolvió la promesa
            if (onCall) onCall();
          }
        }
      })();

      //Modificamos la entrada que se va a agregar al cache con la promesa ret:
      //Es decir, no se develve la promesa tal cual que devolvió la función
      newEntry = {
        ...newEntry,
        value: {
          async: true,
          payload: ret,
        },
      };
    } else {
      //Llamamos al onCall justo después de llamar a la función sólo si el resultado es síncrono, si no, el onCall se llama hasta que se resuelve la promesa
      if (onCall) onCall();
    }
  }

  //Agrega la entrada al cache:
  if (newEntry) {
    //Devolver el valor en el cache:
    return newEntry.value.payload as any;
  }

  if (result.async && !isPromiseLike(result.result)) {
    //Si la función originalmente fue asíncrona pero el resultado en el cache no es una promesa
    //Esto significa que la promesa ya se resolvió y que esta almacenado el valor síncrono en el cache
    //Se devuelve una promesa resulta inmediatamente

    return result.result as any;
  }
  return result.result as any;
}
