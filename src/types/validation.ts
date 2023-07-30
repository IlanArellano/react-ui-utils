export type DeepRecord<T, IValue> = {
  [K in keyof T]: T[K] extends object ? DeepRecord<T[K], IValue> : IValue;
};

export type ParametersWithoutFistParam<T extends (...args: any[]) => any> =
  T extends (firstArg: any, ...rest: infer R) => any ? R : never;

export interface ItemManager<IResult, ItemEvents = string> {
  addEventListenner: (
    events: ItemEvents,
    callback: (value: IResult) => void
  ) => void;
  removeEventListenner: (events: ItemEvents) => void;
}
