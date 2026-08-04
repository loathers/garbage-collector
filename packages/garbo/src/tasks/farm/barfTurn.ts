import { have } from "libram";
import { myAdventures, myLocation, totalTurnsPlayed } from "kolmafia";
import { $effect, $item, $items, $location, CrepeParachute, get } from "libram";
import { Quest } from "grimoire-kolmafia";

import { getPreferredBarfMonster, Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { globalOptions } from "../../config";
import { barfOutfit } from "../../outfit";
import { estimatedGarboTurns } from "../../turns";
import { completeBarfQuest } from "../../resources";
import { trackMarginalMpa } from "../../session";
import { meatMood } from "../../mood";

import { GarboTask } from "../engine";
import {
  canContinue,
  shouldCheckParachute,
  updateParachuteFailure,
} from "./lib";

export const BarfTurnQuest: Quest<GarboTask> = {
  name: "Barf Turn",
  tasks: [
    {
      name: "Barf Parachute",
      ready: () =>
        CrepeParachute.have() &&
        shouldCheckParachute() &&
        myLocation() === $location`Barf Mountain`,
      completed: () => have($effect`Everything looks Beige`),
      outfit: () => barfOutfit({}),
      do: () => CrepeParachute.fight(getPreferredBarfMonster()),
      combat: new GarboStrategy(() => Macro.meatKill()),
      prepare: () =>
        !(totalTurnsPlayed() % 11) && meatMood().execute(estimatedGarboTurns()),
      post: () => {
        if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
        completeBarfQuest();
        trackMarginalMpa();
      },
      spendsTurn: true,
    },
    {
      name: "Barf",
      completed: () => myAdventures() === 0,
      outfit: () => {
        const lubing =
          get("dinseyRollercoasterNext") && have($item`lube-shoes`);
        return barfOutfit(lubing ? { equip: $items`lube-shoes` } : {});
      },
      do: $location`Barf Mountain`,
      combat: new GarboStrategy(
        () => Macro.meatKill(),
        () =>
          Macro.if_(
            `(monsterid ${globalOptions.target.id}) && !gotjump && !(pastround 2)`,
            Macro.meatKill(),
          ).abort(),
      ),
      prepare: () =>
        !get("dinseyRollercoasterNext") &&
        !(totalTurnsPlayed() % 11) &&
        meatMood().execute(estimatedGarboTurns()),
      post: () => {
        completeBarfQuest();
        trackMarginalMpa();
      },
      spendsTurn: true,
    },
  ],
  completed: () => !canContinue(),
};
