import { EventHandler } from "@utils/common/classes/EventHandler";
import { ValueHandler } from "@utils/common/classes/ValueHandler";

export type Status = "mounted" | "unmounted";

export interface ComponentRegister {
  key: string;
  status: Status;
}

export interface EventHandlerRegister {
  key: string;
  event: EventHandler;
}

export class ViewTree {
  private componentMountEvents: ValueHandler<EventHandlerRegister[]>;
  private components: ValueHandler<ComponentRegister[]>;

  constructor() {
    this.componentMountEvents = new ValueHandler([]);
    this.components = new ValueHandler([]);
  }

  public registerComponent(entry: ComponentRegister) {
    this.addEntry(entry);
  }

  public changeStatus(key: string, status: Status) {
    const comp = this.components.get();
    const index = comp.findIndex((x) => x.key === key);
    if (index === -1) return;
    this.modifyEntry({ ...comp[index], status }, index);
  }

  private modifyEntry(entry: ComponentRegister, index: number) {
    const newState = this.components.getDeepCopy();
    newState[index] = entry;
    this.components.set(newState);
    if (entry.status === "unmounted" && this.componentMountEvents) {
      const MountRef = this.getComponentHandler(entry.key);
      if (MountRef) {
        MountRef.event.listen();
        MountRef.event.clear();
      }
    }
  }

  private addEntry(entry: ComponentRegister) {
    const comp = this.components.get();
    if (comp.some((x) => x.key === entry.key)) {
      this.components.set(
        comp.map((x) => {
          if (x.key === entry.key) return entry;
          return x;
        })
      );
      return;
    }
    this.components.set(comp.concat(entry));
    if (this.componentMountEvents) {
      this.componentMountEvents.set(
        this.componentMountEvents.get().concat({
          key: entry.key,
          event: new EventHandler(),
        })
      );
    }
  }

  public getComponentDetails(key: string) {
    return this.components.get().find((comp) => comp?.key === key);
  }

  public getComponentHandler(key: string) {
    return this.componentMountEvents.get().find((x) => x.key === key);
  }
}
