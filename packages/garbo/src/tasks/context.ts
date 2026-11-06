import { BanishMethod } from "../resources/banish";
import { WandererManager } from "garbo-lib";

export type FarmingContext = {
  banish: BanishMethod | null;
  wanderTarget: ReturnType<WandererManager["getTarget"]> & {
    choices: Record<number, string | number>;
  };
};

export const EMPTY_CONTEXT: FarmingContext = {
  banish: null,
  get wanderTarget(): FarmingContext["wanderTarget"] {
    throw new Error(
      "No wanderer target is available outside the farming engine",
    );
  },
};
