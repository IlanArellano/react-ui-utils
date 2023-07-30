export class intervalHandler {
  private interval: number | undefined;

  public set = (callback: TimerHandler, ms?: number) => {
    this.interval = setInterval(callback, ms);
  };

  public clear = () => {
    if (this.interval) clearInterval(this.interval);
  };
}
