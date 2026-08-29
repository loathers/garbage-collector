import { BanishMethod } from "../resources/banish";

export type GarboContext = {
  banish: BanishMethod | null;
};

export const EMPTY_CONTEXT: GarboContext = {
  banish: null,
};
