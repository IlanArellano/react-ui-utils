import { useCallback, useImperativeHandle, useRef } from "react";
import { BaseHandler, ValueHandler } from "../common/classes/ValueHandler";

type Value<IValue> = IValue | (() => IValue);

type ValueSetter<IValue> = IValue | ((prev: IValue) => IValue);

type ValueHandlerResult<IValue> = [
  () => IValue,
  (value: ValueSetter<IValue>, cb?: (newValue: IValue) => void) => void,
  Omit<BaseHandler<IValue>, "value">
];

const _initial = <IValue>(initial?: Value<IValue>) =>
  new ValueHandler(
    initial instanceof Function ? initial() : initial
  ) as ValueHandler<IValue>;

/**Hook que maneja un estado interno sin controlar. A diferencia de @see React.useState este hook no actualiza el componente
 * si no que guarda su estado por medio de una referencia que no cambia durante el lifecycle.
 */
export default function useValueHandler<IValue>(
  initial?: Value<IValue>
): ValueHandlerResult<IValue> {
  const value = useRef<ValueHandler<IValue> | null>(null);

  useImperativeHandle(
    value,
    () => _initial(initial) as ValueHandler<IValue>,
    []
  );

  const get = useCallback(() => value.current?.get() as IValue, []);

  const set = useCallback(
    (newValue: ValueSetter<IValue>, cb?: (value: IValue) => void) => {
      const final =
        newValue instanceof Function
          ? newValue(value.current?.get() as IValue)
          : newValue;
      value.current?.set(final);
      if (cb) cb(final);
    },
    []
  );

  const getDeepCopy = useCallback(
    () => value.current?.getDeepCopy() as IValue,
    []
  );

  return [get, set, { getDeepCopy }];
}
