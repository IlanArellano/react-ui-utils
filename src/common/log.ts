import { isDebug } from ".";

interface LogNamespace {
  debug: DebugLog;
}

type DebugLog = Pick<typeof console, "log" | "warn" | "error" | "info">;

const LogTypes: (keyof DebugLog)[] = ["log", "warn", "error", "info"];

export const Log: LogNamespace = {
  debug: Object.fromEntries<DebugLog["log"]>(
    LogTypes.map((x) => [
      x,
      (...data) => {
        if (!isDebug()) return;
        console[x](...data);
      },
    ])
  ) as DebugLog,
};
