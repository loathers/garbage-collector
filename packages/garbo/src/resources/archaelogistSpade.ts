import { $item, $items, directlyUse, get, have, maxBy } from "libram";
import { garboAverageValue, garboValue } from "../garboValue";
import { availableChoiceOptions, runChoice, use, visitUrl } from "kolmafia";
import { GarboTask } from "../tasks/engine";

export function archaeologySpadeTask(): GarboTask {
  return {
    name: "Use Archaeologist's Spade",
    ready: () =>
      have($item`Archaeologist's Spade`) && get("_archSpadeDigs", 0) < 11,
    completed: () => get("_archSpadeDigs", 0) >= 11,
    do: () => {
      const spadeTargets = [
        {
          price: garboAverageValue(
            ...$items`ancient Pork Elf pottery shard, dinosaur bone fragment, 2015 landfill detritus`,
          ),
          tuner: undefined,
        },
        {
          price: garboValue($item`ancient Pork Elf pottery shard`),
          tuner: $item`Pork Elf neti pot`,
        },
        {
          price: garboValue($item`dinosaur bone fragment`),
          tuner: $item`giant gnawing bone`,
        },
        {
          price: garboValue($item`2015 landfill detritus`),
          tuner: $item`Fleek™ mascara`,
        },
      ].filter((t) => !t.tuner || have(t.tuner));

      if (spadeTargets.length > 0) {
        const target = maxBy(spadeTargets, "price");
        if (target.tuner) use(target.tuner);
      }

      directlyUse($item`Archaeologist's Spade`);
      while ("2" in availableChoiceOptions()) {
        runChoice(2);
      }
      visitUrl("main.php");
    },
    spendsTurn: false,
  };
}
