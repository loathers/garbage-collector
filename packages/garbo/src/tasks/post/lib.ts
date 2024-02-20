import { Delayed } from "libram";
import { GarboTask } from "../engine";

type DistributiveOmit<T, K extends string | number | symbol> = T extends T
  ? Omit<T, K>
  : never;
export type GarboPostTask = DistributiveOmit<GarboTask, "spendsTurn"> & {
  available?: Delayed<boolean>;
};
