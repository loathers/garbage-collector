import { Delayed } from "libram";
import { DistributiveOmit } from "../../lib";
import { GarboTask } from "../engine";

export type GarboPostTask = DistributiveOmit<GarboTask, "spendsTurn"> & {
  available?: Delayed<boolean>;
};
