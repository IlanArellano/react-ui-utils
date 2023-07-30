import { useImperativeHandle, useRef } from "react";
import { EventHandler } from "../common/classes/EventHandler";

const getId = (event: string) => `_${event}`;

/**Hook que genera un eventHandler donde se pueden suscribir callbacks en distintos eventos */
export default function useEventHandler<
  IEvents extends string,
  IValue = any
>() {
  const eventHandler = useRef<EventHandler<IValue> | null>(null);

  useImperativeHandle(eventHandler, () => new EventHandler<IValue>(), []);

  const addEventListenner = (event: IEvents, fn: (value: IValue) => void) => {
    const id = getId(event);
    if (eventHandler.current?.isSuscribed(id)) return;
    eventHandler.current?.suscribe((value) => fn(value as IValue), id);
  };

  const removeEventListenner = (event: IEvents) => {
    const id = getId(event);
    eventHandler.current?.clear(id);
  };

  const listen = (event: IEvents, value: IValue) => {
    const id = getId(event);
    eventHandler.current?.setSelectedId(id);
    eventHandler.current?.listen(value);
  };

  const listenAll = () => {
    eventHandler.current?.listenAll();
  };

  const clearAll = () => {
    eventHandler.current?.clearAll();
  };

  return {
    addEventListenner,
    removeEventListenner,
    listen,
    listenAll,
    clearAll,
  };
}
