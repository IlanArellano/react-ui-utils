export const createObjectWithGetters = <T extends { [key: string]: any }>(
  obj: T,
  get: (key: keyof T, value: T[keyof T]) => any
): T => {
  const newObj = {} as T;

  Object.keys(obj).forEach((key) => {
    Object.defineProperty(newObj, key, {
      get: () => get(key, obj[key]),
    });
  });

  return newObj;
};
