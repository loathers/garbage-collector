import { Quest } from "grimoire-kolmafia";
import {
  autosell,
  autosellPrice,
  availableAmount,
  buy,
  Item,
  itemAmount,
  use,
} from "kolmafia";
import { $coinmaster, $item, getModifier, have } from "libram";
import { globalOptions } from "../config";
import { GarboTask } from "./engine";

function getAutosellableMeltingJunk(): Item[] {
  return Item.all().filter(
    (i) =>
      (getModifier("Lasts Until Rollover", i) ||
        (globalOptions.ascend && i.quest)) &&
      itemAmount(i) &&
      autosellPrice(i) > 0 &&
      (globalOptions.ascend ||
        !(
          ["Adventures", "PvP Fights", "Rollover Effect Duration"] as const
        ).some((mod) => getModifier(mod))),
  );
}

export const FinishUpQuest: Quest<GarboTask> = {
  name: "Finish Up",
  tasks: [
    {
      name: "Open MayDay™ supply package",
      ready: () => globalOptions.ascend,
      completed: () => availableAmount($item`MayDay™ supply package`) === 0,
      spendsTurn: false,
      do: () =>
        use(
          $item`MayDay™ supply package`,
          availableAmount($item`MayDay™ supply package`),
        ),
    },
    {
      name: "Autosell Melting Junk",
      completed: () => getAutosellableMeltingJunk().length === 0,
      spendsTurn: false,
      do: () =>
        getAutosellableMeltingJunk().forEach((i) => autosell(i, itemAmount(i))),
    },
    {
      name: "Buy one-day ticket to Dinseylandfill",
      ready: () =>
        globalOptions.prefs.buyPass === true &&
        availableAmount($item`FunFunds™`) >= 20,
      completed: () => have($item`one-day ticket to Dinseylandfill`),
      spendsTurn: false,
      do: () =>
        buy(
          $coinmaster`The Dinsey Company Store`,
          1,
          $item`one-day ticket to Dinseylandfill`,
        ),
    },
  ],
};
