export const isEmptyObject = <T extends { [key: string]: any }>(
  obj: T
): boolean => {
  if (!obj || typeof obj !== "object") return false;
  return JSON.stringify(obj) === "{}";
};
