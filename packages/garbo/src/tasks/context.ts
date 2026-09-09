import { BanishMethod } from "../resources/banish";

export type FarmingContext = {
  banish: BanishMethod | null;
};

export const EMPTY_CONTEXT: FarmingContext = {
  banish: null,
};
