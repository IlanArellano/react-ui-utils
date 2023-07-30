type Callback<IValue> = ((value?: IValue) => void) | undefined;

let TOAST_ID = 0;

export const getEventId = (event: string) => `_${event}`;

interface EventsList<IValue> {
  id: string;
  callback: Callback<IValue>;
}

export class EventHandler<IValue = any> {
  private list: EventsList<IValue>[] = [];
  private selectedId: string | undefined = undefined;

  suscribe(callback: Callback<IValue>, id?: string) {
    this.list.push({ callback, id: id ?? (TOAST_ID++).toString() });
  }

  isAnyEventSuscribed = () => !!this.list.length;

  isSuscribed = (id?: string) =>
    !!this.selectedId &&
    this.list.some((evt) => evt.id === (id ?? this.selectedId));

  listen(value?: IValue) {
    if (!this.list.length) return;
    if (!this.selectedId) {
      const lastEvent = this.list.pop();
      return this.executeEvent(lastEvent, value);
    }
    const selectedEvent = this.list.find((evt) => evt.id === this.selectedId);
    return this.executeEvent(selectedEvent, value);
  }

  private executeEvent(event: EventsList<IValue> | undefined, value?: IValue) {
    if (event && event.callback) event.callback(value);
  }

  listenAll() {
    this.list.forEach((evt) => evt && evt.callback && evt.callback());
    this.clearAll();
  }

  clear(id?: string) {
    this.list = this.list.filter((evt) => evt.id !== (id ?? this.selectedId));
  }

  clearAll() {
    this.list = [];
    TOAST_ID = 0;
  }

  setSelectedId(id: string) {
    this.selectedId = id;
  }
}
