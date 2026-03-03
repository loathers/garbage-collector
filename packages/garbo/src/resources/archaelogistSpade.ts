import { $item, clamp, get, have } from "libram";
import { garboValue } from "../garboValue";
import { Item, runChoice, use, visitUrl } from "kolmafia";
import { GarboTask } from "../tasks/engine";

export function archaeologySpadeTask(): GarboTask {
  return {
    name: "Use Archaeologist's Spade",
    ready: () =>
      have($item`Archaeologist's Spade`) && get("_archSpadeDigs", 0) < 11,
    completed: () => get("_archSpadeDigs", 0) >= 11,
    do: () => {
      const shard = garboValue($item`ancient Pork Elf pottery shard`);
      const shardTuner = have($item`Pork Elf neti pot`);
      const bone = garboValue($item`dinosaur bone fragment`);
      const boneTuner = have($item`giant gnawing bone`);
      const detritus = garboValue($item`2015 landfill detritus`);

      if (shard > bone && shard > detritus && shardTuner) {
        use($item`Pork Elf neti pot`);
      } else if (bone > shard && bone > detritus && boneTuner) {
        use($item`giant gnawing bone`);
      }

      const digs = clamp(11 - get("_archSpadeDigs", 0), 0, 11);
      visitUrl(
        `inv_use.php?which=3&whichitem=${Item.get("archaeologist's spade").id}&pwd`,
      );
      for (let digsDone = 0; digsDone < digs; digsDone++) {
        runChoice(2);
      }
      visitUrl("main.php");
    },
    spendsTurn: false,
  };
}
