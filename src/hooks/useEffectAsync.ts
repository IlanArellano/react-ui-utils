import { DependencyList, EffectCallback, useEffect } from "react";

type EffectResult = void | EffectCallback;

export default function useEffectAsync(
  effect: () => Promise<EffectResult>,
  deps: DependencyList
) {
  let res: EffectResult | null = null;
  useEffect(() => {
    effect().then((result) => (res = result));
    return () => {
      if (res && typeof res === "function") res();
    };
  }, deps);
}
