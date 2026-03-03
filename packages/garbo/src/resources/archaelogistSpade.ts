import { $item, clamp, get, have, maxBy } from "libram";
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
      const options = [
        {
          value: garboValue($item`ancient Pork Elf pottery shard`),
          tuner: $item`Pork Elf neti pot`,
          haveTuner: have($item`Pork Elf neti pot`),
        },
        {
          value: garboValue($item`dinosaur bone fragment`),
          tuner: $item`giant gnawing bone`,
          haveTuner: have($item`giant gnawing bone`),
        },
        {
          value: garboValue($item`2015 landfill detritus`),
          tuner: $item`Fleek™ mascara`,
          haveTuner: have($item`Fleek™ mascara`)
        }
      ];

      const best = maxBy(options, o => o.value);
      if (best) {
        use(best.tuner);
      }

      const digs = Math.max(0, 11 - get("_archSpadeDigs", 0));
      visitUrl(
        `inv_use.php?which=3&whichitem=${Item.get("archaeologist's spade").id}&pwd`,
      );
      for (let i = 0; i < digs; i++) {
        runChoice(2);
      }
      visitUrl("main.php");
    },
    spendsTurn: false,
  };
}
