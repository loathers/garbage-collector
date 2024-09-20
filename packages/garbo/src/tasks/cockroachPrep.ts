import { Quest } from "grimoire-kolmafia";
import { GarboTask } from "./engine";

export const CockroachSetup: Quest<GarboTask> = {
  name: "SetupTargetCopy",
  tasks: [
    // Tasks to progress pirate realm up to selecting Trash Island go here
    // We'll have to be careful about things like max stats becoming too high (bofa is annoying for this!)
    // To be optimal we would progress up until we're about to fight the giant giant crab, and then after buffing and fighting it, we then select trash island.
    // We might need some restructuring to do this nicely?
  ],
};
